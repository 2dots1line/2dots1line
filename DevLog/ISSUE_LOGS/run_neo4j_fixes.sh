#!/bin/bash

# Neo4j Fix Script for Insight Worker Issues
# This script helps resolve the missing Neo4j nodes identified in the error logs

echo "🔧 Neo4j Fix Script for Insight Worker Issues"
echo "=============================================="
echo ""

# Check if Neo4j container is running
echo "📋 Checking Neo4j container status..."
if docker ps | grep -q "neo4j-2d1l"; then
    echo "✅ Neo4j container is running"
else
    echo "❌ Neo4j container is not running"
    echo "Please start Neo4j first: docker-compose up -d neo4j"
    exit 1
fi

echo ""
echo "🌐 Opening Neo4j Browser..."
echo "You can now run the Cypher scripts to fix the missing nodes:"
echo ""

echo "📁 Available fix scripts:"
echo "1. fix_missing_neo4j_nodes.cypher - Fixes missing ProactivePrompt nodes"
echo "2. fix_concept_merging_issues.cypher - Fixes concept merging issues"
echo ""

echo "📖 Instructions:"
echo "1. Neo4j Browser should open automatically"
echo "2. Login with your Neo4j credentials (check .env file)"
echo "3. Copy and paste the Cypher scripts section by section"
echo "4. Run each section and check the results"
echo "5. After fixing, restart the insight worker to test"
echo ""

echo "🔍 Quick Status Check Commands:"
echo "--------------------------------"
echo "Check ProactivePrompt nodes:"
echo "MATCH (p:ProactivePrompt) RETURN p.prompt_id, p.title, p.created_at;"
echo ""
echo "Check Concept nodes:"
echo "MATCH (c:Concept) RETURN c.id, c.name, c.type LIMIT 10;"
echo ""
echo "Check for orphaned nodes:"
echo "MATCH (n) WHERE NOT (n)-[]-() RETURN labels(n), count(n);"
echo ""

echo "⚠️  Important Notes:"
echo "- Run scripts section by section, not all at once"
echo "- Check results after each section"
echo "- Replace placeholder data with actual data from PostgreSQL if possible"
echo "- Monitor insight worker logs after applying fixes"
echo ""

echo "🚀 Ready to fix! Open Neo4j Browser and start with the first script."
echo ""

# Open Neo4j Browser
open http://localhost:7474/browser/

