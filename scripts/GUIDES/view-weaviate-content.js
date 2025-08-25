#!/usr/bin/env node

/**
 * Weaviate Content Viewer
 * Displays Weaviate database content in a readable format
 * 
 * Usage:
 *   node scripts/view-weaviate-content.js [options]
 * 
 * Options:
 *   --user-id <id>        Filter by specific user ID
 *   --type <type>         Filter by source entity type (Concept, MemoryUnit, etc.)
 *   --after <date>        Filter objects created after this date (YYYY-MM-DD)
 *   --before <date>       Filter objects created before this date (YYYY-MM-DD)
 *   --limit <number>      Limit number of results (default: all)
 *   --content-length <n>  Truncate content to N characters (default: 200)
 *   --format <format>     Output format: table, list, json (default: list)
 *   --help               Show this help message
 * 
 * Examples:
 *   node scripts/view-weaviate-content.js --user-id dev-user-123
 *   node scripts/view-weaviate-content.js --type Concept --limit 50
 *   node scripts/view-weaviate-content.js --after 2025-08-20 --type MemoryUnit
 */

const https = require('https');
const http = require('http');

class WeaviateViewer {
  constructor(host = '127.0.0.1', port = 8080, options = {}) {
    this.host = host;
    this.port = port;
    this.baseUrl = `http://${host}:${port}/v1`;
    
    // Configuration options
    this.config = {
      userId: options.userId || null,
      entityType: options.entityType || null,
      afterDate: options.afterDate || null,
      beforeDate: options.beforeDate || null,
      limit: options.limit || null,
      contentLength: options.contentLength || 200,
      format: options.format || 'list'
    };
  }

  async fetchData(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => req.destroy());
    });
  }

  async getAllKnowledgeItems(limit = null) {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('class', 'UserKnowledgeItem');
      
      if (limit) {
        queryParams.append('limit', limit.toString());
      } else if (this.config.limit) {
        queryParams.append('limit', this.config.limit.toString());
      } else {
        queryParams.append('limit', '100'); // Default batch size
      }
      
      // Add filters if specified
      if (this.config.userId || this.config.entityType || this.config.afterDate || this.config.beforeDate) {
        const whereClause = this.buildWhereClause();
        if (whereClause) {
          queryParams.append('where', JSON.stringify(whereClause));
        }
      }
      
      if (limit) {
        // Single request with specified limit
        const data = await this.fetchData(`/objects?${queryParams.toString()}`);
        return data.objects || [];
      } else {
        // Fetch all objects using pagination
        let allObjects = [];
        let offset = 0;
        const batchSize = 100; // Weaviate allows up to 100 per request
        let hasMore = true;
        
        while (hasMore) {
          const currentParams = new URLSearchParams(queryParams);
          currentParams.set('limit', batchSize.toString());
          currentParams.set('offset', offset.toString());
          
          const data = await this.fetchData(`/objects?${currentParams.toString()}`);
          
          if (data.objects && data.objects.length > 0) {
            allObjects = allObjects.concat(data.objects);
            console.log(`📥 Fetched ${data.objects.length} objects (offset: ${offset})`);
            
            if (data.objects.length < batchSize) {
              hasMore = false; // Last batch
            } else {
              offset += batchSize;
            }
          } else {
            hasMore = false;
          }
        }
        
        return allObjects;
      }
    } catch (error) {
      console.error('❌ Error fetching knowledge items:', error.message);
      return [];
    }
  }

  buildWhereClause() {
    const conditions = [];
    
    // User ID filter
    if (this.config.userId) {
      conditions.push({
        path: ['userId'],
        operator: 'Equal',
        valueString: this.config.userId
      });
    }
    
    // Entity type filter
    if (this.config.entityType) {
      conditions.push({
        path: ['sourceEntityType'],
        operator: 'Equal',
        valueString: this.config.entityType
      });
    }
    
    // Date filters
    if (this.config.afterDate) {
      conditions.push({
        path: ['createdAt'],
        operator: 'GreaterThan',
        valueDate: this.config.afterDate + 'T00:00:00Z'
      });
    }
    
    if (this.config.beforeDate) {
      conditions.push({
        path: ['createdAt'],
        operator: 'LessThan',
        valueDate: this.config.beforeDate + 'T23:59:59Z'
      });
    }
    
    // Return single condition or combined with AND operator
    if (conditions.length === 1) {
      return conditions[0];
    } else if (conditions.length > 1) {
      return {
        operator: 'And',
        operands: conditions
      };
    }
    
    return null;
  }

  async getSchema() {
    try {
      const data = await this.fetchData('/schema');
      return data;
    } catch (error) {
      console.error('❌ Error fetching schema:', error.message);
      return null;
    }
  }

  displayKnowledgeItems(items) {
    if (!items || items.length === 0) {
      console.log('📭 No knowledge items found');
      return;
    }

    console.log(`\n📚 Found ${items.length} Knowledge Items:\n`);
    
    if (this.config.format === 'table') {
      this.displayTable(items);
    } else if (this.config.format === 'json') {
      this.displayJSON(items);
    } else {
      this.displayList(items);
    }
  }

  displayList(items) {
    console.log('='.repeat(80));
    items.forEach((item, index) => {
      const props = item.properties;
      console.log(`\n${index + 1}. ${props.title || 'No Title'}`);
      console.log(`   Type: ${props.sourceEntityType || 'Unknown'}`);
      console.log(`   User: ${props.userId || 'Unknown'}`);
      console.log(`   Created: ${props.createdAt || 'Unknown'}`);
      console.log(`   Content: ${this.truncateText(props.textContent || 'No content', this.config.contentLength)}`);
      console.log('-'.repeat(60));
    });
  }

  displayTable(items) {
    console.log('='.repeat(120));
    console.log(`${'#'.padEnd(4)} ${'Title'.padEnd(40)} ${'Type'.padEnd(15)} ${'User'.padEnd(20)} ${'Created'.padEnd(25)} ${'Content Preview'}`);
    console.log('='.repeat(120));
    
    items.forEach((item, index) => {
      const props = item.properties;
      const title = (props.title || 'No Title').substring(0, 38) + (props.title && props.title.length > 38 ? '..' : '');
      const type = (props.sourceEntityType || 'Unknown').substring(0, 13) + (props.sourceEntityType && props.sourceEntityType.length > 13 ? '..' : '');
      const user = (props.userId || 'Unknown').substring(0, 18) + (props.userId && props.userId.length > 18 ? '..' : '');
      const created = props.createdAt ? new Date(props.createdAt).toISOString().split('T')[0] : 'Unknown';
      const content = this.truncateText(props.textContent || 'No content', 30);
      
      console.log(`${(index + 1).toString().padEnd(4)} ${title.padEnd(40)} ${type.padEnd(15)} ${user.padEnd(20)} ${created.padEnd(25)} ${content}`);
    });
    console.log('='.repeat(120));
  }

  displayJSON(items) {
    const output = items.map(item => ({
      id: item.id,
      title: item.properties.title || 'No Title',
      type: item.properties.sourceEntityType || 'Unknown',
      userId: item.properties.userId || 'Unknown',
      createdAt: item.properties.createdAt || 'Unknown',
      content: item.properties.textContent || 'No content'
    }));
    console.log(JSON.stringify(output, null, 2));
  }

  displaySchema(schema) {
    if (!schema || !schema.classes) {
      console.log('📭 No schema information found');
      return;
    }

    console.log('\n🏗️  Database Schema:\n');
    console.log('='.repeat(80));

    schema.classes.forEach(cls => {
      console.log(`\n📋 Class: ${cls.class}`);
      console.log(`   Description: ${cls.description || 'No description'}`);
      
      if (cls.properties && cls.properties.length > 0) {
        console.log('   Properties:');
        cls.properties.forEach(prop => {
          console.log(`     - ${prop.name}: ${prop.dataType.join(', ')}`);
        });
      }
      console.log('-'.repeat(60));
    });
  }

  truncateText(text, maxLength) {
    if (!text) return 'No text';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  async showSummary() {
    console.log('🔍 Weaviate Database Explorer');
    console.log(`📍 Connecting to: ${this.baseUrl}`);
    
    // Display current configuration
    if (this.hasActiveFilters()) {
      console.log('\n🔧 Active Filters:');
      if (this.config.userId) console.log(`   User ID: ${this.config.userId}`);
      if (this.config.entityType) console.log(`   Entity Type: ${this.config.entityType}`);
      if (this.config.afterDate) console.log(`   After Date: ${this.config.afterDate}`);
      if (this.config.beforeDate) console.log(`   Before Date: ${this.config.beforeDate}`);
      if (this.config.limit) console.log(`   Limit: ${this.config.limit}`);
      console.log(`   Format: ${this.config.format}`);
      console.log(`   Content Length: ${this.config.contentLength}`);
    }
    console.log('');

    try {
      // Get schema first
      const schema = await this.getSchema();
      if (schema) {
        this.displaySchema(schema);
      }

      // Get knowledge items
      const items = await this.getAllKnowledgeItems();
      this.displayKnowledgeItems(items);

      console.log('\n💡 Tips:');
      console.log('   - Use --help to see all available options');
      console.log('   - Use --format table for better readability');
      console.log('   - Use --format json for programmatic processing');
      console.log('   - Check the Neo4j Browser for graph relationships');

    } catch (error) {
      console.error('❌ Failed to connect to Weaviate:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('   1. Make sure Weaviate is running: docker-compose ps');
      console.log('   2. Check the port: docker-compose logs weaviate');
      console.log('   3. Verify the URL: http://127.0.0.1:8080');
    }
  }

  hasActiveFilters() {
    return this.config.userId || this.config.entityType || this.config.afterDate || this.config.beforeDate || this.config.limit;
  }
}

// Command-line argument parser
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
        console.log(`
🧠 Weaviate Content Viewer - 2D1L

Usage: node scripts/GUIDES/view-weaviate-content.js [options]

Options:
  --user-id <id>        Filter by specific user ID
  --type <type>         Filter by source entity type (Concept, MemoryUnit, etc.)
  --after <date>        Filter objects created after this date (YYYY-MM-DD)
  --before <date>       Filter objects created before this date (YYYY-MM-DD)
  --limit <number>      Limit number of results (default: all)
  --content-length <n>  Truncate content to N characters (default: 200)
  --format <format>     Output format: table, list, json (default: list)
  --help               Show this help message

Examples:
  node scripts/GUIDES/view-weaviate-content.js --user-id dev-user-123
  node scripts/GUIDES/view-weaviate-content.js --type Concept --limit 50
  node scripts/GUIDES/view-weaviate-content.js --after 2025-08-20 --type MemoryUnit
  node scripts/GUIDES/view-weaviate-content.js --format table --content-length 100
  node scripts/GUIDES/view-weaviate-content.js --format json --limit 10
        `);
        process.exit(0);
        break;
        
      case '--user-id':
        options.userId = args[++i];
        break;
        
      case '--type':
        options.entityType = args[++i];
        break;
        
      case '--after':
        options.afterDate = args[++i];
        break;
        
      case '--before':
        options.beforeDate = args[++i];
        break;
        
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
        
      case '--content-length':
        options.contentLength = parseInt(args[++i]);
        break;
        
      case '--format':
        options.format = args[++i];
        break;
        
      default:
        if (arg.startsWith('--')) {
          console.error(`❌ Unknown option: ${arg}`);
          console.error('Use --help for usage information');
          process.exit(1);
        }
        break;
    }
  }
  
  return options;
}

// CLI usage
if (require.main === module) {
  const options = parseArguments();
  const viewer = new WeaviateViewer('127.0.0.1', 8080, options);
  viewer.showSummary();
}

module.exports = WeaviateViewer;

