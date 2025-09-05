// scripts/trigger-notification.js
// Usage:
//   node scripts/trigger-notification.js [type] [userId]
// Types: new_star_generated | new_card_available | graph_projection_updated
// Example:
//   node scripts/trigger-notification.js new_star_generated dev-user-123

const { Queue } = require('bullmq');
require('dotenv').config();

async function main() {
  const typeArg = (process.argv[2] || 'new_star_generated').trim();
  const userId = (process.argv[3] || process.env.TEST_USER_ID || 'dev-user-123').trim();

  const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  };

  const queue = new Queue('notification-queue', { connection: redisConnection });

  let payload;
  if (typeArg === 'new_star_generated') {
    payload = {
      type: 'new_star_generated',
      userId,
      star: {
        star_id: `star-${Date.now()}`,
        star_type: 'nebula',
        display_data: {
          title: 'New Star Created',
          description: 'A brand new star has been generated'
        }
      }
    };
  } else if (typeArg === 'new_card_available') {
    payload = {
      type: 'new_card_available',
      userId,
      card: {
        card_id: `card-${Date.now()}`,
        card_type: 'Insight',
        display_data: {
          title: 'New Insight Card'
        }
      }
    };
  } else if (typeArg === 'graph_projection_updated') {
    payload = {
      type: 'graph_projection_updated',
      userId,
      projection: {
        version: `v-${Date.now()}`,
        nodeCount: Math.floor(100 + Math.random() * 50),
        edgeCount: Math.floor(200 + Math.random() * 50)
      }
    };
  } else {
    console.error('Unknown type:', typeArg);
    process.exit(1);
  }

  console.log('[TriggerNotification] Enqueuing job:', payload.type, 'for user:', userId);

  const job = await queue.add(payload.type, payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });

  console.log('[TriggerNotification] ✅ Job added with ID:', job.id);
  await queue.close();
}

main().catch((err) => {
  console.error('[TriggerNotification] ❌ Error:', err);
  process.exit(1);
});