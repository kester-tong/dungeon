import { Content } from '@google/genai';

export interface ChatRequest {
  contents: Content[];
  npcId: string;
  accessKey: string;
}

export interface ChatSuccessResponse {
  success: true;
  response: {
    content: Content;
  };
}

export interface ChatErrorResponse {
  success: false;
  error: string;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
