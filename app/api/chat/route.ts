import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { gameConfig } from '@/src/config/GameConfig'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, npcId, accessKey } = body
    
    // Validate access key
    if (!accessKey || accessKey !== process.env.APP_PASSWORD) {
      return NextResponse.json({
        error: 'Invalid access key'
      }, { status: 401 })
    }
    
    console.log(`💬 Chat request for NPC: ${npcId} with ${messages.length} messages`)

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    const npc = gameConfig.npcs[npcId]
    if (!npc) {
      throw new Error(`NPC not found: ${npcId}`)
    }
    const systemPrompt = npc.prompt

    console.log('🤖 Anthropic API Request:', {
      model: 'claude-opus-4-20250514',
      system: systemPrompt,
      messages: messages,
      tools: npc.tools,
    })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 150,
      system: systemPrompt,
      messages: messages,
      tools: npc.tools,
    })

    console.log('✅ Anthropic API Response:', response)

    let textResponse : string | undefined = undefined;
    let tool_use: {
        name: string;
        // TODO: check if this signature is correct, probably not.
        input: unknown;
    } | undefined = undefined;
    response.content.forEach(block => {
      if (block.type === 'text') {
        textResponse = (textResponse || '') + block.text;
      } else if (block.type === 'tool_use') {
        tool_use = {
          name: block.name,
          input: block.input
        }
      }
    })

    const npcResponse : NPCResponse = textResponse || tool_use ? {
      text: textResponse,
      tool_use,
    } : {
      text: 'Error'
    }
    return NextResponse.json({
      success: true,
      response: npcResponse,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return a fallback response instead of exposing the error
    return NextResponse.json({
      success: true,
      response: {text: "I'm sorry, I'm having trouble hearing you right now. Could you try again?"}
    })
  }
}