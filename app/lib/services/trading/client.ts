/**
 * Trading Bot - API Client
 * Connects to DRL Trading Bot backend (zero-was-here/tradingbot)
 * 
 * The bot runs as a Python backend with REST endpoints for:
 * - Live trading signals from PPO/Dreamer models
 * - Position management
 * - Account status 
 * - Market data (XAUUSD)
 */

import {
    type ITradingConfig,
    type ITradingSignal,
    type IPosition,
    type IAccountInfo,
    type IMarketData
} from './types';

let _config: ITradingConfig | null = null;

export function setTradingConfig(config: ITradingConfig): void {
    _config = config;
}

export function getTradingConfig(): ITradingConfig | null {
    return _config;
}

function getBaseUrl(): string {
    if (!_config) throw new Error('Trading config not set');
    return _config.apiUrl.replace(/\/$/, '');
}

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`);
    if (!res.ok) throw new Error(`Trading API error: ${res.status}`);
    return res.json();
}

async function apiPost<T>(path: string, body: any): Promise<T> {
    const res = await fetch(`${getBaseUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`Trading API error: ${res.status}`);
    return res.json();
}

/**
 * Get current trading signal from the AI model
 */
export async function getLatestSignal(): Promise<ITradingSignal> {
    return apiGet<ITradingSignal>('/api/signal');
}

/**
 * Get open positions
 */
export async function getPositions(): Promise<IPosition[]> {
    return apiGet<IPosition[]>('/api/positions');
}

/**
 * Get account info
 */
export async function getAccountInfo(): Promise<IAccountInfo> {
    return apiGet<IAccountInfo>('/api/account');
}

/**
 * Get current market data for XAUUSD
 */
export async function getMarketData(): Promise<IMarketData> {
    try {
        return await apiGet<IMarketData>('/api/market');
    } catch {
        // Fallback: use public gold price API
        const res = await fetch('https://api.metals.live/v1/spot/gold');
        if (!res.ok) throw new Error('Market data unavailable');
        const data = await res.json();
        const price = Array.isArray(data) ? data[0]?.price || 0 : data.price || 0;
        return {
            symbol: 'XAUUSD',
            bid: price,
            ask: price + 0.3,
            spread: 0.3,
            change24h: 0,
            changePct: 0,
            high24h: price,
            low24h: price,
            timestamp: Date.now()
        };
    }
}

/**
 * Execute a trade
 */
export async function executeTrade(
    action: 'BUY' | 'SELL',
    volume: number,
    stopLoss?: number,
    takeProfit?: number
): Promise<{ success: boolean; positionId?: string; error?: string }> {
    return apiPost('/api/trade', {
        action,
        volume,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        strategy: _config?.strategy || 'standard'
    });
}

/**
 * Close a position
 */
export async function closePosition(positionId: string): Promise<{ success: boolean }> {
    return apiPost('/api/close', { position_id: positionId });
}

/**
 * Health check
 */
export async function checkBotHealth(): Promise<boolean> {
    try {
        const res = await fetch(`${getBaseUrl()}/api/health`);
        return res.ok;
    } catch {
        return false;
    }
}
