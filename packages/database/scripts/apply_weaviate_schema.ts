// packages/database/scripts/apply_weaviate_schema.ts
import weaviate, { WeaviateClient, WeaviateClass } from 'weaviate-ts-client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const WEAVIATE_SCHEME = process.env.WEAVIATE_SCHEME || 'http';
const WEAVIATE_HOST_LOCAL = process.env.WEAVIATE_HOST_LOCAL || 'localhost:8080';

const client: WeaviateClient = weaviate.client({
  scheme: WEAVIATE_SCHEME,
  host: WEAVIATE_HOST_LOCAL,
});

const schemaConfigPath = path.join(__dirname, '../src/weaviate/schema.json');

async function applySchema() {
  console.log(`Connecting to Weaviate at ${WEAVIATE_SCHEME}://${WEAVIATE_HOST_LOCAL}`);
  try {
    // Check if Weaviate is live
    const meta = await client.misc.metaGetter().do();
    console.log('Weaviate is live. Version:', meta.version);

    const schemaFileContent = fs.readFileSync(schemaConfigPath, 'utf-8');
    const schemaConfig = JSON.parse(schemaFileContent);

    if (!schemaConfig.classes || !Array.isArray(schemaConfig.classes)) {
      console.error('Invalid schema.json format: "classes" array not found.');
      return;
    }

    const existingSchema = await client.schema.getter().do();
    const existingClassNames = existingSchema.classes?.map(c => c.class) || [];
    console.log('Existing Weaviate classes:', existingClassNames.join(', ') || 'None');

    for (const classObj of schemaConfig.classes as WeaviateClass[]) {
      if (existingClassNames.includes(classObj.class)) {
        console.log(`Class "${classObj.class}" already exists. Checking properties...`);
        // You could add logic here to compare and update properties if needed,
        // but for simplicity, Prisma often recommends dropping and recreating for schema changes during dev.
        // For now, we'll just log that it exists.
        // To update, you might need to delete and recreate, or add properties individually.
        // Weaviate's schema update capabilities can be complex.
        // For a robust update, you might need to:
        // 1. Get existing class definition: client.schema.classGetter().withClassName(classObj.class).do()
        // 2. Compare properties.
        // 3. Add missing properties: client.schema.propertyCreator()...do()
        // Note: Modifying existing properties or vectorizer usually requires class deletion and recreation.
      } else {
        console.log(`Class "${classObj.class}" does not exist. Creating...`);
        await client.schema.classCreator().withClass(classObj).do();
        console.log(`Class "${classObj.class}" created successfully.`);
      }
    }
    console.log('Schema application process completed.');

  } catch (e) {
    console.error('Failed to apply Weaviate schema:', e.message);
    if (e.stack) {
        console.error(e.stack);
    }
    if (e.response) {
        console.error('Weaviate response error:', JSON.stringify(e.response.data, null, 2));
    }
  }
}

applySchema();