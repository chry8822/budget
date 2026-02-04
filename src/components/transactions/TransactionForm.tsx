// src/components/transactions/TransactionForm.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated, Easing, View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import ScreenContainer from '../common/ScreenContainer';
import theme from '../../theme';
import { MAIN_CATEGORIES, PAYMENT_METHODS, MainCategory, PaymentMethod } from '../../types/transaction';
import { addCategory, deleteCategory, Category, Transaction, getCategories, insertTransaction, updateTransaction } from '../../db/database';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useTransactionChange } from '../common/TransactionChangeContext';

type TransactionFormMode = 'create' | 'edit';

type Props = {
    mode: TransactionFormMode;
    initialTransaction?: Transaction; // edit일 때 전달
    onSaved: () => void;
    onCancel: () => void;
};
export default function TransactionForm({ mode, initialTransaction, onSaved, onCancel }: Props) {
    const isEdit = mode === 'edit';
    const { notifyChanged } = useTransactionChange();

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const dimAnim = useRef(new Animated.Value(0)).current;

    const [date, setDate] = useState<Date>(() => {
        if (initialTransaction) {
            return new Date(initialTransaction.date);
        }
        return new Date();
    });

    const [tempDate, setTempDate] = useState<Date>(() => {
        if (initialTransaction) {
            return new Date(initialTransaction.date);
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

    const [categories, setCategories] = useState<Category[]>([]);
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

    useEffect(() => {
        getCategories().then(setCategories);
    }, []);

    const openCategoryModal = () => {
        setShowAddCategory(true);
        scaleAnim.setValue(0.);
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
                    type: 'expense',
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
                    type: 'expense',
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

    const handleAddCategory = async () => {
        const name = newCategory.trim();
        if (!name) return;
        await addCategory(name);
        setNewCategory('');
        setShowAddCategory(false);
        const list = await getCategories();
        setCategories(list);
        setMainCategory(name);
    };

    const handleDeleteCategory = async (cat: Category) => {
        // 기본 카테고리는 삭제 금지
        if (cat.isDefault) return;
        await deleteCategory(cat.id);
        const list = await getCategories();
        setCategories(list);
        if (mainCategory === cat.name) {
            setMainCategory(list[0]?.name ?? '기타');
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
        <ScreenContainer style={styles.container}>
            <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                extraScrollHeight={Platform.OS === 'ios' ? theme.spacing.lg : theme.spacing.md}
            >
                <Text style={styles.title}>
                    {isEdit ? '지출 수정' : '지출 추가'}
                </Text>

                <Text style={styles.label}>날짜</Text>
                <Pressable
                    style={styles.input}
                    onPress={() => {
                        setTempDate(date);          // 현재 확정값을 기준으로 피커를 열고
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
                                    setDate(tempDate);          // 여기서만 확정
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
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(1000)}
                    >
                        <Text style={styles.quickAmountText}>+1천</Text>
                    </Pressable>
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(5000)}
                    >
                        <Text style={styles.quickAmountText}>+5천</Text>
                    </Pressable>
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(10000)}
                    >
                        <Text style={styles.quickAmountText}>+1만</Text>
                    </Pressable>
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(50000)}
                    >
                        <Text style={styles.quickAmountText}>+5만</Text>
                    </Pressable>
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(100000)}
                    >
                        <Text style={styles.quickAmountText}>+10만</Text>
                    </Pressable>
                    <Pressable
                        style={styles.quickAmountButton}
                        onPress={() => appendQuickAmount(1000000)}
                    >
                        <Text style={styles.quickAmountText}>+100만</Text>
                    </Pressable>
                </View>


                <Text style={styles.label}>대분류</Text>
                <View style={styles.chipContainer}>
                    {categories.map(cat => (
                        <Pressable
                            key={cat.id}
                            onPress={() => setMainCategory(cat.name)}
                            onLongPress={() => !cat.isDefault && handleDeleteCategory(cat)}
                            style={[
                                styles.chip,
                                mainCategory === cat.name && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    mainCategory === cat.name && styles.chipTextSelected,
                                ]}
                            >
                                {cat.name}
                            </Text>
                            {!cat.isDefault && (
                                <Pressable
                                    style={styles.chipDelete}
                                    onPress={() => handleDeleteCategory(cat)}
                                    hitSlop={6}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={14}
                                        color={theme.colors.textMuted}
                                    />
                                </Pressable>
                            )}
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
                        <Pressable
                            style={styles.clearButton}
                            onPress={() => setSubCategory('')}
                            hitSlop={8}
                        >
                            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
                        </Pressable>
                    )}
                </View>

                <Text style={styles.label}>결제 수단</Text>
                <View style={styles.chipContainer}>
                    {PAYMENT_METHODS.map(pm => (
                        <Pressable
                            key={pm}
                            onPress={() => setPaymentMethod(pm)}
                            style={[
                                styles.chip,
                                paymentMethod === pm && styles.chipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    paymentMethod === pm && styles.chipTextSelected,
                                ]}
                            >
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
                    <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel} disabled={saving}>
                        <Text style={styles.cancelButtonText}>취소</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={saving}>
                        <Text style={styles.saveButtonText}>{saving ? '저장 중...' : '저장'}</Text>
                    </Pressable>
                </View>
            </KeyboardAwareScrollView>
            <Modal visible={showAddCategory} transparent animationType="none">
                <Animated.View
                    style={[
                        styles.modalOverlay,
                        { opacity: dimAnim },
                    ]}
                >
                    <Animated.View style={[
                        styles.modalCard,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}>
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
                            <Pressable style={[styles.button, styles.saveButton]} onPress={handleAddCategory}>
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
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
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
