#!/usr/bin/env node

/**
 * Database Sync Toolkit Index
 * 
 * Lists all available scripts and their purposes
 */

const fs = require('fs');
const path = require('path');

const scripts = [
  {
    name: 'status.js',
    description: 'Quick status check for all database components',
    usage: 'node status.js'
  },
  {
    name: 'analyze-database-sync.js',
    description: 'Comprehensive analysis of database synchronization status',
    usage: 'node analyze-database-sync.js'
  },
  {
    name: 'monitor-embedding-queue.js',
    description: 'Real-time monitoring of the BullMQ embedding queue',
    usage: 'node monitor-embedding-queue.js'
  },
  {
    name: 'batch-embed-missing.js',
    description: 'Identifies and queues missing entities for embedding',
    usage: 'node batch-embed-missing.js [--entity-types=type1,type2]'
  },
  {
    name: 'fix-null-vectors.js',
    description: 'Identifies and fixes entities with null or invalid vectors',
    usage: 'node fix-null-vectors.js [--entity-types=type1,type2]'
  },
  {
    name: 'cleanup-duplicate-vectors.js',
    description: 'Removes duplicate Weaviate entries',
    usage: 'node cleanup-duplicate-vectors.js'
  },
  {
    name: 'cleanup-orphaned-entities.js',
    description: 'Removes entities in Weaviate that don\'t exist in PostgreSQL',
    usage: 'node cleanup-orphaned-entities.js [--confirm] [--entity-types=type1,type2]'
  },
  {
    name: 'run-full-sync.js',
    description: 'Runs the complete database synchronization workflow',
    usage: 'node run-full-sync.js'
  }
];

function showHelp() {
  console.log('🔧 Database Synchronization Toolkit');
  console.log('=====================================\n');
  
  console.log('Available scripts:\n');
  
  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.name}`);
    console.log(`   ${script.description}`);
    console.log(`   Usage: ${script.usage}\n`);
  });
  
  console.log('Quick commands:');
  console.log('  pnpm run status       - Check system status');
  console.log('  pnpm run analyze      - Analyze database sync');
  console.log('  pnpm run full-sync    - Run complete workflow');
  console.log('  pnpm run help         - Show this help\n');
  
  console.log('For detailed documentation, see README.md');
}

// Check if script exists
function scriptExists(scriptName) {
  return fs.existsSync(path.join(__dirname, scriptName));
}

// Show help by default
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
  } else {
    const scriptName = args[0];
    const script = scripts.find(s => s.name === scriptName);
    
    if (script && scriptExists(scriptName)) {
      console.log(`Running: ${script.description}`);
      console.log(`Usage: ${script.usage}\n`);
      
      // Execute the script
      const { spawn } = require('child_process');
      const child = spawn('node', [scriptName, ...args.slice(1)], {
        stdio: 'inherit',
        cwd: __dirname
      });
      
      child.on('close', (code) => {
        process.exit(code);
      });
    } else {
      console.log(`❌ Script '${scriptName}' not found or not available.`);
      console.log('\nAvailable scripts:');
      scripts.forEach(s => console.log(`  - ${s.name}`));
      process.exit(1);
    }
  }
}

module.exports = { scripts, showHelp };
