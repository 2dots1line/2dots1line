"use strict";
/**
 * Repositories Index - V9.7
 * Exports all repository classes and interfaces
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
exports.ProactivePromptRepository = exports.InteractionLogRepository = exports.DerivedArtifactRepository = void 0;
exports.createRepositories = createRepositories;
// User Management
__exportStar(require("./UserRepository"), exports);
// Conversations & Messages
__exportStar(require("./ConversationRepository"), exports);
// Memory & Content
__exportStar(require("./MemoryRepository"), exports);
// Knowledge Graph
__exportStar(require("./ConceptRepository"), exports);
// Presentation Layer
__exportStar(require("./CardRepository"), exports);
// Media & Assets
__exportStar(require("./MediaRepository"), exports);
// Derived Content
var DerivedArtifactRepository_1 = require("./DerivedArtifactRepository");
Object.defineProperty(exports, "DerivedArtifactRepository", { enumerable: true, get: function () { return DerivedArtifactRepository_1.DerivedArtifactRepository; } });
// Growth & Analytics
__exportStar(require("./GrowthEventRepository"), exports);
// User Interactions
var InteractionLogRepository_1 = require("./InteractionLogRepository");
Object.defineProperty(exports, "InteractionLogRepository", { enumerable: true, get: function () { return InteractionLogRepository_1.InteractionLogRepository; } });
// Proactive Prompts
var ProactivePromptRepository_1 = require("./ProactivePromptRepository");
Object.defineProperty(exports, "ProactivePromptRepository", { enumerable: true, get: function () { return ProactivePromptRepository_1.ProactivePromptRepository; } });
const UserRepository_1 = require("./UserRepository");
const ConversationRepository_1 = require("./ConversationRepository");
const MemoryRepository_1 = require("./MemoryRepository");
const ConceptRepository_1 = require("./ConceptRepository");
const CardRepository_1 = require("./CardRepository");
const MediaRepository_1 = require("./MediaRepository");
const DerivedArtifactRepository_2 = require("./DerivedArtifactRepository");
const GrowthEventRepository_1 = require("./GrowthEventRepository");
const InteractionLogRepository_2 = require("./InteractionLogRepository");
const ProactivePromptRepository_2 = require("./ProactivePromptRepository");
function createRepositories(db) {
    return {
        user: new UserRepository_1.UserRepository(db),
        conversation: new ConversationRepository_1.ConversationRepository(db),
        memory: new MemoryRepository_1.MemoryRepository(db),
        concept: new ConceptRepository_1.ConceptRepository(db),
        card: new CardRepository_1.CardRepository(db),
        media: new MediaRepository_1.MediaRepository(db),
        derivedArtifact: new DerivedArtifactRepository_2.DerivedArtifactRepository(db),
        growthEvent: new GrowthEventRepository_1.GrowthEventRepository(db),
        interactionLog: new InteractionLogRepository_2.InteractionLogRepository(db),
        proactivePrompt: new ProactivePromptRepository_2.ProactivePromptRepository(db),
    };
}
//# sourceMappingURL=index.js.map