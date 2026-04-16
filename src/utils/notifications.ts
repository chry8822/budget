/**
 * 로컬 알림 유틸
 * - 매일 지정한 시간에 "오늘 지출 기록했나요?" 알림 스케줄
 * - AsyncStorage로 알림 ON/OFF 및 시간 설정 저장
 *
 * Expo Go + Android(SDK 53+)에서는 원격/로컬 알림 모듈이 로드 시 ERROR를 뿌리므로
 * 해당 환경에서는 expo-notifications를 동적 import 하지 않습니다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

export const NOTIFICATION_ENABLED_KEY = 'notification_enabled';
export const NOTIFICATION_HOUR_KEY = 'notification_hour';
export const NOTIFICATION_MINUTE_KEY = 'notification_minute';

export const NOTIFICATION_DEFAULT_HOUR = 21;
export const NOTIFICATION_DEFAULT_MINUTE = 0;

/** Expo Go on Android: 네이티브 알림 모듈을 쓰지 않음 (콘솔 ERROR 방지) */
const skipNativeNotificationModule =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type ExpoNotifications = typeof import('expo-notifications');

let notificationsModulePromise: Promise<ExpoNotifications | null> | null = null;
let handlerInstalled = false;

async function loadNotificationsModule(): Promise<ExpoNotifications | null> {
  if (skipNativeNotificationModule) {
    return null;
  }
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }
  return notificationsModulePromise;
}

async function ensureNotificationHandler(): Promise<void> {
  if (handlerInstalled) return;
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerInstalled = true;
}

/** 개발 빌드/스토어 빌드에서만 네이티브 알림 스택 사용 가능 */
export function nativeNotificationsAvailable(): boolean {
  return !skipNativeNotificationModule;
}

/** 알림 권한 요청. 허용 여부 반환 */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** 현재 알림 권한 상태 확인 */
export async function getNotificationPermissionStatus(): Promise<string> {
  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return 'undetermined';

  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** 매일 알림 스케줄 등록 */
export async function scheduleDailyNotification(hour: number, minute: number): Promise<void> {
  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '한눈쏙 가계부',
      body: '오늘 지출 기록했나요? 잊기 전에 기록해 보세요 💰',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/** 모든 알림 취소 */
export async function cancelAllNotifications(): Promise<void> {
  await ensureNotificationHandler();
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** 저장된 알림 설정 불러오기 */
export async function loadNotificationSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
    AsyncStorage.getItem(NOTIFICATION_HOUR_KEY),
    AsyncStorage.getItem(NOTIFICATION_MINUTE_KEY),
  ]);

  return {
    enabled: enabled === 'true',
    hour: hour !== null ? Number(hour) : NOTIFICATION_DEFAULT_HOUR,
    minute: minute !== null ? Number(minute) : NOTIFICATION_DEFAULT_MINUTE,
  };
}

/** 알림 설정 저장 + 스케줄 적용 */
export async function saveNotificationSettings(
  enabled: boolean,
  hour: number,
  minute: number,
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, String(enabled)),
    AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(hour)),
    AsyncStorage.setItem(NOTIFICATION_MINUTE_KEY, String(minute)),
  ]);

  if (enabled) {
    if (nativeNotificationsAvailable()) {
      await scheduleDailyNotification(hour, minute);
    }
  } else {
    await cancelAllNotifications();
  }
}
