interface ToolUse {
    name: string;
    input: unknown;
}

interface NPCResponse {
    text?: string;
    tool_use?: ToolUse;
}