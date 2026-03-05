/**
 * Crypto Manager - Blockchain API Client
 * Port of Python crypto_manager logic to TypeScript/React Native.
 * Uses public blockchain APIs directly.
 */

import {
    type CryptoCurrency,
    type ICryptoWallet,
    type ITransaction,
    type IExchangeRate
} from './types';

let etherscanApiKey = '';

export function setEtherscanApiKey(key: string) {
    etherscanApiKey = key;
}

// ====== Exchange Rates (CoinGecko) ======

const COINGECKO_IDS: Record<CryptoCurrency, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    LTC: 'litecoin',
    DOGE: 'dogecoin',
    TRX: 'tron'
};

export async function getExchangeRates(currencies: CryptoCurrency[] = ['BTC', 'ETH', 'LTC', 'DOGE']): Promise<IExchangeRate[]> {
    const ids = currencies.map(c => COINGECKO_IDS[c]).join(',');
    const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) throw new Error('Failed to fetch exchange rates');
    const data = await res.json();

    return currencies.map(currency => {
        const id = COINGECKO_IDS[currency];
        return {
            currency,
            usdRate: data[id]?.usd || 0,
            change24h: data[id]?.usd_24h_change,
            lastUpdated: Date.now()
        };
    });
}

// ====== Bitcoin (Blockchain.info) ======

export async function getBtcWallet(address: string): Promise<ICryptoWallet> {
    const res = await fetch(`https://blockchain.info/rawaddr/${address}?limit=10`);
    if (!res.ok) throw new Error(`BTC API error: ${res.status}`);
    const data = await res.json();

    return {
        currency: 'BTC',
        address,
        balance: data.final_balance / 1e8,
        balanceRaw: String(data.final_balance),
        totalReceived: data.total_received / 1e8,
        totalSent: data.total_sent / 1e8,
        lastUpdated: Date.now()
    };
}

export async function getBtcTransactions(address: string): Promise<ITransaction[]> {
    const res = await fetch(`https://blockchain.info/rawaddr/${address}?limit=20`);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.txs || []).map((tx: any) => {
        const isSent = tx.inputs?.some((inp: any) => inp.prev_out?.addr === address);
        let value = 0;
        if (isSent) {
            value = tx.out?.filter((o: any) => o.addr !== address).reduce((s: number, o: any) => s + o.value, 0) / 1e8;
        } else {
            value = tx.out?.filter((o: any) => o.addr === address).reduce((s: number, o: any) => s + o.value, 0) / 1e8;
        }

        return {
            hash: tx.hash,
            type: isSent ? 'sent' : 'received',
            value,
            fee: tx.fee / 1e8,
            timestamp: (tx.time || 0) * 1000,
            confirmed: tx.block_height > 0
        };
    });
}

// ====== Ethereum (Etherscan) ======

export async function getEthWallet(address: string): Promise<ICryptoWallet> {
    const url = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${etherscanApiKey || 'YourApiKeyToken'}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ETH API error: ${res.status}`);
    const data = await res.json();
    const balanceWei = BigInt(data.result || '0');
    const balance = Number(balanceWei) / 1e18;

    return {
        currency: 'ETH',
        address,
        balance,
        balanceRaw: data.result || '0',
        totalReceived: 0,
        totalSent: 0,
        lastUpdated: Date.now()
    };
}

export async function getEthTransactions(address: string): Promise<ITransaction[]> {
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${etherscanApiKey || 'YourApiKeyToken'}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    return (data.result || []).map((tx: any) => ({
        hash: tx.hash,
        type: tx.from?.toLowerCase() === address.toLowerCase() ? 'sent' : 'received',
        value: Number(BigInt(tx.value || '0')) / 1e18,
        fee: (Number(tx.gasPrice || 0) * Number(tx.gasUsed || 0)) / 1e18,
        timestamp: Number(tx.timeStamp || 0) * 1000,
        confirmed: tx.isError === '0',
        from: tx.from,
        to: tx.to
    }));
}

// ====== Generic Wallet Fetch ======

export async function getWallet(address: string, currency: CryptoCurrency): Promise<ICryptoWallet> {
    switch (currency) {
        case 'BTC': return getBtcWallet(address);
        case 'ETH': return getEthWallet(address);
        case 'LTC': {
            // Blockcypher API for LTC
            const res = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
            if (!res.ok) throw new Error(`LTC API error: ${res.status}`);
            const d = await res.json();
            return {
                currency: 'LTC', address,
                balance: d.balance / 1e8, balanceRaw: String(d.balance),
                totalReceived: d.total_received / 1e8, totalSent: d.total_sent / 1e8,
                lastUpdated: Date.now()
            };
        }
        case 'DOGE': {
            const res = await fetch(`https://api.blockcypher.com/v1/doge/main/addrs/${address}/balance`);
            if (!res.ok) throw new Error(`DOGE API error: ${res.status}`);
            const d = await res.json();
            return {
                currency: 'DOGE', address,
                balance: d.balance / 1e8, balanceRaw: String(d.balance),
                totalReceived: d.total_received / 1e8, totalSent: d.total_sent / 1e8,
                lastUpdated: Date.now()
            };
        }
        default:
            throw new Error(`Unsupported currency: ${currency}`);
    }
}
