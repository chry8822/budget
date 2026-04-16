/**
 * 거래 입력/수정 폼 컴포넌트
 * - 지출/수입 금액, 카테고리, 결제수단, 메모 입력
 * - 카테고리 동적 추가/삭제
 * - 생성(create) / 수정(edit) 모드 지원
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import HapticPressable from '../common/HapticPressable';
import ScreenContainer from '../common/ScreenContainer';
import { useTheme, useColorScheme } from '../../theme/ThemeContext';
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
import { Transaction, insertTransaction, updateTransaction } from '../../db/database';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTransactionChange } from '../common/TransactionChangeContext';

const STORAGE_CUSTOM_EXPENSE = '@budgetbook/custom_main_categories_expense';
const STORAGE_CUSTOM_INCOME = '@budgetbook/custom_main_categories_income';

function customMainStorageKey(transactionType: TransactionType): string {
  return transactionType === 'expense' ? STORAGE_CUSTOM_EXPENSE : STORAGE_CUSTOM_INCOME;
}

async function readCustomMainCategories(transactionType: TransactionType): Promise<string[]> {
  const raw = await AsyncStorage.getItem(customMainStorageKey(transactionType));
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

type MainCategoryChip = { key: string; name: string; isDefault: boolean };

function buildMainCategoryChips(
  transactionType: TransactionType,
  customNames: string[],
): MainCategoryChip[] {
  const defaults =
    transactionType === 'expense' ? EXPENSE_MAIN_CATEGORIES : INCOME_MAIN_CATEGORIES;
  const seen = new Set<string>([...defaults]);
  const chips: MainCategoryChip[] = defaults.map((name) => ({
    key: `d:${name}`,
    name,
    isDefault: true,
  }));
  for (const raw of customNames) {
    const name = raw.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    chips.push({ key: `c:${name}`, name, isDefault: false });
  }
  return chips;
}

const QUICK_AMOUNTS = [
  { label: '+1천', delta: 1_000 },
  { label: '+5천', delta: 5_000 },
  { label: '+1만', delta: 10_000 },
  { label: '+5만', delta: 50_000 },
  { label: '+10만', delta: 100_000 },
  { label: '+100만', delta: 1_000_000 },
] as const;

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
  const theme = useTheme();
  const { isDark } = useColorScheme();
  const isEdit = mode === 'edit';
  const isExpense = type === 'expense';

  const mainColor = isExpense ? theme.colors.primary : (theme.colors.income ?? '#1e88e5');
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingBottom: theme.spacing.sm,
          paddingTop: theme.spacing.sm,
        },
        scrollView: { paddingVertical: theme.spacing.sm },
        scrollContent: { paddingBottom: theme.spacing.xl },
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
          color: theme.colors.text,
          backgroundColor: theme.colors.surface,
        },
        dateInputText: {
          color: theme.colors.text,
          fontSize: theme.typography.body.fontSize,
        },
        inputWrapper: { position: 'relative' },
        inputWithClear: { paddingRight: theme.spacing.lg },
        clearButton: {
          position: 'absolute',
          right: theme.spacing.sm,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
        },
        memoInput: { height: 80, textAlignVertical: 'top' },
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
        },
        chipSelected: {
          borderColor: 'transparent',
        },
        chipText: {
          fontSize: theme.typography.body.fontSize,
          color: theme.colors.textMuted,
        },
        chipTextSelected: { color: theme.colors.onPrimary },
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
        cancelButton: { backgroundColor: theme.colors.surface },
        saveButton: {},
        cancelButtonText: { color: theme.colors.text },
        saveButtonText: { color: theme.colors.onPrimary, fontWeight: 'bold' },
        datePickerContainer: { marginTop: 8 },
        datePickerButtons: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginTop: 4,
        },
        dateButton: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 8,
          marginLeft: theme.spacing.sm,
        },
        dateCancelButton: { backgroundColor: theme.colors.surface },
        dateOkButton: { backgroundColor: theme.colors.primary },
        dateCancelText: { ...theme.typography.body, color: theme.colors.text },
        dateOkText: {
          ...theme.typography.body,
          color: theme.colors.onPrimary,
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
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        },
        modalCard: {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        modalTitle: {
          ...theme.typography.subtitle,
          fontWeight: 'bold',
          marginBottom: theme.spacing.sm,
          color: theme.colors.text,
        },
        chipDelete: {
          position: 'absolute',
          top: -6,
          right: -6,
          zIndex: 2,
          padding: 2,
        },
        chipOuter: {
          position: 'relative',
        },
      }),
    [theme],
  );

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

  const [mainCatChips, setMainCatChips] = useState<MainCategoryChip[]>(() =>
    buildMainCategoryChips(type, []),
  );
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [mainCategory, setMainCategory] = useState<MainCategory>(() => {
    if (initialTransaction) {
      return initialTransaction.mainCategory as MainCategory;
    }
    return isExpense ? '식비' : '급여';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customs = await readCustomMainCategories(type);
      if (cancelled) return;
      const chips = buildMainCategoryChips(type, customs);
      setMainCatChips(chips);
      setMainCategory((prev) => {
        const names = chips.map((c) => c.name);
        if (names.includes(prev)) return prev;
        return (names[0] ?? (type === 'expense' ? '식비' : '급여')) as MainCategory;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

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
  const handleAmountChange = useCallback((text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    if (!numeric) {
      setAmountText('');
      setAmountValue(null);
      return;
    }
    const value = Number(numeric);
    if (Number.isNaN(value)) return;
    setAmountText(value.toLocaleString());
    setAmountValue(value);
  }, []);

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
      setShowDatePicker(false);
      return;
    }
    const currentDate = selectedDate ?? tempDate;
    setTempDate(currentDate);
  };

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    const defaults = isExpense ? EXPENSE_MAIN_CATEGORIES : INCOME_MAIN_CATEGORIES;
    if (defaults.includes(name)) {
      alert('기본 카테고리와 같은 이름은 추가할 수 없습니다.');
      return;
    }

    try {
      const current = await readCustomMainCategories(type);
      if (current.includes(name)) {
        alert('이미 있는 카테고리입니다.');
        return;
      }
      const next = [...current, name];
      await AsyncStorage.setItem(customMainStorageKey(type), JSON.stringify(next));
      const chips = buildMainCategoryChips(type, next);
      setMainCatChips(chips);
      setMainCategory(name as MainCategory);
      setNewCategory('');
      closeCategoryModal();
    } catch (e) {
      console.error(e);
      alert('카테고리 추가에 실패했습니다.');
    }
  };

  const handleRemoveCustomMain = async (name: string) => {
    const defaults = isExpense ? EXPENSE_MAIN_CATEGORIES : INCOME_MAIN_CATEGORIES;
    if (defaults.includes(name)) return;
    try {
      const current = await readCustomMainCategories(type);
      const next = current.filter((n) => n !== name);
      await AsyncStorage.setItem(customMainStorageKey(type), JSON.stringify(next));
      const chips = buildMainCategoryChips(type, next);
      setMainCatChips(chips);
      setMainCategory((prev) => {
        const names = chips.map((c) => c.name);
        if (names.includes(prev)) return prev;
        return (names[0] ?? (type === 'expense' ? '식비' : '급여')) as MainCategory;
      });
    } catch (e) {
      console.error(e);
      alert('삭제에 실패했습니다.');
    }
  };
  const appendQuickAmount = useCallback(
    (delta: number) => {
      const base = amountValue ?? 0;
      const newValue = base + delta;
      if (newValue <= 0) {
        setAmountValue(null);
        setAmountText('');
        return;
      }
      setAmountValue(newValue);
      setAmountText(newValue.toLocaleString());
    },
    [amountValue],
  );

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
            if (Platform.OS === 'android') {
              DateTimePickerAndroid.open({
                value: date,
                mode: 'date',
                display: 'spinner',
                onChange: (event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    setDate(selectedDate);
                  }
                },
              });
            } else {
              setTempDate(date);
              setShowDatePicker(true);
            }
          }}
        >
          <Text style={styles.dateInputText}>{dateText}</Text>
        </Pressable>

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={tempDate}
              mode="date"
              locale="ko-KR"
              display="spinner"
              onChange={handleDateChange}
              themeVariant={isDark ? 'dark' : 'light'}
              textColor={theme.colors.text}
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
                  setDate(tempDate);
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
            placeholderTextColor={theme.colors.textMuted}
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
          {QUICK_AMOUNTS.map(({ label, delta }) => (
            <HapticPressable
              key={label}
              onPress={() => appendQuickAmount(delta)}
              style={styles.quickAmountButton}
              pressedScale={0.88}
            >
              <Text style={styles.quickAmountText}>{label}</Text>
            </HapticPressable>
          ))}
        </View>

        <Text style={styles.label}>대분류</Text>

        <View style={styles.chipContainer}>
          {mainCatChips.map((row) => (
            <View key={row.key} style={styles.chipOuter}>
              <HapticPressable
                onPress={() => setMainCategory(row.name as MainCategory)}
                style={[
                  styles.chip,
                  mainCategory === row.name && styles.chipSelected,
                  mainCategory === row.name && { backgroundColor: mainColor },
                ]}
                pressedScale={0.93}
              >
                <Text
                  style={[styles.chipText, mainCategory === row.name && styles.chipTextSelected]}
                >
                  {row.name}
                </Text>
              </HapticPressable>
              {!row.isDefault && (
                <Pressable
                  style={styles.chipDelete}
                  onPress={() => handleRemoveCustomMain(row.name)}
                  hitSlop={10}
                  accessibilityLabel={`${row.name} 카테고리 삭제`}
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                </Pressable>
              )}
            </View>
          ))}

          <HapticPressable onPress={openCategoryModal} style={styles.chip} pressedScale={0.93}>
            <Text style={styles.chipText}>+ 직접입력</Text>
          </HapticPressable>
        </View>
        <Text style={styles.label}>소분류</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputWithClear]}
            value={subCategory}
            onChangeText={setSubCategory}
            placeholder="예: 마트, 편의점, 통신비"
            placeholderTextColor={theme.colors.textMuted}
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
            <HapticPressable
              key={pm}
              onPress={() => setPaymentMethod(pm)}
              style={[
                styles.chip,
                paymentMethod === pm && styles.chipSelected,
                paymentMethod === pm && { backgroundColor: mainColor },
              ]}
              pressedScale={0.93}
            >
              <Text style={[styles.chipText, paymentMethod === pm && styles.chipTextSelected]}>
                {pm}
              </Text>
            </HapticPressable>
          ))}
        </View>

        <Text style={styles.label}>메모</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, styles.inputWithClear, styles.memoInput]}
            value={memo}
            onChangeText={setMemo}
            placeholder="내용을 입력하세요"
            placeholderTextColor={theme.colors.textMuted}
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
          <HapticPressable
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={saving}
            pressedScale={0.95}
            haptic="none"
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </HapticPressable>
          <HapticPressable
            style={[styles.button, styles.saveButton, { backgroundColor: mainColor }]}
            onPress={handleSave}
            disabled={saving}
            pressedScale={0.95}
            haptic="medium"
          >
            <Text style={styles.saveButtonText}>{saving ? '저장 중...' : resolvedSubmitText}</Text>
          </HapticPressable>
        </View>
      </KeyboardAwareScrollView>
      <Modal visible={showAddCategory} transparent animationType="none" onRequestClose={closeCategoryModal}>
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
              placeholderTextColor={theme.colors.textMuted}
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

