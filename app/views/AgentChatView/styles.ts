import { StyleSheet } from 'react-native';

import { type TColors } from '../../theme';

/**
 * Color mapping from semantic names to actual RC theme tokens:
 * - Background: surfaceRoom
 * - Secondary bg: surfaceTint
 * - Text primary: fontDefault
 * - Text titles: fontTitlesLabels
 * - Text secondary: fontAnnotation / fontHint
 * - Accent/tint: strokeHighlight / buttonBackgroundPrimaryDefault
 * - Separator: strokeExtraLight
 * - Input bg: surfaceNeutral
 */
export const getStyles = (colors: TColors) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.surfaceRoom
        },
        messageList: {
            flex: 1,
            paddingHorizontal: 16
        },
        messageListContent: {
            paddingVertical: 16,
            gap: 12
        },
        // AI Message Bubble
        aiMessageContainer: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            maxWidth: '85%',
            gap: 8
        },
        aiAvatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.buttonBackgroundPrimaryDefault,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 4
        },
        aiAvatarText: {
            color: colors.fontWhite,
            fontSize: 14,
            fontWeight: '700'
        },
        aiBubble: {
            backgroundColor: colors.surfaceTint,
            borderRadius: 16,
            borderTopLeftRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            flex: 1
        },
        aiText: {
            color: colors.fontDefault,
            fontSize: 15,
            lineHeight: 22
        },
        // User Message Bubble
        userMessageContainer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            maxWidth: '85%',
            alignSelf: 'flex-end'
        },
        userBubble: {
            backgroundColor: colors.buttonBackgroundPrimaryDefault,
            borderRadius: 16,
            borderTopRightRadius: 4,
            paddingHorizontal: 14,
            paddingVertical: 10
        },
        userText: {
            color: colors.fontWhite,
            fontSize: 15,
            lineHeight: 22
        },
        // Timestamp
        timestamp: {
            color: colors.fontAnnotation,
            fontSize: 11,
            marginTop: 4
        },
        // Chat Input
        inputContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.strokeExtraLight,
            backgroundColor: colors.surfaceRoom,
            gap: 8
        },
        textInput: {
            flex: 1,
            minHeight: 40,
            maxHeight: 120,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 10,
            backgroundColor: colors.surfaceNeutral,
            color: colors.fontDefault,
            fontSize: 15
        },
        sendButton: {
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.buttonBackgroundPrimaryDefault,
            alignItems: 'center',
            justifyContent: 'center'
        },
        sendButtonDisabled: {
            opacity: 0.4
        },
        sendButtonText: {
            color: colors.fontWhite,
            fontSize: 18,
            fontWeight: '600'
        },
        // Streaming Indicator
        streamingContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 6
        },
        streamingDot: {
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.buttonBackgroundPrimaryDefault
        },
        streamingText: {
            color: colors.fontAnnotation,
            fontSize: 13,
            fontStyle: 'italic'
        },
        // Thread History
        threadHistoryOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end'
        },
        threadHistoryContainer: {
            backgroundColor: colors.surfaceRoom,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '70%',
            paddingTop: 16
        },
        threadHistoryHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.strokeExtraLight
        },
        threadHistoryTitle: {
            color: colors.fontTitlesLabels,
            fontSize: 18,
            fontWeight: '700'
        },
        threadItem: {
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.strokeExtraLight
        },
        threadItemActive: {
            backgroundColor: colors.surfaceHover
        },
        threadItemTitle: {
            color: colors.fontDefault,
            fontSize: 15,
            fontWeight: '500'
        },
        threadItemDate: {
            color: colors.fontAnnotation,
            fontSize: 12,
            marginTop: 2
        },
        newThreadButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 14,
            gap: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.strokeExtraLight
        },
        newThreadButtonText: {
            color: colors.strokeHighlight,
            fontSize: 15,
            fontWeight: '600'
        },
        // Config View
        configContainer: {
            flex: 1,
            justifyContent: 'center',
            paddingHorizontal: 24
        },
        configTitle: {
            color: colors.fontTitlesLabels,
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 8
        },
        configSubtitle: {
            color: colors.fontAnnotation,
            fontSize: 14,
            textAlign: 'center',
            marginBottom: 32
        },
        configLabel: {
            color: colors.fontDefault,
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
            marginTop: 16
        },
        configInput: {
            borderWidth: 1,
            borderColor: colors.strokeLight,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: colors.fontDefault,
            fontSize: 15,
            backgroundColor: colors.surfaceNeutral
        },
        configButton: {
            backgroundColor: colors.buttonBackgroundPrimaryDefault,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 32
        },
        configButtonText: {
            color: colors.fontWhite,
            fontSize: 16,
            fontWeight: '600'
        },
        // Header
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginRight: 8
        },
        headerButton: {
            padding: 4
        },
        headerButtonText: {
            color: colors.strokeHighlight,
            fontSize: 22
        },
        // Empty State
        emptyContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40
        },
        emptyIcon: {
            fontSize: 48,
            marginBottom: 16
        },
        emptyTitle: {
            color: colors.fontTitlesLabels,
            fontSize: 20,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 8
        },
        emptySubtitle: {
            color: colors.fontAnnotation,
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20
        },
        // Code Block inside AI messages
        codeBlock: {
            backgroundColor: '#1E1E2E',
            borderRadius: 8,
            padding: 12,
            marginVertical: 6
        },
        codeText: {
            color: '#CDD6F4',
            fontSize: 13,
            fontFamily: 'Courier'
        },
        inlineCode: {
            backgroundColor: colors.surfaceNeutral,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            fontFamily: 'Courier',
            fontSize: 13,
            color: colors.strokeHighlight
        },
        bold: {
            fontWeight: '700'
        },
        italic: {
            fontStyle: 'italic'
        }
    });
