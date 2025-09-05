const { Queue } = require('bullmq');
require('dotenv').config();

async function main() {
  const q = new Queue('notification-queue', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    }
  });
  const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
  console.log('notification-queue counts:', counts);
  await q.close();
}
main().catch(err => { console.error(err); process.exit(1); });