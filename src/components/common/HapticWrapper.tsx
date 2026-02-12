/**
 * 햅틱 피드백 래퍼 컴포넌트
 * - 자식 컴포넌트를 감싸서 터치 시 햅틱(진동) 피드백 제공
 * - 기존 스타일에 영향 없이 재사용 가능
 *
 * @example
 * <HapticWrapper onPress={handleSave} feedbackType="medium">
 *   <View style={styles.button}>
 *     <Text>저장</Text>
 *   </View>
 * </HapticWrapper>
 */

import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type FeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** 햅틱 피드백 종류 (기본값: 'light') */
  feedbackType?: FeedbackType;
  disabled?: boolean;
};

const triggerHaptic = (type: FeedbackType) => {
  switch (type) {
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
    case 'heavy':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'medium':
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'light':
    default:
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
  }
};

export default function HapticWrapper({
  children,
  onPress,
  style,
  feedbackType = 'light',
  disabled = false,
}: Props) {
  const handlePress = () => {
    if (disabled) return;
    triggerHaptic(feedbackType);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} style={style} disabled={disabled}>
      {children}
    </Pressable>
  );
}
