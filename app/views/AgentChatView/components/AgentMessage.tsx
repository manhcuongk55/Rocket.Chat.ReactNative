import React, { memo } from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../theme';
import { type IAgentMessage } from '../../../lib/services/langgraph/types';
import { getStyles } from '../styles';
import { SimpleMarkdown } from './SimpleMarkdown';

interface IAgentMessageProps {
    message: IAgentMessage;
}

const AgentMessage = memo(({ message }: IAgentMessageProps) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <View style={styles.aiMessageContainer}>
            <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarText}>AI</Text>
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.aiBubble}>
                    <SimpleMarkdown content={message.content} colors={colors} />
                    {message.isStreaming && (
                        <Text style={[styles.aiText, { opacity: 0.5 }]}>▌</Text>
                    )}
                </View>
                <Text style={styles.timestamp}>{timeStr}</Text>
            </View>
        </View>
    );
});

AgentMessage.displayName = 'AgentMessage';
export default AgentMessage;
