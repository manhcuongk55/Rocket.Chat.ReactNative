import React, { memo } from 'react';
import { View, Text } from 'react-native';

import { type TColors } from '../../../theme';
import { getStyles } from '../styles';

interface ISimpleMarkdownProps {
    content: string;
    colors: TColors;
}

/**
 * Simple markdown renderer for AI agent messages.
 * Handles: bold, italic, inline code, code blocks, headers, lists, links.
 * This is a lightweight alternative to @rocket.chat/message-parser 
 * since AI responses use standard markdown, not RC format.
 */
export const SimpleMarkdown = memo(({ content, colors }: ISimpleMarkdownProps) => {
    const styles = getStyles(colors);

    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let keyIndex = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code block
        if (line.startsWith('```')) {
            const codeLines: string[] = [];
            i++; // skip opening ```
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            elements.push(
                <View key={`code-${keyIndex++}`} style={styles.codeBlock}>
                    <Text style={styles.codeText}>{codeLines.join('\n')}</Text>
                </View>
            );
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const fontSize = level === 1 ? 20 : level === 2 ? 18 : 16;
            elements.push(
                <Text
                    key={`h-${keyIndex++}`}
                    style={[styles.aiText, { fontSize, fontWeight: '700', marginVertical: 4 }]}
                >
                    {renderInline(headingMatch[2], styles)}
                </Text>
            );
            i++;
            continue;
        }

        // Unordered list item
        if (line.match(/^\s*[-*]\s+/)) {
            const listContent = line.replace(/^\s*[-*]\s+/, '');
            elements.push(
                <View key={`ul-${keyIndex++}`} style={{ flexDirection: 'row', paddingLeft: 8, marginVertical: 2 }}>
                    <Text style={styles.aiText}>•  </Text>
                    <Text style={[styles.aiText, { flex: 1 }]}>{renderInline(listContent, styles)}</Text>
                </View>
            );
            i++;
            continue;
        }

        // Ordered list item
        const olMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
        if (olMatch) {
            elements.push(
                <View key={`ol-${keyIndex++}`} style={{ flexDirection: 'row', paddingLeft: 8, marginVertical: 2 }}>
                    <Text style={styles.aiText}>{olMatch[1]}.  </Text>
                    <Text style={[styles.aiText, { flex: 1 }]}>{renderInline(olMatch[2], styles)}</Text>
                </View>
            );
            i++;
            continue;
        }

        // Empty line
        if (line.trim() === '') {
            elements.push(<View key={`gap-${keyIndex++}`} style={{ height: 8 }} />);
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(
            <Text key={`p-${keyIndex++}`} style={styles.aiText}>
                {renderInline(line, styles)}
            </Text>
        );
        i++;
    }

    return <View style={{ gap: 2 }}>{elements}</View>;
});

SimpleMarkdown.displayName = 'SimpleMarkdown';

/**
 * Render inline markdown: **bold**, *italic*, `code`, [links](url)
 */
function renderInline(
    text: string,
    styles: ReturnType<typeof getStyles>
): React.ReactNode {
    if (!text) return null;

    // Split by inline patterns
    const parts: React.ReactNode[] = [];
    // Regex to match: **bold**, *italic*, `code`, [text](url)
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Add text before match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[2]) {
            // Bold **text**
            parts.push(
                <Text key={`b-${key++}`} style={styles.bold}>
                    {match[2]}
                </Text>
            );
        } else if (match[3]) {
            // Italic *text*
            parts.push(
                <Text key={`i-${key++}`} style={styles.italic}>
                    {match[3]}
                </Text>
            );
        } else if (match[4]) {
            // Inline code `text`
            parts.push(
                <Text key={`c-${key++}`} style={styles.inlineCode}>
                    {match[4]}
                </Text>
            );
        } else if (match[5] && match[6]) {
            // Link [text](url)
            parts.push(
                <Text key={`l-${key++}`} style={{ color: styles.sendButton.backgroundColor as string, textDecorationLine: 'underline' }}>
                    {match[5]}
                </Text>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length === 1 ? parts[0] : parts;
}
