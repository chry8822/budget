import React, { useRef } from 'react';
import { Animated, Pressable, StyleProp, ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
    onPress: () => void;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
};

export default function AnimatedButton({ onPress, style, children }: Props) {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const pressIn = () => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.7, duration: 100, useNativeDriver: true }),
        ]).start();
    };

    const pressOut = () => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
    };

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={pressIn}
            onPressOut={pressOut}
            style={[style, { transform: [{ scale }], opacity }]}
        >
            {children}
        </AnimatedPressable>
    );
}