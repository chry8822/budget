/**
 * 커스텀 헤더 컴포넌트
 * - 뒤로가기 버튼 + 중앙 타이틀
 * - Stack 네비게이션 하위 페이지에서 사용
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

type Props = {
    title: string;
};

export default function ScreenHeader({ title }: Props) {
    const navigation = useNavigation();
    const theme = useTheme();

    const styles = useMemo(
        () =>
            StyleSheet.create({
                container: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: theme.spacing.md,
                },
                backButton: {
                    padding: 4,
                    width: 30,
                },
                title: {
                    flex: 1,
                    fontSize: theme.typography.sizes.xl,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    color: theme.colors.text,
                },
            }),
        [theme],
    );

    return (
        <View style={styles.container}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.backButton} />
        </View>
    );
}
