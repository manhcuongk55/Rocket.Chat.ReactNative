/**
 * RealEstateChatView - AI Real Estate Assistant Chat Interface
 * 
 * Integrates AleksNeStu/ai-real-estate-assistant into Smile Chat.
 * Chat with AI to search properties, get valuations, and mortgage calculations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../theme';
import { setRealEstateConfig, sendChatMessage, checkHealth } from '../../lib/services/realEstate/client';
import { type IChatMessage, type IRealEstateConfig } from '../../lib/services/realEstate/types';
import { SimpleMarkdown } from '../AgentChatView/components/SimpleMarkdown';
import PropertyCard from './components/PropertyCard';
import { getStyles } from '../AgentChatView/styles';

const STORAGE_KEY = 'realestate_config';

const RealEstateChatView = ({ navigation }: { navigation: any }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const flatListRef = useRef<FlatList>(null);

    const [configured, setConfigured] = useState(false);
    const [configApiUrl, setConfigApiUrl] = useState('http://localhost:8000');
    const [configProvider, setConfigProvider] = useState('openai');

    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>();
    const [inputText, setInputText] = useState('');

    useEffect(() => {
        navigation.setOptions({
            title: '🏠 AI Real Estate',
            headerRight: () => (
                <TouchableOpacity style={styles.headerButton} onPress={() => setConfigured(false)}>
                    <Text style={styles.headerButtonText}>⚙️</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, colors]);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const config: IRealEstateConfig = JSON.parse(saved);
                setConfigApiUrl(config.apiUrl);
                setConfigProvider(config.provider || 'openai');
                setRealEstateConfig(config);
                setConfigured(true);
            }
        } catch { /* show config form */ }
    };

    const saveConfig = async () => {
        const config: IRealEstateConfig = {
            apiUrl: configApiUrl.trim(),
            provider: configProvider
        };
        if (!config.apiUrl) {
            Alert.alert('Lỗi', 'Vui lòng nhập Backend URL');
            return;
        }
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            setRealEstateConfig(config);
            setConfigured(true);
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu cấu hình');
        }
    };

    const handleSend = useCallback(async () => {
        const text = inputText.trim();
        if (!text || isStreaming) return;

        const userMsg: IChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsStreaming(true);

        const aiMsgId = `ai-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true
        }]);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const result = await sendChatMessage(text, sessionId, (chunk) => {
                setMessages(prev => prev.map(m =>
                    m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
                ));
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
            });

            setSessionId(result.session_id);
            setMessages(prev => prev.map(m =>
                m.id === aiMsgId
                    ? { ...m, content: result.response || m.content, properties: result.properties, isStreaming: false }
                    : m
            ));
        } catch (error: any) {
            setMessages(prev => prev.map(m =>
                m.id === aiMsgId
                    ? { ...m, content: `❌ Lỗi: ${error.message}`, isStreaming: false }
                    : m
            ));
        } finally {
            setIsStreaming(false);
        }
    }, [inputText, isStreaming, sessionId]);

    const renderMessage = useCallback(({ item }: { item: IChatMessage }) => {
        if (item.role === 'user') {
            return (
                <View style={styles.userMessageContainer}>
                    <View style={styles.userBubble}>
                        <Text style={styles.userText}>{item.content}</Text>
                    </View>
                </View>
            );
        }
        return (
            <View style={styles.aiMessageContainer}>
                <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarText}>🏠</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.aiBubble}>
                        <SimpleMarkdown content={item.content} colors={colors} />
                        {item.isStreaming && <Text style={[styles.aiText, { opacity: 0.5 }]}>▌</Text>}
                    </View>
                    {item.properties?.map(p => (
                        <PropertyCard key={p.id} property={p} />
                    ))}
                </View>
            </View>
        );
    }, [colors]);

    const canSend = inputText.trim().length > 0 && !isStreaming;

    // --- Config Form ---
    if (!configured) {
        return (
            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.configContainer}>
                    <Text style={styles.configTitle}>🏠 AI Real Estate</Text>
                    <Text style={styles.configSubtitle}>Kết nối với AI Real Estate Assistant</Text>

                    <Text style={styles.configLabel}>Backend URL *</Text>
                    <TextInput
                        style={styles.configInput}
                        value={configApiUrl}
                        onChangeText={setConfigApiUrl}
                        placeholder='http://localhost:8000'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                    />

                    <Text style={styles.configLabel}>AI Provider</Text>
                    <TextInput
                        style={styles.configInput}
                        value={configProvider}
                        onChangeText={setConfigProvider}
                        placeholder='openai / anthropic / google / ollama'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                    />

                    <TouchableOpacity style={styles.configButton} onPress={saveConfig} activeOpacity={0.8}>
                        <Text style={styles.configButtonText}>Bắt đầu tìm kiếm</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    }

    // --- Chat Interface ---
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={88}
        >
            {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🏠</Text>
                    <Text style={styles.emptyTitle}>AI Real Estate</Text>
                    <Text style={styles.emptySubtitle}>
                        Tìm kiếm bất động sản bằng ngôn ngữ tự nhiên. Ví dụ: "Tìm căn hộ 2 phòng ngủ dưới 3 tỷ ở Quận 7"
                    </Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={isStreaming ? 'AI đang trả lời...' : 'Tìm kiếm bất động sản...'}
                    placeholderTextColor={colors.fontAnnotation}
                    multiline
                    editable={!isStreaming}
                    onSubmitEditing={handleSend}
                />
                <TouchableOpacity
                    style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!canSend}
                >
                    <Text style={styles.sendButtonText}>↑</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default RealEstateChatView;
