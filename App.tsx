// App.tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from './src/navigation/types'

import HomeScreen from './src/screens/HomeScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import StatsScreen from './src/screens/StatsScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import { initDatabase } from './src/db/database';
import theme from './src/theme';
import EditTransactionScreen from './src/screens/EditTransactionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

// 1) 탭 네비게이터 (하단 탭 3개)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground ?? '#FFFFFF',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'Home') iconName = 'home-outline';
          if (route.name === 'Transactions') iconName = 'list-outline';
          if (route.name === 'Stats') iconName = 'stats-chart-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel: ({ color }) => {
          let label = '';

          if (route.name === 'Home') label = '홈';
          if (route.name === 'Transactions') label = '내역';
          if (route.name === 'Stats') label = '통계';

          return <Text style={{ color, fontSize: 11 }}>{label}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}

// 2) 전체 앱 루트 (Stack + Tabs + 지출 추가 화면)
export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setIsDbReady(true))
      .catch(err => {
        console.error('DB 초기화 실패', err);
        setIsDbReady(true);
      });
  }, []);

  if (!isDbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>데이터베이스 준비 중...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* 하단 탭 3개가 들어있는 메인 화면 */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* 지출 추가 화면 (상단 헤더 + 뒤로가기 버튼 자동 생성) */}
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{
            title: '지출 추가',
            headerBackTitle: '뒤로',
            headerShown: false
          }}
        />
        <Stack.Screen
          name="EditTransaction"
          component={EditTransactionScreen}
          options={{
            title: '지출 수정',
            headerBackTitle: '뒤로',
            headerShown: false
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
