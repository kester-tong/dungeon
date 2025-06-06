import { NPCResponse } from '@/src/npcs/NPCResponse';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  npcId: string;
  accessKey: string;
}

export interface ChatSuccessResponse {
  success: true;
  response: NPCResponse;
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
