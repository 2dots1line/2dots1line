const path = require('path');

// Add the packages to the module path
const databasePath = path.join(__dirname, '..', 'packages', 'database', 'dist');
const workerPath = path.join(__dirname, '..', 'workers', 'graph-projection-worker', 'dist');

console.log('Database path:', databasePath);
console.log('Worker path:', workerPath);

try {
  const { DatabaseService } = require(databasePath);
  console.log('✅ DatabaseService imported successfully');
  
  const { GraphProjectionWorker } = require(workerPath);
  console.log('✅ GraphProjectionWorker imported successfully');
  
  const databaseService = DatabaseService.getInstance();
  console.log('✅ DatabaseService instance created');
  
  const worker = new GraphProjectionWorker(databaseService);
  console.log('✅ GraphProjectionWorker instance created');
  
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(worker)));
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
} 