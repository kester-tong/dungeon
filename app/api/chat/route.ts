import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { gameConfig } from '@/src/config/gameConfig';
import { ChatRequest, ChatResponse } from './types';
import { ContentBlock } from '@/src/npcs/Anthropic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();
    const { messages, npcId, accessKey } = body;

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

    console.log(
      `💬 Chat request for NPC: ${npcId} with ${messages.length} messages`
    );

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured');
    }

    const npc = gameConfig.npcs[npcId];
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`);
    }
    const systemPrompt = npc.prompt;

    console.log('🤖 Anthropic API Request:', {
      model: 'claude-opus-4-20250514',
      system: systemPrompt,
      messages: messages,
      tools: npc.tools,
    });

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 150,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: messages,
      tools: npc.tools,
    });

    console.log('✅ Anthropic API Response:', response);

    // Convert Anthropic content blocks to our format
    const convertedContent: ContentBlock[] = response.content.map((block) => {
      if (block.type === 'text') {
        return {
          type: 'text',
          text: block.text,
        };
      } else if (block.type === 'tool_use') {
        return {
          type: 'tool_use',
          id: block.id,
          name: block.name,
          input: block.input,
        };
      } else {
        // Handle any other types by converting to text
        return {
          type: 'text',
          text: `[Unsupported content type: ${block.type}]`,
        };
      }
    });

    return NextResponse.json<ChatResponse>({
      success: true,
      response: {
        message: {
          role: 'assistant',
          content: convertedContent,
          stop_reason: response.stop_reason,
        },
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    // Return a fallback response instead of exposing the error
    return NextResponse.json<ChatResponse>({
      success: false,
      error: error!.toString(),
    });
  }
}
