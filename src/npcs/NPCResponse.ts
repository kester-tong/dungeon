export interface ToolUse {
  name: string;
  input: unknown;
}

export interface NPCResponse {
  text?: string;
  tool_use?: ToolUse;
}
