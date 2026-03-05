import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme, type TColors } from '../../../theme';
import { type ICryptoWallet } from '../../../lib/services/crypto/types';

interface IWalletCardProps {
    wallet: ICryptoWallet;
    onPress?: () => void;
}

const CURRENCY_ICONS: Record<string, string> = {
    BTC: '₿',
    ETH: 'Ξ',
    LTC: 'Ł',
    DOGE: 'Ð',
    TRX: 'T'
};

const WalletCard = memo(({ wallet, onPress }: IWalletCardProps) => {
    const { colors } = useTheme();
    const styles = getCardStyles(colors);

    const icon = CURRENCY_ICONS[wallet.currency] || '🪙';
    const shortAddr = `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.currency}>{wallet.label || wallet.currency}</Text>
                    <Text style={styles.address}>{shortAddr}</Text>
                </View>
            </View>

            <View style={styles.balanceRow}>
                <Text style={styles.balance}>
                    {wallet.balance.toFixed(wallet.currency === 'DOGE' ? 2 : 8)} {wallet.currency}
                </Text>
                {wallet.usdValue !== undefined && (
                    <Text style={styles.usdValue}>
                        ≈ ${wallet.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Nhận</Text>
                    <Text style={[styles.statValue, { color: colors.userPresenceOnline }]}>
                        +{wallet.totalReceived.toFixed(4)}
                    </Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Gửi</Text>
                    <Text style={[styles.statValue, { color: colors.fontDanger }]}>
                        -{wallet.totalSent.toFixed(4)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

WalletCard.displayName = 'WalletCard';
export default WalletCard;

const getCardStyles = (colors: TColors) =>
    StyleSheet.create({
        card: {
            backgroundColor: colors.surfaceLight,
            borderRadius: 14,
            padding: 16,
            marginVertical: 6,
            marginHorizontal: 16,
            borderWidth: 1,
            borderColor: colors.strokeExtraLight
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
        },
        iconContainer: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.buttonBackgroundPrimaryDefault,
            alignItems: 'center',
            justifyContent: 'center'
        },
        icon: {
            color: colors.fontWhite,
            fontSize: 20,
            fontWeight: '700'
        },
        currency: {
            color: colors.fontTitlesLabels,
            fontSize: 16,
            fontWeight: '700'
        },
        address: {
            color: colors.fontAnnotation,
            fontSize: 12,
            fontFamily: 'Courier'
        },
        balanceRow: {
            marginBottom: 12
        },
        balance: {
            color: colors.fontTitlesLabels,
            fontSize: 22,
            fontWeight: '700'
        },
        usdValue: {
            color: colors.fontHint,
            fontSize: 14,
            marginTop: 2
        },
        statsRow: {
            flexDirection: 'row',
            gap: 24,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.strokeExtraLight,
            paddingTop: 10
        },
        stat: {
            gap: 2
        },
        statLabel: {
            color: colors.fontAnnotation,
            fontSize: 12
        },
        statValue: {
            fontSize: 14,
            fontWeight: '600'
        }
    });
