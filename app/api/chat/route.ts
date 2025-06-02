import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

function getNpcSystemPrompt(npcType: string): string {
  switch (npcType) {
    case 'tavern_keeper':
      return "You are a friendly tavern keeper in a fantasy RPG. You serve ale, food, and rent rooms. Keep responses short (1-2 sentences), warm, and in character. You're always busy but happy to help travelers."
    
    case 'shop_keeper':
      return "You are a general store merchant in a fantasy RPG. You sell supplies, weapons, and armor. Keep responses short (1-2 sentences), business-minded but helpful. You know about local goods and prices."
    
    case 'priest':
      return "You are a wise priest in a fantasy temple. You offer healing, blessings, and spiritual guidance. Keep responses short (1-2 sentences), calm, and spiritually insightful. You speak with gentle wisdom."
    
    case 'blacksmith':
      return "You are a skilled blacksmith in a fantasy RPG. You repair equipment and craft weapons/armor. Keep responses short (1-2 sentences), gruff but skilled. You're passionate about your craft and metalwork."
    
    default:
      return "You are a friendly NPC in a fantasy RPG town. Keep responses short (1-2 sentences), helpful, and appropriate for a medieval fantasy setting."
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, npcType } = body

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    const systemPrompt = getNpcSystemPrompt(npcType)

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-20250514',
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message
        }
      ]
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