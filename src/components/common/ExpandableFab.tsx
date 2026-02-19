/**
 * 확장형 플로팅 액션 버튼 (FAB)
 * - + 버튼 클릭 시 위로 미니 버튼들이 펼쳐짐
 * - 아이콘 + 라벨 원형 버튼 스타일
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import AnimatedButton from './AnimatedButton';

export type FabAction = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

type Props = {
  actions: FabAction[];
  fabOpacity?: Animated.Value;
  fabTranslateX?: Animated.Value;
};

export default function ExpandableFab({ actions, fabOpacity, fabTranslateX }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 9,
        },
        container: {
          position: 'absolute',
          right: theme.spacing.lg,
          bottom: 0,
          width: 140,
          height: 320,
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          zIndex: 10,
        },
        fabRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        shakeWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        togglePressable: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        fab: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 4,
          shadowColor: theme.colors.textMuted,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        },
        fabInner: {},
        miniRow: {
          position: 'absolute',
          flexDirection: 'row',
          alignItems: 'center',
          right: 0,
          zIndex: 11,
        },
        miniLabel: {
          marginRight: 12,
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.text,
          fontWeight: '600',
          backgroundColor: theme.colors.background,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 6,
          overflow: 'hidden',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
        },
        miniButton: {
          width: 46,
          height: 46,
          borderRadius: 23,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        },
        miniButtonText: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.background,
          fontWeight: '600',
        },
      }),
    [theme],
  );

  // 탭 포커스될 때마다 5초간 좌우 흔들림 애니메이션 / 탭 이동 시 FAB 펼침 상태 초기화
  useFocusEffect(
    useCallback(() => {
      shakeAnim.setValue(0);
      const shake = Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 120, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
          Animated.delay(1500),
        ]),
      );
      shake.start();

      const timer = setTimeout(() => {
        shake.stop();
        shakeAnim.setValue(0);
      }, 5000);

      return () => {
        clearTimeout(timer);
        shake.stop();
        shakeAnim.setValue(0);
        // 네비 탭으로 다른 화면 이동 시 FAB 펼침 상태 닫기
        if (openRef.current) {
          anim.setValue(0);
          rotateAnim.setValue(0);
          setOpen(false);
        }
      };
    }, [shakeAnim, anim, rotateAnim]),
  );

  const toggle = () => {
    // 열릴 때 흔들림 중단
    shakeAnim.stopAnimation();
    shakeAnim.setValue(0);

    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(anim, { toValue, useNativeDriver: true, friction: 6 }),
      Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const close = () => {
    if (!open) return;
    Animated.parallel([
      Animated.spring(anim, { toValue: 0, useNativeDriver: true, friction: 6 }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(false);
  };

  const containerStyle = [
    styles.container,
    { bottom: theme.spacing.lg + insets.bottom },
    fabOpacity != null || fabTranslateX != null
      ? {
          opacity: fabOpacity ?? 1,
          transform: fabTranslateX ? [{ translateX: fabTranslateX }] : [],
        }
      : undefined,
  ];

  return (
    <>
      {open && <Pressable style={styles.overlay} onPress={close} />}

      <Animated.View style={containerStyle} pointerEvents="box-none">
        {/* 미니 액션 버튼들 */}
        {actions.map((action, index) => {
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -(64 + index * 60)],
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.miniRow,
                {
                  opacity: anim,
                  transform: [{ translateY }, { scale: anim }],
                },
              ]}
            >
              <Pressable
                style={[styles.miniButton, { backgroundColor: action.color }]}
                onPress={() => {
                  action.onPress();
                  close();
                }}
              >
                <Text style={styles.miniButtonText}>{action.label}</Text>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* 메인 FAB + "추가" 라벨 */}
        <View style={styles.fabRow}>
          <Animated.View
            style={[
              styles.shakeWrapper,
              {
                transform: [
                  {
                    translateX: shakeAnim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-4, 0, 4],
                    }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={toggle} style={styles.togglePressable}>
              <Animated.Text
                style={[
                  styles.miniLabel,
                  {
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.surface,
                    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                    transform: [
                      {
                        translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }),
                      },
                    ],
                  },
                ]}
              >
                추가
              </Animated.Text>
              <Animated.View style={styles.fab}>
                <Animated.View
                  style={[
                    styles.fabInner,
                    {
                      transform: [
                        {
                          rotate: rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '45deg'],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="add" size={28} color={theme.colors.text} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </>
  );
}

