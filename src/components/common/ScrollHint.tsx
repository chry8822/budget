/**
 * 스크롤 힌트 컴포넌트
 * - 마우스 스크롤 모양 아이콘 + 아래 화살표 애니메이션
 * - 스크롤 가능 여부에 따라 표시/숨김
 * - ScrollView, FlatList 모두 지원
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type AnimatedValue = Animated.Value | Animated.AnimatedInterpolation<number>;

type Props = {
    opacity?: AnimatedValue;
    top?: number;
    bottom?: number;
    visible?: boolean;
    scrollRef?: React.RefObject<ScrollView | FlatList | null>;
    scrollAmount?: number;
};

export default function ScrollHint({ opacity, top, bottom, visible = true, scrollRef, scrollAmount }: Props) {
    const theme = useTheme();
    const translateY = useRef(new Animated.Value(0)).current;
    const arrow1Opacity = useRef(new Animated.Value(0.3)).current;
    const arrow2Opacity = useRef(new Animated.Value(0.3)).current;
    const arrow3Opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const bob = Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: 8,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );

        const arrowSequence = Animated.sequence([
            Animated.timing(arrow1Opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(arrow1Opacity, { toValue: 0.3, duration: 250, useNativeDriver: true }),
            Animated.timing(arrow2Opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(arrow2Opacity, { toValue: 0.3, duration: 250, useNativeDriver: true }),
            Animated.timing(arrow3Opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(arrow3Opacity, { toValue: 0.3, duration: 250, useNativeDriver: true }),
        ]);
        const arrows = Animated.loop(arrowSequence);

        bob.start();
        arrows.start();

        return () => {
            bob.stop();
            arrows.stop();
        };
    }, [arrow1Opacity, arrow2Opacity, arrow3Opacity, translateY]);

    const arrowOpacities: AnimatedValue[] = [arrow1Opacity, arrow2Opacity, arrow3Opacity];

    const styles = useMemo(
        () =>
            StyleSheet.create({
                pressable: { alignItems: 'center' },
                container: {
                    position: 'absolute',
                    right: theme.spacing.lg,
                    zIndex: 30,
                    alignItems: 'center',
                    width: 56,
                },
                mouseShell: {
                    width: 26,
                    height: 42,
                    borderRadius: 13,
                    borderWidth: 2,
                    borderColor: theme.colors.border,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'transparent',
                },
                mouseWheel: {
                    width: 2,
                    height: 8,
                    borderRadius: 1,
                    backgroundColor: theme.colors.textMuted,
                },
                arrowWrapper: { marginTop: 2 },
            }),
        [theme],
    );

    const onPress = () => {
        const ref = scrollRef?.current;
        if (!ref) return;

        const offset = scrollAmount ?? 200;
        if (ref instanceof FlatList) {
            ref.scrollToOffset({ offset, animated: true });
        } else {
            (ref as ScrollView).scrollTo({ y: offset, animated: true });
        }
    };

    if (!visible) return null;

    return (

        <Animated.View
            pointerEvents="none"
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    top: top ?? (bottom == null ? '5%' : undefined),
                    bottom,
                },
            ]}
        >
            <Pressable onPress={onPress} style={styles.pressable}>
                <View style={styles.mouseShell}>
                    <View style={styles.mouseWheel} />
                </View>

                {arrowOpacities.map((arrowOpacity, index) => (
                    <Animated.View key={index} style={[styles.arrowWrapper, { opacity: arrowOpacity }]}>
                        <Entypo name="chevron-down" size={14} color={theme.colors.textMuted} />
                    </Animated.View>
                ))}
            </Pressable>
        </Animated.View>
    );
}

