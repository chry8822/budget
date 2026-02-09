import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../theme';

type Props = {
    title: string;
};

export default function ScreenHeader({ title }: Props) {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            {/* 오른쪽 빈 공간 (왼쪽 버튼과 동일 폭으로 균형) */}
            <View style={styles.backButton} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    backButton: {
        padding: 4,
        width: 30,  // 좌우 동일 폭
    },
    title: {
        flex: 1,
        fontSize: theme.typography.sizes.xl,
        fontWeight: 'bold',
        textAlign: 'center',
        color: theme.colors.text,
    },
});
