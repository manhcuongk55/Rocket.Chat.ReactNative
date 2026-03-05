/**
 * Trading Bot - Type Definitions
 * Based on zero-was-here/tradingbot DRL Trading system
 */

export type TradingStrategy = 'aggressive' | 'swing' | 'standard';
export type SignalAction = 'BUY' | 'SELL' | 'HOLD';
export type PositionStatus = 'open' | 'closed' | 'pending';

export interface ITradingConfig {
    apiUrl: string; // Trading bot backend URL
    strategy: TradingStrategy;
    maxRiskPerTrade: number; // e.g., 0.02 = 2%
    maxDailyLoss: number; // e.g., 0.05 = 5%
    maxPositions: number;
}

export interface ITradingSignal {
    id: string;
    action: SignalAction;
    confidence: number; // 0-1
    price: number;
    timestamp: number;
    stopLoss?: number;
    takeProfit?: number;
    reasoning?: string;
}

export interface IPosition {
    id: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    currentPrice: number;
    volume: number;
    profit: number;
    profitPct: number;
    stopLoss: number;
    takeProfit: number;
    openTime: number;
    status: PositionStatus;
}

export interface IAccountInfo {
    balance: number;
    equity: number;
    profit: number;
    profitPct: number;
    openPositions: number;
    todayTrades: number;
    todayPnl: number;
    winRate: number;
    totalTrades: number;
}

export interface IMarketData {
    symbol: string;
    bid: number;
    ask: number;
    spread: number;
    change24h: number;
    changePct: number;
    high24h: number;
    low24h: number;
    timestamp: number;
}
