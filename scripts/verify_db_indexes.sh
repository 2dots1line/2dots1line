#!/bin/bash
# Verify database indexes for CosmosQuest performance
# Run EXPLAIN ANALYZE on critical queries

echo "=== DATABASE INDEX VERIFICATION FOR COSMOS QUEST ==="
echo

# Check if container is running
if ! docker ps | grep -q postgres-2d1l; then
  echo "❌ PostgreSQL container is not running. Please start it with:"
  echo "   docker-compose -f docker-compose.dev.yml up -d postgres"
  exit 1
fi

echo "1. Verifying indexes for getMostRecentMessages query"
echo "   Table: conversation_messages"
echo "   Expected index: (conversation_id, created_at)"
echo

docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
EXPLAIN ANALYZE 
SELECT message_id, type, content, created_at, status, metadata 
FROM conversation_messages 
WHERE conversation_id = (SELECT conversation_id FROM conversations LIMIT 1)
ORDER BY created_at DESC 
LIMIT 10;
" 2>&1 | grep -E "(Index Scan|Seq Scan|Planning|Execution)" || echo "Query executed"

echo
echo "2. Verifying indexes for getRecentImportantConversationSummaries"
echo "   Table: conversations"
echo "   Expected index: (user_id, updated_at DESC)"
echo

docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
EXPLAIN ANALYZE
SELECT conversation_id, title, importance_score, created_at, ended_at
FROM conversations
WHERE user_id = (SELECT user_id FROM users LIMIT 1)
  AND status = 'active'
  AND importance_score IS NOT NULL
ORDER BY importance_score DESC, updated_at DESC
LIMIT 5;
" 2>&1 | grep -E "(Index Scan|Seq Scan|Planning|Execution)" || echo "Query executed"

echo
echo "3. Verifying indexes for findUserByIdWithContext"
echo "   Table: users"
echo "   Expected: Primary key on user_id"
echo

docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
EXPLAIN ANALYZE
SELECT user_id, email, name, preferences, memory_profile, 
       next_conversation_context_package, key_phrases
FROM users
WHERE user_id = (SELECT user_id FROM users LIMIT 1);
" 2>&1 | grep -E "(Index Scan|Seq Scan|Planning|Execution)" || echo "Query executed"

echo
echo "4. Checking existing indexes on critical tables"
echo

docker exec postgres-2d1l psql -U danniwang -d twodots1line -c "
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('conversation_messages', 'conversations', 'users', 'memory_units', 'concepts')
ORDER BY tablename, indexname;
"

echo
echo "=== VERIFICATION COMPLETE ==="
echo
echo "✅ If you see 'Index Scan' in the EXPLAIN output, indexes are being used correctly."
echo "❌ If you see 'Seq Scan' on large tables, indexes may be missing or not optimal."

