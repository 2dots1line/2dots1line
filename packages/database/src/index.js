"use strict";
/**
 * @2dots1line/database - V9.7 Main Export File
 *
 * This package provides centralized access to all persistence layers:
 * - PostgreSQL (via Prisma)
 * - Neo4j (via neo4j-driver)
 * - Weaviate (via weaviate-ts-client)
 * - Redis (via ioredis)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.databaseService = exports.DatabaseService = void 0;
// Core Database Service
var DatabaseService_1 = require("./DatabaseService");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return DatabaseService_1.DatabaseService; } });
Object.defineProperty(exports, "databaseService", { enumerable: true, get: function () { return DatabaseService_1.databaseService; } });
// Prisma Client Singleton
var prisma_client_1 = require("./prisma-client");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return prisma_client_1.prisma; } });
// Re-export Prisma types for convenience
__exportStar(require("@prisma/client"), exports);
// Repositories
__exportStar(require("./repositories"), exports);
//# sourceMappingURL=index.js.map