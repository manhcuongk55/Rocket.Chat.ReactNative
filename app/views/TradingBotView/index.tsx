/**
 * TradingBotView - DRL Trading Bot Dashboard
 * 
 * Integrates zero-was-here/tradingbot into Smile Chat.
 * Monitor AI trading signals, positions, and account performance for XAUUSD.
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
    setTradingConfig,
    getLatestSignal,
    getPositions,
    getAccountInfo,
    getMarketData,
    checkBotHealth
} from '../../lib/services/trading/client';
import {
    type ITradingConfig,
    type ITradingSignal,
    type IPosition,
    type IAccountInfo,
    type IMarketData,
    type TradingStrategy
} from '../../lib/services/trading/types';

const STORAGE_KEY = 'trading_config';

const TradingBotView = ({ navigation }: { navigation: any }) => {
    const { colors } = useTheme();
    const styles = getViewStyles(colors);

    const [configured, setConfigured] = useState(false);
    const [configUrl, setConfigUrl] = useState('http://localhost:5000');
    const [configStrategy, setConfigStrategy] = useState<TradingStrategy>('standard');

    const [signal, setSignal] = useState<ITradingSignal | null>(null);
    const [positions, setPositions] = useState<IPosition[]>([]);
    const [account, setAccount] = useState<IAccountInfo | null>(null);
    const [market, setMarket] = useState<IMarketData | null>(null);
    const [botOnline, setBotOnline] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            title: '🤖 Trading Bot',
            headerRight: () => (
                <TouchableOpacity style={{ padding: 4, marginRight: 8 }} onPress={() => setConfigured(false)}>
                    <Text style={{ color: colors.strokeHighlight, fontSize: 22 }}>⚙️</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, colors]);

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const config: ITradingConfig = JSON.parse(saved);
                setConfigUrl(config.apiUrl);
                setConfigStrategy(config.strategy);
                setTradingConfig(config);
                setConfigured(true);
                refreshData();
            }
        } catch { /* show config */ }
    };

    const saveConfig = async () => {
        if (!configUrl.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập Bot API URL');
            return;
        }
        const config: ITradingConfig = {
            apiUrl: configUrl.trim(),
            strategy: configStrategy,
            maxRiskPerTrade: 0.02,
            maxDailyLoss: 0.05,
            maxPositions: 3
        };
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            setTradingConfig(config);
            setConfigured(true);
            refreshData();
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu cấu hình');
        }
    };

    const refreshData = useCallback(async () => {
        setLoading(true);
        try {
            const health = await checkBotHealth();
            setBotOnline(health);

            // Fetch market data (works without bot via public API fallback)
            try { setMarket(await getMarketData()); } catch { /* ignore */ }

            if (health) {
                const [sig, pos, acc] = await Promise.all([
                    getLatestSignal().catch(() => null),
                    getPositions().catch(() => []),
                    getAccountInfo().catch(() => null)
                ]);
                if (sig) setSignal(sig);
                setPositions(pos);
                if (acc) setAccount(acc);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Auto-refresh every 60s
    useEffect(() => {
        if (!configured) return;
        const timer = setInterval(refreshData, 60000);
        return () => clearInterval(timer);
    }, [configured, refreshData]);

    const STRATEGIES: { key: TradingStrategy; label: string; desc: string }[] = [
        { key: 'standard', label: '📊 Standard', desc: 'Cân bằng rủi ro và lợi nhuận' },
        { key: 'aggressive', label: '🔥 Aggressive', desc: 'Lợi nhuận cao, rủi ro lớn' },
        { key: 'swing', label: '🌊 Swing', desc: 'Giữ lệnh lâu, ít giao dịch' }
    ];

    // --- Config Form ---
    if (!configured) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.configScroll}>
                    <Text style={styles.configTitle}>🤖 DRL Trading Bot</Text>
                    <Text style={styles.configSubtitle}>Kết nối với AI Trading Bot cho XAUUSD</Text>

                    <Text style={styles.label}>Bot API URL *</Text>
                    <TextInput
                        style={styles.input}
                        value={configUrl}
                        onChangeText={setConfigUrl}
                        placeholder='http://localhost:5000'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                    />

                    <Text style={styles.label}>Chiến lược giao dịch</Text>
                    {STRATEGIES.map(s => (
                        <TouchableOpacity
                            key={s.key}
                            style={[styles.strategyBtn, configStrategy === s.key && styles.strategyBtnActive]}
                            onPress={() => setConfigStrategy(s.key)}
                        >
                            <Text style={[styles.strategyLabel, configStrategy === s.key && { color: colors.fontWhite }]}>
                                {s.label}
                            </Text>
                            <Text style={[styles.strategyDesc, configStrategy === s.key && { color: 'rgba(255,255,255,0.7)' }]}>
                                {s.desc}
                            </Text>
                        </TouchableOpacity>
                    ))}

                    <TouchableOpacity style={styles.saveBtn} onPress={saveConfig} activeOpacity={0.8}>
                        <Text style={styles.saveBtnText}>Kết nối Bot</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    // --- Trading Dashboard ---
    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); refreshData(); }} />}
        >
            {/* Bot status */}
            <View style={[styles.statusBar, { backgroundColor: botOnline ? colors.userPresenceOnline : colors.fontDanger }]}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                    {botOnline ? '🟢 Bot Online' : '🔴 Bot Offline'} • {configStrategy.toUpperCase()}
                </Text>
            </View>

            {/* Market Data */}
            {market && (
                <View style={styles.marketCard}>
                    <Text style={styles.marketSymbol}>XAUUSD (Gold)</Text>
                    <Text style={styles.marketPrice}>${market.bid.toFixed(2)}</Text>
                    <View style={styles.marketRow}>
                        <Text style={[styles.marketChange, { color: market.changePct >= 0 ? colors.userPresenceOnline : colors.fontDanger }]}>
                            {market.changePct >= 0 ? '▲' : '▼'} {Math.abs(market.changePct).toFixed(2)}%
                        </Text>
                        <Text style={styles.marketDetail}>Spread: {market.spread.toFixed(1)}</Text>
                        <Text style={styles.marketDetail}>H: ${market.high24h.toFixed(0)} L: ${market.low24h.toFixed(0)}</Text>
                    </View>
                </View>
            )}

            {/* AI Signal */}
            {signal && (
                <View style={styles.signalCard}>
                    <Text style={styles.sectionTitle}>🧠 Tín hiệu AI</Text>
                    <View style={styles.signalContent}>
                        <View style={[
                            styles.signalBadge,
                            { backgroundColor: signal.action === 'BUY' ? colors.userPresenceOnline : signal.action === 'SELL' ? colors.fontDanger : colors.fontHint }
                        ]}>
                            <Text style={styles.signalAction}>{signal.action}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.signalConfidence}>
                                Độ tin cậy: {(signal.confidence * 100).toFixed(0)}%
                            </Text>
                            {signal.stopLoss && <Text style={styles.signalDetail}>SL: ${signal.stopLoss.toFixed(2)}</Text>}
                            {signal.takeProfit && <Text style={styles.signalDetail}>TP: ${signal.takeProfit.toFixed(2)}</Text>}
                            {signal.reasoning && <Text style={styles.signalReasoning}>{signal.reasoning}</Text>}
                        </View>
                    </View>
                </View>
            )}

            {/* Account Info */}
            {account && (
                <View style={styles.accountCard}>
                    <Text style={styles.sectionTitle}>💰 Tài khoản</Text>
                    <View style={styles.accountGrid}>
                        <View style={styles.accountItem}>
                            <Text style={styles.accountLabel}>Balance</Text>
                            <Text style={styles.accountValue}>${account.balance.toLocaleString()}</Text>
                        </View>
                        <View style={styles.accountItem}>
                            <Text style={styles.accountLabel}>Equity</Text>
                            <Text style={styles.accountValue}>${account.equity.toLocaleString()}</Text>
                        </View>
                        <View style={styles.accountItem}>
                            <Text style={styles.accountLabel}>P/L Hôm nay</Text>
                            <Text style={[styles.accountValue, { color: account.todayPnl >= 0 ? colors.userPresenceOnline : colors.fontDanger }]}>
                                {account.todayPnl >= 0 ? '+' : ''}{account.todayPnl.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.accountItem}>
                            <Text style={styles.accountLabel}>Win Rate</Text>
                            <Text style={styles.accountValue}>{(account.winRate * 100).toFixed(1)}%</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Open Positions */}
            <View style={styles.positionsSection}>
                <Text style={styles.sectionTitle}>📊 Vị thế ({positions.length})</Text>
                {positions.length === 0 ? (
                    <Text style={styles.emptyText}>Không có vị thế mở</Text>
                ) : (
                    positions.map(p => (
                        <View key={p.id} style={styles.positionCard}>
                            <View style={styles.positionHeader}>
                                <View style={[styles.positionType, { backgroundColor: p.type === 'BUY' ? colors.userPresenceOnline : colors.fontDanger }]}>
                                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{p.type}</Text>
                                </View>
                                <Text style={styles.positionVolume}>{p.volume} lot</Text>
                                <Text style={[styles.positionPnl, { color: p.profit >= 0 ? colors.userPresenceOnline : colors.fontDanger }]}>
                                    {p.profit >= 0 ? '+' : ''}{p.profit.toFixed(2)} ({p.profitPct.toFixed(2)}%)
                                </Text>
                            </View>
                            <View style={styles.positionDetails}>
                                <Text style={styles.positionDetail}>Entry: ${p.entryPrice.toFixed(2)}</Text>
                                <Text style={styles.positionDetail}>Current: ${p.currentPrice.toFixed(2)}</Text>
                                <Text style={styles.positionDetail}>SL: ${p.stopLoss.toFixed(2)}</Text>
                                <Text style={styles.positionDetail}>TP: ${p.takeProfit.toFixed(2)}</Text>
                            </View>
                        </View>
                    ))
                )}
            </View>

            {loading && <Text style={[styles.emptyText, { padding: 20 }]}>Đang tải...</Text>}
        </ScrollView>
    );
};

export default TradingBotView;

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
        strategyBtn: {
            padding: 14, borderRadius: 12, marginTop: 8,
            borderWidth: 1, borderColor: colors.strokeLight, backgroundColor: colors.surfaceLight
        },
        strategyBtnActive: { backgroundColor: colors.buttonBackgroundPrimaryDefault, borderColor: colors.buttonBackgroundPrimaryDefault },
        strategyLabel: { color: colors.fontTitlesLabels, fontSize: 15, fontWeight: '600' },
        strategyDesc: { color: colors.fontAnnotation, fontSize: 12, marginTop: 2 },
        saveBtn: {
            backgroundColor: colors.buttonBackgroundPrimaryDefault, borderRadius: 12,
            paddingVertical: 14, alignItems: 'center', marginTop: 28
        },
        saveBtnText: { color: colors.fontWhite, fontSize: 16, fontWeight: '600' },
        statusBar: {
            paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center'
        },
        marketCard: {
            margin: 16, padding: 20, borderRadius: 16,
            backgroundColor: colors.surfaceDark, alignItems: 'center'
        },
        marketSymbol: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
        marketPrice: { color: colors.fontWhite, fontSize: 36, fontWeight: '700', marginVertical: 4 },
        marketRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
        marketChange: { fontSize: 14, fontWeight: '600' },
        marketDetail: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
        sectionTitle: { color: colors.fontTitlesLabels, fontSize: 16, fontWeight: '700', marginBottom: 10 },
        signalCard: {
            marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14,
            backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.strokeExtraLight
        },
        signalContent: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
        signalBadge: {
            width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center'
        },
        signalAction: { color: '#fff', fontSize: 16, fontWeight: '800' },
        signalConfidence: { color: colors.fontDefault, fontSize: 14, fontWeight: '600' },
        signalDetail: { color: colors.fontHint, fontSize: 12, marginTop: 2 },
        signalReasoning: { color: colors.fontAnnotation, fontSize: 12, marginTop: 6, fontStyle: 'italic' },
        accountCard: {
            marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 14,
            backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.strokeExtraLight
        },
        accountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginTop: 8 },
        accountItem: { width: '50%', paddingVertical: 6 },
        accountLabel: { color: colors.fontAnnotation, fontSize: 12 },
        accountValue: { color: colors.fontTitlesLabels, fontSize: 16, fontWeight: '700' },
        positionsSection: { marginHorizontal: 16, marginBottom: 24 },
        positionCard: {
            padding: 14, borderRadius: 12, marginTop: 8,
            backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.strokeExtraLight
        },
        positionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
        positionType: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
        positionVolume: { color: colors.fontDefault, fontSize: 14 },
        positionPnl: { fontSize: 15, fontWeight: '700', marginLeft: 'auto' },
        positionDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
        positionDetail: { color: colors.fontHint, fontSize: 12 },
        emptyText: { color: colors.fontAnnotation, fontSize: 13, textAlign: 'center' }
    });
