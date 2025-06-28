// index.ts - Entry point for the notification-worker

import { NotificationWorker } from './NotificationWorker';

export { NotificationWorker };

if (require.main === module) {
  console.log('Notification Worker starting...');
  // Worker startup logic to be implemented
} 