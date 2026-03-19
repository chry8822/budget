/**
 * 햅틱 + 스케일/opacity 애니메이션이 적용된 공용 Pressable
 * - pressedScale: 눌렸을 때 축소 비율 (기본 0.92)
 * - haptic: 햅틱 세기 ('light' | 'medium' | 'heavy' | 'none')
 * - style: Animated.View에 적용되는 스타일 (배경색, border 등 포함)
 */
import React, { useRef } from 'react';
import {
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'none';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  haptic?: HapticStyle;
  disabled?: boolean;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
};

export default function HapticPressable({
  children,
  onPress,
  style,
  pressedScale = 0.92,
  haptic = 'light',
  disabled,
  hitSlop,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (haptic !== 'none') {
      const feedbackStyle =
        haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(feedbackStyle);
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: pressedScale,
        useNativeDriver: true,
        tension: 400,
        friction: 15,
      }),
      Animated.timing(opacity, {
        toValue: 0.65,
        duration: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 280,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
