/**
 * index.ts
 * Entry point for the config-service
 */

import { ConfigService } from './ConfigService';
import { ModelConfigService } from './ModelConfigService';
import { EnvironmentModelConfigService } from './EnvironmentModelConfigService';

// Export the main service classes
export { ConfigService };
export { ModelConfigService, type ModelConfig, type ModelDetails, type GeminiModelConfiguration } from './ModelConfigService';
export { EnvironmentModelConfigService, type EnvironmentModelConfig } from './EnvironmentModelConfigService';

// Service initialization placeholder
if (require.main === module) {
  console.log('Config Service starting...');
  // Service startup logic to be implemented
} 