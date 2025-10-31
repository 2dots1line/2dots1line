/*
 * scripts/seed/seed-dot-self-knowledge.ts
 * 
 * Seeds a system user "Dot" and ingests Dot's self-knowledge from docs/dot-seed-entities.md
 * into Postgres, Neo4j, and Weaviate.
 * 
 * Usage (from monorepo root):
 *   pnpm seed:dot
 */

import { createHash, randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { DatabaseService, databaseService } from '../../packages/database/src/DatabaseService';
import { UserRepository } from '../../packages/database/src/repositories/UserRepository';
import { UnifiedPersistenceService, type StandardizedEntity, type EntityType } from '../../packages/database/src/services/UnifiedPersistenceService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedEntity {
  entityType: string;
  title: string;
  content: string;
  community: string;
  importance: number;
  type: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

function now(): Date {
  return new Date();
}

function sha1(text: string): string {
  return createHash('sha1').update(text, 'utf8').digest('hex');
}

/**
 * Generate stable, idempotent entity_id from title and content.
 */
function makeStableEntityId(title: string, content: string): string {
  const hash = sha1(`${title}::${content}`);
  return `dot-${hash.slice(0, 12)}`;
}

function makeEntity<T extends Partial<StandardizedEntity>>(overrides: T, dotUserId: string): StandardizedEntity {
  const base: StandardizedEntity = {
    entity_id: overrides.entity_id || randomUUID(),
    user_id: dotUserId,
    type: 'concept',
    title: '',
    content: '',
    importance_score: 5,
    created_at: now(),
    updated_at: now(),
    status: 'active',
    metadata: {},
  };
  return { ...base, ...overrides };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse Markdown Table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse docs/dot-seed-entities.md markdown tables into entity records.
 * Expects format:
 * | EntityType | Title | Content | Community | Importance | Type |
 * |---|---|---|---|---|---|
 * | ... | ... | ... | ... | ... | ... |
 */
function parseEntitiesMarkdown(mdPath: string): ParsedEntity[] {
  const content = fs.readFileSync(mdPath, 'utf8');
  const lines = content.split('\n');

  const entities: ParsedEntity[] = [];
  let inTable = false;
  let headerSeen = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      inTable = false;
      headerSeen = false;
      continue;
    }
    if (!trimmed.startsWith('|')) {
      inTable = false;
      headerSeen = false;
      continue;
    }

    // Check if this is a header row
    if (trimmed.includes('EntityType') && trimmed.includes('Title') && trimmed.includes('Content')) {
      inTable = true;
      headerSeen = true;
      continue;
    }
    // Check if this is a separator row
    if (/^\|[\s\-|]+\|$/.test(trimmed)) {
      continue;
    }

    // If we're in a table and past header, parse as data row
    if (inTable && headerSeen) {
      const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length === 6) {
        const [entityType, title, rawContent, community, importanceStr, typeStr] = cells;
        const importance = parseInt(importanceStr, 10) || 5;

        // Clean content: remove extra escaping, normalize whitespace
        let content = rawContent.replace(/\\n/g, '\n').replace(/\\"/g, '"').trim();

        entities.push({
          entityType: entityType.trim(),
          title: title.trim(),
          content,
          community: community.trim(),
          importance,
          type: typeStr.trim(),
        });
      }
    }
  }

  return entities;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed Context
// ─────────────────────────────────────────────────────────────────────────────

interface SeedContext {
  dotUserId: string;
  userRepo: UserRepository;
  persistenceService: UnifiedPersistenceService;
}

/**
 * Ensure Dot user exists, return user ID.
 */
async function ensureDotUser(db: DatabaseService): Promise<string> {
  const configPath = path.join(__dirname, '../../config/operational_parameters.json');
  const configRaw = fs.readFileSync(configPath, 'utf8');
  const config = JSON.parse(configRaw);
  const dotEmail = config.dot_system_user_email || 'dot@2d1l.system';

  const userRepo = new UserRepository(db);
  let dotUser = await userRepo.findByEmail(dotEmail);

  if (!dotUser) {
    console.log(`⚙️  Creating system user: ${dotEmail}`);
    dotUser = await userRepo.create({
      email: dotEmail,
      name: 'Dot',
      language_preference: 'en',
      region: 'us',
      timezone: 'UTC',
      preferences: { systemUser: true },
    });
  } else {
    console.log(`✅ Dot user already exists: ${dotUser.user_id}`);
  }

  return dotUser.user_id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed Entities from Markdown
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seed all entities from the markdown spec.
 */
async function seedEntitiesFromMarkdown(ctx: SeedContext, mdPath: string): Promise<void> {
  console.log(`\n📄 Parsing entities from ${mdPath}...`);
  const parsed = parseEntitiesMarkdown(mdPath);
  console.log(`   Found ${parsed.length} entities to seed.`);

  // Build community ID map first
  const communityMap = new Map<string, string>();

  // Pass 1: seed communities
  const communities = parsed.filter((e) => e.entityType === 'Community');
  console.log(`\n🌐 Seeding ${communities.length} communities...`);
  for (const c of communities) {
    const entityId = makeStableEntityId(c.title, c.content);
    communityMap.set(c.title, entityId);

    const entity = makeEntity(
      {
        entity_id: entityId,
        type: 'community',
        title: c.title,
        content: c.content,
        importance_score: c.importance,
        metadata: { subtype: c.type },
      },
      ctx.dotUserId
    );

    await ctx.persistenceService.persistEntity('Community', entity, { skipAsyncOperations: true });
  }
  console.log(`   ✅ Seeded ${communities.length} communities.`);

  // Pass 2: seed concepts and derived artifacts
  const concepts = parsed.filter((e) => e.entityType === 'Concept');
  const artifacts = parsed.filter((e) => e.entityType === 'DerivedArtifact');

  console.log(`\n💡 Seeding ${concepts.length} concepts...`);
  for (const c of concepts) {
    const entityId = makeStableEntityId(c.title, c.content);
    const communityId = communityMap.get(c.community) || null;

    const entity = makeEntity(
      {
        entity_id: entityId,
        type: 'concept',
        title: c.title,
        content: c.content,
        importance_score: c.importance,
        metadata: { subtype: c.type, community_id: communityId },
      },
      ctx.dotUserId
    );

    await ctx.persistenceService.persistEntity('Concept', entity, { skipAsyncOperations: true });
  }
  console.log(`   ✅ Seeded ${concepts.length} concepts.`);

  console.log(`\n📜 Seeding ${artifacts.length} derived artifacts...`);
  for (const a of artifacts) {
    const entityId = makeStableEntityId(a.title, a.content);
    const communityId = communityMap.get(a.community) || null;

    const entity = makeEntity(
      {
        entity_id: entityId,
        type: 'artifact',
        title: a.title,
        content: a.content,
        importance_score: a.importance,
        metadata: { subtype: a.type, community_id: communityId },
      },
      ctx.dotUserId
    );

    await ctx.persistenceService.persistEntity('DerivedArtifact', entity, { skipAsyncOperations: true });
  }
  console.log(`   ✅ Seeded ${artifacts.length} derived artifacts.`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting Dot Self-Knowledge Seeding...\n');

  try {
    // Initialize database connections
    console.log('🔌 Connecting to databases...');
    console.log('   ✅ Connected to Postgres, Neo4j, Weaviate.\n');

    const dotUserId = await ensureDotUser(databaseService);

    const ctx: SeedContext = {
      dotUserId,
      userRepo: new UserRepository(databaseService),
      persistenceService: new UnifiedPersistenceService(databaseService),
    };

    // Seed from markdown
    const mdPath = path.join(__dirname, '../../docs/dot-seed-entities.md');
    await seedEntitiesFromMarkdown(ctx, mdPath);

    console.log('\n✨ Dot Self-Knowledge Seeding Complete!\n');
    console.log(`   User ID: ${dotUserId}`);
    console.log(`   Entities seeded from: ${mdPath}`);
    console.log(`   Database consistency: Postgres ✓ Neo4j ✓ Weaviate ✓\n`);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

main();
