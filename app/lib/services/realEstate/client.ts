/**
 * AI Real Estate Assistant - API Client
 * Connects to FastAPI backend from AleksNeStu/ai-real-estate-assistant
 */

import { type IRealEstateConfig, type IChatRequest, type IChatResponse } from './types';

let _config: IRealEstateConfig | null = null;

export function setRealEstateConfig(config: IRealEstateConfig): void {
    _config = config;
}

export function getRealEstateConfig(): IRealEstateConfig | null {
    return _config;
}

function getBaseUrl(): string {
    if (!_config) throw new Error('Real Estate config not set');
    return _config.apiUrl.replace(/\/$/, '');
}

/**
 * Send a chat message to the AI Real Estate backend
 */
export async function sendChatMessage(
    message: string,
    sessionId?: string,
    onStream?: (chunk: string) => void
): Promise<IChatResponse> {
    const baseUrl = getBaseUrl();

    const body: IChatRequest = {
        message,
        session_id: sessionId,
        provider: _config?.provider,
        model: _config?.model
    };

    const response = await fetch(`${baseUrl}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Real Estate API error: ${response.status} ${response.statusText}`);
    }

    // Try streaming if callback provided and response supports it
    if (onStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullContent += chunk;
                onStream(chunk);
            }
        } finally {
            reader.releaseLock();
        }

        return {
            response: fullContent,
            session_id: sessionId || ''
        };
    }

    // Fallback to regular JSON response
    const data = await response.json();
    return {
        response: data.response || data.message || JSON.stringify(data),
        session_id: data.session_id || sessionId || '',
        properties: data.properties
    };
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
    try {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
        return res.ok;
    } catch {
        return false;
    }
}
