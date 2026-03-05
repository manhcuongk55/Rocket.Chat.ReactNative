import React, { memo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

import { useTheme, type TColors } from '../../../theme';
import { type ITransaction } from '../../../lib/services/crypto/types';

interface ITransactionListProps {
    transactions: ITransaction[];
    currency: string;
}

const TransactionList = memo(({ transactions, currency }: ITransactionListProps) => {
    const { colors } = useTheme();
    const styles = getListStyles(colors);

    const formatDate = (ts: number) => {
        if (!ts) return '';
        return new Date(ts).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <FlatList
            data={transactions}
            keyExtractor={item => item.hash}
            renderItem={({ item }) => (
                <View style={styles.txItem}>
                    <View style={styles.txIcon}>
                        <Text style={{ fontSize: 16 }}>{item.type === 'received' ? '📥' : '📤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.txHash} numberOfLines={1}>
                            {item.hash.slice(0, 12)}...{item.hash.slice(-6)}
                        </Text>
                        <Text style={styles.txDate}>{formatDate(item.timestamp)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[
                            styles.txValue,
                            { color: item.type === 'received' ? colors.userPresenceOnline : colors.fontDanger }
                        ]}>
                            {item.type === 'received' ? '+' : '-'}{item.value.toFixed(6)} {currency}
                        </Text>
                        {item.confirmed && <Text style={styles.confirmed}>✓ Confirmed</Text>}
                    </View>
                </View>
            )}
            ListEmptyComponent={
                <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={styles.txDate}>Chưa có giao dịch nào</Text>
                </View>
            }
        />
    );
});

TransactionList.displayName = 'TransactionList';
export default TransactionList;

const getListStyles = (colors: TColors) =>
    StyleSheet.create({
        txItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.strokeExtraLight,
            gap: 10
        },
        txIcon: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceNeutral,
            alignItems: 'center',
            justifyContent: 'center'
        },
        txHash: {
            color: colors.fontDefault,
            fontSize: 13,
            fontFamily: 'Courier'
        },
        txDate: {
            color: colors.fontAnnotation,
            fontSize: 11,
            marginTop: 2
        },
        txValue: {
            fontSize: 14,
            fontWeight: '600'
        },
        confirmed: {
            color: colors.userPresenceOnline,
            fontSize: 10,
            marginTop: 2
        }
    });
