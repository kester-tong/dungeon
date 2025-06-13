import { NextRequest, NextResponse } from 'next/server';
import { GenerateContentParameters, GoogleGenAI } from '@google/genai';
import { gameConfig } from '@/src/config/gameConfig';
import { ChatRequest, ChatResponse } from './types';

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse>> {
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY!,
    });

    const body: ChatRequest = await request.json();
    const { contents, npcId, accessKey } = body;

    // Validate access key
    if (!accessKey || accessKey !== process.env.APP_PASSWORD) {
      return NextResponse.json<ChatResponse>(
        {
          success: false,
          error: 'Invalid access key',
        },
        { status: 401 }
      );
    }

    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new Error('Google AI API key not configured');
    }

    const npc = gameConfig.npcs[npcId];
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }
    const systemPrompt = npc.prompt;

    const generateContentRequest: GenerateContentParameters = {
      model: 'gemini-2.5-pro-preview-06-05',
      config: {
        systemInstruction: systemPrompt,
        tools: [
          {
            functionDeclarations: npc.functions,
          },
        ],
      },
      contents,
    };

    console.log('✅ Google AI Request:', generateContentRequest);

    const response = await ai.models.generateContent(generateContentRequest);

    console.log('✅ Google AI Response:', response);

    if (
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content
    ) {
      return NextResponse.json<ChatResponse>({
        success: true,
        response: {
          content: response.candidates[0].content,
        },
      });
    } else {
      // Return a fallback response instead of exposing the error
      return NextResponse.json<ChatResponse>({
        success: false,
        error: 'Got empty response',
      });
    }
  } catch (error) {
    console.error('Chat API error:', error);

    // Return a fallback response instead of exposing the error
    return NextResponse.json<ChatResponse>({
      success: false,
      error: error!.toString(),
    });
  }
}
