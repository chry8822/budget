// App.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// 앱 로딩 완료 전까지 스플래시 유지
SplashScreen.preventAutoHideAsync();
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './src/navigation/types';

import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import { initDatabase } from './src/db/database';
import EditTransactionScreen from './src/screens/EditTransactionScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { TransactionChangeProvider } from './src/components/common/TransactionChangeContext';
import BudgetSettingScreen from './src/screens/BudgetSettingScreen';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import type { AppTheme } from './src/theme';

import Toast, { BaseToast, BaseToastProps, ErrorToast } from 'react-native-toast-message';
import HapticWrapper from './src/components/common/HapticWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

/** 탭 아이콘: tabBarIconSize 옵션 미지원으로 콜백 안에서 size를 직접 지정. 아이콘 하단 여백만 유지. */
const TAB_ICON_PADDING = { marginBottom: 2 };

function MainTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground ?? theme.colors.background,
          height: 60 + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom + 10,
        },
        tabBarButton: (props) => (
          <HapticWrapper
            {...props}
            onPress={props.onPress as () => void}
            style={props.style}
            disabled={props.disabled ?? false}
          >
            {props.children as React.ReactNode}
          </HapticWrapper>
        ),
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';
          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Transactions') iconName = 'list-outline';
          if (route.name === 'Stats') iconName = 'stats-chart-outline';
          if (route.name === 'Summary') iconName = 'pie-chart-outline';
          return (
            <View style={TAB_ICON_PADDING}>
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ color }) => {
          let label = '';
          if (route.name === 'Home') label = '홈';
          if (route.name === 'Transactions') label = '내역';
          if (route.name === 'Stats') label = '통계';
          if (route.name === 'Summary') label = '요약/설정';
          return (
            <Text
              style={{
                color,
                fontSize: theme.typography.sizes.md,
                fontWeight: 'bold',
                marginTop: 10,
                marginBottom: 2,
              }}
            >
              {label}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Summary" component={SummaryScreen} />
    </Tab.Navigator>
  );
}

function makeToastConfig(theme: AppTheme) {
  return {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#4CAF50' }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 20, fontWeight: 'bold' }}
        text2Style={{ fontSize: 16 }}
      />
    ),
    error: (props: BaseToastProps) => (
      <ErrorToast
        {...props}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.danger,
          borderLeftColor: theme.colors.danger,
          marginTop: theme.spacing.md,
        }}
        text1Style={{ fontSize: 20, fontWeight: 'bold' }}
        text2Style={{ fontSize: 16, color: theme.colors.danger }}
      />
    ),
  };
}

function AppContent() {
  const theme = useTheme();
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="AddTransaction"
            component={AddTransactionScreen}
            options={{ title: '지출 추가', headerBackTitle: '뒤로', headerShown: false }}
          />
          <Stack.Screen
            name="EditTransaction"
            component={EditTransactionScreen}
            options={{ title: '지출 수정', headerBackTitle: '뒤로', headerShown: false }}
          />
          <Stack.Screen
            name="BudgetSetting"
            component={BudgetSettingScreen}
            options={{ title: '예산 설정', headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: '설정', headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={makeToastConfig(theme)} />
    </>
  );
}

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch((err) => {
        console.error('DB 초기화 실패', err);
        setDbError(true);
      })
      .finally(() => {
        SplashScreen.hideAsync();
      });
  }, []);

  if (dbError) {
    return (
      <ThemeProvider>
        <DbErrorScreen />
      </ThemeProvider>
    );
  }

  if (!isDbReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <TransactionChangeProvider>
          <AppContent />
        </TransactionChangeProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function DbErrorScreen() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Ionicons name="alert-circle-outline" size={64} color={theme.colors.primary} />
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 16, color: theme.colors.text }}>
        데이터베이스 오류
      </Text>
      <Text
        style={{ fontSize: 14, color: theme.colors.textMuted, textAlign: 'center', marginTop: 8 }}
      >
        앱을 시작할 수 없습니다.{'\n'}앱을 종료 후 다시 실행해 주세요.
      </Text>
    </View>
  );
}
