import React, { memo, useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';

import { useTheme } from '../../../theme';
import { getStyles } from '../styles';

const StreamingIndicator = memo(() => {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animate = (dot: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true
                    }),
                    Animated.timing(dot, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true
                    })
                ])
            );

        const a1 = animate(dot1, 0);
        const a2 = animate(dot2, 200);
        const a3 = animate(dot3, 400);

        a1.start();
        a2.start();
        a3.start();

        return () => {
            a1.stop();
            a2.stop();
            a3.stop();
        };
    }, [dot1, dot2, dot3]);

    return (
        <View style={styles.streamingContainer}>
            <Animated.View style={[styles.streamingDot, { opacity: dot1 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: dot2 }]} />
            <Animated.View style={[styles.streamingDot, { opacity: dot3 }]} />
            <Text style={styles.streamingText}>AI đang suy nghĩ...</Text>
        </View>
    );
});

StreamingIndicator.displayName = 'StreamingIndicator';
export default StreamingIndicator;
