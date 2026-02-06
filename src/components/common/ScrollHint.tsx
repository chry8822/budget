import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Entypo } from '@expo/vector-icons';
import theme from '../../theme';

type AnimatedValue = Animated.Value | Animated.AnimatedInterpolation<number>;

type Props = {
    opacity?: AnimatedValue;
    top?: number;
    bottom?: number;
    visible?: boolean;
};

export default function ScrollHint({ opacity, top, bottom, visible = true }: Props) {
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
            <View style={styles.mouseShell}>
                <View style={styles.mouseWheel} />
            </View>

            {arrowOpacities.map((arrowOpacity, index) => (
                <Animated.View key={index} style={[styles.arrowWrapper, { opacity: arrowOpacity }]}>
                    <Entypo name="chevron-down" size={14} color="rgba(0,0,0,0.5)" />
                </Animated.View>
            ))}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: theme.spacing.lg,
        zIndex: 30,
        alignItems: 'center',
    },
    mouseShell: {
        width: 26,
        height: 42,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    mouseWheel: {
        width: 2,
        height: 8,
        borderRadius: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    arrowWrapper: {
        marginTop: 2,
    },
});
