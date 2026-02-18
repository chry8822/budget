/**
 * 거래 입력/수정 폼 컴포넌트
 * - 지출/수입 금액, 카테고리, 결제수단, 메모 입력
 * - 카테고리 동적 추가/삭제
 * - 생성(create) / 수정(edit) 모드 지원
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  Easing,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import ScreenContainer from '../common/ScreenContainer';
import theme from '../../theme';
import {
  PAYMENT_METHODS,
  MainCategory,
  PaymentMethod,
  TransactionType,
  INCOME_MAIN_CATEGORIES,
  EXPENSE_MAIN_CATEGORIES,
  INCOME_PAYMENT_METHODS,
  EXPENSE_PAYMENT_METHODS,
} from '../../types/transaction';
import {
  addCategory,
  deleteCategory,
  Category,
  Transaction,
  getCategories,
  insertTransaction,
  updateTransaction,
} from '../../db/database';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTransactionChange } from '../common/TransactionChangeContext';

type TransactionFormMode = 'create' | 'edit';

type Props = {
  mode: TransactionFormMode;
  initialTransaction?: Transaction; // edit일 때 전달
  initialDate?: string; // create일 때 기본 날짜 (YYYY-MM-DD), 없으면 오늘
  type: TransactionType;
  onSaved: () => void;
  onCancel: () => void;
};
export default function TransactionForm({
  mode,
  initialTransaction,
  initialDate,
  onSaved,
  onCancel,
  type,
}: Props) {
  const isEdit = mode === 'edit';
  const isExpense = type === 'expense';

  const mainColor = isExpense ? theme.colors.primary : theme.colors.income;
  const resolvedTitle = isExpense
    ? mode === 'create'
      ? '지출 추가'
      : '지출 수정'
    : mode === 'create'
      ? '수입 추가'
      : '수입 수정';

  const resolvedSubmitText = isExpense ? '지출 저장' : '수입 저장';

  const paymentMethods = isExpense ? EXPENSE_PAYMENT_METHODS : INCOME_PAYMENT_METHODS;

  const { notifyChanged } = useTransactionChange();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const dimAnim = useRef(new Animated.Value(0)).current;

  const [date, setDate] = useState<Date>(() => {
    if (initialTransaction) {
      return new Date(initialTransaction.date);
    }
    if (initialDate) {
      return new Date(initialDate + 'T12:00:00');
    }
    return new Date();
  });

  const [tempDate, setTempDate] = useState<Date>(() => {
    if (initialTransaction) {
      return new Date(initialTransaction.date);
    }
    if (initialDate) {
      return new Date(initialDate + 'T12:00:00');
    }
    return new Date();
  });

  const [amountText, setAmountText] = useState(() => {
    if (initialTransaction) {
      return initialTransaction.amount.toLocaleString();
    }
    return '';
  });

  const [amountValue, setAmountValue] = useState<number | null>(() => {
    if (initialTransaction) {
      return initialTransaction.amount;
    }
    return null;
  });

  const [categories, setCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [mainCategory, setMainCategory] = useState<MainCategory>(() => {
    if (initialTransaction) {
      return initialTransaction.mainCategory as MainCategory;
    }
    return '식비';
  });

  const [subCategory, setSubCategory] = useState(() => initialTransaction?.subCategory ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    if (initialTransaction) {
      return initialTransaction.paymentMethod as PaymentMethod;
    }
    return '현금';
  });
  const [memo, setMemo] = useState(initialTransaction?.memo ?? '');
  const [saving, setSaving] = useState(false);

  const dateText = date.toISOString().slice(0, 10);

  const [showDatePicker, setShowDatePicker] = useState(false);

  //   useEffect(() => {
  //     getCategories().then(setCategories);
  //   }, []);

  useEffect(() => {
    console.log('isExpense', isExpense);
    if (isExpense) {
      setCategories(EXPENSE_MAIN_CATEGORIES);
    } else {
      setCategories(INCOME_MAIN_CATEGORIES);
    }
  }, [isExpense]);

  const openCategoryModal = () => {
    setShowAddCategory(true);
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeCategoryModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dimAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddCategory(false); // 애니메이션 끝난 뒤 닫기
    });
  };
  const handleAmountChange = (text: string) => {
    // 입력값에서 숫자만 남기기
    const numeric = text.replace(/[^0-9]/g, '');

    if (!numeric) {
      setAmountText('');
      setAmountValue(null);
      return;
    }

    // 숫자로 변환
    const value = Number(numeric);
    if (Number.isNaN(value)) {
      // 이론상 여기 안 오지만 방어 코드
      return;
    }

    // 표시용 문자열: 1000 -> 1,000
    const formatted = value.toLocaleString();

    setAmountText(formatted);
    setAmountValue(value);
  };

  const handleSave = async () => {
    if (!amountValue || amountValue <= 0) {
      alert('금액을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && initialTransaction?.id) {
        // ✅ 수정(update) 로직
        await updateTransaction({
          ...initialTransaction,
          date: dateText,
          amount: amountValue,
          type: type,
          mainCategory,
          subCategory: subCategory || undefined,
          paymentMethod,
          memo: memo || undefined,
          // createdAt은 그대로 유지
        });
      } else {
        // ✅ 새로 추가(insert) 로직
        await insertTransaction({
          date: dateText,
          amount: amountValue,
          type: type,
          mainCategory,
          subCategory: subCategory || undefined,
          paymentMethod,
          memo: memo || undefined,
          createdAt: new Date().toISOString(),
        });
      }

      setSaving(false);
      onSaved();
    } catch (e) {
      console.error(e);
      setSaving(false);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      notifyChanged();
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      // 사용자가 취소(뒤로가기 등) 했을 때만 닫기
      setShowDatePicker(false);
      return;
    }

    const currentDate = selectedDate ?? tempDate;
    setTempDate(currentDate);
  };

  const handleAddCategory = () => {
    const name = newCategory.trim();
    if (!name) return;

    // 현재 모드에 따라 로컬 categories에만 추가
    setCategories((prev) => [...prev, name]);
    setMainCategory(name as MainCategory);
    setNewCategory('');
    closeCategoryModal();
  };

  const handleDeleteCategory = (name: string) => {
    // 기본 카테고리는 삭제 막고 싶으면 조건 추가
    setCategories((prev) => prev.filter((c) => c !== name));
    if (mainCategory === name) {
      setMainCategory((prev) => (prev === name ? (categories[0] as MainCategory) : prev));
    }
  };
  const appendQuickAmount = (delta: number) => {
    const base = amountValue ?? 0;
    const newValue = base + delta;
    if (newValue <= 0) {
      setAmountValue(null);
      setAmountText('');
      return;
    }
    setAmountValue(newValue);
    setAmountText(newValue.toLocaleString());
  };

  return (
    <ScreenContainer style={styles.container} safeBottom>
      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.md}
      >
        <Text style={styles.title}>{resolvedTitle}</Text>

        <Text style={styles.label}>날짜</Text>
        <Pressable
          style={styles.input}
          onPress={() => {
            setTempDate(date); // 현재 확정값을 기준으로 피커를 열고
            setShowDatePicker(true);
          }}
        >
          <Text>{dateText}</Text>
        </Pressable>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              locale="ko-KR"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
            <View style={styles.datePickerButtons}>
              <Pressable
                style={[styles.dateButton, styles.dateCancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.dateCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.dateButton, styles.dateOkButton]}
                onPress={() => {
                  setDate(tempDate); // 여기서만 확정
                  setShowDatePicker(false);
                }}
              >
                <Text style={styles.dateOkText}>확인</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.label}>금액</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputWithClear]}
            value={amountText}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="0"
          />
          {amountText.length > 0 && (
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setAmountText('');
                setAmountValue(null);
              }}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.quickAmountContainer}>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(1000)}>
            <Text style={styles.quickAmountText}>+1천</Text>
          </Pressable>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(5000)}>
            <Text style={styles.quickAmountText}>+5천</Text>
          </Pressable>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(10000)}>
            <Text style={styles.quickAmountText}>+1만</Text>
          </Pressable>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(50000)}>
            <Text style={styles.quickAmountText}>+5만</Text>
          </Pressable>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(100000)}>
            <Text style={styles.quickAmountText}>+10만</Text>
          </Pressable>
          <Pressable style={styles.quickAmountButton} onPress={() => appendQuickAmount(1000000)}>
            <Text style={styles.quickAmountText}>+100만</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>대분류</Text>

        <View style={styles.chipContainer}>
          {categories.map((name) => (
            <Pressable
              key={name}
              onPress={() => setMainCategory(name as MainCategory)}
              style={[
                styles.chip,
                mainCategory === name && styles.chipSelected && { backgroundColor: mainColor },
              ]}
            >
              <Text style={[styles.chipText, mainCategory === name && styles.chipTextSelected]}>
                {name}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={openCategoryModal} style={styles.chip}>
            <Text style={styles.chipText}>+ 직접입력</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>소분류</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputWithClear]}
            value={subCategory}
            onChangeText={setSubCategory}
            placeholder="예: 마트, 편의점, 통신비"
          />
          {subCategory.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setSubCategory('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>{isExpense ? '결제' : '수입'} 수단</Text>
        <View style={styles.chipContainer}>
          {paymentMethods.map((pm) => (
            <Pressable
              key={pm}
              onPress={() => setPaymentMethod(pm)}
              style={[
                styles.chip,
                paymentMethod === pm && styles.chipSelected && { backgroundColor: mainColor },
              ]}
            >
              <Text style={[styles.chipText, paymentMethod === pm && styles.chipTextSelected]}>
                {pm}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>메모</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputWithClear, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="내용을 입력하세요"
            multiline
          />
          {memo.length > 0 && (
            <Pressable
              style={[styles.clearButton, { top: '-60%' }]}
              onPress={() => setMemo('')}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.saveButton, { backgroundColor: mainColor }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? '저장 중...' : resolvedSubmitText}</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
      <Modal visible={showAddCategory} transparent animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: dimAnim }]}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            <Text style={styles.modalTitle}>대분류 추가</Text>
            <TextInput
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="새 대분류 입력"
            />
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setNewCategory('');
                  closeCategoryModal();
                }}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.saveButton, { backgroundColor: mainColor }]}
                onPress={handleAddCategory}
              >
                <Text style={styles.saveButtonText}>추가</Text>
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
  },
  scrollView: {
    paddingVertical: theme.spacing.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.title.fontSize,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputWithClear: {
    paddingRight: theme.spacing.lg,
  },
  clearButton: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  memoInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm as any,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textMuted,
  },
  chipTextSelected: {
    color: theme.colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm as any,
  },
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
  },
  saveButton: {},
  cancelButtonText: {
    color: theme.colors.text,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  datePickerContainer: {
    marginTop: 8,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  dateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  dateCancelButton: {
    backgroundColor: theme.colors.surface,
  },
  dateOkButton: {
    backgroundColor: theme.colors.primary,
  },
  dateCancelText: {
    ...theme.typography.body,
  },
  dateOkText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: 'bold',
  },
  quickAmountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md as any,
  },
  quickAmountButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  quickAmountText: {
    ...theme.typography.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    ...theme.typography.subtitle,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  chipDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
});
