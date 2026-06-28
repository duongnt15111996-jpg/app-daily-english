import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '../constants/types';

const STORAGE_KEY = 'notifications_enabled';
const STORAGE_TIME_KEY = 'notification_time';
const CHANNEL_ID = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Reminder',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function saveNotificationTime(hour: number, minute: number): Promise<void> {
  await AsyncStorage.setItem(STORAGE_TIME_KEY, JSON.stringify({ hour, minute }));
}

export async function getNotificationTime(): Promise<{ hour: number; minute: number }> {
  const raw = await AsyncStorage.getItem(STORAGE_TIME_KEY);
  if (!raw) return { hour: 20, minute: 0 };
  return JSON.parse(raw);
}

export async function syncNotification(progress: UserProgress): Promise<void> {
  const enabled = await getNotificationsEnabled();
  if (!enabled) return;

  const { hour, minute } = await getNotificationTime();

  const remainingLessons = Math.max(0, progress.dailyGoal.lessons - progress.todayCompleted.lessons);
  const remainingWords = Math.max(0, progress.dailyGoal.words - progress.todayCompleted.words);
  const goalMet = remainingLessons === 0 && remainingWords === 0;
  const hasStarted = progress.todayCompleted.lessons > 0 || progress.todayCompleted.words > 0;

  let body: string;
  if (goalMet) {
    body = 'Bắt đầu ngày mới với một bài học tiếng Anh!';
  } else if (hasStarted) {
    const parts: string[] = [];
    if (remainingLessons > 0) parts.push(`${remainingLessons} lesson`);
    if (remainingWords > 0) parts.push(`${remainingWords} từ`);
    body = `Còn ${parts.join(' và ')} để hoàn thành mục tiêu hôm nay!`;
  } else {
    body = 'Bạn chưa học hôm nay, hãy dành 10 phút luyện tập!';
  }

  const content = {
    title: 'Daily English',
    body,
    ...(Platform.OS === 'android' && { channelId: CHANNEL_ID }),
  };

  const now = new Date();
  const notifToday = new Date();
  notifToday.setHours(hour, minute, 0, 0);

  // Fire today nếu goal chưa đạt và chưa tới giờ, ngược lại fire ngày mai
  const triggerDate = new Date(notifToday);
  if (goalMet || now >= notifToday) {
    triggerDate.setDate(triggerDate.getDate() + 1);
  }

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function scheduleDaily(hour: number, minute: number): Promise<void> {
  await saveNotificationTime(hour, minute);
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(STORAGE_KEY, 'false');
}

export async function getNotificationsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === 'true';
}
