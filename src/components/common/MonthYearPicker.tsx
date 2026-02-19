/**
 * 월/연도 선택 피커 컴포넌트
 * - 연도 좌우 네비게이션 + 월 그리드 선택
 * - 기간 필터에서 커스텀 월 선택 시 사용
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

type MonthYearPickerProps = {
    visible: boolean;
    year: number;
    month: number;
    title?: string;
    bottomOffset?: number;
    onConfirm: (year: number, month: number) => void;
    onCancel: () => void;
};

const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_BOX_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;
const WHEEL_PADDING = (WHEEL_BOX_HEIGHT - WHEEL_ITEM_HEIGHT) / 2;

const buildYears = (selectedYear: number) => {
    const nowYear = new Date().getFullYear();
    const start = Math.min(nowYear - 3, selectedYear - 2);
    const end = Math.max(nowYear + 2, selectedYear + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const months = Array.from({ length: 12 }, (_, i) => i + 1);

export default function MonthYearPicker({
    visible,
    year,
    month,
    title = '연/월 선택',
    bottomOffset = 0,
    onConfirm,
    onCancel,
}: MonthYearPickerProps) {
    const theme = useTheme();
    const [tempYear, setTempYear] = useState(year);
    const [tempMonth, setTempMonth] = useState(month);
    const years = buildYears(year);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                overlay: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                container: {
                    width: '86%',
                    backgroundColor: theme.colors.surface,
                    padding: theme.spacing.lg,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                },
                title: {
                    ...theme.typography.subtitle,
                    fontWeight: 'bold',
                    marginBottom: theme.spacing.sm,
                    color: theme.colors.text,
                },
                wheelRow: {
                    flexDirection: 'row',
                    marginTop: theme.spacing.sm,
                    marginBottom: theme.spacing.md,
                    gap: theme.spacing.md as any,
                },
                wheelColumn: { flex: 1 },
                wheelLabel: {
                    fontSize: theme.typography.sizes.xs,
                    color: theme.colors.textMuted,
                    marginBottom: theme.spacing.xs,
                    textAlign: 'center',
                },
                wheelBox: {
                    height: WHEEL_BOX_HEIGHT,
                    width: '100%',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.background,
                    overflow: 'hidden',
                    position: 'relative',
                },
                wheelContent: { paddingVertical: WHEEL_PADDING },
                wheelItem: {
                    height: WHEEL_ITEM_HEIGHT,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                wheelItemActive: { backgroundColor: theme.colors.primarySoft },
                wheelItemText: {
                    fontSize: theme.typography.sizes.md,
                    color: theme.colors.text,
                },
                wheelItemTextActive: {
                    color: theme.colors.primary,
                    fontWeight: 'bold',
                    fontSize: theme.typography.sizes.lg,
                },
                buttons: {
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    marginTop: theme.spacing.sm,
                    gap: theme.spacing.sm as any,
                },
                button: {
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: theme.spacing.xs,
                    borderRadius: 8,
                },
                buttonGhost: { backgroundColor: theme.colors.background },
                buttonPrimary: { backgroundColor: theme.colors.primary },
                buttonGhostText: { ...theme.typography.body, color: theme.colors.text },
                buttonPrimaryText: {
                    ...theme.typography.body,
                    color: theme.colors.onPrimary,
                    fontWeight: 'bold',
                },
            }),
        [theme],
    );

    const yearScrollRef = useRef<ScrollView>(null);
    const monthScrollRef = useRef<ScrollView>(null);
    const yearScrollY = useRef(new Animated.Value(0)).current;
    const monthScrollY = useRef(new Animated.Value(0)).current;
    const yearIndexRef = useRef<number | null>(null);
    const monthIndexRef = useRef<number | null>(null);

    const syncToSelection = (y: number, m: number) => {
        const yearIndex = years.indexOf(y);
        const monthIndex = months.indexOf(m);
        const yearOffset = Math.max(0, yearIndex) * WHEEL_ITEM_HEIGHT;
        const monthOffset = Math.max(0, monthIndex) * WHEEL_ITEM_HEIGHT;
        yearScrollY.setValue(yearOffset);
        monthScrollY.setValue(monthOffset);
        yearScrollRef.current?.scrollTo({ y: yearOffset, animated: false });
        monthScrollRef.current?.scrollTo({ y: monthOffset, animated: false });
        setTimeout(() => {
            yearScrollY.setValue(yearOffset);
            monthScrollY.setValue(monthOffset);
            yearScrollRef.current?.scrollTo({ y: yearOffset, animated: false });
            monthScrollRef.current?.scrollTo({ y: monthOffset, animated: false });
        }, 50);
    };

    useEffect(() => {
        if (!visible) return;
        setTempYear(year);
        setTempMonth(month);
        yearIndexRef.current = null;
        monthIndexRef.current = null;
        requestAnimationFrame(() => {
            syncToSelection(year, month);
        });
    }, [visible, year, month]);

    const handleYearScroll = (offsetY: number) => {
        const index = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(years.length - 1, index));
        if (yearIndexRef.current === clamped) return;
        yearIndexRef.current = clamped;
        setTempYear(years[clamped]);
    };

    const handleMonthScroll = (offsetY: number) => {
        const index = Math.round(offsetY / WHEEL_ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(months.length - 1, index));
        if (monthIndexRef.current === clamped) return;
        monthIndexRef.current = clamped;
        setTempMonth(months[clamped]);
    };

    const handleConfirm = () => {
        onConfirm(tempYear, tempMonth);
    };

    const handleCancel = () => {
        setTempYear(year);
        setTempMonth(month);
        onCancel();
    };

    if (!visible) return null;

    return (
        <View style={[styles.overlay, { bottom: bottomOffset }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
            <View style={styles.container}>
                <Text style={styles.title}>{title}</Text>

                <View style={styles.wheelRow}>
                    <View style={styles.wheelColumn}>
                        <Text style={styles.wheelLabel}>연도</Text>
                        <View style={styles.wheelBox}>
                            <Animated.ScrollView
                                ref={yearScrollRef}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={WHEEL_ITEM_HEIGHT}
                                snapToAlignment="center"
                                decelerationRate={0.995}
                                bounces
                                alwaysBounceVertical
                                overScrollMode="always"
                                contentContainerStyle={styles.wheelContent}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: yearScrollY } } }],
                                    {
                                        useNativeDriver: true,
                                        listener: (event: any) => {
                                            handleYearScroll(event.nativeEvent.contentOffset.y);
                                        },
                                    }
                                )}
                                onMomentumScrollEnd={event =>
                                    handleYearScroll(event.nativeEvent.contentOffset.y)
                                }
                                onScrollEndDrag={event =>
                                    handleYearScroll(event.nativeEvent.contentOffset.y)
                                }
                                scrollEventThrottle={8}
                            >
                                {years.map((y, index) => {
                                    const center = index * WHEEL_ITEM_HEIGHT;
                                    const scale = yearScrollY.interpolate({
                                        inputRange: [
                                            center - WHEEL_ITEM_HEIGHT * 2,
                                            center,
                                            center + WHEEL_ITEM_HEIGHT * 2,
                                        ],
                                        outputRange: [0.8, 1.25, 0.8],
                                        extrapolate: 'clamp',
                                    });
                                    const opacity = yearScrollY.interpolate({
                                        inputRange: [
                                            center - WHEEL_ITEM_HEIGHT * 2,
                                            center,
                                            center + WHEEL_ITEM_HEIGHT * 2,
                                        ],
                                        outputRange: [0.3, 1, 0.3],
                                        extrapolate: 'clamp',
                                    });
                                    return (
                                        <Animated.View
                                            key={y}
                                            style={{ transform: [{ scale }], opacity }}
                                        >
                                            <Pressable
                                                style={[
                                                    styles.wheelItem,
                                                    tempYear === y && styles.wheelItemActive,
                                                ]}
                                                onPress={() => setTempYear(y)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.wheelItemText,
                                                        tempYear === y && styles.wheelItemTextActive,
                                                    ]}
                                                >
                                                    {y}년
                                                </Text>
                                            </Pressable>
                                        </Animated.View>
                                    );
                                })}
                            </Animated.ScrollView>
                        </View>
                    </View>

                    <View style={styles.wheelColumn}>
                        <Text style={styles.wheelLabel}>월</Text>
                        <View style={styles.wheelBox}>
                            <Animated.ScrollView
                                ref={monthScrollRef}
                                showsVerticalScrollIndicator={false}
                                snapToInterval={WHEEL_ITEM_HEIGHT}
                                snapToAlignment="center"
                                decelerationRate={0.995}
                                bounces
                                alwaysBounceVertical
                                overScrollMode="always"
                                contentContainerStyle={styles.wheelContent}
                                onScroll={Animated.event(
                                    [{ nativeEvent: { contentOffset: { y: monthScrollY } } }],
                                    {
                                        useNativeDriver: true,
                                        listener: (event: any) => {
                                            handleMonthScroll(event.nativeEvent.contentOffset.y);
                                        },
                                    }
                                )}
                                onMomentumScrollEnd={event =>
                                    handleMonthScroll(event.nativeEvent.contentOffset.y)
                                }
                                onScrollEndDrag={event =>
                                    handleMonthScroll(event.nativeEvent.contentOffset.y)
                                }
                                scrollEventThrottle={8}
                            >
                                {months.map((m, index) => {
                                    const center = index * WHEEL_ITEM_HEIGHT;
                                    const scale = monthScrollY.interpolate({
                                        inputRange: [
                                            center - WHEEL_ITEM_HEIGHT * 2,
                                            center,
                                            center + WHEEL_ITEM_HEIGHT * 2,
                                        ],
                                        outputRange: [0.8, 1.25, 0.8],
                                        extrapolate: 'clamp',
                                    });
                                    const opacity = monthScrollY.interpolate({
                                        inputRange: [
                                            center - WHEEL_ITEM_HEIGHT * 2,
                                            center,
                                            center + WHEEL_ITEM_HEIGHT * 2,
                                        ],
                                        outputRange: [0.3, 1, 0.3],
                                        extrapolate: 'clamp',
                                    });
                                    return (
                                        <Animated.View
                                            key={m}
                                            style={{ transform: [{ scale }], opacity }}
                                        >
                                            <Pressable
                                                style={[
                                                    styles.wheelItem,
                                                    tempMonth === m && styles.wheelItemActive,
                                                ]}
                                                onPress={() => setTempMonth(m)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.wheelItemText,
                                                        tempMonth === m && styles.wheelItemTextActive,
                                                    ]}
                                                >
                                                    {m}월
                                                </Text>
                                            </Pressable>
                                        </Animated.View>
                                    );
                                })}
                            </Animated.ScrollView>
                        </View>
                    </View>
                </View>

                <View style={styles.buttons}>
                    <Pressable style={[styles.button, styles.buttonGhost]} onPress={handleCancel}>
                        <Text style={styles.buttonGhostText}>취소</Text>
                    </Pressable>
                    <Pressable style={[styles.button, styles.buttonPrimary]} onPress={handleConfirm}>
                        <Text style={styles.buttonPrimaryText}>확인</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

