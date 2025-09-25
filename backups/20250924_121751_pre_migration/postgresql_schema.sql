--
-- PostgreSQL database dump
--

\restrict 6zsaZgaAkNgkqVwQkbDVutfKmPrhkhBvio0TEmWubDa70ms3cKfbj5GYhzbuygr

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cards (
    card_id text NOT NULL,
    user_id text NOT NULL,
    card_type text NOT NULL,
    source_entity_id text NOT NULL,
    source_entity_type text NOT NULL,
    status text DEFAULT 'active_canvas'::text NOT NULL,
    is_favorited boolean DEFAULT false NOT NULL,
    display_data jsonb,
    is_synced boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    background_image_url text
);


--
-- Name: communities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.communities (
    community_id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_analyzed_ts timestamp(3) without time zone
);


--
-- Name: concepts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.concepts (
    concept_id text NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    community_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_updated_ts timestamp(3) without time zone NOT NULL,
    merged_into_concept_id text,
    salience double precision,
    status text DEFAULT 'active'::text NOT NULL
);


--
-- Name: conversation_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversation_messages (
    conversation_id text NOT NULL,
    role text NOT NULL,
    media_ids text[] DEFAULT ARRAY[]::text[],
    content text NOT NULL,
    id text NOT NULL,
    llm_call_metadata jsonb,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    user_id text NOT NULL,
    title text,
    start_time timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at timestamp(3) without time zone,
    context_summary text,
    metadata jsonb,
    id text NOT NULL,
    importance_score double precision,
    source_card_id text,
    status text DEFAULT 'active'::text NOT NULL,
    session_id text,
    forward_looking_context jsonb,
    proactive_greeting text,
    updated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: derived_artifacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.derived_artifacts (
    artifact_id text NOT NULL,
    user_id text NOT NULL,
    artifact_type text NOT NULL,
    title text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    content_narrative text,
    source_concept_ids text[],
    source_memory_unit_ids text[],
    cycle_id text
);


--
-- Name: growth_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.growth_events (
    event_id text NOT NULL,
    user_id text NOT NULL,
    source text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    details jsonb,
    growth_dimensions jsonb NOT NULL,
    related_concepts text[],
    related_memory_units text[],
    dimension_key text NOT NULL,
    delta_value numeric(3,1) NOT NULL,
    rationale text NOT NULL
);


--
-- Name: interaction_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interaction_logs (
    interaction_id text NOT NULL,
    user_id text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    interaction_type text NOT NULL,
    target_entity_id text,
    target_entity_type text,
    content_text text,
    content_structured jsonb,
    metadata jsonb
);


--
-- Name: llm_interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.llm_interactions (
    interaction_id text NOT NULL,
    worker_type text NOT NULL,
    worker_job_id text,
    session_id text,
    user_id text NOT NULL,
    conversation_id text,
    message_id text,
    source_entity_id text,
    model_name text NOT NULL,
    temperature numeric(3,2),
    max_tokens integer,
    prompt_length integer NOT NULL,
    prompt_tokens integer,
    system_prompt text,
    user_prompt text NOT NULL,
    full_prompt text NOT NULL,
    response_length integer NOT NULL,
    response_tokens integer,
    raw_response text NOT NULL,
    parsed_response jsonb,
    finish_reason text,
    request_started_at timestamp(3) without time zone NOT NULL,
    request_completed_at timestamp(3) without time zone NOT NULL,
    processing_time_ms integer NOT NULL,
    status text NOT NULL,
    error_message text,
    error_code text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: media_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_items (
    media_id text NOT NULL,
    user_id text NOT NULL,
    memory_unit_id text,
    type text NOT NULL,
    storage_url text NOT NULL,
    filename text,
    mime_type text,
    size_bytes integer,
    hash text,
    processing_status text DEFAULT 'pending'::text NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: memory_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memory_units (
    muid text NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    creation_ts timestamp(3) without time zone NOT NULL,
    ingestion_ts timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_modified_ts timestamp(3) without time zone NOT NULL,
    importance_score double precision,
    sentiment_score double precision,
    source_conversation_id text
);


--
-- Name: proactive_prompts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proactive_prompts (
    prompt_id text NOT NULL,
    user_id text NOT NULL,
    prompt_text text NOT NULL,
    source_agent text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    cycle_id text
);


--
-- Name: user_challenges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_challenges (
    user_challenge_id text NOT NULL,
    user_id text NOT NULL,
    challenge_template_id text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    start_time timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completion_time timestamp(3) without time zone,
    progress_data jsonb
);


--
-- Name: user_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_cycles (
    cycle_id text NOT NULL,
    user_id text NOT NULL,
    job_id text,
    cycle_start_date timestamp(3) without time zone NOT NULL,
    cycle_end_date timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    cycle_type text DEFAULT 'strategic_analysis'::text NOT NULL,
    cycle_duration_days integer DEFAULT 2 NOT NULL,
    trigger_source text DEFAULT 'scheduled'::text NOT NULL,
    artifacts_created integer DEFAULT 0 NOT NULL,
    prompts_created integer DEFAULT 0 NOT NULL,
    concepts_merged integer DEFAULT 0 NOT NULL,
    relationships_created integer DEFAULT 0 NOT NULL,
    processing_duration_ms integer,
    llm_tokens_used integer,
    error_count integer DEFAULT 0 NOT NULL,
    validation_score double precision,
    insights_summary jsonb,
    growth_metrics jsonb,
    dashboard_ready boolean DEFAULT false NOT NULL
);


--
-- Name: user_graph_projections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_graph_projections (
    projection_id text NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'completed'::text NOT NULL,
    projection_data jsonb NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    session_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp(3) without time zone,
    last_active_at timestamp(3) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    user_id text NOT NULL,
    email text NOT NULL,
    hashed_password text,
    name text,
    preferences jsonb,
    region text DEFAULT 'us'::text NOT NULL,
    timezone text DEFAULT 'UTC'::text,
    language_preference text DEFAULT 'en'::text,
    profile_picture_url text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at timestamp(3) without time zone,
    account_status text DEFAULT 'active'::text NOT NULL,
    concepts_created_in_cycle integer DEFAULT 0 NOT NULL,
    last_cycle_started_at timestamp(3) without time zone,
    memory_profile jsonb,
    next_conversation_context_package jsonb,
    key_phrases jsonb
);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (card_id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (community_id);


--
-- Name: concepts concepts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepts
    ADD CONSTRAINT concepts_pkey PRIMARY KEY (concept_id);


--
-- Name: conversation_messages conversation_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: derived_artifacts derived_artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.derived_artifacts
    ADD CONSTRAINT derived_artifacts_pkey PRIMARY KEY (artifact_id);


--
-- Name: growth_events growth_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_events
    ADD CONSTRAINT growth_events_pkey PRIMARY KEY (event_id);


--
-- Name: interaction_logs interaction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_logs
    ADD CONSTRAINT interaction_logs_pkey PRIMARY KEY (interaction_id);


--
-- Name: llm_interactions llm_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_interactions
    ADD CONSTRAINT llm_interactions_pkey PRIMARY KEY (interaction_id);


--
-- Name: media_items media_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_items
    ADD CONSTRAINT media_items_pkey PRIMARY KEY (media_id);


--
-- Name: memory_units memory_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_units
    ADD CONSTRAINT memory_units_pkey PRIMARY KEY (muid);


--
-- Name: proactive_prompts proactive_prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proactive_prompts
    ADD CONSTRAINT proactive_prompts_pkey PRIMARY KEY (prompt_id);


--
-- Name: user_challenges user_challenges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_pkey PRIMARY KEY (user_challenge_id);


--
-- Name: user_cycles user_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cycles
    ADD CONSTRAINT user_cycles_pkey PRIMARY KEY (cycle_id);


--
-- Name: user_graph_projections user_graph_projections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_graph_projections
    ADD CONSTRAINT user_graph_projections_pkey PRIMARY KEY (projection_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: cards_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cards_user_id_status_idx ON public.cards USING btree (user_id, status);


--
-- Name: conversation_messages_conversation_id_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversation_messages_conversation_id_timestamp_idx ON public.conversation_messages USING btree (conversation_id, "timestamp");


--
-- Name: conversations_session_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_session_id_idx ON public.conversations USING btree (session_id);


--
-- Name: conversations_status_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_status_updated_at_idx ON public.conversations USING btree (status, updated_at DESC);


--
-- Name: conversations_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_user_id_status_idx ON public.conversations USING btree (user_id, status);


--
-- Name: conversations_user_id_updated_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX conversations_user_id_updated_at_idx ON public.conversations USING btree (user_id, updated_at DESC);


--
-- Name: derived_artifacts_artifact_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX derived_artifacts_artifact_type_idx ON public.derived_artifacts USING btree (artifact_type);


--
-- Name: derived_artifacts_user_id_cycle_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX derived_artifacts_user_id_cycle_id_idx ON public.derived_artifacts USING btree (user_id, cycle_id);


--
-- Name: growth_events_delta_value_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX growth_events_delta_value_idx ON public.growth_events USING btree (delta_value);


--
-- Name: growth_events_dimension_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX growth_events_dimension_key_idx ON public.growth_events USING btree (dimension_key);


--
-- Name: growth_events_user_id_dimension_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX growth_events_user_id_dimension_key_idx ON public.growth_events USING btree (user_id, dimension_key);


--
-- Name: llm_interactions_conversation_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_interactions_conversation_id_idx ON public.llm_interactions USING btree (conversation_id);


--
-- Name: llm_interactions_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_interactions_created_at_idx ON public.llm_interactions USING btree (created_at);


--
-- Name: llm_interactions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_interactions_status_idx ON public.llm_interactions USING btree (status);


--
-- Name: llm_interactions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_interactions_user_id_idx ON public.llm_interactions USING btree (user_id);


--
-- Name: llm_interactions_worker_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX llm_interactions_worker_type_idx ON public.llm_interactions USING btree (worker_type);


--
-- Name: media_items_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX media_items_hash_key ON public.media_items USING btree (hash);


--
-- Name: media_items_processing_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_items_processing_status_idx ON public.media_items USING btree (processing_status);


--
-- Name: media_items_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_items_user_id_created_at_idx ON public.media_items USING btree (user_id, created_at DESC);


--
-- Name: media_items_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_items_user_id_idx ON public.media_items USING btree (user_id);


--
-- Name: media_items_user_id_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX media_items_user_id_type_idx ON public.media_items USING btree (user_id, type);


--
-- Name: proactive_prompts_user_id_cycle_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX proactive_prompts_user_id_cycle_id_idx ON public.proactive_prompts USING btree (user_id, cycle_id);


--
-- Name: user_cycles_cycle_start_date_cycle_end_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_cycles_cycle_start_date_cycle_end_date_idx ON public.user_cycles USING btree (cycle_start_date, cycle_end_date);


--
-- Name: user_cycles_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_cycles_status_idx ON public.user_cycles USING btree (status);


--
-- Name: user_cycles_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_cycles_user_id_created_at_idx ON public.user_cycles USING btree (user_id, created_at);


--
-- Name: user_graph_projections_user_id_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_graph_projections_user_id_created_at_idx ON public.user_graph_projections USING btree (user_id, created_at DESC);


--
-- Name: user_sessions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_sessions_user_id_idx ON public.user_sessions USING btree (user_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: cards cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: communities communities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: concepts concepts_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepts
    ADD CONSTRAINT concepts_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(community_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: concepts concepts_merged_into_concept_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepts
    ADD CONSTRAINT concepts_merged_into_concept_id_fkey FOREIGN KEY (merged_into_concept_id) REFERENCES public.concepts(concept_id);


--
-- Name: concepts concepts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.concepts
    ADD CONSTRAINT concepts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_messages conversation_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_messages
    ADD CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversations conversations_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_sessions(session_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_source_card_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_source_card_id_fkey FOREIGN KEY (source_card_id) REFERENCES public.cards(card_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: derived_artifacts derived_artifacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.derived_artifacts
    ADD CONSTRAINT derived_artifacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: growth_events growth_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.growth_events
    ADD CONSTRAINT growth_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interaction_logs interaction_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interaction_logs
    ADD CONSTRAINT interaction_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: llm_interactions llm_interactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.llm_interactions
    ADD CONSTRAINT llm_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: media_items media_items_memory_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_items
    ADD CONSTRAINT media_items_memory_unit_id_fkey FOREIGN KEY (memory_unit_id) REFERENCES public.memory_units(muid) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: media_items media_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_items
    ADD CONSTRAINT media_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memory_units memory_units_source_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_units
    ADD CONSTRAINT memory_units_source_conversation_id_fkey FOREIGN KEY (source_conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memory_units memory_units_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memory_units
    ADD CONSTRAINT memory_units_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: proactive_prompts proactive_prompts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proactive_prompts
    ADD CONSTRAINT proactive_prompts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_challenges user_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_challenges
    ADD CONSTRAINT user_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_cycles user_cycles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_cycles
    ADD CONSTRAINT user_cycles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_graph_projections user_graph_projections_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_graph_projections
    ADD CONSTRAINT user_graph_projections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6zsaZgaAkNgkqVwQkbDVutfKmPrhkhBvio0TEmWubDa70ms3cKfbj5GYhzbuygr

