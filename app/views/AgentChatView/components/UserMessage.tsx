import React, { memo } from 'react';
import { View, Text } from 'react-native';

import { useTheme } from '../../../theme';
import { type IAgentMessage } from '../../../lib/services/langgraph/types';
import { getStyles } from '../styles';

interface IUserMessageProps {
    message: IAgentMessage;
}

const UserMessage = memo(({ message }: IUserMessageProps) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <View style={styles.userMessageContainer}>
            <View>
                <View style={styles.userBubble}>
                    <Text style={styles.userText}>{message.content}</Text>
                </View>
                <Text style={[styles.timestamp, { textAlign: 'right' }]}>{timeStr}</Text>
            </View>
        </View>
    );
});

UserMessage.displayName = 'UserMessage';
export default UserMessage;
