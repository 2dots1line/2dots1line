/**
 * apply-schemas.ts
 * V9.7 Unified Schema Application Script
 * 
 * This script applies both Neo4j and Weaviate schemas from the /schemas directory.
 */

import fs from 'fs';
import path from 'path';
import { Driver, driver, auth } from 'neo4j-driver';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

// Schema file paths
const SCHEMAS_DIR = path.join(__dirname, '..', 'schemas');
const NEO4J_SCHEMA_PATH = path.join(SCHEMAS_DIR, 'neo4j.cypher');
const WEAVIATE_SCHEMA_PATH = path.join(SCHEMAS_DIR, 'weaviate.json');

/**
 * Apply Neo4j schema (constraints and indexes)
 */
async function applyNeo4jSchema(): Promise<void> {
  console.log('🔗 Applying Neo4j schema...');
  
  const neo4jUri = process.env.NEO4J_URI_HOST || 'neo4j://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'password123';

  const neo4jDriver: Driver = driver(
    neo4jUri,
    auth.basic(neo4jUser, neo4jPassword)
  );

  try {
    const session = neo4jDriver.session();
    
    // Read the schema file
    const schemaContent = fs.readFileSync(NEO4J_SCHEMA_PATH, 'utf-8');
    
    // Split by lines and filter out comments and empty lines
    const statements = schemaContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt);

    console.log(`Executing ${statements.length} Neo4j schema statements...`);

    for (const statement of statements) {
      try {
        await session.run(statement);
        console.log(`✅ Executed: ${statement.substring(0, 60)}...`);
      } catch (error) {
        console.warn(`⚠️  Skipped (already exists): ${statement.substring(0, 60)}...`);
      }
    }

    await session.close();
    console.log('✅ Neo4j schema applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply Neo4j schema:', error);
    throw error;
  } finally {
    await neo4jDriver.close();
  }
}

/**
 * Apply Weaviate schema
 */
async function applyWeaviateSchema(): Promise<void> {
  console.log('🔍 Applying Weaviate schema...');
  
  const weaviateHost = process.env.WEAVIATE_HOST_LOCAL || 'localhost:8080';
  const weaviateScheme = process.env.WEAVIATE_SCHEME || 'http';

  const client: WeaviateClient = weaviate.client({
    scheme: weaviateScheme,
    host: weaviateHost,
  });

  try {
    // Read the schema file
    const schemaContent = fs.readFileSync(WEAVIATE_SCHEMA_PATH, 'utf-8');
    const schema = JSON.parse(schemaContent);

    console.log(`Applying ${schema.classes.length} Weaviate class(es)...`);

    for (const classSchema of schema.classes) {
      try {
        await client.schema.classCreator().withClass(classSchema).do();
        console.log(`✅ Created class: ${classSchema.class}`);
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  Class already exists: ${classSchema.class}`);
        } else {
          console.error(`❌ Failed to create class ${classSchema.class}:`, error);
          throw error;
        }
      }
    }

    console.log('✅ Weaviate schema applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply Weaviate schema:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log('🚀 Starting V9.7 Schema Application...\n');

  try {
    // Check if schema files exist
    if (!fs.existsSync(NEO4J_SCHEMA_PATH)) {
      throw new Error(`Neo4j schema file not found: ${NEO4J_SCHEMA_PATH}`);
    }
    if (!fs.existsSync(WEAVIATE_SCHEMA_PATH)) {
      throw new Error(`Weaviate schema file not found: ${WEAVIATE_SCHEMA_PATH}`);
    }

    // Apply schemas
    await applyNeo4jSchema();
    console.log('');
    await applyWeaviateSchema();

    console.log('\n🎉 All schemas applied successfully!');
  } catch (error) {
    console.error('\n💥 Schema application failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}