/**
 * NPC (Non-Player Character) interface and types
 */

export interface NPC {
  /**
   * Brief description of the NPC for display purposes
   */
  intro_text: string;
  
  /**
   * Optional first message the NPC says when chat begins
   */
  first_message?: string;
  
  /**
   * System prompt that defines the NPC's personality and behavior for AI conversations
   */
  prompt: string;
}