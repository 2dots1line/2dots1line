## Definitions of key concepts
Define conversation as an episode of user interactions with AI without any gap longer than n minues (e.g., n could be defined as 2, 5 or configured time interval)

A cycle is the time between two adjacent global insight refreshes. Could be daily cycle, weekly cycle or monthly cycle. The purpose is to dynamically refresh user model as most recent context for more meaningful user personalization. The output also directly populates user facing artifacts such as a weekly or monthly growth report

The notion of session tracks user log in vs. log out activitiies. Each session could have multiple conversations.

A message is simply a conversation turn by the user or by the AI. Each conversation consists of one or more messages. User upload or user entries of journal are also counted as messages.

When the user enters a new query, if this new query is n minutes post the last interaction, a new conversation is started.

## Description of agent actitivities 
### Start of a new conversation
At the start of a new conversation, a context package is prepared and submitted to the LLM at the beginning of the new conversation (assuming that REDIS will preserve it), the context package includes:

1. CoreAgentIdentity (Who the agent is): Dialogue agent system prompt, which also includes other agents, tools, and databases that DA can rely on
2. userMemoryProfile (Who the user is): User memory profile generated from a global cypher query from user's knowledge graph (for new user, this will be empty at first)
    - A condensed summary of the user's core concepts, stated goals, and recent major life events, retrieved from the graph database  
    - Demographics
    - Preferences
3. What have you two talked about recently (also empty for new user)
    - Conversation Context: a brief summary of the last k sessions (k is configurable), likely covering all the sessions that have occurred since the last user memory profile refresh
    - Context around how long has it been since the last conversation and the nature of the current conversation: is it initiated by the user or by the AI, is the user using a simple chat, or uploaded something, or responding to an AI prompt
4. What does the agent have access to
    - Memory infrastructure to query from as needed, instructions on how to craft a cypher query to request on demand real time supplementary context
    - Instruction on being observant and always ask relevant memory retrieval question (in terms of cypher query, given what's available and what the ontology looks like) to better drive the conversation
5. Onboarding scripts to orient new users and guide them through answering AI prompted questions, upload image or file, and compose a journal entry
6. Last cycle report

### During a conversation
During a conversation, dialogue agent relies on cached conversation history (including the session starter package) to stay contexturalized

If the dialogue agent senses that there are specific memory or context that user may expect it to know, it generates a targeted cypher query to the knowledge graph database (through a tool or another agent?) 

Once the custom requested memory is retrieved, dialogue agent adds the additional memory context to the prompt to LLM for fully customized LLM response

Should we reveal the memory retrieval process? I think so, at least during dev process and as a demo feature. In the user UI, when the Dialogue Agent is generating cypher query, user will see "I am searching my memory about [natural language version of the cypher query]" and once the agent receives the requested memory package, it will display a summary of the parsed memory. This feature can be turned on or off in user setting or by the developer.

In-flight artifact creation
[For future development] The idea is that Dialogue Agent may sense something significant and determines it would be cool to create an artifact such a card or an essay live. 

### After a conversation
After Dialogue agent senses the conversation has been inactive for at least n minutes, it alerts the ingestion analyst to 
- Summarize the entire conversation based on raw messages (with proper attribution to AI vs. user), global context prompt, custom retrieved context (both the raw JSON and the parsed summary passed onto LLM), which will be leveraged as conversation context for future conversations
- Generate new memory units: user mentions a new event with clear who, what, where, when, how, why (at least some of these components) that does not pre-exist. How to determine if it exists or not? based on memory unit vector similarity match?
- Update existing memory units: if user did not provide additional information about the memory unit itself but reacted to it, added color to it or leveraged it in processing a different life situation
- Assign importance score (based on user's part of the conversation), based on its level of substance, relevance to the user's memory profile and growth model (for established user) and the emotional weight of the language
- Extract concepts: identify salient psychological concepts, themes, goals, and entities that are worthy adding or updating in the user graph. For each, determine if it is a new concept or an reiteration of an existing concept (leveraging the concepts reported in the global user memory profile and the custom memory retrieval)
- Create edges: link new edges between existing or new memory units or entities. For example, a new memory unit can be related to pre-existing memory units, a new memory unit can be linked to new or existing concepts, and new or existing concepts can be linked to new or existing nodes, etc. This edge update is done on a relatively local scale, focusing on new nodes and nodes retrieved as custom context. Insight engine will perform periodical global ontology review for each cycle.
- Detect growth event if any: identify moments of potential insights, emotional shift, or self-reflection from the user, or user self-reported action taken (refer to the 6 part growth model)
- Prepare proactive prompts for the user's next converesation: the prompts can be used as customized AI greeting at the start of a new conversation, loaded at the greeting header of the dashboard, fed into wild cards
- Generate cards



Card has several types of content
- AI derived artifacts: mock essays, ROI analysis
- User journal entry (presented in its raw message form, with opptional AI reactions)
- Memory unit (event oriented)
- Concept (people, object, theme, character, goal oriented)
- Growth (focused on near term actionable next actions)

Dashboard is updated with new stats through postgre query (e.g., # of cards, concepts, growth events)

### After a cycle
Insight engine 
- Refreshes global cypher query on thematic questions not specific to any particular memory, goal or concept
- Performs ontology review to combine potentially duplicative nodes, reconcile any conflicts, generate new or update existing "communities", yield a new ontology schema that can be passed onto dialogue agent at the start of ensuing conversations
- Derive insights on any major thematic changes, growth arcs, shifts in preference and tone, quantity and quality of user engagement both with observations and follow up questions. Essentially reading between the lines, go beyond what user said and think about the underlying change.
- Identify major gaps in the user memory graph and mark them as priority proactive prompts that the Dialogue Agent should be aware of 
- Dialogue agent facing cycle report
- User facing cycle report
    - Highlights from the previous cycle, major milestones hit, growth events accomplished, new memory units formed, nodes/cards activated. This should open as a prose (not just a laundry list or reading off numbers) and should feel like a toast, something that a user would be looking forward to reading at the start of every cycle and be motivated or even touched by how far the user has come and how well the agent understands what the user has gone through
    - Showcase opportunities for the coming cycle
