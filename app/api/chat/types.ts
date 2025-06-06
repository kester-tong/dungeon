import { ChatMessage, ContentBlock } from '@/src/npcs/ContentBlocks';

export type { ChatMessage };

export interface ChatRequest {
  messages: ChatMessage[];
  npcId: string;
  accessKey: string;
}

export interface ChatSuccessResponse {
  success: true;
  response: {
    content: ContentBlock[];
  };
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
