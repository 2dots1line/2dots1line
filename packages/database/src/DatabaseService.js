"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const neo4j_driver_1 = require("neo4j-driver");
const weaviate_ts_client_1 = __importDefault(require("weaviate-ts-client"));
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_client_1 = require("./prisma-client");
/**
 * V9.7 DatabaseService
 *
 * Centralized service for managing all database client connections.
 * This service provides a single point of access to all persistence layers:
 * - PostgreSQL (via Prisma)
 * - Neo4j (via neo4j-driver)
 * - Weaviate (via weaviate-ts-client)
 * - Redis (via ioredis)
 */
class DatabaseService {
    // Use a private constructor to enforce singleton pattern for the service itself
    constructor() {
        // 1. Assign the singleton Prisma client
        this.prisma = prisma_client_1.prisma;
        // 2. Initialize Neo4j Client
        this.neo4j = (0, neo4j_driver_1.driver)(process.env.NEO4J_URI_DOCKER || 'bolt://localhost:7687', neo4j_driver_1.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD));
        // 3. Initialize Weaviate Client
        this.weaviate = weaviate_ts_client_1.default.client({
            scheme: process.env.WEAVIATE_SCHEME_DOCKER || 'http',
            host: process.env.WEAVIATE_HOST_DOCKER || 'localhost:8080',
        });
        // 4. Initialize Redis Client
        const redisHost = process.env.NODE_ENV === 'production'
            ? (process.env.REDIS_HOST_DOCKER || 'localhost')
            : 'localhost'; // Always use localhost in development
        const redisPort = process.env.NODE_ENV === 'production'
            ? parseInt(process.env.REDIS_PORT_FOR_APP_IN_DOCKER || '6379')
            : 6379; // Always use standard port in development
        this.redis = new ioredis_1.default({
            host: redisHost,
            port: redisPort,
            connectTimeout: 5000,
            lazyConnect: true,
            maxRetriesPerRequest: 3
        });
        console.log(`DatabaseService Redis configured: ${redisHost}:${redisPort} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
        console.log("DatabaseService initialized with all clients.");
    }
    // Public method to get the singleton instance of the DatabaseService
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    // Method to gracefully close all connections
    async closeConnections() {
        await this.prisma.$disconnect();
        await this.neo4j.close();
        // Redis client in ioredis handles connection closing automatically or with .quit()
        this.redis.quit();
        console.log("Database connections closed.");
    }
}
exports.DatabaseService = DatabaseService;
// Export singleton instance
exports.databaseService = DatabaseService.getInstance();
//# sourceMappingURL=DatabaseService.js.map