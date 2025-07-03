/**
 * index.ts
 * Entry point for the config-service
 */

import { ConfigService } from './ConfigService';
import { ModelConfigService } from './ModelConfigService';

// Export the main service classes
export { ConfigService };
export { ModelConfigService, type ModelConfig, type ModelDetails, type GeminiModelConfiguration } from './ModelConfigService';

// Service initialization placeholder
if (require.main === module) {
  console.log('Config Service starting...');
  // Service startup logic to be implemented
} 