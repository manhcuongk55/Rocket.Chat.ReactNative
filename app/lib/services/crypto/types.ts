/**
 * Crypto Manager - Type Definitions
 * Based on brendadeeznuts1111/crypto-manager response format
 */

export type CryptoCurrency = 'BTC' | 'ETH' | 'LTC' | 'DOGE' | 'TRX';

export interface ICryptoConfig {
    etherscanApiKey?: string;
    wallets: IWalletConfig[];
}

export interface IWalletConfig {
    address: string;
    currency: CryptoCurrency;
    label?: string;
}

export interface ICryptoWallet {
    currency: CryptoCurrency;
    address: string;
    label?: string;
    balance: number;
    balanceRaw: string;
    totalReceived: number;
    totalSent: number;
    usdValue?: number;
    lastUpdated: number;
}

export interface ITransaction {
    hash: string;
    type: 'sent' | 'received';
    value: number;
    fee?: number;
    timestamp: number;
    confirmed: boolean;
    from?: string;
    to?: string;
}

export interface IExchangeRate {
    currency: CryptoCurrency;
    usdRate: number;
    change24h?: number;
    lastUpdated: number;
}
