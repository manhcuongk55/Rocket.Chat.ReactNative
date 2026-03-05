import React, { memo } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Modal
} from 'react-native';

import { useTheme } from '../../../theme';
import { type IAgentThread } from '../../../lib/services/langgraph/types';
import { getStyles } from '../styles';

interface IThreadHistoryProps {
    visible: boolean;
    threads: IAgentThread[];
    activeThreadId?: string;
    onSelectThread: (threadId: string) => void;
    onNewThread: () => void;
    onClose: () => void;
}

const ThreadHistory = memo(
    ({ visible, threads, activeThreadId, onSelectThread, onNewThread, onClose }: IThreadHistoryProps) => {
        const { colors } = useTheme();
        const styles = getStyles(colors);

        const formatDate = (dateStr: string) => {
            try {
                const date = new Date(dateStr);
                return date.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch {
                return dateStr;
            }
        };

        return (
            <Modal visible={visible} transparent animationType='slide' onRequestClose={onClose}>
                <TouchableOpacity style={styles.threadHistoryOverlay} activeOpacity={1} onPress={onClose}>
                    <View style={styles.threadHistoryContainer}>
                        <View style={styles.threadHistoryHeader}>
                            <Text style={styles.threadHistoryTitle}>Lịch sử hội thoại</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Text style={{ fontSize: 24, color: colors.fontAnnotation }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.newThreadButton} onPress={onNewThread}>
                            <Text style={{ fontSize: 18 }}>＋</Text>
                            <Text style={styles.newThreadButtonText}>Hội thoại mới</Text>
                        </TouchableOpacity>

                        <FlatList
                            data={threads}
                            keyExtractor={item => item.threadId}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.threadItem, item.threadId === activeThreadId && styles.threadItemActive]}
                                    onPress={() => onSelectThread(item.threadId)}
                                >
                                    <Text style={styles.threadItemTitle} numberOfLines={1}>
                                        Thread #{item.threadId.slice(0, 8)}
                                    </Text>
                                    <Text style={styles.threadItemDate}>{formatDate(item.createdAt)}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View style={{ padding: 24, alignItems: 'center' }}>
                                    <Text style={styles.threadItemDate}>Chưa có hội thoại nào</Text>
                                </View>
                            }
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    }
);

ThreadHistory.displayName = 'ThreadHistory';
export default ThreadHistory;
