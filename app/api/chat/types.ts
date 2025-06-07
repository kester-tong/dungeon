import { Message, MessageParam } from '@/src/npcs/Anthropic';

export interface ChatRequest {
  messages: MessageParam[];
  npcId: string;
  accessKey: string;
}

export interface ChatSuccessResponse {
  success: true;
  response: {
    message: Message;
  };
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
