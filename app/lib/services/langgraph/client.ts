/**
 * LangGraph Client Factory
 * Creates and manages the LangGraph SDK client instance.
 * Ported from agent-chat-ui/src/providers/client.ts
 */

import { type ILangGraphConfig, type IAgentThread, type IAgentMessage } from './types';
import { processStream } from './streamHandler';
import type { IStreamCallbacks } from './types';

let _config: ILangGraphConfig | null = null;

/**
 * Set the LangGraph configuration
 */
export function setLangGraphConfig(config: ILangGraphConfig): void {
    _config = config;
}

/**
 * Get the current LangGraph configuration
 */
export function getLangGraphConfig(): ILangGraphConfig | null {
    return _config;
}

/**
 * Build the base URL for API calls
 */
function getBaseUrl(): string {
    if (!_config) {
        throw new Error('LangGraph config not set. Call setLangGraphConfig first.');
    }
    return _config.apiUrl.replace(/\/$/, '');
}

/**
 * Build request headers
 */
function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (_config?.apiKey) {
        headers['x-api-key'] = _config.apiKey;
    }
    return headers;
}

/**
 * Create a new thread
 */
export async function createThread(): Promise<IAgentThread> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/threads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            metadata: _config?.assistantId
                ? { graph_id: _config.assistantId }
                : {}
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
        threadId: data.thread_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        metadata: data.metadata
    };
}

/**
 * Get list of threads
 */
export async function getThreads(limit = 20): Promise<IAgentThread[]> {
    const baseUrl = getBaseUrl();
    const body: Record<string, unknown> = { limit };

    if (_config?.assistantId) {
        body.metadata = { graph_id: _config.assistantId };
    }

    const response = await fetch(`${baseUrl}/threads/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Failed to get threads: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((t: any) => ({
        threadId: t.thread_id,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        metadata: t.metadata
    }));
}

/**
 * Get thread state (messages)
 */
export async function getThreadState(threadId: string): Promise<IAgentMessage[]> {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/threads/${threadId}/state`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) {
        throw new Error(`Failed to get thread state: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const messages = data?.values?.messages || [];

    return messages
        .filter((m: any) => !m.id?.startsWith('do-not-render-'))
        .map((m: any, index: number) => ({
            id: m.id || `msg-${index}`,
            role: m.type === 'human' ? 'human' : m.type === 'tool' ? 'tool' : 'ai',
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
            timestamp: Date.now() - (messages.length - index) * 1000,
            toolCallId: m.tool_call_id,
            toolName: m.name
        }));
}

/**
 * Send a message and stream the response
 */
export async function sendMessage(
    threadId: string,
    content: string,
    callbacks: IStreamCallbacks
): Promise<void> {
    const baseUrl = getBaseUrl();
    const assistantId = _config?.assistantId || 'agent';

    callbacks.onStart?.();

    try {
        const response = await fetch(`${baseUrl}/runs/stream`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                assistant_id: assistantId,
                thread_id: threadId,
                input: {
                    messages: [
                        {
                            role: 'human',
                            content
                        }
                    ]
                },
                stream_mode: ['messages'],
                stream_subgraphs: true
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
        }

        await processStream(response, callbacks);
    } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
}
