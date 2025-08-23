import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface EnvironmentConfig {
  // Database connections
  DATABASE_URL?: string;
  
  // Redis configurations
  REDIS_URL?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  
  // Neo4j configurations (all variations)
  NEO4J_URI?: string;
  NEO4J_URI_DOCKER?: string;
  NEO4J_USER?: string;
  NEO4J_USERNAME?: string;
  NEO4J_PASSWORD?: string;
  
  // Weaviate
  WEAVIATE_URL?: string;
  
  // API Keys
  GOOGLE_API_KEY?: string;
  PEXELS_API_KEY?: string;
  
  // LLM Model Configuration
  LLM_CHAT_MODEL?: string;
  LLM_VISION_MODEL?: string;
  LLM_EMBEDDING_MODEL?: string;
  LLM_FALLBACK_MODEL?: string;
  
  // Application
  JWT_SECRET?: string;
  NODE_ENV?: string;
  
  // Ports
  PORT?: string;
  API_GATEWAY_PORT?: string;
  
  [key: string]: string | undefined;
}

export class EnvironmentLoader {
  private static instance: EnvironmentLoader;
  private config: EnvironmentConfig = {};
  private initialized = false;
  private loadingSources: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentLoader {
    if (!EnvironmentLoader.instance) {
      EnvironmentLoader.instance = new EnvironmentLoader();
    }
    return EnvironmentLoader.instance;
  }

  /**
   * Load environment variables from multiple sources with precedence:
   * 1. process.env (highest priority)
   * 2. .env file
   * 3. .env.local
   * 4. .env.development
   * 5. Default values (lowest priority)
   */
  public load(projectRoot?: string): EnvironmentConfig {
    if (this.initialized) {
      return this.config;
    }

    const root = projectRoot || this.findProjectRoot();
    this.loadingSources = [];

    // 1. Start with process.env
    this.config = { ...process.env };
    this.loadingSources.push('process.env');

    // 2. Load from .env files in order of precedence
    const envFiles = [
      '.env.development',
      '.env.local', 
      '.env'
    ];

    for (const envFile of envFiles) {
      const envPath = resolve(root, envFile);
      if (existsSync(envPath)) {
        this.loadEnvFile(envPath);
        this.loadingSources.push(envFile);
      }
    }

    // 3. Apply default values for missing variables
    this.applyDefaults();

    // 4. Resolve variable variations (Neo4j, Redis, etc.)
    this.resolveVariations();

    // 5. Validate required variables
    this.validateRequired();

    this.initialized = true;
    
    console.log(`✅ Environment loaded from: ${this.loadingSources.join(', ')}`);
    return this.config;
  }

  private loadEnvFile(filePath: string): void {
    try {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          
          // Only set if not already set (precedence)
          if (!this.config[key]) {
            this.config[key] = value;
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not load env file ${filePath}:`, error);
    }
  }

  private applyDefaults(): void {
    const defaults = {
      NODE_ENV: 'development',
      PORT: '3000',
      API_GATEWAY_PORT: '3001',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      NEO4J_URI: 'bolt://localhost:7687',
      WEAVIATE_URL: 'http://localhost:8080',
      // LLM Model defaults - these can be overridden by .env
      LLM_CHAT_MODEL: 'gemini-2.5-flash',
      LLM_VISION_MODEL: 'gemini-2.5-flash',
      LLM_EMBEDDING_MODEL: 'text-embedding-004',
      LLM_FALLBACK_MODEL: 'gemini-2.0-flash-exp',
    };

    for (const [key, value] of Object.entries(defaults)) {
      if (!this.config[key]) {
        this.config[key] = value;
      }
    }
  }

  private resolveVariations(): void {
    // Resolve Neo4j variations
    if (!this.config.NEO4J_URI && this.config.NEO4J_URI_DOCKER) {
      this.config.NEO4J_URI = this.config.NEO4J_URI_DOCKER;
    }
    
    if (!this.config.NEO4J_USER && this.config.NEO4J_USERNAME) {
      this.config.NEO4J_USER = this.config.NEO4J_USERNAME;
    } else if (!this.config.NEO4J_USERNAME && this.config.NEO4J_USER) {
      this.config.NEO4J_USERNAME = this.config.NEO4J_USER;
    }

    // Resolve Redis variations
    if (!this.config.REDIS_URL && this.config.REDIS_HOST && this.config.REDIS_PORT) {
      this.config.REDIS_URL = `redis://${this.config.REDIS_HOST}:${this.config.REDIS_PORT}`;
    }
  }

  private validateRequired(): void {
    const required = ['DATABASE_URL', 'GOOGLE_API_KEY', 'JWT_SECRET'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Missing required environment variables: ${missing.join(', ')}`);
      console.warn('   This may cause runtime failures in services that depend on these variables.');
    }
  }

  private findProjectRoot(): string {
    let current = process.cwd();
    
    while (current !== '/') {
      if (existsSync(resolve(current, 'package.json')) && 
          existsSync(resolve(current, 'packages'))) {
        return current;
      }
      current = resolve(current, '..');
    }
    
    return process.cwd();
  }

  public get(key: string): string | undefined {
    if (!this.initialized) {
      this.load();
    }
    return this.config[key];
  }

  public getRequired(key: string): string {
    const value = this.get(key);
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  public getConfig(): EnvironmentConfig {
    if (!this.initialized) {
      this.load();
    }
    return { ...this.config };
  }

  public injectIntoProcess(): void {
    if (!this.initialized) {
      this.load();
    }
    
    for (const [key, value] of Object.entries(this.config)) {
      if (value !== undefined) {
        process.env[key] = value;
      }
    }
  }

  public generateEcosystemEnv(): Record<string, string> {
    if (!this.initialized) {
      this.load();
    }

    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.config)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
    return env;
  }

  public validateForService(serviceName: string): void {
    const serviceRequirements: Record<string, string[]> = {
      'database': ['DATABASE_URL', 'NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD', 'REDIS_URL', 'WEAVIATE_URL'],
      'ai-services': ['GOOGLE_API_KEY'],
      'auth': ['JWT_SECRET'],
      'redis': ['REDIS_URL'],
      'neo4j': ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'],
    };

    const required = serviceRequirements[serviceName] || [];
    const missing = required.filter(key => !this.get(key));

    if (missing.length > 0) {
      throw new Error(`Service ${serviceName} missing required environment variables: ${missing.join(', ')}`);
    }
  }

  public reset(): void {
    this.initialized = false;
    this.config = {};
    this.loadingSources = [];
  }
}

// Singleton instance
export const environmentLoader = EnvironmentLoader.getInstance();

// Convenience functions
export const loadEnvironment = (projectRoot?: string) => environmentLoader.load(projectRoot);
export const getEnv = (key: string) => environmentLoader.get(key);
export const getRequiredEnv = (key: string) => environmentLoader.getRequired(key);
export const validateServiceEnv = (serviceName: string) => environmentLoader.validateForService(serviceName); 