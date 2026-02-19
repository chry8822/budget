/**
 * 날짜별 내역 바텀시트
 * - 캘린더에서 날짜 선택 시 화면 절반 이상 올라오는 바텀시트
 * - 위로 슬라이드 업 / 아래로 슬라이드 다운
 * - 상단 핸들 드래그로 내려서 닫기
 */
import React, { useEffect, useRef, useMemo } from 'react';
import {
  Modal,
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { Transaction } from '../../db/database';
import { formatWon } from '../../utils/format';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.max(SCREEN_HEIGHT * 0.55, 400);
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
}: Props) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 150,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.45)',
        },
        sheet: {
          width: '100%',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
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
          marginTop: theme.spacing.xs,
        },
        title: {
          fontSize: theme.typography.sizes.lg,
          fontWeight: 'bold',
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
          marginTop: theme.spacing.md,
        },
        loadingWrap: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 120,
        },
        listWrap: {
          flex: 1,
          maxHeight: SHEET_HEIGHT - 200,
        },
        listContent: {
          paddingHorizontal: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
        },
        emptyText: {
          ...theme.typography.body,
          color: theme.colors.textMuted,
          textAlign: 'center',
          marginTop: theme.spacing.lg,
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
    [theme],
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
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }).start(() => onClose());
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
    [translateY, onClose],
  );

  const closeWithSlideDown = () => {
    translateY.stopAnimation();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 150,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!selectedDate) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={closeWithSlideDown}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeWithSlideDown}
          activeOpacity={1}
        />

        <Animated.View style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}>
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.title}>{selectedDate} 내역</Text>

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
                          style={[
                            styles.txAmount,
                            { color: isExpense ? '#e53935' : '#1e88e5' },
                          ]}
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

          {/* 추가 버튼 영역 - 메인 FAB와 동일한 지출/수입 버튼 */}
          <View style={styles.addRow}>
            <TouchableOpacity
              style={[styles.addButton]}
              onPress={onAddIncome}
              activeOpacity={0.8}
            >
              <Text style={[styles.addButtonText, { color: theme.colors.income ?? '#1e88e5' }]}>수입</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton]}
              onPress={onAddExpense}
              activeOpacity={0.8}
            >
              <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>지출</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

