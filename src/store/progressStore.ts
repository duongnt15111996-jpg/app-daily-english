import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress } from '../constants/types';
import { fetchProgress, registerDevice, syncProgress } from '../services/api';
import { syncNotification } from '../services/notificationService';

const KEY = 'user_progress';

const DEFAULT_PROGRESS: UserProgress = {
  streak: 15,
  lastStudyDate: new Date().toISOString().split('T')[0],
  completedLessons: ['g1', 'g2', 'g3', 'g4', 'g5', 'd1', 'd2', 'd3', 'a1', 'a2', 'a3'],
  learnedWords: ['v1', 'v2', 'v3', 'v6', 'v7', 'v8'],
  savedWords: ['v1', 'v2', 'v3', 'v6', 'v7', 'v8', 'v9', 'v10'],
  dailyGoal: { lessons: 2, words: 10 },
  todayCompleted: { lessons: 0, words: 7, date: new Date().toISOString().split('T')[0] },
  weeklyActivity: {},
};

async function save(progress: UserProgress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
  syncProgress(progress).catch(() => {});
}

export async function getProgress(): Promise<UserProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const today = new Date().toISOString().split('T')[0];

    if (!raw) {
      // Lần đầu chạy: đăng ký device và thử lấy progress từ server
      await registerDevice().catch(() => {});
      const serverProgress = await fetchProgress();
      const initial = serverProgress ?? DEFAULT_PROGRESS;
      if (initial.todayCompleted.date !== today) {
        initial.todayCompleted = { lessons: 0, words: 0, date: today };
        await updateStreak(initial);
      }
      await AsyncStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }

    const progress: UserProgress = JSON.parse(raw);
    if (progress.todayCompleted.date !== today) {
      progress.todayCompleted = { lessons: 0, words: 0, date: today };
      await updateStreak(progress);
    }
    return progress;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

async function updateStreak(progress: UserProgress) {
  const today = new Date().toISOString().split('T')[0];
  const last = progress.lastStudyDate;
  const diff = Math.floor((new Date(today).getTime() - new Date(last).getTime()) / 86400000);
  if (diff === 1) {
    progress.streak += 1;
  } else if (diff > 1) {
    progress.streak = 0;
  }
  progress.lastStudyDate = today;
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}

export async function markLessonCompleted(lessonId: string): Promise<void> {
  const progress = await getProgress();
  if (!progress.completedLessons.includes(lessonId)) {
    const today = new Date().toISOString().split('T')[0];
    progress.completedLessons.push(lessonId);
    progress.todayCompleted.lessons += 1;
    progress.lastStudyDate = today;
    progress.weeklyActivity[today] = (progress.weeklyActivity[today] ?? 0) + 1;
  }
  await save(progress);
  syncNotification(progress).catch(() => {});

  const inProgress: string[] = await getInProgressLessons();
  const updated = inProgress.filter(id => id !== lessonId);
  await AsyncStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(updated));
}

export async function markWordLearned(wordId: string): Promise<void> {
  const progress = await getProgress();
  if (!progress.learnedWords.includes(wordId)) {
    progress.learnedWords.push(wordId);
    progress.todayCompleted.words += 1;
  }
  await save(progress);
  syncNotification(progress).catch(() => {});
}

export async function toggleSavedWord(wordId: string): Promise<boolean> {
  const progress = await getProgress();
  const idx = progress.savedWords.indexOf(wordId);
  if (idx >= 0) {
    progress.savedWords.splice(idx, 1);
    await save(progress);
    return false;
  } else {
    progress.savedWords.push(wordId);
    await save(progress);
    return true;
  }
}

export async function updateDailyGoal(lessons: number, words: number): Promise<void> {
  const progress = await getProgress();
  progress.dailyGoal = { lessons, words };
  await save(progress);
}

const LAST_LESSON_KEY = 'last_lesson';
const IN_PROGRESS_KEY = 'in_progress_lessons';
const LESSON_HISTORY_KEY = 'lesson_history';

export interface LastLesson {
  topicId: string;
  sectionId: string;
  sectionTitle: string;
}

export interface LessonHistoryEntry {
  topicId: string;
  sectionId: string;
  lessonId: string;
}

export async function saveLastLesson(data: LastLesson): Promise<void> {
  await AsyncStorage.setItem(LAST_LESSON_KEY, JSON.stringify(data));
}

export async function getLastLesson(): Promise<LastLesson | null> {
  const raw = await AsyncStorage.getItem(LAST_LESSON_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getInProgressLessons(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(IN_PROGRESS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function markLessonInProgress(topicId: string, sectionId: string, lessonId: string): Promise<void> {
  const progress = await getProgress();
  if (progress.completedLessons.includes(lessonId)) return;

  const inProgress: string[] = await getInProgressLessons();
  if (!inProgress.includes(lessonId)) {
    await AsyncStorage.setItem(IN_PROGRESS_KEY, JSON.stringify([...inProgress, lessonId]));
  }

  const history: LessonHistoryEntry[] = await getLessonHistory();
  if (!history.some(e => e.lessonId === lessonId)) {
    await AsyncStorage.setItem(LESSON_HISTORY_KEY, JSON.stringify([...history, { topicId, sectionId, lessonId }]));
  }
}

export async function getLessonHistory(): Promise<LessonHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(LESSON_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
