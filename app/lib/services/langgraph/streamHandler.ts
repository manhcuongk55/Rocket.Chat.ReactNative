/**
 * LangGraph Stream Handler
 * Processes Server-Sent Events (SSE) from LangGraph streaming API.
 * Adapted for React Native (no browser EventSource).
 */

import { type IStreamCallbacks, type IAgentMessage } from './types';

/**
 * Parse a single SSE line into event name and data
 */
function parseSSELine(line: string): { event?: string; data?: string } {
    if (line.startsWith('event:')) {
        return { event: line.slice(6).trim() };
    }
    if (line.startsWith('data:')) {
        return { data: line.slice(5).trim() };
    }
    return {};
}

/**
 * Process the streaming response from LangGraph
 */
export async function processStream(
    response: Response,
    callbacks: IStreamCallbacks
): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
        callbacks.onError(new Error('Response body is not readable'));
        return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    let fullContent = '';
    let messageId = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep incomplete last line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();

                if (trimmed === '') {
                    // End of event block — process accumulated event
                    currentEvent = '';
                    continue;
                }

                const parsed = parseSSELine(trimmed);

                if (parsed.event) {
                    currentEvent = parsed.event;
                    continue;
                }

                if (parsed.data && currentEvent === 'messages/partial') {
                    try {
                        const eventData = JSON.parse(parsed.data);
                        // eventData is typically an array of message chunks
                        const messages = Array.isArray(eventData) ? eventData : [eventData];

                        for (const msg of messages) {
                            if (msg.type === 'ai' || msg.type === 'AIMessageChunk') {
                                const content = typeof msg.content === 'string' ? msg.content : '';
                                if (content && content !== fullContent) {
                                    // Emit new tokens
                                    const newTokens = content.slice(fullContent.length);
                                    if (newTokens) {
                                        callbacks.onToken(newTokens);
                                    }
                                    fullContent = content;
                                    messageId = msg.id || messageId;
                                }
                            }
                        }
                    } catch {
                        // Skip malformed JSON chunks
                    }
                }

                if (parsed.data && currentEvent === 'messages/complete') {
                    try {
                        const eventData = JSON.parse(parsed.data);
                        const messages = Array.isArray(eventData) ? eventData : [eventData];

                        for (const msg of messages) {
                            if (msg.type === 'ai' && !msg.id?.startsWith('do-not-render-')) {
                                const content = typeof msg.content === 'string' ? msg.content : '';
                                if (content) {
                                    const completeMessage: IAgentMessage = {
                                        id: msg.id || `ai-${Date.now()}`,
                                        role: 'ai',
                                        content,
                                        timestamp: Date.now()
                                    };
                                    callbacks.onMessageComplete(completeMessage);
                                }
                            }
                        }
                    } catch {
                        // Skip malformed JSON
                    }
                }

                // Handle end event
                if (currentEvent === 'end') {
                    callbacks.onEnd?.();
                }
            }
        }

        // If we accumulated content but never got a complete event, send what we have
        if (fullContent) {
            const finalMessage: IAgentMessage = {
                id: messageId || `ai-${Date.now()}`,
                role: 'ai',
                content: fullContent,
                timestamp: Date.now()
            };
            callbacks.onMessageComplete(finalMessage);
        }

        callbacks.onEnd?.();
    } catch (error) {
        callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    } finally {
        reader.releaseLock();
    }
}
