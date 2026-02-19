/**
 * 월 선택 바텀시트 컴포넌트
 * - 요약 페이지에서 연/월을 선택하는 모달
 * - 슬라이드 업 애니메이션, 배경 딤 처리
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  initialYear: number;
  initialMonth: number;
  onConfirm: (year: number, month: number) => void;
};

export default function MonthPickerBottomSheet({
  visible,
  onClose,
  initialYear,
  initialMonth,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.4)',
        },
        backdropTouchable: { flex: 1 },
        sheet: {
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.colors.surface,
        },
        yearRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.md,
        },
        yearButton: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
        },
        yearButtonText: {
          fontSize: theme.typography.sizes.lg,
          color: theme.colors.text,
        },
        yearLabel: {
          marginHorizontal: theme.spacing.lg,
          fontSize: theme.typography.sizes.lg,
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        monthGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        },
        monthItem: {
          width: '22%',
          paddingVertical: theme.spacing.sm,
          marginBottom: theme.spacing.sm,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        },
        monthItemSelected: {
          backgroundColor: theme.colors.primarySoft ?? theme.colors.primary,
        },
        monthText: {
          fontSize: theme.typography.sizes.sm,
          color: theme.colors.text,
        },
        monthTextSelected: {
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        footerRow: {
          flexDirection: 'row',
          marginTop: theme.spacing.sm,
        },
        footerButton: {
          flex: 1,
          paddingVertical: theme.spacing.sm,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        footerCancel: {
          marginRight: theme.spacing.sm,
          backgroundColor: theme.colors.background,
        },
        footerConfirm: {
          marginLeft: theme.spacing.sm,
          backgroundColor: theme.colors.primary,
        },
        footerCancelText: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.text,
        },
        footerConfirmText: {
          fontSize: theme.typography.sizes.md,
          color: theme.colors.onPrimary,
          fontWeight: 'bold',
        },
      }),
    [theme],
  );

  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setYear(initialYear);
      setMonth(initialMonth);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 300,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialYear, initialMonth, translateY]);

  const handlePrevYear = () => setYear((y) => y - 1);
  const handleNextYear = () => setYear((y) => y + 1);

  const handlePressCancel = () => {
    onClose();
  };

  const handlePressConfirm = () => {
    onConfirm(year, month);
    onClose();
  };

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* 연도 헤더 (모달 중간 쯤에 위치하는 느낌) */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={styles.yearButton}
              onPress={handlePrevYear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={'chevron-back'} size={14} color={theme.colors.text} />
            </TouchableOpacity>

            <Text style={styles.yearLabel}>{year}년</Text>

            <TouchableOpacity
              style={styles.yearButton}
              onPress={handleNextYear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={'chevron-forward'} size={14} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* 월 그리드 */}
          <View style={styles.monthGrid}>
            {months.map((m) => {
              const isSelected = m === month;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthItem, isSelected && styles.monthItemSelected]}
                  onPress={() => setMonth(m)}
                >
                  <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                    {m}월
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 하단 버튼 영역 */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerCancel]}
              onPress={handlePressCancel}
            >
              <Text style={styles.footerCancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.footerConfirm]}
              onPress={handlePressConfirm}
            >
              <Text style={styles.footerConfirmText}>완료</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

