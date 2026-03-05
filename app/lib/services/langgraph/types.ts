/**
 * LangGraph Agent Chat - Type Definitions
 * Ported from langchain-ai/agent-chat-ui
 */

export type MessageRole = 'human' | 'ai' | 'tool' | 'system';

export interface IAgentMessage {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: number;
    /** If true, this message is currently being streamed */
    isStreaming?: boolean;
    /** Tool call metadata (for tool messages) */
    toolCallId?: string;
    toolName?: string;
}

export interface IAgentThread {
    threadId: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
}

export interface ILangGraphConfig {
    apiUrl: string;
    assistantId: string;
    apiKey?: string;
}

export interface IStreamEvent {
    event: string;
    data: {
        id?: string;
        content?: string;
        role?: MessageRole;
        [key: string]: unknown;
    };
}

/** Callbacks for handling stream events */
export interface IStreamCallbacks {
    onToken: (token: string) => void;
    onMessageComplete: (message: IAgentMessage) => void;
    onError: (error: Error) => void;
    onStart?: () => void;
    onEnd?: () => void;
}
