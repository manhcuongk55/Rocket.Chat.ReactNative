/**
 * CryptoWalletView - Cryptocurrency Wallet Dashboard
 * 
 * Integrates brendadeeznuts1111/crypto-manager into Smile Chat.
 * Track crypto wallets across BTC, ETH, LTC, DOGE networks.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme, type TColors } from '../../theme';
import {
    setEtherscanApiKey,
    getExchangeRates,
    getWallet,
    getBtcTransactions,
    getEthTransactions
} from '../../lib/services/crypto/client';
import {
    type CryptoCurrency,
    type ICryptoConfig,
    type ICryptoWallet,
    type ITransaction,
    type IExchangeRate
} from '../../lib/services/crypto/types';
import WalletCard from './components/WalletCard';
import TransactionList from './components/TransactionList';

const STORAGE_KEY = 'crypto_config';

const CURRENCY_OPTIONS: CryptoCurrency[] = ['BTC', 'ETH', 'LTC', 'DOGE'];

const CryptoWalletView = ({ navigation }: { navigation: any }) => {
    const { colors } = useTheme();
    const styles = getViewStyles(colors);

    const [configured, setConfigured] = useState(false);
    const [ethApiKey, setEthApiKey] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newCurrency, setNewCurrency] = useState<CryptoCurrency>('BTC');
    const [newLabel, setNewLabel] = useState('');

    const [wallets, setWallets] = useState<ICryptoWallet[]>([]);
    const [rates, setRates] = useState<IExchangeRate[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<ICryptoWallet | null>(null);
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<ICryptoConfig>({ wallets: [] });

    useEffect(() => {
        navigation.setOptions({
            title: '🪙 Crypto Wallet',
            headerRight: () => (
                <TouchableOpacity style={{ padding: 4, marginRight: 8 }} onPress={() => setConfigured(false)}>
                    <Text style={{ color: colors.strokeHighlight, fontSize: 22 }}>＋</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, colors]);

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const cfg: ICryptoConfig = JSON.parse(saved);
                setConfig(cfg);
                if (cfg.etherscanApiKey) {
                    setEthApiKey(cfg.etherscanApiKey);
                    setEtherscanApiKey(cfg.etherscanApiKey);
                }
                if (cfg.wallets.length > 0) {
                    setConfigured(true);
                    refreshWallets(cfg);
                }
            }
        } catch { /* show config */ }
    };

    const saveAndAddWallet = async () => {
        if (!newAddress.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập wallet address');
            return;
        }

        const updatedConfig: ICryptoConfig = {
            etherscanApiKey: ethApiKey.trim() || undefined,
            wallets: [
                ...config.wallets,
                { address: newAddress.trim(), currency: newCurrency, label: newLabel.trim() || undefined }
            ]
        };

        if (ethApiKey.trim()) {
            setEtherscanApiKey(ethApiKey.trim());
        }

        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
            setConfig(updatedConfig);
            setNewAddress('');
            setNewLabel('');
            setConfigured(true);
            refreshWallets(updatedConfig);
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu');
        }
    };

    const refreshWallets = async (cfg?: ICryptoConfig) => {
        const c = cfg || config;
        setLoading(true);
        try {
            // Fetch exchange rates
            const currencies = [...new Set(c.wallets.map(w => w.currency))] as CryptoCurrency[];
            const rateData = await getExchangeRates(currencies);
            setRates(rateData);

            // Fetch all wallets
            const walletData = await Promise.all(
                c.wallets.map(async w => {
                    try {
                        const wallet = await getWallet(w.address, w.currency);
                        const rate = rateData.find(r => r.currency === w.currency);
                        return {
                            ...wallet,
                            label: w.label,
                            usdValue: rate ? wallet.balance * rate.usdRate : undefined
                        };
                    } catch (err: any) {
                        return {
                            currency: w.currency,
                            address: w.address,
                            label: w.label,
                            balance: 0,
                            balanceRaw: '0',
                            totalReceived: 0,
                            totalSent: 0,
                            lastUpdated: Date.now()
                        } as ICryptoWallet;
                    }
                })
            );
            setWallets(walletData);
        } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật dữ liệu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleWalletPress = async (wallet: ICryptoWallet) => {
        setSelectedWallet(wallet);
        setTransactions([]);
        try {
            let txs: ITransaction[] = [];
            if (wallet.currency === 'BTC') txs = await getBtcTransactions(wallet.address);
            else if (wallet.currency === 'ETH') txs = await getEthTransactions(wallet.address);
            setTransactions(txs);
        } catch { /* ignore */ }
    };

    const totalUsd = wallets.reduce((sum, w) => sum + (w.usdValue || 0), 0);

    // --- Add Wallet Form ---
    if (!configured) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.configScroll}>
                    <Text style={styles.configTitle}>🪙 Thêm Wallet</Text>
                    <Text style={styles.configSubtitle}>Nhập địa chỉ ví để theo dõi số dư</Text>

                    <Text style={styles.label}>Blockchain</Text>
                    <View style={styles.currencyRow}>
                        {CURRENCY_OPTIONS.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.currencyBtn, newCurrency === c && styles.currencyBtnActive]}
                                onPress={() => setNewCurrency(c)}
                            >
                                <Text style={[styles.currencyBtnText, newCurrency === c && styles.currencyBtnTextActive]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Wallet Address *</Text>
                    <TextInput
                        style={styles.input}
                        value={newAddress}
                        onChangeText={setNewAddress}
                        placeholder='0x... hoặc bc1...'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                        autoCorrect={false}
                    />

                    <Text style={styles.label}>Label (tuỳ chọn)</Text>
                    <TextInput
                        style={styles.input}
                        value={newLabel}
                        onChangeText={setNewLabel}
                        placeholder='Ví chính, Savings...'
                        placeholderTextColor={colors.fontAnnotation}
                    />

                    {newCurrency === 'ETH' && (
                        <>
                            <Text style={styles.label}>Etherscan API Key</Text>
                            <TextInput
                                style={styles.input}
                                value={ethApiKey}
                                onChangeText={setEthApiKey}
                                placeholder='API key từ etherscan.io'
                                placeholderTextColor={colors.fontAnnotation}
                                autoCapitalize='none'
                            />
                        </>
                    )}

                    <TouchableOpacity style={styles.addBtn} onPress={saveAndAddWallet} activeOpacity={0.8}>
                        <Text style={styles.addBtnText}>Thêm Wallet</Text>
                    </TouchableOpacity>

                    {config.wallets.length > 0 && (
                        <TouchableOpacity style={styles.skipBtn} onPress={() => setConfigured(true)}>
                            <Text style={styles.skipBtnText}>← Quay lại Dashboard</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // --- Wallet Dashboard ---
    if (selectedWallet) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedWallet(null)}>
                    <Text style={styles.backBtnText}>← Quay lại</Text>
                </TouchableOpacity>
                <WalletCard wallet={selectedWallet} />
                <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
                <TransactionList transactions={transactions} currency={selectedWallet.currency} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refreshWallets(); }} />}
        >
            {/* Total Portfolio */}
            <View style={styles.portfolioCard}>
                <Text style={styles.portfolioLabel}>Tổng giá trị</Text>
                <Text style={styles.portfolioValue}>
                    ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.portfolioSub}>{wallets.length} ví • {rates.length} đồng</Text>
            </View>

            {/* Exchange Rates */}
            {rates.length > 0 && (
                <View style={styles.ratesRow}>
                    {rates.map(r => (
                        <View key={r.currency} style={styles.rateCard}>
                            <Text style={styles.rateName}>{r.currency}</Text>
                            <Text style={styles.rateValue}>${r.usdRate.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
                            {r.change24h !== undefined && (
                                <Text style={[styles.rateChange, { color: r.change24h >= 0 ? colors.userPresenceOnline : colors.fontDanger }]}>
                                    {r.change24h >= 0 ? '▲' : '▼'} {Math.abs(r.change24h).toFixed(2)}%
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {/* Wallets */}
            {wallets.map((w, i) => (
                <WalletCard key={`${w.address}-${i}`} wallet={w} onPress={() => handleWalletPress(w)} />
            ))}

            {loading && (
                <Text style={[styles.portfolioSub, { textAlign: 'center', padding: 20 }]}>Đang tải...</Text>
            )}
        </ScrollView>
    );
};

export default CryptoWalletView;

const getViewStyles = (colors: TColors) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.surfaceRoom },
        configScroll: { padding: 24, justifyContent: 'center', minHeight: '100%' },
        configTitle: { color: colors.fontTitlesLabels, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
        configSubtitle: { color: colors.fontAnnotation, fontSize: 14, textAlign: 'center', marginBottom: 24 },
        label: { color: colors.fontDefault, fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 14 },
        input: {
            borderWidth: 1, borderColor: colors.strokeLight, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12,
            color: colors.fontDefault, fontSize: 15, backgroundColor: colors.surfaceNeutral
        },
        currencyRow: { flexDirection: 'row', gap: 8 },
        currencyBtn: {
            flex: 1, paddingVertical: 10, borderRadius: 10,
            backgroundColor: colors.surfaceNeutral, alignItems: 'center'
        },
        currencyBtnActive: { backgroundColor: colors.buttonBackgroundPrimaryDefault },
        currencyBtnText: { color: colors.fontDefault, fontSize: 14, fontWeight: '600' },
        currencyBtnTextActive: { color: colors.fontWhite },
        addBtn: {
            backgroundColor: colors.buttonBackgroundPrimaryDefault, borderRadius: 12,
            paddingVertical: 14, alignItems: 'center', marginTop: 28
        },
        addBtnText: { color: colors.fontWhite, fontSize: 16, fontWeight: '600' },
        skipBtn: { marginTop: 16, alignItems: 'center' },
        skipBtnText: { color: colors.strokeHighlight, fontSize: 14 },
        backBtn: { paddingHorizontal: 16, paddingVertical: 12 },
        backBtnText: { color: colors.strokeHighlight, fontSize: 15, fontWeight: '500' },
        sectionTitle: {
            color: colors.fontTitlesLabels, fontSize: 16, fontWeight: '700',
            paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8
        },
        portfolioCard: {
            margin: 16, padding: 20, borderRadius: 16,
            backgroundColor: colors.buttonBackgroundPrimaryDefault, alignItems: 'center'
        },
        portfolioLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
        portfolioValue: { color: colors.fontWhite, fontSize: 32, fontWeight: '700', marginVertical: 4 },
        portfolioSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
        ratesRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
        rateCard: {
            flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 10,
            padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.strokeExtraLight
        },
        rateName: { color: colors.fontHint, fontSize: 12, fontWeight: '600' },
        rateValue: { color: colors.fontTitlesLabels, fontSize: 14, fontWeight: '700', marginTop: 2 },
        rateChange: { fontSize: 11, marginTop: 2 }
    });
