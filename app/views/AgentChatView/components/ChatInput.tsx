import React, { memo, useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

import { useTheme } from '../../../theme';
import { getStyles } from '../styles';

interface IChatInputProps {
    onSend: (text: string) => void;
    disabled?: boolean;
}

const ChatInput = memo(({ onSend, disabled }: IChatInputProps) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const [text, setText] = useState('');
    const inputRef = useRef<TextInput>(null);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || disabled) return;

        onSend(trimmed);
        setText('');
        inputRef.current?.focus();
    };

    const canSend = text.trim().length > 0 && !disabled;

    return (
        <View style={styles.inputContainer}>
            <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={text}
                onChangeText={setText}
                placeholder={disabled ? 'AI đang trả lời...' : 'Nhập tin nhắn...'}
                placeholderTextColor={colors.fontAnnotation}
                multiline
                maxLength={4000}
                editable={!disabled}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                returnKeyType='send'
            />
            <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend}
                activeOpacity={0.7}
            >
                <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
        </View>
    );
});

ChatInput.displayName = 'ChatInput';
export default ChatInput;
