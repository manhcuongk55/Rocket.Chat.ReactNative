/**
 * AgentChatView - AI Agent Chat Interface
 * 
 * Integrates LangChain agent-chat-ui functionality into Smile Chat.
 * Connects to any LangGraph server for AI agent conversations
 * with streaming responses, thread management, and markdown rendering.
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
import {
    setLangGraphConfig,
    createThread,
    getThreads,
    getThreadState,
    sendMessage
} from '../../lib/services/langgraph/client';
import { type IAgentMessage, type IAgentThread, type ILangGraphConfig } from '../../lib/services/langgraph/types';
import AgentMessage from './components/AgentMessage';
import UserMessage from './components/UserMessage';
import ChatInput from './components/ChatInput';
import StreamingIndicator from './components/StreamingIndicator';
import ThreadHistory from './components/ThreadHistory';
import { getStyles } from './styles';

const STORAGE_KEY = 'langgraph_config';

const AgentChatView = ({ navigation }: { navigation: any }) => {
    const { colors } = useTheme();
    const styles = getStyles(colors);
    const flatListRef = useRef<FlatList>(null);

    // Config state
    const [configured, setConfigured] = useState(false);
    const [configApiUrl, setConfigApiUrl] = useState('http://localhost:2024');
    const [configAssistantId, setConfigAssistantId] = useState('agent');
    const [configApiKey, setConfigApiKey] = useState('');

    // Chat state
    const [messages, setMessages] = useState<IAgentMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

    // Thread history state
    const [threads, setThreads] = useState<IAgentThread[]>([]);
    const [showThreadHistory, setShowThreadHistory] = useState(false);

    // Set navigation options
    useEffect(() => {
        navigation.setOptions({
            title: '🤖 AI Agent Chat',
            headerRight: () => (
                <View style={styles.headerRight}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => loadThreads()}
                    >
                        <Text style={styles.headerButtonText}>📋</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            setConfigured(false);
                        }}
                    >
                        <Text style={styles.headerButtonText}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            )
        });
    }, [navigation, colors]);

    // Load saved config on mount
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_KEY);
            if (saved) {
                const config: ILangGraphConfig = JSON.parse(saved);
                setConfigApiUrl(config.apiUrl);
                setConfigAssistantId(config.assistantId);
                setConfigApiKey(config.apiKey || '');
                setLangGraphConfig(config);
                setConfigured(true);
                initChat(config);
            }
        } catch {
            // No saved config, show config form
        }
    };

    const saveConfig = async () => {
        const config: ILangGraphConfig = {
            apiUrl: configApiUrl.trim(),
            assistantId: configAssistantId.trim(),
            apiKey: configApiKey.trim() || undefined
        };

        if (!config.apiUrl || !config.assistantId) {
            Alert.alert('Lỗi', 'Vui lòng nhập API URL và Assistant ID');
            return;
        }

        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
            setLangGraphConfig(config);
            setConfigured(true);
            initChat(config);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể lưu cấu hình');
        }
    };

    const initChat = async (_config?: ILangGraphConfig) => {
        try {
            // Create initial thread
            const thread = await createThread();
            setCurrentThreadId(thread.threadId);
            setMessages([]);
        } catch (error) {
            console.warn('Agent Chat: Failed to create initial thread', error);
            // Still allow usage, will create thread on first message
        }
    };

    const loadThreads = async () => {
        try {
            const threadList = await getThreads();
            setThreads(threadList);
            setShowThreadHistory(true);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tải lịch sử hội thoại');
        }
    };

    const handleSelectThread = async (threadId: string) => {
        setShowThreadHistory(false);
        setCurrentThreadId(threadId);
        setMessages([]);

        try {
            const threadMessages = await getThreadState(threadId);
            setMessages(threadMessages);
        } catch (error) {
            console.warn('Failed to load thread messages:', error);
        }
    };

    const handleNewThread = async () => {
        setShowThreadHistory(false);
        try {
            const thread = await createThread();
            setCurrentThreadId(thread.threadId);
            setMessages([]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể tạo hội thoại mới');
        }
    };

    const handleSendMessage = useCallback(
        async (text: string) => {
            if (isStreaming) return;

            // Add user message immediately
            const userMessage: IAgentMessage = {
                id: `user-${Date.now()}`,
                role: 'human',
                content: text,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, userMessage]);

            // Create thread if needed
            let threadId = currentThreadId;
            if (!threadId) {
                try {
                    const thread = await createThread();
                    threadId = thread.threadId;
                    setCurrentThreadId(threadId);
                } catch (error) {
                    Alert.alert('Lỗi', 'Không thể kết nối tới AI server');
                    return;
                }
            }

            // Add placeholder AI message for streaming
            const aiMessageId = `ai-${Date.now()}`;
            const aiMessage: IAgentMessage = {
                id: aiMessageId,
                role: 'ai',
                content: '',
                timestamp: Date.now(),
                isStreaming: true
            };
            setMessages(prev => [...prev, aiMessage]);
            setIsStreaming(true);

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);

            try {
                await sendMessage(threadId, text, {
                    onToken: (token: string) => {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessageId
                                    ? { ...m, content: m.content + token }
                                    : m
                            )
                        );
                        // Auto scroll
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }, 50);
                    },
                    onMessageComplete: (complete: IAgentMessage) => {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessageId
                                    ? { ...complete, isStreaming: false }
                                    : m
                            )
                        );
                    },
                    onError: (error: Error) => {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessageId
                                    ? { ...m, content: `❌ Lỗi: ${error.message}`, isStreaming: false }
                                    : m
                            )
                        );
                        setIsStreaming(false);
                    },
                    onStart: () => {
                        // Already handled
                    },
                    onEnd: () => {
                        setIsStreaming(false);
                        // Mark message as done streaming
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === aiMessageId ? { ...m, isStreaming: false } : m
                            )
                        );
                    }
                });
            } catch (error) {
                setIsStreaming(false);
            }
        },
        [currentThreadId, isStreaming]
    );

    const renderMessage = useCallback(
        ({ item }: { item: IAgentMessage }) => {
            if (item.role === 'human') {
                return <UserMessage message={item} />;
            }
            if (item.role === 'ai') {
                return <AgentMessage message={item} />;
            }
            // Tool messages are hidden for now
            return null;
        },
        []
    );

    // --- Config Form ---
    if (!configured) {
        return (
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.configContainer}>
                    <Text style={styles.configTitle}>🤖 Agent Chat</Text>
                    <Text style={styles.configSubtitle}>
                        Kết nối với LangGraph server để chat với AI Agent
                    </Text>

                    <Text style={styles.configLabel}>Deployment URL *</Text>
                    <TextInput
                        style={styles.configInput}
                        value={configApiUrl}
                        onChangeText={setConfigApiUrl}
                        placeholder='http://localhost:2024'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                        autoCorrect={false}
                    />

                    <Text style={styles.configLabel}>Assistant / Graph ID *</Text>
                    <TextInput
                        style={styles.configInput}
                        value={configAssistantId}
                        onChangeText={setConfigAssistantId}
                        placeholder='agent'
                        placeholderTextColor={colors.fontAnnotation}
                        autoCapitalize='none'
                        autoCorrect={false}
                    />

                    <Text style={styles.configLabel}>LangSmith API Key (optional)</Text>
                    <TextInput
                        style={styles.configInput}
                        value={configApiKey}
                        onChangeText={setConfigApiKey}
                        placeholder='lsv2_...'
                        placeholderTextColor={colors.fontAnnotation}
                        secureTextEntry
                        autoCapitalize='none'
                        autoCorrect={false}
                    />

                    <TouchableOpacity style={styles.configButton} onPress={saveConfig} activeOpacity={0.8}>
                        <Text style={styles.configButtonText}>Bắt đầu Chat</Text>
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
                    <Text style={styles.emptyIcon}>🤖</Text>
                    <Text style={styles.emptyTitle}>Xin chào!</Text>
                    <Text style={styles.emptySubtitle}>
                        Bắt đầu hội thoại với AI Agent. Gửi một tin nhắn để bắt đầu.
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
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: false });
                    }}
                />
            )}

            {isStreaming && <StreamingIndicator />}

            <ChatInput onSend={handleSendMessage} disabled={isStreaming} />

            <ThreadHistory
                visible={showThreadHistory}
                threads={threads}
                activeThreadId={currentThreadId || undefined}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                onClose={() => setShowThreadHistory(false)}
            />
        </KeyboardAvoidingView>
    );
};

export default AgentChatView;
