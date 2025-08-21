|ingestio | 2025-08-21T12:53:48: 🔍 Auth Debug - Authorization header: "Bearer dev-token..."
1|ingestio | 2025-08-21T12:53:48: 🔍 Auth Debug - Extracted token length: 9
1|ingestio | 2025-08-21T12:53:48: 🔧 Auth Debug - Development mode dev-token accepted
1|ingestio | 2025-08-21T12:53:48: prisma:info Starting a postgresql pool with 29 connections.
1|ingestio | 2025-08-21T12:53:48: prisma:query SELECT "public"."conversations"."id", "public"."conversations"."user_id", "public"."conversations"."title", "public"."conversations"."start_time", "public"."conversations"."ended_at", "public"."conversations"."context_summary", "public"."conversations"."metadata", "public"."conversations"."importance_score", "public"."conversations"."source_card_id", "public"."conversations"."status" FROM "public"."conversations" WHERE "public"."conversations"."user_id" = $1 ORDER BY "public"."conversations"."start_time" DESC LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:53:48: prisma:query SELECT "public"."conversation_messages"."id", "public"."conversation_messages"."conversation_id", "public"."conversation_messages"."role", "public"."conversation_messages"."media_ids", "public"."conversation_messages"."content", "public"."conversation_messages"."llm_call_metadata", "public"."conversation_messages"."timestamp" FROM "public"."conversation_messages" WHERE "public"."conversation_messages"."conversation_id" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50) ORDER BY "public"."conversation_messages"."timestamp" DESC OFFSET $51
1|ingestio | 2025-08-21T12:53:48: prisma:query SELECT COUNT(*) AS "_count._all" FROM (SELECT "public"."conversations"."id" FROM "public"."conversations" WHERE "public"."conversations"."user_id" = $1 OFFSET $2) AS "sub"
1|ingestio | 2025-08-21T12:53:51: 🐛 DEBUG: Received Redis event - pattern: __keyevent@0__:expired, channel: __keyevent@0__:expired, message: bull:ingestion-queue:stalled-check
1|ingestio | 2025-08-21T12:53:51: ⚪ Other Redis event (not conversation timeout): bull:ingestion-queue:stalled-check
1|ingestio | 2025-08-21T12:54:03: [IngestionWorker] Processing job 2: debug-neo4j-test
1|ingestio | 2025-08-21T12:54:03: [IngestionAnalyst] Processing conversation debug-neo4j-test for user dev-user-123
1|ingestio | 2025-08-21T12:54:03: prisma:query SELECT 1
1|ingestio | 2025-08-21T12:54:03: prisma:query SELECT "public"."conversation_messages"."id", "public"."conversation_messages"."conversation_id", "public"."conversation_messages"."role", "public"."conversation_messages"."media_ids", "public"."conversation_messages"."content", "public"."conversation_messages"."llm_call_metadata", "public"."conversation_messages"."timestamp" FROM "public"."conversation_messages" WHERE "public"."conversation_messages"."conversation_id" = $1 ORDER BY "public"."conversation_messages"."timestamp" ASC LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:03: [IngestionAnalyst] Built transcript with 2 messages (653 chars)
1|ingestio | 2025-08-21T12:54:03: prisma:query SELECT "public"."users"."user_id", "public"."users"."email", "public"."users"."hashed_password", "public"."users"."name", "public"."users"."preferences", "public"."users"."region", "public"."users"."timezone", "public"."users"."language_preference", "public"."users"."profile_picture_url", "public"."users"."created_at", "public"."users"."last_active_at", "public"."users"."account_status", "public"."users"."concepts_created_in_cycle", "public"."users"."knowledge_graph_schema", "public"."users"."last_cycle_started_at", "public"."users"."memory_profile", "public"."users"."next_conversation_context_package" FROM "public"."users" WHERE ("public"."users"."user_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:03: [HolisticAnalysisTool] Starting holistic analysis for user dev-user-123
1|ingestio | 2025-08-21T12:54:03: 🔄 LLMChatTool: Forcing reinitialization
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Found LLM_CHAT_MODEL=gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Using environment variable for chat: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🤖 LLMChatTool: Initializing with model gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Found LLM_CHAT_MODEL=gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Using environment variable for chat: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Found LLM_VISION_MODEL=gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Using environment variable for vision: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Found LLM_EMBEDDING_MODEL=text-embedding-004
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Using environment variable for embedding: text-embedding-004
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🔧 Environment-First Model Configuration:
1|ingestio | 2025-08-21T12:54:03: ==========================================
1|ingestio | 2025-08-21T12:54:03: 📱 Chat Model: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 👁️ Vision Model: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔗 Embedding Model: text-embedding-004
1|ingestio | 2025-08-21T12:54:03: 🔄 Fallback Model: gemini-2.0-flash-exp
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🔍 Environment Variable Status:
1|ingestio | 2025-08-21T12:54:03: LLM_CHAT_MODEL: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: LLM_VISION_MODEL: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: LLM_EMBEDDING_MODEL: text-embedding-004
1|ingestio | 2025-08-21T12:54:03: LLM_FALLBACK_MODEL: gemini-2.0-flash-exp
1|ingestio | 2025-08-21T12:54:03: ==========================================
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Found LLM_CHAT_MODEL=gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 🔧 EnvironmentModelConfigService: Using environment variable for chat: gemini-2.5-flash
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🤖 LLMChatTool - FINAL ASSEMBLED PROMPT SENT TO LLM:
1|ingestio | 2025-08-21T12:54:03: 🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
1|ingestio | 2025-08-21T12:54:03: You are an advanced AI analyst. Follow the instructions exactly and return only valid JSON.
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: RELEVANT CONTEXT FROM USER'S PAST:
1|ingestio | 2025-08-21T12:54:03: No memories provided.
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: CURRENT MESSAGE: <system_identity>
1|ingestio | 2025-08-21T12:54:03:   <persona>
1|ingestio | 2025-08-21T12:54:03:     <name>Dot</name>
1|ingestio | 2025-08-21T12:54:03:     <archetype>The Reflected-Self Growth Catalyst</archetype>
1|ingestio | 2025-08-21T12:54:03:     <description>
1|ingestio | 2025-08-21T12:54:03:       You are an expert knowledge analyst, strategist, personal historian and autobiographer. Given a conversation between USER and ASSISTANT, you extract and persist salient memories, concepts, relationships, and growth events. You then craft forward-looking context for the next conversation.
1|ingestio | 2025-08-21T12:54:03:     </description>
1|ingestio | 2025-08-21T12:54:03:   </persona>
1|ingestio | 2025-08-21T12:54:03: </system_identity>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: <critical_rules>
1|ingestio | 2025-08-21T12:54:03: ⚠️  CRITICAL RULES (read every time)
1|ingestio | 2025-08-21T12:54:03: 1. **Output exactly one JSON object**, wrapped between the literal markers ###==BEGIN_JSON==### and ###==END_JSON==###
1|ingestio | 2025-08-21T12:54:03: 2. **Follow the exact schema** provided in the <instructions> section. Missing or extra fields will cause system errors.
1|ingestio | 2025-08-21T12:54:03: 3. **Be concise but comprehensive** - capture the essence without redundancy
1|ingestio | 2025-08-21T12:54:03: 4. **Focus on USER insights** - the conversation is about understanding the USER, not the ASSISTANT
1|ingestio | 2025-08-21T12:54:03: 5. **Extract actionable knowledge** - prioritize information that helps future conversations
1|ingestio | 2025-08-21T12:54:03: 6. **Maintain temporal context** - note when events occurred relative to the conversation
1|ingestio | 2025-08-21T12:54:03: 7. **Preserve emotional nuance** - capture feelings, motivations, and growth indicators
1|ingestio | 2025-08-21T12:54:03: 8. **Generate meaningful IDs** - use descriptive temp_ids that indicate content (e.g., "mem_career_change_2024")
1|ingestio | 2025-08-21T12:54:03: 9. **Score importance objectively** - use 1-10 scale where 10 = life-changing revelations, 1 = casual mentions
1|ingestio | 2025-08-21T12:54:03: 10. **Create forward momentum** - your output directly influences the next conversation's quality
1|ingestio | 2025-08-21T12:54:03: </critical_rules>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: <user_memory_profile>
1|ingestio | 2025-08-21T12:54:03: No existing memory profile
1|ingestio | 2025-08-21T12:54:03: </user_memory_profile>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: <knowledge_graph_schema>
1|ingestio | 2025-08-21T12:54:03: {
1|ingestio | 2025-08-21T12:54:03:   "description_for_llm": "The schema below represents the potential structure you can help build. Focus on creating :MemoryUnit and :Concept nodes first.",
1|ingestio | 2025-08-21T12:54:03:   "prominent_node_types": [],
1|ingestio | 2025-08-21T12:54:03:   "prominent_relationship_types": [],
1|ingestio | 2025-08-21T12:54:03:   "example_concept_types": [
1|ingestio | 2025-08-21T12:54:03:     "person",
1|ingestio | 2025-08-21T12:54:03:     "organization",
1|ingestio | 2025-08-21T12:54:03:     "location",
1|ingestio | 2025-08-21T12:54:03:     "project",
1|ingestio | 2025-08-21T12:54:03:     "goal",
1|ingestio | 2025-08-21T12:54:03:     "value",
1|ingestio | 2025-08-21T12:54:03:     "skill",
1|ingestio | 2025-08-21T12:54:03:     "interest",
1|ingestio | 2025-08-21T12:54:03:     "emotion",
1|ingestio | 2025-08-21T12:54:03:     "theme",
1|ingestio | 2025-08-21T12:54:03:     "event_theme",
1|ingestio | 2025-08-21T12:54:03:     "role"
1|ingestio | 2025-08-21T12:54:03:   ],
1|ingestio | 2025-08-21T12:54:03:   "relationship_label_guidelines": {
1|ingestio | 2025-08-21T12:54:03:     "description": "Guidelines for generating relationship_description strings for new relationships.",
1|ingestio | 2025-08-21T12:54:03:     "format": "Should be a concise, human-readable, verb-based phrase in the present tense.",
1|ingestio | 2025-08-21T12:54:03:     "style": "Be as specific as the context allows. Describe the connection clearly.",
1|ingestio | 2025-08-21T12:54:03:     "examples": [
1|ingestio | 2025-08-21T12:54:03:       "is motivated by",
1|ingestio | 2025-08-21T12:54:03:       "is an obstacle to",
1|ingestio | 2025-08-21T12:54:03:       "expresses frustration with",
1|ingestio | 2025-08-21T12:54:03:       "has skill in",
1|ingestio | 2025-08-21T12:54:03:       "is a core part of",
1|ingestio | 2025-08-21T12:54:03:       "has symptom"
1|ingestio | 2025-08-21T12:54:03:     ]
1|ingestio | 2025-08-21T12:54:03:   }
1|ingestio | 2025-08-21T12:54:03: }
1|ingestio | 2025-08-21T12:54:03: </knowledge_graph_schema>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: <conversation_transcript>
1|ingestio | 2025-08-21T12:54:03: USER: I have made a revolutionary discovery about the intersection of quantum computing and artificial intelligence. This breakthrough represents a fundamental shift in my understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.
1|ingestio | 2025-08-21T12:54:03: ASSISTANT: Your discovery about quantum computing and AI is truly groundbreaking. The intersection of these fields indeed represents a paradigm shift in computational theory. Quantum algorithms could potentially solve problems that classical computers cannot, particularly in areas like cryptography, optimization, and machine learning.
1|ingestio | 2025-08-21T12:54:03: </conversation_transcript>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: <instructions>
1|ingestio | 2025-08-21T12:54:03: Your task: Analyze the conversation transcript and generate a comprehensive JSON response with two main sections:
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: **SECTION 1: persistence_payload**
1|ingestio | 2025-08-21T12:54:03: Extract and structure knowledge for long-term storage:
1|ingestio | 2025-08-21T12:54:03: - conversation_summary: 2-3 sentence overview of main topics and outcomes
1|ingestio | 2025-08-21T12:54:03: - conversation_importance_score: 1-10 rating of overall significance using these criteria:
1|ingestio | 2025-08-21T12:54:03:   * 1-3: Routine daily activities, casual conversation, minor updates
1|ingestio | 2025-08-21T12:54:03:   * 4-6: Moderate personal events, work progress, relationship developments
1|ingestio | 2025-08-21T12:54:03:   * 7-8: Significant life events, major achievements, emotional breakthroughs, career milestones
1|ingestio | 2025-08-21T12:54:03:   * 9-10: Life-changing events, major personal transformations, profound insights, critical decisions
1|ingestio | 2025-08-21T12:54:03: - extracted_memory_units: Array of discrete memories/experiences mentioned (focus on emotionally significant or transformative moments). ALWAYS extract at least 1-2 memory units from any conversation with personal content.
1|ingestio | 2025-08-21T12:54:03: - extracted_concepts: Array of topics, themes, interests, or entities discussed. ALWAYS extract at least 2-3 concepts from any conversation with meaningful content.
1|ingestio | 2025-08-21T12:54:03: - new_relationships: Array of connections between entities (person-to-concept, concept-to-concept, etc.)
1|ingestio | 2025-08-21T12:54:03: - detected_growth_events: Array of personal development moments with quantified impact
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: **SECTION 2: forward_looking_context**
1|ingestio | 2025-08-21T12:54:03: Prepare context for the next conversation:
1|ingestio | 2025-08-21T12:54:03: - proactive_greeting: Warm, personalized opening that references recent topics
1|ingestio | 2025-08-21T12:54:03: - unresolved_topics_for_next_convo: Array of topics that need follow-up or deeper exploration
1|ingestio | 2025-08-21T12:54:03: - suggested_initial_focus: One-sentence suggestion for where the next conversation should start
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: **OUTPUT FORMAT:**
1|ingestio | 2025-08-21T12:54:03: Return your answer **between** the exact markers
1|ingestio | 2025-08-21T12:54:03: `###==BEGIN_JSON==###` and `###==END_JSON==###`.
1|ingestio | 2025-08-21T12:54:03: The content **must** match this schema:
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: ```json
1|ingestio | 2025-08-21T12:54:03: {
1|ingestio | 2025-08-21T12:54:03:   "persistence_payload": {
1|ingestio | 2025-08-21T12:54:03:     "conversation_summary": "string",
1|ingestio | 2025-08-21T12:54:03:     "conversation_importance_score": number,
1|ingestio | 2025-08-21T12:54:03:     "extracted_memory_units": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "temp_id": "mem_[unique_id]", // Must start with 'mem_' followed by alphanumeric characters
1|ingestio | 2025-08-21T12:54:03:         "title": "string", 
1|ingestio | 2025-08-21T12:54:03:         "content": "string",
1|ingestio | 2025-08-21T12:54:03:         "source_type": "conversation_extraction",
1|ingestio | 2025-08-21T12:54:03:         "creation_ts": "ISO8601_timestamp"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "extracted_concepts": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "name": "string",
1|ingestio | 2025-08-21T12:54:03:         "type": "string",
1|ingestio | 2025-08-21T12:54:03:         "description": "string"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "new_relationships": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "source_entity_id_or_name": "string",
1|ingestio | 2025-08-21T12:54:03:         "target_entity_id_or_name": "string", 
1|ingestio | 2025-08-21T12:54:03:         "relationship_description": "string"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "detected_growth_events": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "dim_key": "know_self|know_world|act_self|act_world|show_self|show_world", // Must be one of these exact values
1|ingestio | 2025-08-21T12:54:03:         "delta": number, // Must be between -5.0 and 5.0
1|ingestio | 2025-08-21T12:54:03:         "rationale": "string"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ]
1|ingestio | 2025-08-21T12:54:03:   },
1|ingestio | 2025-08-21T12:54:03:   "forward_looking_context": {
1|ingestio | 2025-08-21T12:54:03:     "proactive_greeting": "string",
1|ingestio | 2025-08-21T12:54:03:     "unresolved_topics_for_next_convo": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "topic": "string",
1|ingestio | 2025-08-21T12:54:03:         "summary_of_unresolution": "string",
1|ingestio | 2025-08-21T12:54:03:         "suggested_question": "string"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "suggested_initial_focus": "string"
1|ingestio | 2025-08-21T12:54:03:   }
1|ingestio | 2025-08-21T12:54:03: }
1|ingestio | 2025-08-21T12:54:03: ```
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: **EXAMPLE RESPONSE STRUCTURE:**
1|ingestio | 2025-08-21T12:54:03: ```json
1|ingestio | 2025-08-21T12:54:03: {
1|ingestio | 2025-08-21T12:54:03:   "persistence_payload": {
1|ingestio | 2025-08-21T12:54:03:     "conversation_summary": "User discussed their passion for quantum physics and how reading a book about consciousness changed their perspective on reality.",
1|ingestio | 2025-08-21T12:54:03:     "conversation_importance_score": 7,
1|ingestio | 2025-08-21T12:54:03:     "extracted_memory_units": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "temp_id": "mem_quantum_book_insight",
1|ingestio | 2025-08-21T12:54:03:         "title": "Reading quantum physics book",
1|ingestio | 2025-08-21T12:54:03:         "content": "Read a fascinating book about quantum physics and consciousness that completely changed my perspective on reality and the mind-body problem.",
1|ingestio | 2025-08-21T12:54:03:         "source_type": "conversation_extraction",
1|ingestio | 2025-08-21T12:54:03:         "creation_ts": "2025-08-18T20:00:00.000Z"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "extracted_concepts": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "name": "Quantum Physics",
1|ingestio | 2025-08-21T12:54:03:         "type": "interest",
1|ingestio | 2025-08-21T12:54:03:         "description": "Fascination with quantum physics and its implications for consciousness"
1|ingestio | 2025-08-21T12:54:03:       },
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "name": "Consciousness",
1|ingestio | 2025-08-21T12:54:03:         "type": "theme",
1|ingestio | 2025-08-21T12:54:03:         "description": "Interest in the nature of consciousness and the mind-body problem"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ],
1|ingestio | 2025-08-21T12:54:03:     "new_relationships": [],
1|ingestio | 2025-08-21T12:54:03:     "detected_growth_events": [
1|ingestio | 2025-08-21T12:54:03:       {
1|ingestio | 2025-08-21T12:54:03:         "dim_key": "know_world",
1|ingestio | 2025-08-21T12:54:03: delta": 3.0,
1|ingestio | 2025-08-21T12:54:03:         "rationale": "Gained new perspective on reality through quantum physics reading"
1|ingestio | 2025-08-21T12:54:03:       }
1|ingestio | 2025-08-21T12:54:03:     ]
1|ingestio | 2025-08-21T12:54:03:   },
1|ingestio | 2025-08-21T12:54:03:   "forward_looking_context": {
1|ingestio | 2025-08-21T12:54:03:     "proactive_greeting": "Hello! I noticed you've been exploring some fascinating ideas about quantum physics and consciousness. How has that new perspective been sitting with you?",
1|ingestio | 2025-08-21T12:54:03:     "unresolved_topics_for_next_convo": [],
1|ingestio | 2025-08-21T12:54:03:     "suggested_initial_focus": "Continue exploring the implications of quantum consciousness theories"
1|ingestio | 2025-08-21T12:54:03:   }
1|ingestio | 2025-08-21T12:54:03: }
1|ingestio | 2025-08-21T12:54:03: ```
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: Remember: Output ONLY the JSON wrapped in ###==BEGIN_JSON==### and ###==END_JSON==### markers. No additional text.
1|ingestio | 2025-08-21T12:54:03: </instructions>
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸
1|ingestio | 2025-08-21T12:54:03: 📏 LLMChatTool - Final prompt length: 8436 characters
1|ingestio | 2025-08-21T12:54:03: 
1|ingestio | 2025-08-21T12:54:03: 🚀 LLMChatTool - Sending request to Google Gemini...
1|ingestio | 2025-08-21T12:54:09: 🐛 DEBUG: Received Redis event - pattern: __keyevent@0__:expired, channel: __keyevent@0__:expired, message: bull:insight:stalled-check
1|ingestio | 2025-08-21T12:54:09: ⚪ Other Redis event (not conversation timeout): bull:insight:stalled-check
1|ingestio | 2025-08-21T12:54:09: 🐛 DEBUG: Received Redis event - pattern: __keyevent@0__:expired, channel: __keyevent@0__:expired, message: bull:card-and-graph-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: ⚪ Other Redis event (not conversation timeout): bull:card-and-graph-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: 🐛 DEBUG: Received Redis event - pattern: __keyevent@0__:expired, channel: __keyevent@0__:expired, message: bull:embedding-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: ⚪ Other Redis event (not conversation timeout): bull:embedding-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: 🐛 DEBUG: Received Redis event - pattern: __keyevent@0__:expired, channel: __keyevent@0__:expired, message: bull:notification-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: ⚪ Other Redis event (not conversation timeout): bull:notification-queue:stalled-check
1|ingestio | 2025-08-21T12:54:09: [EmbeddingWorker] Stats - Running: true, Processed: 0, Failed: 0
1|ingestio | 2025-08-21T12:54:16: 
1|ingestio | 2025-08-21T12:54:16: 🎯 LLMChatTool - RAW LLM RESPONSE RECEIVED:
1|ingestio | 2025-08-21T12:54:16: 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
1|ingestio | 2025-08-21T12:54:16: Response text length: 4897
1|ingestio | 2025-08-21T12:54:16: Raw response:
1|ingestio | 2025-08-21T12:54:16: ###==BEGIN_JSON==###
1|ingestio | 2025-08-21T12:54:16: {
1|ingestio | 2025-08-21T12:54:16:   "persistence_payload": {
1|ingestio | 2025-08-21T12:54:16:     "conversation_summary": "The user announced a revolutionary discovery at the intersection of quantum computing and artificial intelligence, which has fundamentally shifted their understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.",
1|ingestio | 2025-08-21T12:54:16:     "conversation_importance_score": 9,
1|ingestio | 2025-08-21T12:54:16:     "extracted_memory_units": [
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "temp_id": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "title": "Revolutionary Discovery in Quantum Computing and AI",
1|ingestio | 2025-08-21T12:54:16:         "content": "User claims to have made a revolutionary discovery about the intersection of quantum computing and artificial intelligence, leading to a fundamental shift in their understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.",
1|ingestio | 2025-08-21T12:54:16:         "source_type": "conversation_extraction",
1|ingestio | 2025-08-21T12:54:16:         "creation_ts": "2024-07-30T12:00:00.000Z"
1|ingestio | 2025-08-21T12:54:16:       }
1|ingestio | 2025-08-21T12:54:16:     ],
1|ingestio | 2025-08-21T12:54:16:     "extracted_concepts": [
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Quantum Computing",
1|ingestio | 2025-08-21T12:54:16:         "type": "concept",
1|ingestio | 2025-08-21T12:54:16:         "description": "A field of computing that uses quantum-mechanical phenomena to solve problems."
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Artificial Intelligence",
1|ingestio | 2025-08-21T12:54:16:         "type": "concept",
1|ingestio | 2025-08-21T12:54:16:         "description": "The simulation of human intelligence processes by machines, especially computer systems."
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Computational Complexity",
1|ingestio | 2025-08-21T12:54:16:         "type": "concept",
1|ingestio | 2025-08-21T12:54:16:         "description": "A field within theoretical computer science that studies the resources required to solve computational problems."
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Cryptography",
1|ingestio | 2025-08-21T12:54:16:         "type": "field",
1|ingestio | 2025-08-21T12:54:16:         "description": "The practice and study of techniques for secure communication in the presence of adversarial behavior."
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Machine Learning",
1|ingestio | 2025-08-21T12:54:16:         "type": "field",
1|ingestio | 2025-08-21T12:54:16:         "description": "A subset of artificial intelligence that enables systems to learn from data without being explicitly programmed."
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "name": "Breakthrough",
1|ingestio | 2025-08-21T12:54:16:         "type": "event_theme",
1|ingestio | 2025-08-21T12:54:16:         "description": "A significant and sudden advance, development, or achievement."
1|ingestio | 2025-08-21T12:54:16:       }
1|ingestio | 2025-08-21T12:54:16:     ],
1|ingestio | 2025-08-21T12:54:16:     "new_relationships": [
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "USER",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "has made"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "Quantum Computing",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "involves"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "Artificial Intelligence",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "involves"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "Computational Complexity",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "impacts understanding of"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "Cryptography",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "has implications for"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "source_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:16:         "target_entity_id_or_name": "Machine Learning",
1|ingestio | 2025-08-21T12:54:16:         "relationship_description": "has implications for"
1|ingestio | 2025-08-21T12:54:16:       }
1|ingestio | 2025-08-21T12:54:16:     ],
1|ingestio | 2025-08-21T12:54:16:     "detected_growth_events": [
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "dim_key": "know_world",
1|ingestio | 2025-08-21T12:54:16:         "delta": 4.0,
1|ingestio | 2025-08-21T12:54:16:         "rationale": "User experienced a fundamental shift in understanding computational complexity due to a revolutionary discovery at the intersection of quantum computing and AI."
1|ingestio | 2025-08-21T12:54:16:       }
1|ingestio | 2025-08-21T12:54:16:     ]
1|ingestio | 2025-08-21T12:54:16:   },
1|ingestio | 2025-08-21T12:54:16:   "forward_looking_context": {
1|ingestio | 2025-08-21T12:54:16:     "proactive_greeting": "Hello! I'm still thinking about your truly groundbreaking discovery at the intersection of quantum computing and AI. It sounds like a profound shift in your understanding.",
1|ingestio | 2025-08-21T12:54:16:     "unresolved_topics_for_next_convo": [
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "topic": "Nature of the discovery",
1|ingestio | 2025-08-21T12:54:16:         "summary_of_unresolution": "The user mentioned a discovery but did not elaborate on its specific details or how it was made.",
1|ingestio | 2025-08-21T12:54:16:         "suggested_question": "Could you tell me more about the specifics of this revolutionary discovery? What exactly did you uncover?"
1|ingestio | 2025-08-21T12:54:16:       },
1|ingestio | 2025-08-21T12:54:16:       {
1|ingestio | 2025-08-21T12:54:16:         "topic": "Implications for intractable problems",
1|ingestio | 2025-08-21T12:54:16:         "summary_of_unresolution": "The user mentioned implications for solving previously intractable problems but didn't specify which problems or how.",
1|ingestio | 2025-08-21T12:54:16:         "suggested_question": "What are some of the previously intractable problems in cryptography and machine learning that your discovery now makes solvable?"
1|ingestio | 2025-08-21T12:54:16:       }
1|ingestio | 2025-08-21T12:54:16:     ],
1|ingestio | 2025-08-21T12:54:16:     "suggested_initial_focus": "Delve deeper into the specifics of the user's revolutionary discovery and its practical implications."
1|ingestio | 2025-08-21T12:54:16:   }
1|ingestio | 2025-08-21T12:54:16: }
1|ingestio | 2025-08-21T12:54:16: ###==END_JSON==###
1|ingestio | 2025-08-21T12:54:16: 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
1|ingestio | 2025-08-21T12:54:16: 📊 LLMChatTool - Usage stats: { promptTokens: 2093, candidateTokens: 1216, totalTokens: 4813 }
1|ingestio | 2025-08-21T12:54:16: 
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] LLM response received, length: 4897
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Extracted JSON string length: 4857
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] JSON parsed successfully
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Schema validation successful
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Successfully parsed and validated LLM response
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Importance score: 9
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Memory units: 1
1|ingestio | 2025-08-21T12:54:16: [HolisticAnalysisTool] Concepts: 6
1|ingestio | 2025-08-21T12:54:16: [IngestionAnalyst] Analysis completed with importance score: 9
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Starting persistence for conversation debug-neo4j-test
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Importance score: 9
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Memory units to create: 1
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Concepts to create: 6
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Growth events to create: 1
1|ingestio | 2025-08-21T12:54:16: 🔍 [IngestionAnalyst] DEBUG: Importance score above threshold, proceeding with entity creation
1|ingestio | 2025-08-21T12:54:17: prisma:query UPDATE "public"."conversations" SET "context_summary" = $1, "importance_score" = $2, "status" = $3 WHERE ("public"."conversations"."id" = $4 AND 1=1) RETURNING "public"."conversations"."id", "public"."conversations"."user_id", "public"."conversations"."title", "public"."conversations"."start_time", "public"."conversations"."ended_at", "public"."conversations"."context_summary", "public"."conversations"."metadata", "public"."conversations"."importance_score", "public"."conversations"."source_card_id", "public"."conversations"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Conversation updated successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Creating 1 memory units
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing memory unit: Revolutionary Discovery in Quantum Computing and AI
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."memory_units" ("muid","user_id","title","content","creation_ts","ingestion_ts","last_modified_ts","source_conversation_id") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."memory_units"."muid", "public"."memory_units"."user_id", "public"."memory_units"."title", "public"."memory_units"."content", "public"."memory_units"."creation_ts", "public"."memory_units"."ingestion_ts", "public"."memory_units"."last_modified_ts", "public"."memory_units"."importance_score", "public"."memory_units"."sentiment_score", "public"."memory_units"."source_conversation_id"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Memory unit created in PostgreSQL: 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for memory unit: 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for MemoryUnit with id: 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: MemoryUnit
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "4dcc1309-b280-43c2-ad43-2bd960d64350",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "title": "Revolutionary Discovery in Quantum Computing and AI",
1|ingestio | 2025-08-21T12:54:17:   "content": "User claims to have made a revolutionary discovery about the intersection of quantum computing and artificial intelligence, leading to a fundamental shift in their understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.",
1|ingestio | 2025-08-21T12:54:17:   "importance_score": null,
1|ingestio | 2025-08-21T12:54:17:   "sentiment_score": null,
1|ingestio | 2025-08-21T12:54:17:   "creation_ts": "2024-07-30T12:00:00.000Z",
1|ingestio | 2025-08-21T12:54:17:   "source_conversation_id": "debug-neo4j-test",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "title": "Revolutionary Discovery in Quantum Computing and AI",
1|ingestio | 2025-08-21T12:54:17:   "content": "User claims to have made a revolutionary discovery about the intersection of quantum computing and artificial intelligence, leading to a fundamental shift in their understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.",
1|ingestio | 2025-08-21T12:54:17:   "creation_ts": "2024-07-30T12:00:00.000Z",
1|ingestio | 2025-08-21T12:54:17:   "source_conversation_id": "debug-neo4j-test",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:MemoryUnit {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "4dcc1309-b280-43c2-ad43-2bd960d64350",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "title": "Revolutionary Discovery in Quantum Computing and AI",
1|ingestio | 2025-08-21T12:54:17:     "content": "User claims to have made a revolutionary discovery about the intersection of quantum computing and artificial intelligence, leading to a fundamental shift in their understanding of computational complexity and its implications for solving previously intractable problems in cryptography and machine learning.",
1|ingestio | 2025-08-21T12:54:17:     "creation_ts": "2024-07-30T12:00:00.000Z",
1|ingestio | 2025-08-21T12:54:17:     "source_conversation_id": "debug-neo4j-test",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created MemoryUnit node: 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created memory unit: 4dcc1309-b280-43c2-ad43-2bd960d64350 - Revolutionary Discovery in Quantum Computing and AI
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Creating 6 concepts
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Quantum Computing
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "15a6fe4a-8c7c-4577-a5b4-d79a1852670f",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Quantum Computing",
1|ingestio | 2025-08-21T12:54:17:   "description": "A field of computing that uses quantum-mechanical phenomena to solve problems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.034Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Quantum Computing",
1|ingestio | 2025-08-21T12:54:17:   "description": "A field of computing that uses quantum-mechanical phenomena to solve problems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.034Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "15a6fe4a-8c7c-4577-a5b4-d79a1852670f",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Quantum Computing",
1|ingestio | 2025-08-21T12:54:17:     "description": "A field of computing that uses quantum-mechanical phenomena to solve problems.",
1|ingestio | 2025-08-21T12:54:17:     "type": "concept",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.034Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: 15a6fe4a-8c7c-4577-a5b4-d79a1852670f - Quantum Computing
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Artificial Intelligence
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "79784246-2b51-40f3-b8a3-89043caf63d5",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Artificial Intelligence",
1|ingestio | 2025-08-21T12:54:17:   "description": "The simulation of human intelligence processes by machines, especially computer systems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.043Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Artificial Intelligence",
1|ingestio | 2025-08-21T12:54:17:   "description": "The simulation of human intelligence processes by machines, especially computer systems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.043Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "79784246-2b51-40f3-b8a3-89043caf63d5",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Artificial Intelligence",
1|ingestio | 2025-08-21T12:54:17:     "description": "The simulation of human intelligence processes by machines, especially computer systems.",
1|ingestio | 2025-08-21T12:54:17:     "type": "concept",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.043Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: 79784246-2b51-40f3-b8a3-89043caf63d5 - Artificial Intelligence
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Computational Complexity
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "17186270-723d-44c7-881d-5ccc433c06fc",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Computational Complexity",
1|ingestio | 2025-08-21T12:54:17:   "description": "A field within theoretical computer science that studies the resources required to solve computational problems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.048Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Computational Complexity",
1|ingestio | 2025-08-21T12:54:17:   "description": "A field within theoretical computer science that studies the resources required to solve computational problems.",
1|ingestio | 2025-08-21T12:54:17:   "type": "concept",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.048Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "17186270-723d-44c7-881d-5ccc433c06fc",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Computational Complexity",
1|ingestio | 2025-08-21T12:54:17:     "description": "A field within theoretical computer science that studies the resources required to solve computational problems.",
1|ingestio | 2025-08-21T12:54:17:     "type": "concept",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.048Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: 17186270-723d-44c7-881d-5ccc433c06fc - Computational Complexity
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Cryptography
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "7d210209-641b-4411-ae4e-5b34a91ad320",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Cryptography",
1|ingestio | 2025-08-21T12:54:17:   "description": "The practice and study of techniques for secure communication in the presence of adversarial behavior.",
1|ingestio | 2025-08-21T12:54:17:   "type": "field",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.054Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Cryptography",
1|ingestio | 2025-08-21T12:54:17:   "description": "The practice and study of techniques for secure communication in the presence of adversarial behavior.",
1|ingestio | 2025-08-21T12:54:17:   "type": "field",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.054Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "7d210209-641b-4411-ae4e-5b34a91ad320",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Cryptography",
1|ingestio | 2025-08-21T12:54:17:     "description": "The practice and study of techniques for secure communication in the presence of adversarial behavior.",
1|ingestio | 2025-08-21T12:54:17:     "type": "field",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.054Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: 7d210209-641b-4411-ae4e-5b34a91ad320 - Cryptography
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Machine Learning
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Machine Learning",
1|ingestio | 2025-08-21T12:54:17:   "description": "A subset of artificial intelligence that enables systems to learn from data without being explicitly programmed.",
1|ingestio | 2025-08-21T12:54:17:   "type": "field",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.060Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Machine Learning",
1|ingestio | 2025-08-21T12:54:17:   "description": "A subset of artificial intelligence that enables systems to learn from data without being explicitly programmed.",
1|ingestio | 2025-08-21T12:54:17:   "type": "field",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.060Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Machine Learning",
1|ingestio | 2025-08-21T12:54:17:     "description": "A subset of artificial intelligence that enables systems to learn from data without being explicitly programmed.",
1|ingestio | 2025-08-21T12:54:17:     "type": "field",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.060Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1 - Machine Learning
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing concept: Breakthrough
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."concepts" ("concept_id","user_id","name","type","description","created_at","last_updated_ts","status") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Concept created in PostgreSQL: d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j node for concept: d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jNode called for Concept with id: d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with node creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Node type: Concept
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Properties: {
1|ingestio | 2025-08-21T12:54:17:   "id": "d2f7ff70-17b3-47df-8a98-1bc09e7b3579",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "name": "Breakthrough",
1|ingestio | 2025-08-21T12:54:17:   "description": "A significant and sudden advance, development, or achievement.",
1|ingestio | 2025-08-21T12:54:17:   "type": "event_theme",
1|ingestio | 2025-08-21T12:54:17:   "salience": null,
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.064Z",
1|ingestio | 2025-08-21T12:54:17:   "community_id": null,
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cleaned properties: {
1|ingestio | 2025-08-21T12:54:17:   "name": "Breakthrough",
1|ingestio | 2025-08-21T12:54:17:   "description": "A significant and sudden advance, development, or achievement.",
1|ingestio | 2025-08-21T12:54:17:   "type": "event_theme",
1|ingestio | 2025-08-21T12:54:17:   "status": "active",
1|ingestio | 2025-08-21T12:54:17:   "created_at": "2025-08-21T16:54:17.064Z",
1|ingestio | 2025-08-21T12:54:17:   "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query: 
1|ingestio | 2025-08-21T12:54:17:         MERGE (n:Concept {id: $id, userId: $userId})
1|ingestio | 2025-08-21T12:54:17:         SET n += $properties
1|ingestio | 2025-08-21T12:54:17:         SET n.updatedAt = datetime()
1|ingestio | 2025-08-21T12:54:17:         RETURN n
1|ingestio | 2025-08-21T12:54:17:       
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Query parameters: {
1|ingestio | 2025-08-21T12:54:17:   "id": "d2f7ff70-17b3-47df-8a98-1bc09e7b3579",
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "properties": {
1|ingestio | 2025-08-21T12:54:17:     "name": "Breakthrough",
1|ingestio | 2025-08-21T12:54:17:     "description": "A significant and sudden advance, development, or achievement.",
1|ingestio | 2025-08-21T12:54:17:     "type": "event_theme",
1|ingestio | 2025-08-21T12:54:17:     "status": "active",
1|ingestio | 2025-08-21T12:54:17:     "created_at": "2025-08-21T16:54:17.064Z",
1|ingestio | 2025-08-21T12:54:17:     "source": "IngestionAnalyst"
1|ingestio | 2025-08-21T12:54:17:   }
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Cypher query executed successfully
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Result records length: 1
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] ✅ Created Concept node: d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created concept: d2f7ff70-17b3-47df-8a98-1bc09e7b3579 - Breakthrough
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Creating 1 growth events
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."growth_events" ("event_id","user_id","source","created_at","details","growth_dimensions","related_concepts","related_memory_units") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."growth_events"."event_id", "public"."growth_events"."user_id", "public"."growth_events"."source", "public"."growth_events"."created_at", "public"."growth_events"."details", "public"."growth_events"."growth_dimensions", "public"."growth_events"."related_concepts", "public"."growth_events"."related_memory_units"
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Created growth event: f74b1f1c-21ad-4a18-bc1b-4ba5877415aa - know_world (4)
1|ingestio | 2025-08-21T12:54:17: prisma:query UPDATE "public"."users" SET "next_conversation_context_package" = $1 WHERE ("public"."users"."user_id" = $2 AND 1=1) RETURNING "public"."users"."user_id", "public"."users"."email", "public"."users"."hashed_password", "public"."users"."name", "public"."users"."preferences", "public"."users"."region", "public"."users"."timezone", "public"."users"."language_preference", "public"."users"."profile_picture_url", "public"."users"."created_at", "public"."users"."last_active_at", "public"."users"."account_status", "public"."users"."concepts_created_in_cycle", "public"."users"."knowledge_graph_schema", "public"."users"."last_cycle_started_at", "public"."users"."memory_profile", "public"."users"."next_conversation_context_package"
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: About to create Neo4j relationships
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Creating 6 Neo4j relationships
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: createNeo4jRelationships called for 6 relationships
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j client is available, proceeding with relationship creation
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session created for relationships
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Processing relationship: {
1|ingestio | 2025-08-21T12:54:17:   "source_entity_id_or_name": "USER",
1|ingestio | 2025-08-21T12:54:17:   "target_entity_id_or_name": "mem_qc_ai_discovery_2024",
1|ingestio | 2025-08-21T12:54:17:   "relationship_description": "has made"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Relationship Cypher query: 
1|ingestio | 2025-08-21T12:54:17:           MATCH (source), (target)
1|ingestio | 2025-08-21T12:54:17:           WHERE (source.muid = $sourceId OR source.concept_id = $sourceId) 
1|ingestio | 2025-08-21T12:54:17:             AND (target.muid = $targetId OR target.concept_id = $targetId)
1|ingestio | 2025-08-21T12:54:17:             AND source.user_id = $userId AND target.user_id = $userId
1|ingestio | 2025-08-21T12:54:17:           CREATE (source)-[r:RELATED_TO {
1|ingestio | 2025-08-21T12:54:17:             type: $relationshipType,
1|ingestio | 2025-08-21T12:54:17:             strength: $strength,
1|ingestio | 2025-08-21T12:54:17:             context: $context,
1|ingestio | 2025-08-21T12:54:17:             created_at: datetime(),
1|ingestio | 2025-08-21T12:54:17:             source: 'IngestionAnalyst'
1|ingestio | 2025-08-21T12:54:17:           }]->(target)
1|ingestio | 2025-08-21T12:54:17:           RETURN r
1|ingestio | 2025-08-21T12:54:17:         
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Relationship parameters: {
1|ingestio | 2025-08-21T12:54:17:   "userId": "dev-user-123",
1|ingestio | 2025-08-21T12:54:17:   "relationshipType": "general",
1|ingestio | 2025-08-21T12:54:17:   "strength": 0.5,
1|ingestio | 2025-08-21T12:54:17:   "context": "Inferred from conversation analysis"
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Relationship error details: {
1|ingestio | 2025-08-21T12:54:17:   "gqlStatus": "50N42",
1|ingestio | 2025-08-21T12:54:17:   "gqlStatusDescription": "error: general processing exception - unexpected error. Unexpected error has occurred. See debug log for details.",
1|ingestio | 2025-08-21T12:54:17:   "diagnosticRecord": {
1|ingestio | 2025-08-21T12:54:17:     "OPERATION": "",
1|ingestio | 2025-08-21T12:54:17:     "OPERATION_CODE": "0",
1|ingestio | 2025-08-21T12:54:17:     "CURRENT_SCHEMA": "/"
1|ingestio | 2025-08-21T12:54:17:   },
1|ingestio | 2025-08-21T12:54:17:   "classification": "UNKNOWN",
1|ingestio | 2025-08-21T12:54:17:   "name": "Neo4jError",
1|ingestio | 2025-08-21T12:54:17:   "code": "Neo.ClientError.Statement.ParameterMissing",
1|ingestio | 2025-08-21T12:54:17:   "retriable": false
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: 🔍 [IngestionAnalyst] DEBUG: Neo4j session closed for relationships
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Persistence completed for conversation debug-neo4j-test
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."memory_units"."muid", "public"."memory_units"."user_id", "public"."memory_units"."title", "public"."memory_units"."content", "public"."memory_units"."creation_ts", "public"."memory_units"."ingestion_ts", "public"."memory_units"."last_modified_ts", "public"."memory_units"."importance_score", "public"."memory_units"."sentiment_score", "public"."memory_units"."source_conversation_id" FROM "public"."memory_units" WHERE ("public"."memory_units"."muid" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."media_items"."media_id", "public"."media_items"."user_id", "public"."media_items"."memory_unit_id", "public"."media_items"."type", "public"."media_items"."storage_url", "public"."media_items"."filename", "public"."media_items"."mime_type", "public"."media_items"."size_bytes", "public"."media_items"."hash", "public"."media_items"."processing_status", "public"."media_items"."metadata", "public"."media_items"."created_at" FROM "public"."media_items" WHERE "public"."media_items"."memory_unit_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."conversations"."id", "public"."conversations"."user_id", "public"."conversations"."title", "public"."conversations"."start_time", "public"."conversations"."ended_at", "public"."conversations"."context_summary", "public"."conversations"."metadata", "public"."conversations"."importance_score", "public"."conversations"."source_card_id", "public"."conversations"."status" FROM "public"."conversations" WHERE "public"."conversations"."id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for MemoryUnit 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for MemoryUnit 4dcc1309-b280-43c2-ad43-2bd960d64350
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (360 chars)
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept 15a6fe4a-8c7c-4577-a5b4-d79a1852670f
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (97 chars)
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept 79784246-2b51-40f3-b8a3-89043caf63d5
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (113 chars)
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE ("public"."concepts"."concept_id" = $1 AND 1=1) LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."concepts"."concept_id", "public"."concepts"."user_id", "public"."concepts"."name", "public"."concepts"."type", "public"."concepts"."description", "public"."concepts"."community_id", "public"."concepts"."created_at", "public"."concepts"."last_updated_ts", "public"."concepts"."merged_into_concept_id", "public"."concepts"."salience", "public"."concepts"."status" FROM "public"."concepts" WHERE "public"."concepts"."merged_into_concept_id" IN ($1) OFFSET $2
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Queued embedding job for Concept d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Published new_entities_created event for 7 entities
1|ingestio | 2025-08-21T12:54:17: [IngestionAnalyst] Successfully processed conversation debug-neo4j-test, created 7 new entities
1|ingestio | 2025-08-21T12:54:17: [IngestionWorker] Completed job 2
1|ingestio | 2025-08-21T12:54:17: [IngestionWorker] Job 2 completed successfully
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Processing new_entities_created event for user dev-user-123
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Starting projection generation for user dev-user-123
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] ✅ Fetched 139 nodes and 78 edges from Neo4j for user dev-user-123
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Fetched 139 nodes and 78 edges from Neo4j
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] ✅ Retrieved 139 embeddings from Weaviate
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Fetched 139 embedding vectors from Weaviate
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Calling dimension reducer with 139 vectors using umap
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 248ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: b976d9bf-0ea3-489d-86a1-ec4b1a850b88
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: b976d9bf-0ea3-489d-86a1-ec4b1a850b88
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [-0.0196, 0.0340, 0.0019, -0.0095, -0.0320...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 65 completed successfully
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept 17186270-723d-44c7-881d-5ccc433c06fc
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (138 chars)
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 266ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 267ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored MemoryUnit embedding in Weaviate: dfa22829-0e6d-4f51-8574-e8c19fb8fa0f
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: dfa22829-0e6d-4f51-8574-e8c19fb8fa0f
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [0.0121, 0.0159, -0.0776, 0.0196, -0.0134...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 63 completed successfully
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept 7d210209-641b-4411-ae4e-5b34a91ad320
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (116 chars)
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: d09e8d79-df1f-4b72-8074-5fa75d7f693c
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: d09e8d79-df1f-4b72-8074-5fa75d7f693c
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [0.0339, 0.0148, -0.0267, 0.0094, 0.0205...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 64 completed successfully
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept ae56db19-4c93-4fa2-ae9e-ca1fcdc02fe1
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (130 chars)
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] ✅ Dimension reduction completed for 139 vectors in 103ms
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Generated 3D coordinates for 139 nodes
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Projection assembly complete
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Using 78 edges from projection data
1|ingestio | 2025-08-21T12:54:17: prisma:info Starting a postgresql pool with 29 connections.
1|ingestio | 2025-08-21T12:54:17: prisma:query INSERT INTO "public"."user_graph_projections" ("projection_id","user_id","status","projection_data","created_at","metadata","updated_at") VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING "public"."user_graph_projections"."projection_id", "public"."user_graph_projections"."user_id", "public"."user_graph_projections"."status", "public"."user_graph_projections"."projection_data", "public"."user_graph_projections"."created_at", "public"."user_graph_projections"."metadata", "public"."user_graph_projections"."updated_at"
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] ✅ Stored projection proj_1755795257402_quvgn0 for user dev-user-123
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Projection statistics: {
1|ingestio | 2025-08-21T12:54:17:   totalNodes: 139,
1|ingestio | 2025-08-21T12:54:17:   memoryUnits: 36,
1|ingestio | 2025-08-21T12:54:17:   concepts: 100,
1|ingestio | 2025-08-21T12:54:17:   derivedArtifacts: 2,
1|ingestio | 2025-08-21T12:54:17:   communities: 1,
1|ingestio | 2025-08-21T12:54:17:   connections: 78
1|ingestio | 2025-08-21T12:54:17: }
1|ingestio | 2025-08-21T12:54:17: prisma:query SELECT "public"."user_graph_projections"."projection_id" FROM "public"."user_graph_projections" WHERE "public"."user_graph_projections"."user_id" = $1 ORDER BY "public"."user_graph_projections"."created_at" DESC LIMIT $2 OFFSET $3
1|ingestio | 2025-08-21T12:54:17: prisma:query DELETE FROM "public"."user_graph_projections" WHERE ("public"."user_graph_projections"."user_id" = $1 AND "public"."user_graph_projections"."projection_id" NOT IN ($2,$3,$4,$5,$6))
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Successfully generated projection for user dev-user-123 in 317ms
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Projection contains 139 nodes
1|ingestio | 2025-08-21T12:54:17: [GraphProjectionWorker] Job 16 completed successfully
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 205ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 219ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: 467bbcfb-d575-4651-8c83-e6bf9c5b841e
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: 467bbcfb-d575-4651-8c83-e6bf9c5b841e
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [0.0014, 0.0276, -0.0287, -0.0254, -0.0266...]
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: 7e2021b8-3a2f-4831-913b-6db9aeeba087
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: 7e2021b8-3a2f-4831-913b-6db9aeeba087
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [-0.0151, 0.0648, -0.0171, -0.0171, -0.0164...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 67 completed successfully
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Processing embedding for Concept d2f7ff70-17b3-47df-8a98-1bc09e7b3579
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generating embedding for text (76 chars)
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 66 completed successfully
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 228ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: 14a42fb1-6ed6-4b39-af42-e946374ef2e2
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: 14a42fb1-6ed6-4b39-af42-e946374ef2e2
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [-0.0375, 0.0167, -0.0192, -0.0292, -0.0450...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 68 completed successfully
1|ingestio | 2025-08-21T12:54:17: TextEmbeddingTool: Generated 768-dimensional embedding in 198ms
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Generated embedding vector of length 768
1|ingestio | 2025-08-21T12:54:17: ✅ [EmbeddingWorker] Stored Concept embedding in Weaviate: ceaaec0e-6512-49b1-863c-e1cc43b0385f
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] ✅ Successfully stored embedding in Weaviate with ID: ceaaec0e-6512-49b1-863c-e1cc43b0385f
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Embedding dimensions: 768
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Preview: [0.0029, -0.0245, -0.0058, 0.0564, 0.0179...]
1|ingestio | 2025-08-21T12:54:17: [EmbeddingWorker] Job 69 completed successfully