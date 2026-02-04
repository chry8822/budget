import React, { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

type ScreenContainerProps = {
    children: ReactNode;
    style?: ViewStyle;
};

export default function ScreenContainer({ children, style }: ScreenContainerProps) {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={[styles.inner, style]}>{children}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    inner: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
});
