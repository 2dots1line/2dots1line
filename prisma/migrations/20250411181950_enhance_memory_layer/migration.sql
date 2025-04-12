-- Create new tables for enhanced memory layer

-- Create Perspective model
CREATE TABLE "Perspective" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Perspective_pkey" PRIMARY KEY ("id")
);

-- Create RawData model
CREATE TABLE "RawData" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" UUID NOT NULL,
    "sessionId" TEXT NOT NULL,
    "perspectiveOwnerId" UUID NOT NULL,
    "subjectId" TEXT,
    "importanceScore" DOUBLE PRECISION,
    "processedFlag" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RawData_pkey" PRIMARY KEY ("id")
);

-- Create SemanticChunk model
CREATE TABLE "SemanticChunk" (
    "id" TEXT NOT NULL,
    "rawDataId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "chunkIndex" INTEGER NOT NULL,
    "importanceScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "perspectiveOwnerId" UUID NOT NULL,
    "subjectId" TEXT,

    CONSTRAINT "SemanticChunk_pkey" PRIMARY KEY ("id")
);

-- Create Embedding model
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "vector" DOUBLE PRECISION[],
    "dimension" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "importanceScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "embeddingType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rawDataId" TEXT,
    "chunkId" TEXT,
    "perspectiveOwnerId" UUID NOT NULL,
    "subjectId" TEXT,
    "linkedNodeIds" TEXT[],
    "vectorCollection" TEXT NOT NULL,
    "vectorId" TEXT NOT NULL,
    "isIncremental" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- Create EmbeddingUpdate model
CREATE TABLE "EmbeddingUpdate" (
    "id" TEXT NOT NULL,
    "embeddingId" TEXT NOT NULL,
    "previousVector" DOUBLE PRECISION[],
    "updateReason" TEXT NOT NULL,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "sourceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbeddingUpdate_pkey" PRIMARY KEY ("id")
);

-- Create OntologyVersion model
CREATE TABLE "OntologyVersion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OntologyVersion_pkey" PRIMARY KEY ("id")
);

-- Create NodeType model
CREATE TABLE "NodeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentType" TEXT,
    "ontologyVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB,

    CONSTRAINT "NodeType_pkey" PRIMARY KEY ("id")
);

-- Create EdgeType model
CREATE TABLE "EdgeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceNodeTypes" TEXT[],
    "targetNodeTypes" TEXT[],
    "ontologyVersionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCore" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB,

    CONSTRAINT "EdgeType_pkey" PRIMARY KEY ("id")
);

-- Create OntologyChangeProposal model
CREATE TABLE "OntologyChangeProposal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposedDefinition" JSONB NOT NULL,
    "justification" TEXT NOT NULL,
    "examples" TEXT[],
    "supportingCount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "OntologyChangeProposal_pkey" PRIMARY KEY ("id")
);

-- Alter existing Thought table
-- First save existing data
CREATE TEMP TABLE "ThoughtBackup" AS
SELECT * FROM "Thought";

-- Drop the existing Thought table
DROP TABLE "Thought";

-- Create the new Thought table with updated schema
CREATE TABLE "Thought" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "subjectType" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "rawDataId" TEXT,
    "chunkId" TEXT,
    "embeddingId" TEXT,
    "interactionId" UUID,
    "userId" UUID NOT NULL,
    "perspectiveOwnerId" UUID,
    "subjectId" TEXT,
    "linkedNodeIds" TEXT[],

    CONSTRAINT "Thought_pkey" PRIMARY KEY ("id")
);

-- Restore data from backup
INSERT INTO "Thought" (
    "id", "title", "content", "createdAt", "updatedAt",
    "confidence", "subjectType", "subjectName", "interactionId",
    "userId", "linkedNodeIds"
)
SELECT 
    id, 
    COALESCE(title, 'Imported Thought'), 
    content, 
    "createdAt", 
    "updatedAt",
    confidence, 
    COALESCE("subjectType", 'legacy'), 
    COALESCE("subjectName", 'imported'),
    "interactionId",
    "userId",
    ARRAY[]::TEXT[]
FROM "ThoughtBackup";

-- Drop the backup table
DROP TABLE "ThoughtBackup";

-- Create unique constraints and indices
CREATE UNIQUE INDEX "SemanticChunk_rawDataId_chunkIndex_key" ON "SemanticChunk"("rawDataId", "chunkIndex");

-- Create foreign key constraints
ALTER TABLE "Perspective" ADD CONSTRAINT "Perspective_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RawData" ADD CONSTRAINT "RawData_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SemanticChunk" ADD CONSTRAINT "SemanticChunk_rawDataId_fkey" FOREIGN KEY ("rawDataId") REFERENCES "RawData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_rawDataId_fkey" FOREIGN KEY ("rawDataId") REFERENCES "RawData"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "SemanticChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmbeddingUpdate" ADD CONSTRAINT "EmbeddingUpdate_embeddingId_fkey" FOREIGN KEY ("embeddingId") REFERENCES "Embedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NodeType" ADD CONSTRAINT "NodeType_ontologyVersionId_fkey" FOREIGN KEY ("ontologyVersionId") REFERENCES "OntologyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EdgeType" ADD CONSTRAINT "EdgeType_ontologyVersionId_fkey" FOREIGN KEY ("ontologyVersionId") REFERENCES "OntologyVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_rawDataId_fkey" FOREIGN KEY ("rawDataId") REFERENCES "RawData"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_chunkId_fkey" FOREIGN KEY ("chunkId") REFERENCES "SemanticChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_embeddingId_fkey" FOREIGN KEY ("embeddingId") REFERENCES "Embedding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Thought" ADD CONSTRAINT "Thought_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "Interaction"("interaction_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create additional indices
CREATE INDEX "Perspective_userId_idx" ON "Perspective"("userId");
CREATE INDEX "RawData_userId_idx" ON "RawData"("userId");
CREATE INDEX "RawData_sessionId_idx" ON "RawData"("sessionId");
CREATE INDEX "RawData_perspectiveOwnerId_idx" ON "RawData"("perspectiveOwnerId");
CREATE INDEX "SemanticChunk_rawDataId_idx" ON "SemanticChunk"("rawDataId");
CREATE INDEX "SemanticChunk_perspectiveOwnerId_idx" ON "SemanticChunk"("perspectiveOwnerId");
CREATE INDEX "Embedding_rawDataId_idx" ON "Embedding"("rawDataId");
CREATE INDEX "Embedding_chunkId_idx" ON "Embedding"("chunkId");
CREATE INDEX "Embedding_perspectiveOwnerId_idx" ON "Embedding"("perspectiveOwnerId");
CREATE INDEX "EmbeddingUpdate_embeddingId_idx" ON "EmbeddingUpdate"("embeddingId");
CREATE INDEX "NodeType_ontologyVersionId_idx" ON "NodeType"("ontologyVersionId");
CREATE INDEX "EdgeType_ontologyVersionId_idx" ON "EdgeType"("ontologyVersionId");
CREATE INDEX "Thought_userId_idx" ON "Thought"("userId");
CREATE INDEX "Thought_rawDataId_idx" ON "Thought"("rawDataId");
CREATE INDEX "Thought_chunkId_idx" ON "Thought"("chunkId");
CREATE INDEX "Thought_embeddingId_idx" ON "Thought"("embeddingId");
CREATE INDEX "Thought_interactionId_idx" ON "Thought"("interactionId");
CREATE INDEX "Thought_perspectiveOwnerId_idx" ON "Thought"("perspectiveOwnerId"); 