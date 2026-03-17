/**
 * 날짜별 내역 바텀시트 (같은 창 오버레이)
 * - Modal 대신 View 오버레이로 렌더 → useSafeAreaInsets()가 프로덕션에서도 정상 동작
 * - 위로 슬라이드 업 / 아래로 슬라이드 다운, 상단 핸들 드래그로 닫기
 */
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Pressable,
  PanResponder,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction } from '../../db/database';
import { formatWon } from '../../utils/format';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.max(SCREEN_HEIGHT * 0.55, 400);
const SHEET_OVERHEAD = 180;
const LIST_AREA_HEIGHT = SHEET_HEIGHT - SHEET_OVERHEAD;
const DRAG_CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  selectedDate: string | null;
  transactions: Transaction[];
  loading: boolean;
  onClose: () => void;
  onAddExpense: () => void;
  onAddIncome: () => void;
  onTransactionPress?: (id: number) => void;
  onAnimationComplete?: () => void;
};

export default function DayDetailBottomSheet({
  visible,
  selectedDate,
  transactions,
  loading,
  onClose,
  onAddExpense,
  onAddIncome,
  onTransactionPress,
  onAnimationComplete,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const handleShow = useCallback(() => {
    translateY.setValue(SCREEN_HEIGHT);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.bezier(0.33, 1, 0.68, 1),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onAnimationComplete?.();
    });
  }, [translateY, backdropOpacity, onAnimationComplete]);

  const closeWithSlideDown = useCallback(() => {
    translateY.stopAnimation();
    backdropOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }, [translateY, backdropOpacity, onClose]);

  useEffect(() => {
    if (!visible) return;
    handleShow();
  }, [visible, handleShow]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeWithSlideDown();
      return true;
    });
    return () => sub.remove();
  }, [visible, closeWithSlideDown]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          zIndex: 1000,
          justifyContent: 'flex-end',
        },
        backdropDim: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        backdropTouchArea: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: SHEET_HEIGHT,
        },
        sheet: {
          width: '100%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
          paddingBottom: insets.bottom,
        },
        handleArea: {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border,
          marginTop: theme.spacing.md,
        },
        title: {
          fontSize: theme.typography.sizes.lg,
          fontWeight: 'bold',
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
          marginTop: theme.spacing.md,
        },
        contentArea: {
          height: LIST_AREA_HEIGHT,
          minHeight: LIST_AREA_HEIGHT,
        },
        loadingWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        listWrap: {
          flex: 1,
          minHeight: LIST_AREA_HEIGHT,
        },
        listContent: {
          flexGrow: 1,
          minHeight: LIST_AREA_HEIGHT,
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
        },
        emptyText: {
          ...theme.typography.body,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginTop: theme.spacing.md,
        },
        txRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: theme.spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
        },
        txLeft: {
          flex: 1,
          paddingRight: theme.spacing.sm,
        },
        txRight: { alignItems: 'flex-end' },
        txCategory: {
          ...theme.typography.body,
          fontWeight: '600',
          color: theme.colors.text,
        },
        txMemo: {
          ...theme.typography.body,
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
          marginTop: 2,
        },
        txAmount: {
          ...theme.typography.body,
          fontWeight: 'bold',
        },
        txTime: {
          fontSize: theme.typography.sizes.xs,
          color: theme.colors.textMuted,
          marginTop: 2,
        },
        addRow: {
          flexDirection: 'row',
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          paddingBottom: theme.spacing.lg + 16,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        },
        addButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: theme.spacing.md,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        addButtonText: {
          fontSize: theme.typography.sizes.md,
          fontWeight: 'bold',
        },
      }),
    [theme, insets.bottom],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, { dy }) => Math.abs(dy) > 5,
        onPanResponderMove: (_, { dy }) => {
          if (dy > 0) {
            translateY.setValue(dy);
          }
        },
        onPanResponderRelease: (_, { dy, vy }) => {
          if (dy > DRAG_CLOSE_THRESHOLD || vy > 0.3) {
            closeWithSlideDown();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 11,
            }).start();
          }
        },
      }),
    [translateY, closeWithSlideDown],
  );

  if (!visible || !selectedDate) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={[styles.backdropDim, { opacity: backdropOpacity }]} pointerEvents="none" />
      <TouchableOpacity
        style={styles.backdropTouchArea}
        onPress={closeWithSlideDown}
        activeOpacity={1}
      />
      <Animated.View
        style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
        </View>
        <Text style={styles.title}>{selectedDate} 내역</Text>

        <View style={styles.contentArea}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.listWrap}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>이 날에는 내역이 없어요.</Text>
              ) : (
                transactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <Pressable
                      key={tx.id ?? tx.date + tx.mainCategory + tx.amount}
                      style={styles.txRow}
                      onPress={() => tx.id && onTransactionPress?.(tx.id)}
                    >
                      <View style={styles.txLeft}>
                        <Text style={styles.txCategory}>{tx.mainCategory}</Text>
                        {tx.memo ? (
                          <Text style={styles.txMemo} numberOfLines={1}>
                            {tx.memo}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.txRight}>
                        <Text
                          style={[styles.txAmount, { color: isExpense ? '#e53935' : '#1e88e5' }]}
                        >
                          {isExpense ? '-' : '+'}
                          {formatWon(Math.abs(tx.amount))}
                        </Text>
                        {tx.createdAt ? (
                          <Text style={styles.txTime}>{tx.createdAt.slice(11, 16)}</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>

        <View style={styles.addRow}>
          <TouchableOpacity style={[styles.addButton]} onPress={onAddIncome} activeOpacity={0.8}>
            <Text style={[styles.addButtonText, { color: theme.colors.income ?? '#1e88e5' }]}>
              수입
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton]} onPress={onAddExpense} activeOpacity={0.8}>
            <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>지출</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
