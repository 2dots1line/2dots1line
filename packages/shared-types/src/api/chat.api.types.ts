/**
 * API types for Conversation (Chat) interactions
 */
import type { TConversation, TConversationMessage } from '../entities';

import type { TPaginationInput } from './common.types';

/**
 * Request payload for sending a message
 */
export interface TSendMessageRequest {
  conversation_id?: string | null; // Null or omitted to start a new conversation
  message_text?: string | null;
  media_attachments?: { type: string; url: string }[]; // Client sends URL, backend creates TMedia
}

/**
 * Response payload after sending a message (contains the assistant's reply)
 */
export interface TSendMessageResponse {
  user_message: TConversationMessage; // The user message as recorded
  assistant_message: TConversationMessage; // The assistant's reply
  conversation_id: string; // ID of the conversation (new or existing)
}

/**
 * Request payload for retrieving conversation history
 */
export interface TGetConversationHistoryRequest extends TPaginationInput {
  conversation_id: string;
}

/**
 * Response payload containing conversation history
 */
export interface TGetConversationHistoryResponse {
  conversation: TConversation;
  messages: TConversationMessage[];
}

/**
 * Request payload for listing conversations
 */
export interface TListConversationsRequest extends TPaginationInput {
  status?: 'active' | 'archived';
}

/**
 * Response payload containing a list of conversations
 */
export interface TListConversationsResponse {
  conversations: TConversation[];
} 