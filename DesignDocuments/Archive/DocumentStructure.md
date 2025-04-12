下面是一个非常具体且可执行的**实施落地指南**：

---

**🗂️ 两点一线 Memory Layer 实施与落地计划**

  

**📌 你需要生成的文件与实施顺序 (Files to generate and implementation order)**

  

**🚩 Phase 1: Preparation & Documentation (准备与文档)**

  

> 📁 **Files to Generate:**

  

• **technical_architecture.md**

• 完整描述系统整体架构、技术栈、组件交互方式

• **data_schema.sql**

• PostgreSQL: Raw Data 表结构

• 关系数据库schema脚本（Nodes, Edges, Embedding metadata）

• **knowledge_graph_schema.cypher**

• Neo4j图数据库节点和边定义的Schema文件

• **embedding_schema.json**

• 向量数据库Schema（Pinecone/Weaviate）定义文件

• **design_principles.md**

• 关键设计原则（中文+英文）

• **decision_framework.md**

• 决策框架详细说明文档

---

**🚩 Phase 2: API & Backend Implementation (后端开发与API设计)**

  

> 📁 **Files to Generate:**

  

• **data_processing_pipeline.py**

• Python代码实现数据预处理、语义切分、重要性过滤

• **knowledge_graph_api.py**

• API实现Knowledge Graph数据入库与查询（FastAPI, Flask）

• **embedding_api.py**

• Embedding生成与向量数据库更新API (调用OpenAI Embedding API)

• **incremental_embedding.py**

• Python脚本实现Incremental Embedding更新逻辑

• **ontology_expansion.py**

• 自动Ontology扩展（NER、聚类、自动分类）

---

**🚩 Phase 3: Prompt & AI Agent Implementation (Prompt与Agent实现)**

  

> 📁 **Files to Generate:**

  

• **cursor_prompt.txt**

• 给Cursor AI模型的数据处理Prompt示例

• **agent_system_prompt.txt**

• AI Agent系统Prompt (用于实际对用户交互的AI Agent)

---

**🚩 Phase 4: Frontend & Visualization (前端与可视化)**

  

> 📁 **Files to Generate:**

  

• **frontend_graph_vis.js**

• 前端图谱可视化交互 (Vis.js, D3.js)

• **embedding_explorer.js**

• Embedding向量检索前端界面代码

• **knowledge_dashboard.jsx**

• 用户知识/记忆图谱与Embedding数据的统一展示界面 (Next.js/React)

---

**🚩 Phase 5: Testing & Evaluation (测试与评估)**

  

> 📁 **Files to Generate:**

  

• **test_cases.json**

• 系统功能单元测试案例集合 (从简单到复杂)

• **evaluation_metrics.md**

• 定义评估系统表现的指标（Embedding相似度、Knowledge Graph召回准确性等）

---

**🚩 具体实施顺序 (Recommended Implementation Order)**

|**Step**|**Task (任务)**|**Outputs (输出文件)**|
|---|---|---|
|1|📝 完整文档准备 (Documentation)|technical_architecture.md, data_schema.sql, knowledge_graph_schema.cypher, embedding_schema.json, design_principles.md, decision_framework.md|
|2|🔧 搭建基础数据库 (DB Setup)|PostgreSQL, Neo4j, Pinecone (部署与测试)|
|3|🧩 数据处理Pipeline实现|data_processing_pipeline.py (语义分割、过滤)|
|4|🌐 API层实现（Knowledge Graph）|knowledge_graph_api.py (FastAPI/Flask API)|
|5|🌐 API层实现（Embedding）|embedding_api.py (向量存储API调用)|
|6|🔄 Incremental Embedding逻辑实现|incremental_embedding.py|
|7|🛠️ 自动Ontology扩展机制开发|ontology_expansion.py|
|8|🤖 AI模型Prompt设计与优化|cursor_prompt.txt, agent_system_prompt.txt|
|9|🎨 前端展示与交互界面开发|frontend_graph_vis.js, embedding_explorer.js, knowledge_dashboard.jsx|
|10|✅ 系统整合联调与基础功能测试|功能正常联通，各组件交互顺畅|
|11|🚨 单元测试与端到端测试|test_cases.json, 单元测试通过|
|12|📈 系统评估与优化|evaluation_metrics.md, 性能指标达标|

  

---

**🛠️ 具体开发顺序举例（Detailed Example）：**

  

**(举例) Step-by-step示范：**

• ✅ **第一周 (Week 1)**

• 完成所有技术文档与数据Schema定义

• PostgreSQL/Neo4j/Pinecone 环境搭建

• ✅ **第二周 (Week 2)**

• 实现Data Processing Pipeline (data_processing_pipeline.py)

• 生成示例数据入库到数据库

• ✅ **第三周 (Week 3)**

• Knowledge Graph API (knowledge_graph_api.py)开发与单元测试

• ✅ **第四周 (Week 4)**

• Embedding API (embedding_api.py)开发与单元测试

• ✅ **第五周 (Week 5)**

• Incremental Embedding Logic (incremental_embedding.py)实现与优化

• ✅ **第六周 (Week 6)**

• Ontology自动扩展机制 (ontology_expansion.py)开发

• ✅ **第七周 (Week 7)**

• 完成Cursor Prompt 与 Agent System Prompt设计优化

• ✅ **第八周 (Week 8)**

• 开发前端知识图谱与Embedding数据的可视化与交互

• ✅ **第九周 (Week 9)**

• 整合测试、联调并修复Bug

• ✅ **第十周 (Week 10)**

• 功能测试与性能评估，确定系统初步部署

---

**🧑‍💻 提供给Cursor AI 的 Prompt 范例 (Cursor AI Prompt Example):**

```
Here is the structured document for the "Two Dots One Line" product's Memory Layer system. Follow the technical architecture outlined, generate and maintain the specified data schema, and implement embedding and knowledge graph structures as clearly described in the documentation. Adhere strictly to provided Design Principles and Decision Framework.

Your tasks:
- Implement semantic chunking, importance filtering, and incremental embedding precisely.
- Automatically maintain and expand the ontology for the knowledge graph as specified.
- Use provided data schemas to handle all data consistently and precisely.
- Generate embedding vectors based on combined Raw Input and Knowledge Graph contexts.
- Always document your outputs clearly with structured JSON.

Confirm each step and report clearly on progress.
```

  

---

**✅ 整体实施最佳实践建议（Best Practice）：**

• 每个阶段结束前，明确输出可演示成果。

• 增量开发，每周小目标明确，易于跟踪。

• Prompt文件与文档定期更新，确保实现质量。

---

以上文档能够帮助你一步步精准落地开发，并可直接指导Cursor AI与开发团队，完整实现两点一线产品背后的Memory Layer技术架构。

  

如还有任何其他的细节或调整需求，请随时提出！

Here are your fully structured and ready-to-use documents:

---

**✅ 1. data_schema.sql**

```
-- PostgreSQL Schema for Raw Data Storage
CREATE TABLE raw_data (
  source_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'user_chat', 'uploaded_file'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  perspective_owner_id TEXT, -- who provided the data
  subject_id TEXT -- who the data is about
);

-- PostgreSQL Schema for Embedding Metadata
CREATE TABLE embedding_metadata (
  embedding_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  importance_score FLOAT NOT NULL,
  source_ids TEXT[], -- array of raw_data source_ids
  linked_node_ids TEXT[], -- linked knowledge graph node ids
  subject_id TEXT,
  perspective_owner_id TEXT,
  last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

  

---

**✅ 2. knowledge_graph_schema.cypher**

```
// Constraints for uniqueness
CREATE CONSTRAINT ON (p:Person) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT ON (e:Event) ASSERT e.id IS UNIQUE;
CREATE CONSTRAINT ON (em:Emotion) ASSERT em.id IS UNIQUE;
CREATE CONSTRAINT ON (o:Object) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT ON (h:Hobby) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT ON (pl:Place) ASSERT pl.id IS UNIQUE;
CREATE CONSTRAINT ON (i:Identity) ASSERT i.id IS UNIQUE;

// Sample Nodes
CREATE (user:Person {id:'user_001', name:'Mother', role:'User'});
CREATE (child:Person {id:'child_001', name:'Daughter', role:'Child'});

CREATE (piano:Object {id:'object_piano', name:'Piano'});
CREATE (piano_hobby:Hobby {id:'hobby_piano', name:'Playing Piano'});

// Sample Event & Emotion Nodes
CREATE (event_start:Event {id:'event_001', title:'Started Piano Practice', timestamp:datetime()});
CREATE (emotion_excited:Emotion {id:'emotion_001', label:'Excitement', intensity:'high'});

// Relationships
CREATE (child)-[:PARTICIPATED_IN]->(event_start);
CREATE (event_start)-[:FELT_DURING]->(emotion_excited);
CREATE (child)-[:USES_OBJECT]->(piano);
CREATE (child)-[:HAS_HOBBY]->(piano_hobby);
CREATE (user)-[:OBSERVED_BY]->(event_start);
CREATE (user)-[:USES_OBJECT]->(piano);
```

  

---

**✅ 3. embedding_schema.json**

```
{
  "embedding_id": "emb_001",
  "vector": [0.0156, -0.0234, 0.1234, ..., 0.5678], 
  "metadata": {
    "summary": "Daughter started piano practice, initially excited.",
    "importance_score": 0.92,
    "source_ids": ["raw_001"],
    "linked_node_ids": ["event_001", "emotion_001", "object_piano"],
    "subject_id": "child_001",
    "perspective_owner_id": "user_001",
    "last_updated_at": "2025-04-01T12:00:00Z"
  }
}
```

  

---

**✅ 4. design_principles.md**

```
# 关键设计原则 (Design Principles)

## 1. Semantic Chunking (语义切分)
- Break down large texts into discrete, meaningful semantic units.

## 2. Importance Filtering (重要性过滤)
- Store only information that provides significant insight into user's mental model or experiences.

## 3. Incremental Embedding (增量式嵌入)
- Avoid redundant embeddings by incrementally updating vectors with semantically similar new information.

## 4. Knowledge Graph-first Embedding (先知识图谱再Embedding)
- Clearly define Knowledge Graph nodes and edges first, then generate embeddings based on this structured context.

## 5. Automatic Ontology Expansion (自动本体扩展)
- Dynamically and intelligently expand ontology (node and edge types) based on continuous analysis of user data.

## 6. Incremental Graph Migration (增量图谱迁移)
- Perform incremental updates when ontology changes, rather than complete reprocessing of historical data.

## 7. Two-layer Structure (双层架构)
- Maintain a stable core ontology layer with dynamic extensions to manage flexibility and stability.

## 8. Comprehensive Contextual Embedding (综合上下文嵌入)
- Embed vectors considering both raw textual inputs and structured Knowledge Graph contexts.

## 9. Human-in-the-loop (人机协作)
- Include manual confirmation steps for critical ontology expansions and data quality assessments.

## 10. Semantic Similarity Threshold (语义相似度阈值)
- Use defined thresholds to manage incremental embedding updates and minimize redundancy.
```

  

---

**✅ 5. decision_framework.md**

```
# Decision Framework for Memory Layer Management

## Input Handling:

### Step 1: Semantic Chunking
- If large input (>500 tokens), split into ~200-500 token semantic chunks.

### Step 2: Importance Filtering
- Classify each chunk using Importance Filtering:
  - Unimportant: Archive raw data only.
  - Important: Proceed to Knowledge Graph processing.

## Knowledge Graph Decision Logic:

### Step 3: Node & Edge Creation
- Create new nodes and edges if:
  - Semantically unique event, emotion, object, or relationship emerges.
- Else, update metadata on existing nodes.

### Step 4: Ontology Expansion
- Trigger ontology expansion if:
  - New entity types or relationship patterns significantly differ from existing ones.
- Validate expansion through human-in-the-loop confirmation.

## Embedding Decision Logic:

### Step 5: Embedding Generation
- Generate embeddings using comprehensive context (raw input + Knowledge Graph related nodes).

### Step 6: Incremental Embedding Update
- Check semantic similarity against existing embeddings:
  - Similarity > 0.9: Update metadata only.
  - Similarity 0.7-0.9: Perform incremental embedding update.
  - Similarity < 0.7: Generate new embedding vector.

## Data Consistency and Maintenance:

### Step 7: Incremental Graph Migration
- When new ontology structures are approved:
  - Perform incremental migration on existing graph data.
  - Update relevant embeddings incrementally.

### Step 8: Resource Management
- Use two-layer ontology structure to manage resource consumption:
  - Stable Core: Rarely updated, comprehensive embedding.
  - Dynamic Extensions: Updated incrementally, partial embedding updates.
```

  

---

**🚩 How to Use These Documents:**

• **data_schema.sql**:

Execute in PostgreSQL to create raw data and metadata tables.

• **knowledge_graph_schema.cypher**:

Run in Neo4j to establish the initial knowledge graph schema.

• **embedding_schema.json**:

Template for embedding data insertion and incremental updating in Pinecone or Weaviate.

• **design_principles.md** and **decision_framework.md**:

Share with your development team and Cursor AI as reference documents to clearly guide development processes and data-handling logic.

---

These files provide a solid foundation for direct deployment and refinement of your memory layer system. If any additional customizations or adjustments are needed, please let me know!py



# Data Schema Enhancement for Memory Layer Implementation

After reviewing the memory layer design and document structure guidance, I'm proposing the following data schema enhancements to serve as a foundation for implementing the comprehensive memory layer.

## 1. PostgreSQL Schema (Raw Data and Metadata)

```sql
-- Raw Data Storage
CREATE TABLE raw_data (
  source_id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'user_chat', 'uploaded_file', 'image', 'document' etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  perspective_owner_id TEXT NOT NULL, -- who provided/narrated the data (usually user_id)
  subject_id TEXT, -- whom the data is about (could be user or others)
  importance_score FLOAT, -- preliminary importance score
  processed_flag BOOLEAN DEFAULT FALSE, -- indicates if processed by semantic pipeline
  batch_id TEXT -- optional grouping for related inputs
);

-- Semantic Chunks Table (For chunked processing of larger content)
CREATE TABLE semantic_chunks (
  chunk_id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES raw_data(source_id),
  chunk_content TEXT NOT NULL,
  chunk_summary TEXT,
  chunk_index INTEGER, -- position in sequence
  importance_score FLOAT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  perspective_owner_id TEXT NOT NULL,
  subject_id TEXT,
  CONSTRAINT unique_chunk_per_source UNIQUE (source_id, chunk_index)
);

-- Embedding Metadata Table
CREATE TABLE embedding_metadata (
  embedding_id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  content TEXT NOT NULL, -- the text that was embedded
  importance_score FLOAT NOT NULL,
  source_ids TEXT[] NOT NULL, -- array of raw_data or chunk source_ids
  linked_node_ids TEXT[] NOT NULL, -- linked knowledge graph node ids
  subject_id TEXT NOT NULL,
  perspective_owner_id TEXT NOT NULL,
  embedding_type TEXT NOT NULL, -- 'thought', 'entity', 'event', etc.
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  vector_collection TEXT NOT NULL, -- which vector collection/table this is stored in
  vector_id TEXT NOT NULL, -- ID in the vector database
  confidence_score FLOAT DEFAULT 1.0,
  is_incremental BOOLEAN DEFAULT FALSE -- indicates if this is an incremental update
);

-- History of Embedding Updates (for tracking incremental changes)
CREATE TABLE embedding_update_history (
  update_id TEXT PRIMARY KEY,
  embedding_id TEXT NOT NULL REFERENCES embedding_metadata(embedding_id),
  previous_summary TEXT,
  update_reason TEXT NOT NULL, -- 'new_information', 'correction', 'refinement'
  source_id TEXT NOT NULL, -- which source triggered this update
  similarity_score FLOAT, -- similarity with previous embedding
  update_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Thoughts Table (for extracted insights)
CREATE TABLE thoughts (
  thought_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  embedding_id TEXT REFERENCES embedding_metadata(embedding_id),
  source_id TEXT REFERENCES raw_data(source_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  subject_type TEXT, -- 'user_trait', 'user_experience', etc.
  subject_name TEXT, -- specific entity/concept name
  confidence_score FLOAT DEFAULT 1.0
);
```

## 2. Neo4j Knowledge Graph Schema (Cypher)

```cypher
// Constraints for Node Uniqueness
CREATE CONSTRAINT ON (p:Person) ASSERT p.id IS UNIQUE;
CREATE CONSTRAINT ON (e:Event) ASSERT e.id IS UNIQUE;
CREATE CONSTRAINT ON (em:Emotion) ASSERT em.id IS UNIQUE;
CREATE CONSTRAINT ON (o:Object) ASSERT o.id IS UNIQUE;
CREATE CONSTRAINT ON (pl:Place) ASSERT pl.id IS UNIQUE;
CREATE CONSTRAINT ON (i:Identity) ASSERT i.id IS UNIQUE;
CREATE CONSTRAINT ON (h:Hobby) ASSERT h.id IS UNIQUE;
CREATE CONSTRAINT ON (t:Trait) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT ON (v:Value) ASSERT v.id IS UNIQUE;
CREATE CONSTRAINT ON (g:Goal) ASSERT g.id IS UNIQUE;
CREATE CONSTRAINT ON (c:Challenge) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT ON (s:System) ASSERT s.id IS UNIQUE;

// Enhanced Node Schema With Required Metadata
// Person node template with perspective tracking
CREATE (p:Person {
  id: 'person_001',
  name: 'Example Person',
  role: 'User/Child/Friend/etc',
  subject_id: 'subject_unique_id', // Who this node represents 
  perspective_owner_id: 'user_001', // Whose perspective created this
  source_type: 'direct_statement/inference/observation',
  created_at: datetime(),
  last_updated_at: datetime(),
  confidence: 0.95,
  source_ids: ['raw_001', 'raw_002'] // Provenance tracking
});

// Event node template with temporal information
CREATE (e:Event {
  id: 'event_001',
  title: 'Example Event',
  description: 'Detailed event description',
  subject_id: 'subject_unique_id', // Who experienced this event
  perspective_owner_id: 'user_001', // Who narrated this event
  source_type: 'direct_statement/observation/inference',
  timestamp: datetime(), // When the event occurred
  created_at: datetime(), // When this node was created
  last_updated_at: datetime(),
  confidence: 0.9,
  source_ids: ['raw_001']
});

// Emotion node template with intensity information
CREATE (em:Emotion {
  id: 'emotion_001',
  label: 'Joy/Sadness/Anxiety/etc',
  intensity: 'low/moderate/high',
  subject_id: 'subject_unique_id', // Who felt this emotion
  perspective_owner_id: 'user_001', // Who observed/reported this emotion
  source_type: 'direct_statement/observation/inference',
  created_at: datetime(),
  confidence: 0.85,
  source_ids: ['raw_001']
});

// Enhanced Relationship Types with Metadata
// PARTICIPATED_IN relationship with metadata
MATCH (p:Person {id:'person_001'}), (e:Event {id:'event_001'})
CREATE (p)-[:PARTICIPATED_IN {
  role: 'participant/observer/initiator',
  created_at: datetime(),
  source_ids: ['raw_001'],
  confidence: 0.9,
  perspective_owner_id: 'user_001'
}]->(e);

// FELT_DURING relationship with temporal context
MATCH (e:Event {id:'event_001'}), (em:Emotion {id:'emotion_001'})
CREATE (e)-[:FELT_DURING {
  temporal_relation: 'before/during/after',
  created_at: datetime(),
  source_ids: ['raw_001'],
  confidence: 0.85,
  perspective_owner_id: 'user_001'
}]->(em);

// HAS_TRAIT relationship with evidence tracking
MATCH (p:Person {id:'person_001'}), (t:Trait {id:'trait_001'})
CREATE (p)-[:HAS_TRAIT {
  strength: 'weak/moderate/strong',
  created_at: datetime(),
  updated_at: datetime(),
  frequency: 1, // How many times this trait has been observed
  source_ids: ['raw_001'],
  confidence: 0.8,
  perspective_owner_id: 'user_001'
}]->(t);
```

## 3. Vector Database Schema (JSON for Pinecone/Weaviate)

```json
{
  "collections": [
    {
      "name": "thoughts",
      "dimensions": 768,
      "metadata_schema": {
        "thought_id": "string",
        "user_id": "string",
        "title": "string",
        "content": "string",
        "summary": "string",
        "importance_score": "float",
        "source_ids": "string[]",
        "linked_node_ids": "string[]",
        "subject_id": "string",
        "subject_type": "string",
        "perspective_owner_id": "string",
        "created_at": "string",
        "last_updated_at": "string",
        "confidence": "float"
      }
    },
    {
      "name": "entities",
      "dimensions": 768,
      "metadata_schema": {
        "entity_id": "string",
        "name": "string",
        "category": "string",
        "description": "string",
        "importance_score": "float",
        "source_ids": "string[]",
        "linked_node_ids": "string[]",
        "subject_id": "string",
        "perspective_owner_id": "string",
        "created_at": "string",
        "last_updated_at": "string",
        "confidence": "float"
      }
    },
    {
      "name": "events",
      "dimensions": 768,
      "metadata_schema": {
        "event_id": "string",
        "title": "string",
        "description": "string",
        "temporal_info": "string",
        "importance_score": "float",
        "source_ids": "string[]",
        "linked_node_ids": "string[]",
        "subject_id": "string",
        "perspective_owner_id": "string",
        "created_at": "string",
        "last_updated_at": "string",
        "confidence": "float"
      }
    }
  ],
  "example_vector": {
    "id": "emb_001",
    "vector": [0.0156, -0.0234, 0.1234, 0.5678],
    "metadata": {
      "thought_id": "thought_001",
      "user_id": "user_001",
      "title": "Piano Practice Beginning",
      "content": "Daughter started piano practice with initial excitement but later developed reluctance",
      "summary": "Daughter's fluctuating interest in piano practice",
      "importance_score": 0.92,
      "source_ids": ["raw_001", "raw_002"],
      "linked_node_ids": ["event_001", "emotion_001", "emotion_002", "object_piano"],
      "subject_id": "child_001",
      "subject_type": "user_experience",
      "perspective_owner_id": "user_001",
      "created_at": "2023-05-10T12:00:00Z",
      "last_updated_at": "2023-05-15T14:30:00Z",
      "confidence": 0.95
    }
  },
  "incremental_update_example": {
    "id": "emb_001",
    "original_vector": [0.0156, -0.0234, 0.1234, 0.5678],
    "update_vector": [0.0160, -0.0240, 0.1240, 0.5670],
    "alpha": 0.3, // Weight for new information
    "updated_vector": [0.0158, -0.0236, 0.1236, 0.5676], // Weighted combination
    "similarity_score": 0.86 // Similarity between original and update vectors
  }
}
```

## 4. Ontology Management Schema

```sql
-- Track ontology evolution
CREATE TABLE ontology_versions (
  version_id TEXT PRIMARY KEY,
  version_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT FALSE
);

-- Node types in the ontology
CREATE TABLE node_types (
  type_id TEXT PRIMARY KEY,
  type_name TEXT NOT NULL,
  description TEXT,
  parent_type TEXT,
  ontology_version_id TEXT REFERENCES ontology_versions(version_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_core BOOLEAN DEFAULT FALSE, -- Is this part of the core ontology?
  properties JSONB -- Expected properties for this node type
);

-- Edge types in the ontology
CREATE TABLE edge_types (
  type_id TEXT PRIMARY KEY,
  type_name TEXT NOT NULL,
  description TEXT,
  source_node_types TEXT[], -- Which node types can be the source
  target_node_types TEXT[], -- Which node types can be the target
  ontology_version_id TEXT REFERENCES ontology_versions(version_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_core BOOLEAN DEFAULT FALSE, -- Is this part of the core ontology?
  properties JSONB -- Expected properties for this edge type
);

-- Track proposed ontology changes
CREATE TABLE ontology_change_proposals (
  proposal_id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'new_node_type', 'new_edge_type', 'modify_node_type', etc.
  description TEXT NOT NULL,
  proposed_definition JSONB NOT NULL,
  justification TEXT NOT NULL,
  examples TEXT[], -- Example entities/relationships
  supporting_data_count INTEGER, -- How many instances support this change?
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by TEXT
);
```

## 5. Key Enhancements from Current Schema

1. **Multi-perspective Support**: Added `perspective_owner_id` and `subject_id` to all relevant tables to track who provided the information and whom it's about.

2. **Semantic Chunking**: Added a dedicated `semantic_chunks` table to support breaking down large texts into meaningful units while preserving the relationship to source.

3. **Incremental Updates**: Added `embedding_update_history` to track changes to embeddings over time, with metadata about why updates occurred.

4. **Confidence Scoring**: Added `confidence_score` fields to allow for uncertainty representation in extracted knowledge.

5. **Richer Metadata**: Enhanced all schemas with more detailed metadata about provenance, timestamps, and relationship context.

6. **Ontology Management**: Added tables to track ontology versions and proposed changes, supporting the dynamic ontology expansion capability.

7. **Enhanced Node Properties**: Added more detailed properties to knowledge graph nodes, supporting richer context and attribution.

8. **Relationship Metadata**: Added metadata to relationships in the knowledge graph to track confidence, perspective, and provenance.

These schema enhancements provide a solid foundation for implementing the complete memory layer as described in the design documents, supporting key features like semantic chunking, importance filtering, incremental embedding, and perspective management.
