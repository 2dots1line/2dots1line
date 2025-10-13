<!-- ca81e510-09d4-464e-8f5c-5ebadf928424 5b448572-699f-4d7d-9980-e20639bcedd5 -->
# Dot Self-Learning: Symmetrical User Architecture

## Core Philosophy

**Dot is a user.** That's it. No special tables, no special methods, no special logic. Every feature that works for human users works for Dot identically.

**Sessions are sessions.** No types, no branching. Metadata + participant list = all you need.

---

## Phase 1: Dot as System User (Week 1-2)

### 1.1 Create Dot's Account

**Script**: `scripts/setup-dot-user.ts`

```typescript
const DOT_USER_ID = 'dot-system-user';

await db.users.create({
  data: {
    user_id: DOT_USER_ID,
    email: 'dot@2dots1line.ai',
    name: 'Dot',
    account_status: 'active'
  }
});
```

That's it. Dot is now a user. Everything else just works.

### 1.2 Store Dot's Documents

Put Dot's origin story and devlogs in `/system/dot/`. Use the **existing** document upload and ingestion flow. No new code needed.

---

## Phase 2: Universal Document Ingestion (Week 2-3)

Current file upload already works. Just use it for Dot:

```bash
# Upload Dot's origin story
curl -X POST /api/v1/media/upload \
  -F "file=@/system/dot/origin-story.md" \
  -F "user_id=dot-system-user"
```

Ingestion worker processes it like any other document. Zero changes needed.

---

## Phase 3: File System Write (Week 3-4)

Add one generic tool:

**File**: `packages/tools/src/filesystem/FileWriterTool.ts` (NEW)

```typescript
export class FileWriterTool {
  async execute(params: {
    userId: string;
    filePath: string;
    content: string;
    operation: 'create' | 'update' | 'append';
  }) {
    const workspace = `/users/${userId}`;
    const fullPath = path.join(workspace, filePath);
    
    // Ensure dir exists
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    
    // Write file
    if (operation === 'create' && fs.existsSync(fullPath)) {
      throw new Error('File exists');
    }
    
    if (operation === 'append') {
      fs.appendFileSync(fullPath, content);
    } else {
      fs.writeFileSync(fullPath, content);
    }
    
    return { success: true, path: fullPath };
  }
}
```

Works for Dot, works for humans. One tool.

---

## Phase 4: User Relationships (Week 4-5)

### 4.1 Add Relationship Edges in Neo4j

User relationships are edges in the graph, not PG tables.

**Cypher**: Create relationship

```cypher
// Danni → Dot
MATCH (a:User {user_id: 'danni-id'})
MATCH (b:User {user_id: 'dot-system-user'})
CREATE (a)-[:RELATES_TO {
  permissions: {
    can_view_cosmos: true,
    can_contribute: true
  },
  status: 'active',
  created_at: datetime()
}]->(b)

// Danni → Vivian (parent-child)
MATCH (a:User {user_id: 'danni-id'})
MATCH (b:User {user_id: 'vivian-id'})
CREATE (a)-[:RELATES_TO {
  permissions: {
    can_view_cosmos: true,
    can_contribute: true
  },
  status: 'active',
  created_at: datetime()
}]->(b)
```

No relationship type property. Just permissions. Simple.

---

## Phase 5: Social Cosmos (Week 5-6)

### 5.1 Cosmos Access Check

When visiting `/cosmos?user=vivian-id`:

```typescript
// Check relationship
const relationship = await db.userRelationship.findUnique({
  where: { user_a_id_user_b_id: { user_a_id: currentUserId, user_b_id: targetUserId } }
});

if (!relationship?.permissions?.can_view_cosmos) {
  return <AccessDenied />;
}

// Show cosmos
return <CosmosScene userId={targetUserId} />;
```

### 5.2 Contribution Review

When ingesting, check if speaker owns the target cosmos:

```typescript
// In ingestion worker
const targetUserId = session.metadata?.target_cosmos_user_id || speakerId;
const isContributor = speakerId !== targetUserId;

await db.memory_units.create({
  data: {
    user_id: targetUserId,
    contributed_by: isContributor ? speakerId : null,
    status: isContributor ? 'pending_review' : 'active',
    // ... rest of fields
  }
});
```

One simple check. No special tables, no special logic.

---

## Phase 9: Universal Sessions (Week 11-12)

### 9.1 Schema Changes (Minimal)

**Modify**: `packages/database/prisma/schema.prisma`

```prisma
// Remove user_id, add participants
model user_sessions {
  session_id     String               @id
  metadata       Json?
  created_at     DateTime             @default(now())
  last_active_at DateTime
  
  participants   SessionParticipant[]
  conversations  conversations[]
}

// New join table
model SessionParticipant {
  id         String        @id @default(uuid())
  session_id String
  user_id    String
  role       String        @default("participant")
  joined_at  DateTime      @default(now())
  left_at    DateTime?
  
  session    user_sessions @relation(fields: [session_id], references: [session_id], onDelete: Cascade)
  user       users         @relation(fields: [user_id], references: [user_id], onDelete: Cascade)
  
  @@unique([session_id, user_id])
}

// Remove user_id from conversations
model conversations {
  conversation_id String                  @id
  session_id      String
  // ... other fields ...
  
  session         user_sessions           @relation(fields: [session_id], references: [session_id])
  messages        conversation_messages[]
}

// Add speaker to messages
model conversation_messages {
  message_id      String   @id
  conversation_id String
  speaker_user_id String   // NEW: who said this
  content         String
  // ... other fields ...
  
  conversation    conversations @relation(fields: [conversation_id], references: [conversation_id])
  speaker         users         @relation("MessageSpeaker", fields: [speaker_user_id], references: [user_id])
}

// Add contribution tracking
model memory_units {
  // ... existing fields ...
  contributed_by String?  // If not owner, who added this
  status         String   @default("active") // 'active' | 'pending_review'
  
  contributor    users?   @relation("ContributedMemory", fields: [contributed_by], references: [user_id])
}

model concepts {
  // ... existing fields ...
  contributed_by String?
  status         String   @default("active")
  
  contributor    users?   @relation("ContributedConcept", fields: [contributed_by], references: [user_id])
}

// Update users relations
model users {
  // ... existing fields ...
  session_participations SessionParticipant[]
  messages_as_speaker    conversation_messages[] @relation("MessageSpeaker")
  contributed_memories   memory_units[]          @relation("ContributedMemory")
  contributed_concepts   concepts[]              @relation("ContributedConcept")
}
```

### 9.2 Universal Ingestion (Zero Branching)

**Modify**: `workers/ingestion-worker/src/IngestionAnalyst.ts`

```typescript
async processConversation(job: Job<{ conversationId: string; sessionId: string }>) {
  const { conversationId, sessionId } = job.data;
  
  // Get participants
  const session = await this.sessionRepo.findById(sessionId);
  const participants = await this.sessionParticipantRepo.findBySessionId(sessionId);
  
  // Get messages
  const messages = await this.conversationRepo.getMessages(conversationId);
  const transcript = messages.map(m => `${m.speaker.name}: ${m.content}`).join('\n');
  
  // Determine who gets entities
  const targetUserId = session.metadata?.target_cosmos_user_id;
  const entityOwners = targetUserId 
    ? [targetUserId]  // Cosmos exploration: target gets entities
    : participants.filter(p => p.user_id !== DOT_USER_ID).map(p => p.user_id); // Everyone else
  
  // Create entities for each owner
  for (const ownerId of entityOwners) {
    const analysis = await this.holisticAnalysisTool.execute({
      userId: ownerId,
      transcript,
      // ... rest
    });
    
    const speakerId = messages[0].speaker_user_id;
    const isContribution = speakerId !== ownerId;
    
    await this.createEntities({
      userId: ownerId,
      analysis,
      contributedBy: isContribution ? speakerId : null,
      status: isContribution ? 'pending_review' : 'active'
    });
  }
}
```

**That's it.** No switch statements. No session types. Pure data-driven logic.

### 9.3 Session Creation (All Use Cases)

```typescript
// 1:1 chat
const session = await db.user_sessions.create({ data: { metadata: {} } });
await db.sessionParticipant.createMany([
  { session_id: session.id, user_id: 'danni-id' },
  { session_id: session.id, user_id: DOT_USER_ID }
]);

// Cosmos exploration
const session = await db.user_sessions.create({
  data: { metadata: { target_cosmos_user_id: 'vivian-id' } }
});
await db.sessionParticipant.createMany([
  { session_id: session.id, user_id: 'danni-id' },
  { session_id: session.id, user_id: DOT_USER_ID }
]);

// Family session
const session = await db.user_sessions.create({ data: { metadata: {} } });
await db.sessionParticipant.createMany([
  { session_id: session.id, user_id: 'danni-id' },
  { session_id: session.id, user_id: 'vivian-id' },
  { session_id: session.id, user_id: DOT_USER_ID }
]);
```

Same code. Different participants. That's the only difference.

---

## Implementation Checklist

### Phase 1: Dot User (1 day)

- [ ] Run `setup-dot-user.ts`
- [ ] Upload Dot's origin story via existing upload endpoint
- [ ] Verify ingestion creates Dot's memories

### Phase 2: Document Ingestion (1 day)

- [ ] Upload devlogs for Dot via existing endpoint
- [ ] Verify Dot's knowledge graph grows

### Phase 3: File Write Tool (2 days)

- [ ] Create `FileWriterTool`
- [ ] Test Dot writing files
- [ ] Test humans writing files

### Phase 4: Relationships (2 days)

- [ ] Add `UserRelationship` table
- [ ] Create Danni→Dot, Danni→Vivian relationships
- [ ] Test cosmos access control

### Phase 5: Social Cosmos (3 days)

- [ ] Add cosmos visitor mode
- [ ] Add contribution review UI
- [ ] Test: Danni visits Vivian's cosmos → entities pending → Vivian approves

### Phase 9: Universal Sessions (5 days)

- [ ] Schema changes (remove `user_id` from sessions/conversations, add `SessionParticipant`, add `speaker_user_id`, add `contributed_by`)
- [ ] Update ingestion worker (one universal flow)
- [ ] Migration script for existing sessions
- [ ] Test all scenarios: 1:1, cosmos exploration, family, team

---

## Why This Works

1. **Zero special-casing**: Dot uses user schema, sessions use metadata
2. **Zero branching**: One ingestion flow, metadata determines behavior
3. **Zero duplication**: Same code for all use cases
4. **Future-proof**: New use cases = just different participant lists
5. **Simple**: Less code, less complexity, less bugs

### To-dos

- [ ] Create config/view_transitions.json with all 6 transitions and view configs
- [ ] Create apps/web-app/src/services/viewTransitionService.ts with generic transition logic
- [ ] Add setChatSizeForView method to apps/web-app/src/stores/HUDStore.ts
- [ ] Create apps/web-app/src/hooks/useViewTransitionContent.ts reusable hook
- [ ] Update apps/web-app/src/components/chat/ChatInterface.tsx to use ViewTransitionService
- [ ] Update apps/web-app/src/app/cosmos/CosmosScene.tsx to use generic hook and remove old logic
- [ ] Update apps/web-app/src/app/page.tsx to add hook calls for chat/cards/dashboard views
- [ ] Update config/view_specific_instructions.json to reference transitions config
- [ ] Update services/dialogue-service/src/PromptBuilder.ts to load transitions dynamically
- [ ] Update config/prompt_templates.yaml to render transitions dynamically
- [ ] Run all 6 test scenarios to verify transitions work end-to-end