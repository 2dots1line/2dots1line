#!/bin/bash

WEAVIATE_URL="http://localhost:8080/v1/objects"
EMBEDDING_DIM=1536

# Helper to generate a random vector as a JSON array
random_vector() {
  python3 -c "import random, json; print(json.dumps([round(random.uniform(-1,1), 6) for _ in range($EMBEDDING_DIM)]))"
}

# Helper to insert a UserKnowledgeItem
insert_item() {
  local business_id="$1"
  local user_id="$2"
  local source_entity_type="$3"
  local text_content="$4"
  local title="$5"
  local tags_json="$6"
  local growth_events_json="$7"

  local external_id=$(uuidgen)
  local source_entity_id=$(uuidgen)
  local vector=$(random_vector)

  local json=$(cat <<EOF
{
  "class": "UserKnowledgeItem",
  "properties": {
    "externalId": "$external_id",
    "businessId": "$business_id",
    "userId": "$user_id",
    "sourceEntityType": "$source_entity_type",
    "sourceEntityId": "$source_entity_id",
    "textContent": $text_content,
    "title": $title,
    "tags": $tags_json,
    "growthEvents": $growth_events_json
  },
  "vector": $vector
}
EOF
)
  curl -s -X POST "$WEAVIATE_URL" -H "Content-Type: application/json" -d "$json"
  echo "\n---\n"
}

USER_ID="dev-user-123"

# 8 MemoryUnits (unchanged, omitted for brevity)
insert_item "mu-career-crossroads" "$USER_ID" "MemoryUnit" \
  '"Charles is at a major crossroads, weighing the benefits of his career at Columbia against his desire to return to China for family, health, and autonomy. This dilemma is the central theme of the first conversation."' \
  '"Career crossroads: Weighing Columbia vs. China"' \
  '["career", "family", "autonomy"]' \
  '["growth-family-priority", "growth-career-crossroads"]'

insert_item "mu-health-driver" "$USER_ID" "MemoryUnit" \
  '"Charles’s chronic pain and depression are major factors motivating his desire to return to China and seek holistic healing through Traditional Chinese Medicine."' \
  '"Health as a driver for life change"' \
  '["health", "motivation", "TCM"]' \
  '[]'

insert_item "mu-family-autonomy" "$USER_ID" "MemoryUnit" \
  '"Charles’s vision for a new life in China centers on family, autonomy, and holistic well-being."' \
  '"Family and autonomy: Vision for a new life"' \
  '["family", "autonomy", "vision"]' \
  '[]'

insert_item "mu-personal-mission" "$USER_ID" "MemoryUnit" \
  '"Charles’s personal mission is deeply tied to autism research and advocacy, inspired by his son’s diagnosis."' \
  '"Personal mission: Autism research and advocacy"' \
  '["mission", "autism", "research"]' \
  '["growth-autism-motivation"]'

insert_item "mu-ambivalence-leaving" "$USER_ID" "MemoryUnit" \
  '"Charles feels ambivalent about leaving Columbia, torn between professional opportunities and personal needs."' \
  '"Ambivalence about leaving Columbia"' \
  '["ambivalence", "Columbia", "career"]' \
  '[]'

insert_item "mu-hybrid-model" "$USER_ID" "MemoryUnit" \
  '"Charles considers a hybrid model, balancing commitments in the US and China."' \
  '"Hybrid model: US-China commitments"' \
  '["hybrid", "US", "China"]' \
  '[]'

insert_item "mu-ai-pediatric-care" "$USER_ID" "MemoryUnit" \
  '"Charles is interested in integrating AI into pediatric care as a new research direction."' \
  '"AI in pediatric care: New research direction"' \
  '["AI", "pediatrics", "research"]' \
  '[]'

insert_item "mu-transition-steps" "$USER_ID" "MemoryUnit" \
  '"Charles outlines concrete steps for his transition to China, including family, research, and clinical plans."' \
  '"Transition steps: Family, research, clinical"' \
  '["transition", "steps", "planning"]' \
  '[]'

# 39 Concepts (fully enumerated)
insert_item "concept-charles" "$USER_ID" "Concept" '"User: Charles, autism researcher at Columbia, considering move to China"' '"Charles"' '["person", "user", "researcher"]' '[]'
insert_item "concept-dot" "$USER_ID" "Concept" '"AI assistant helping Charles navigate his growth journey"' '"Dot"' '["assistant", "AI", "support"]' '[]'
insert_item "concept-columbia" "$USER_ID" "Concept" '"Charles’s current employer, major research university in NYC"' '"Columbia University"' '["organization", "university", "employer"]' '[]'
insert_item "concept-nyc" "$USER_ID" "Concept" '"City where Charles works, dislikes living there"' '"New York City"' '["location", "NYC", "city"]' '[]'
insert_item "concept-china" "$USER_ID" "Concept" '"Country Charles wants to return to for family, health, and autonomy"' '"China"' '["country", "China", "family"]' '[]'
insert_item "concept-family" "$USER_ID" "Concept" '"Charles’s parents and relatives, main reason for wanting to return"' '"Family"' '["people_group", "family", "motivation"]' '[]'
insert_item "concept-older-son" "$USER_ID" "Concept" '"Charles’s 9-year-old son, diagnosed with borderline ASD"' '"Older Son"' '["person", "son", "ASD"]' '[]'
insert_item "concept-younger-son" "$USER_ID" "Concept" '"Charles’s younger son, attends school in Changchun"' '"Younger Son"' '["person", "son", "Changchun"]' '[]'
insert_item "concept-health-issues" "$USER_ID" "Concept" '"Chronic neck and shoulder pain, depression, and other health issues motivating change"' '"Health Issues"' '["topic", "health", "motivation"]' '[]'
insert_item "concept-family-responsibility" "$USER_ID" "Concept" '"Charles feels a strong sense of responsibility to care for his aging parents in China."' '"Family Responsibility"' '["family", "responsibility", "motivation"]' '[]'
insert_item "concept-tcm" "$USER_ID" "Concept" '"Traditional Chinese Medicine as a path to healing for Charles’s chronic pain."' '"Traditional Chinese Medicine (TCM)"' '["TCM", "health", "healing"]' '[]'
insert_item "concept-career-ambition" "$USER_ID" "Concept" '"Charles’s drive for professional achievement."' '"Career Ambition"' '["career", "ambition", "motivation"]' '[]'
insert_item "concept-funding" "$USER_ID" "Concept" '"Research funding needed for new projects in China."' '"Research Funding"' '["funding", "research", "resource"]' '[]'
insert_item "concept-network" "$USER_ID" "Concept" '"Charles’s professional network at Columbia and in China."' '"Professional Network"' '["network", "professional", "connections"]' '[]'
insert_item "concept-new-lab" "$USER_ID" "Concept" '"Charles’s plan to start a new lab in China."' '"New Lab"' '["lab", "project", "China"]' '[]'
insert_item "concept-remote-collab" "$USER_ID" "Concept" '"Remote collaboration as a way to maintain US ties while in China."' '"Remote Collaboration"' '["remote", "collaboration", "US"]' '[]'
insert_item "concept-bio-statistics" "$USER_ID" "Concept" '"Charles’s expertise in bio-statistics."' '"Bio-statistics"' '["bio-statistics", "skill", "expertise"]' '[]'
insert_item "concept-autism" "$USER_ID" "Concept" '"Older son’s diagnosis, deep impact on research direction."' '"Autism"' '["autism", "condition", "research"]' '[]'
insert_item "concept-asd-diagnosis" "$USER_ID" "Concept" '"Older son’s ASD diagnosis, pivotal event for Charles."' '"ASD Diagnosis"' '["ASD", "diagnosis", "event"]' '[]'
insert_item "concept-autism-research" "$USER_ID" "Concept" '"Charles’s research focus on autism, inspired by his son’s diagnosis."' '"Autism Research"' '["autism", "research", "focus"]' '[]'
insert_item "concept-protein-target" "$USER_ID" "Concept" '"Research focus: links between protein targets and autism."' '"蛋白质靶点 (Protein Target)"' '["protein", "target", "autism"]' '[]'
insert_item "concept-family-health" "$USER_ID" "Concept" '"Community: Family & Health, related to family, health, and well-being."' '"Family & Health Community"' '["community", "family", "health"]' '[]'
insert_item "concept-research-career" "$USER_ID" "Concept" '"Community: Research Autonomy & Career, about research independence and career transition."' '"Research Autonomy & Career Community"' '["community", "research", "career"]' '[]'
insert_item "concept-autism-mission" "$USER_ID" "Concept" '"Community: Autism & Scientific Mission, about autism, advocacy, and science."' '"Autism & Scientific Mission Community"' '["community", "autism", "mission"]' '[]'
insert_item "concept-ai-peds" "$USER_ID" "Concept" '"Community: AI & Pediatric Care, about AI and technology in pediatric healthcare."' '"AI & Pediatric Care Community"' '["community", "AI", "pediatrics"]' '[]'
insert_item "concept-pediatric-care" "$USER_ID" "Concept" '"Focus of new project in China: pediatric care."' '"Pediatric Care"' '["pediatrics", "care", "project"]' '[]'
insert_item "concept-hybrid-model" "$USER_ID" "Concept" '"Strategy to balance US and China commitments."' '"Hybrid Model"' '["hybrid", "US", "China"]' '[]'
insert_item "concept-advisor" "$USER_ID" "Concept" '"Charles’s mentor at Columbia, supportive of his transition."' '"Academic Advisor"' '["advisor", "mentor", "Columbia"]' '[]'
insert_item "concept-cousin-shanghai" "$USER_ID" "Concept" '"Charles’s cousin in Shanghai, works at a large hospital, potential collaborator."' '"Cousin in Shanghai"' '["cousin", "Shanghai", "collaborator"]' '[]'
insert_item "concept-shanghai-hospital" "$USER_ID" "Concept" '"Hospital in Shanghai where Charles’s cousin works, possible site for new project."' '"Shanghai Hospital"' '["hospital", "Shanghai", "project"]' '[]'
insert_item "concept-language-barrier" "$USER_ID" "Concept" '"Possible issue for research and clinical work: language barrier."' '"Language Barrier"' '["language", "barrier", "challenge"]' '[]'
insert_item "concept-cultural-adaptation" "$USER_ID" "Concept" '"Adjusting to work culture in China: cultural adaptation."' '"Cultural Adaptation"' '["culture", "adaptation", "challenge"]' '[]'
insert_item "concept-dotcore" "$USER_ID" "Concept" '"DotCore: Charles’s core values and identity."' '"DotCore"' '["core", "identity", "values"]' '[]'
insert_item "concept-nyc-lifestyle" "$USER_ID" "Concept" '"Lifestyle in New York City: pros and cons for Charles."' '"NYC Lifestyle"' '["NYC", "lifestyle", "city"]' '[]'
insert_item "concept-changchun" "$USER_ID" "Concept" '"City in China where Charles’s younger son attends school."' '"Changchun"' '["Changchun", "city", "China"]' '[]'
insert_item "concept-china-lab" "$USER_ID" "Concept" '"Charles’s plan to establish a new lab in China."' '"China Lab"' '["lab", "China", "project"]' '[]'
insert_item "concept-china-funding" "$USER_ID" "Concept" '"Funding opportunities for research in China."' '"China Funding"' '["funding", "China", "research"]' '[]'
insert_item "concept-china-network" "$USER_ID" "Concept" '"Professional network in China for Charles."' '"China Network"' '["network", "China", "professional"]' '[]'
insert_item "concept-china-collab" "$USER_ID" "Concept" '"Collaboration opportunities in China for Charles."' '"China Collaboration"' '["collaboration", "China", "opportunity"]' '[]'
insert_item "concept-china-adaptation" "$USER_ID" "Concept" '"Charles’s adaptation to life and work in China."' '"China Adaptation"' '["China", "adaptation", "life"]' '[]'
insert_item "concept-china-ambition" "$USER_ID" "Concept" '"Charles’s ambition for his career in China."' '"China Ambition"' '["China", "ambition", "career"]' '[]'
insert_item "concept-china-family" "$USER_ID" "Concept" '"Charles’s family connections in China."' '"China Family"' '["China", "family", "connections"]' '[]'
insert_item "concept-china-health" "$USER_ID" "Concept" '"Charles’s health journey in China."' '"China Health"' '["China", "health", "journey"]' '[]'
insert_item "concept-china-autism" "$USER_ID" "Concept" '"Autism research and advocacy in China."' '"China Autism"' '["China", "autism", "research"]' '[]'
insert_item "concept-china-advisor" "$USER_ID" "Concept" '"Charles’s advisor in China."' '"China Advisor"' '["China", "advisor", "mentor"]' '[]'
insert_item "concept-china-dot" "$USER_ID" "Concept" '"Dot’s role in Charles’s China journey."' '"China Dot"' '["China", "Dot", "assistant"]' '[]'
insert_item "concept-china-nyc" "$USER_ID" "Concept" '"Connections between China and New York City in Charles’s life."' '"China-NYC Connection"' '["China", "NYC", "connection"]' '[]'
insert_item "concept-china-peds" "$USER_ID" "Concept" '"Pediatric care projects in China."' '"China Pediatrics"' '["China", "pediatrics", "project"]' '[]'
insert_item "concept-china-tcm" "$USER_ID" "Concept" '"Traditional Chinese Medicine in Charles’s China journey."' '"China TCM"' '["China", "TCM", "health"]' '[]'
insert_item "concept-china-mission" "$USER_ID" "Concept" '"Charles’s scientific mission in China."' '"China Mission"' '["China", "mission", "science"]' '[]'
insert_item "concept-china-research" "$USER_ID" "Concept" '"Charles’s research activities in China."' '"China Research"' '["China", "research", "activity"]' '[]'
insert_item "concept-china-remote" "$USER_ID" "Concept" '"Remote work and collaboration from China."' '"China Remote"' '["China", "remote", "collaboration"]' '[]'
insert_item "concept-china-skill" "$USER_ID" "Concept" '"Skills Charles brings to China."' '"China Skill"' '["China", "skill", "expertise"]' '[]'
insert_item "concept-china-event" "$USER_ID" "Concept" '"Key events in Charles’s China journey."' '"China Event"' '["China", "event", "journey"]' '[]'
insert_item "concept-china-condition" "$USER_ID" "Concept" '"Conditions affecting Charles’s work in China."' '"China Condition"' '["China", "condition", "work"]' '[]'
insert_item "concept-china-topic" "$USER_ID" "Concept" '"Topics of interest for Charles in China."' '"China Topic"' '["China", "topic", "interest"]' '[]'
insert_item "concept-china-resource" "$USER_ID" "Concept" '"Resources available to Charles in China."' '"China Resource"' '["China", "resource", "available"]' '[]'
insert_item "concept-china-project" "$USER_ID" "Concept" '"Projects Charles is working on in China."' '"China Project"' '["China", "project", "work"]' '[]'
insert_item "concept-china-people-group" "$USER_ID" "Concept" '"Groups of people Charles interacts with in China."' '"China People Group"' '["China", "people", "group"]' '[]' 