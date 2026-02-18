/**
 * 온보딩 모달 컴포넌트
 * - 최초 진입 시 앱 사용법을 안내하는 스와이프 슬라이드
 * - 각 슬라이드마다 해당 기능 페이지로 바로 이동하는 버튼
 * - AsyncStorage로 "다시 안보기" 상태 저장
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ONBOARDING_KEY = 'onboarding_shown';

type Slide = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonLabel: string;
  buttonIcon: keyof typeof Ionicons.glyphMap;
};

const slides: Slide[] = [
  {
    icon: 'wallet-outline',
    title: '간편한 지출 / 수입 기록',
    description: '우측 하단 + 버튼 하나로\n지출과 수입을 빠르게 기록하세요.',
    buttonLabel: '바로 등록하기',
    buttonIcon: 'add-circle-outline',
  },
  {
    icon: 'calendar-outline',
    title: '캘린더로 한눈에',
    description: '날짜별 지출 · 수입을\n캘린더에서 한눈에 확인할 수 있어요.',
    buttonLabel: '캘린더 확인하기',
    buttonIcon: 'calendar-outline',
  },
  {
    icon: 'bar-chart-outline',
    title: '똑똑한 통계 분석',
    description: '카테고리별, 월별 지출 분석으로\n소비 습관을 파악해보세요.',
    buttonLabel: '통계 보러가기',
    buttonIcon: 'stats-chart-outline',
  },
  {
    icon: 'cash-outline',
    title: '예산 설정으로 절약',
    description: '월 예산을 설정하고\n지출을 관리해보세요.',
    buttonLabel: '예산 설정하기',
    buttonIcon: 'settings-outline',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 각 슬라이드 액션 버튼 클릭 시 호출 (slideIndex) */
  onSlideAction?: (index: number) => void;
};

export default function OnboardingModal({ visible, onClose, onSlideAction }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const swipeHintAnim = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === slides.length - 1;

  // 스와이프 힌트 좌우 흔들기 애니메이션
  useEffect(() => {
    if (!visible) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(swipeHintAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(swipeHintAnim, {
          toValue: -1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(swipeHintAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    const timeout = setTimeout(() => animation.start(), 500);

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [visible]);

  const swipeTranslateX = swipeHintAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 6],
  });

  const handleClose = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  const handleDontShowAgain = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  const handleSlideAction = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
    onSlideAction?.(currentIndex);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.iconCircle}>
        <Ionicons name={item.icon} size={56} color={theme.colors.primary} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDescription}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });

        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const currentSlide = slides[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 우상단 닫기 */}
          <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={theme.colors.textMuted} />
          </Pressable>

          {/* 슬라이드 */}
          <FlatList
            ref={flatListRef}
            data={slides}
            renderItem={renderSlide}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />

          {/* 스와이프 힌트 */}
          {!isLastSlide && (
            <Animated.View
              style={[styles.swipeHint, { transform: [{ translateX: swipeTranslateX }] }]}
            >
              <Ionicons name="chevron-back" size={14} color={theme.colors.textMuted} />
              <Text style={styles.swipeHintText}>밀어서 더 보기</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
            </Animated.View>
          )}

          {/* 인디케이터 점 */}
          {renderDots()}

          {/* 하단 버튼 영역 */}
          <View style={styles.buttonArea}>
            {/* 슬라이드별 액션 버튼 */}
            <Pressable style={styles.actionButton} onPress={handleSlideAction}>
              <Ionicons
                name={currentSlide.buttonIcon}
                size={18}
                color="#fff"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.actionButtonText}>{currentSlide.buttonLabel}</Text>
            </Pressable>

            {/* 다시 안보기 */}
            <Pressable style={styles.skipButton} onPress={handleDontShowAgain}>
              <Text style={styles.skipText}>다시 안보기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    width: SCREEN_WIDTH - 48,
    paddingTop: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  slide: {
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 32,
    paddingBottom: 12,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  slideTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  swipeHintText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textMuted,
    marginHorizontal: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonArea: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textMuted,
  },
});
