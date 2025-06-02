import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { loadNPC } from '../../../src/npcs/loader'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, npcId } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    const npc = await loadNPC(npcId)
    const systemPrompt = npc.prompt

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 150,
      system: systemPrompt,
      messages: messages
    })

    const responseText = response.content[0]?.type === 'text' 
      ? response.content[0].text 
      : "I'm not sure how to respond to that."

    return NextResponse.json({
      success: true,
      response: responseText
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return a fallback response instead of exposing the error
    return NextResponse.json({
      success: true,
      response: "I'm sorry, I'm having trouble hearing you right now. Could you try again?"
    })
  }
}