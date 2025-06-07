// Client-safe types that mirror the Anthropic API structure.

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: unknown;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

/**
 * This is the response from the Anthropic API
 */
export interface Message {
  role: 'assistant';
  content: ContentBlock[];
  stop_reason:
    | 'end_turn'
    | 'max_tokens'
    | 'stop_sequence'
    | 'tool_use'
    | 'pause_turn'
    | 'refusal'
    | null;
}

/**
 * This is part of the input to the Anthropic API and also how we
 * store the chat history internally.
 */
export interface MessageParam {
  // TODO: the inputs and outputs to the API should be separate types
  // (in the Anthropic API they are ContentBlock and ContentBlockParam)
  content: Array<ContentBlock>;

  role: 'user' | 'assistant';
}
