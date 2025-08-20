import { environmentLoader } from '../environment/EnvironmentLoader';

export interface ServiceConfig {
  name: string;
  requiredEnvVars?: string[];
  dependencies?: string[];
}

export abstract class BaseService {
  protected initialized = false;
  private initializationPromise?: Promise<void>;
  protected config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
    // NEVER call async methods in constructor (LESSON 16)
    // Environment variables may not be available during module loading
  }

  /**
   * Initialize the service with environment variables and dependencies
   * This addresses LESSON 21: ConfigService Initialization Missing
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    console.log(`🔧 Initializing ${this.config.name}...`);

    // 1. Load environment variables
    environmentLoader.load();

    // 2. Validate required environment variables
    if (this.config.requiredEnvVars) {
      this.validateEnvironmentVariables();
    }

    // 3. Validate service dependencies
    if (this.config.dependencies) {
      await this.validateDependencies();
    }

    // 4. Perform service-specific initialization
    await this.initializeService();

    this.initialized = true;
    console.log(`✅ ${this.config.name} initialized successfully`);
  }

  protected abstract initializeService(): Promise<void>;

  private validateEnvironmentVariables(): void {
    if (!this.config.requiredEnvVars) return;

    const missing = this.config.requiredEnvVars.filter(
      varName => !environmentLoader.get(varName)
    );

    if (missing.length > 0) {
      throw new Error(
        `${this.config.name} missing required environment variables: ${missing.join(', ')}`
      );
    }
  }

  private async validateDependencies(): Promise<void> {
    if (!this.config.dependencies) return;

    // This could be extended to check actual service health
    // For now, we just validate that dependency services are configured
    console.log(`🔍 Validating dependencies for ${this.config.name}: ${this.config.dependencies.join(', ')}`);
  }

  /**
   * Ensure initialization before any service operation
   * This prevents the async constructor anti-pattern
   */
  protected async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get environment variable with fallback
   */
  protected getEnv(key: string, defaultValue?: string): string {
    const value = environmentLoader.get(key);
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue!;
  }

  /**
   * Get environment variable without throwing (returns undefined if not set)
   */
  protected getEnvOptional(key: string): string | undefined {
    return environmentLoader.get(key);
  }

  /**
   * Check if service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get service name
   */
  public getServiceName(): string {
    return this.config.name;
  }

  /**
   * Reset service state (useful for testing)
   */
  public reset(): void {
    this.initialized = false;
    this.initializationPromise = undefined;
  }
}

/**
 * Factory function to create services with proper initialization
 */
export async function createService<T extends BaseService>(
  ServiceClass: new (config: ServiceConfig) => T,
  config: ServiceConfig
): Promise<T> {
  const service = new ServiceClass(config);
  await service.initialize();
  return service;
}

/**
 * Decorator to ensure service methods are called only after initialization
 */
export function requiresInitialization(
  target: unknown,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;
  descriptor.value = async function(this: BaseService, ...args: unknown[]) {
    await this.ensureInitialized();
    return method.apply(this, args);
  };
} 