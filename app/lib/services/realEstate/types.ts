/**
 * AI Real Estate Assistant - Type Definitions
 * Based on AleksNeStu/ai-real-estate-assistant API
 */

export interface IRealEstateConfig {
    apiUrl: string;
    provider?: string; // openai, anthropic, google, ollama
    model?: string;
}

export interface IProperty {
    id: string;
    title: string;
    price: number;
    currency: string;
    location: string;
    rooms?: number;
    area?: number;
    description?: string;
    imageUrl?: string;
    amenities?: string[];
}

export interface IChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    properties?: IProperty[];
    isStreaming?: boolean;
}

export interface IChatRequest {
    message: string;
    session_id?: string;
    provider?: string;
    model?: string;
}

export interface IChatResponse {
    response: string;
    session_id: string;
    properties?: IProperty[];
}
