import { UserProgress } from '../constants/types';
import { getDeviceId } from '../utils/deviceId';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://daily-english-backend-zzmv.onrender.com';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  console.log('[API] request →', options?.method ?? 'GET', url);
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      console.error('[API] error →', res.status, url);
      throw new Error(`API ${options?.method ?? 'GET'} ${path} → ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error('[API] failed →', url, err);
    throw err;
  }
}

export async function registerDevice(): Promise<void> {
  const deviceId = await getDeviceId();
  await request('/api/v1/devices', {
    method: 'POST',
    body: JSON.stringify({ deviceId, platform: 'android' }),
  });
}

export async function fetchProgress(): Promise<UserProgress | null> {
  try {
    const deviceId = await getDeviceId();
    const data = await request<{ progress: UserProgress }>(`/api/v1/devices/${deviceId}/progress`);
    return data.progress;
  } catch {
    return null;
  }
}

export async function syncProgress(progress: UserProgress): Promise<void> {
  const deviceId = await getDeviceId();
  await request(`/api/v1/devices/${deviceId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress }),
  });
}

// --- Content API ---

export interface ApiTopic {
  id: string;
  title: string;
  iconName: string;
  iconColor: string[];
  sortOrder: number;
  isActive: boolean;
}

export interface ApiSection {
  id: string;
  topicId: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface ApiLesson {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  duration?: string;
  sortOrder: number;
}

export const fetchTopics = () =>
  request<{ topics: ApiTopic[] }>('/api/v1/topics').then(d => {
    console.log('[API] fetchTopics →', d.topics.length, 'topics', d.topics);
    return d.topics.map(t => ({
      ...t,
      iconName: t.iconName ?? 'book',
      iconColor: Array.isArray(t.iconColor) ? t.iconColor : ['#3B82F6', '#1560FC'],
    }));
  });

export const fetchSections = (topicId: string) =>
  request<{ sections: ApiSection[] }>(`/api/v1/topics/${topicId}/sections`).then(d => {
    console.log('[API] fetchSections →', d.sections.length, 'sections', d.sections);
    return d.sections;
  });

export const fetchLessons = (topicId: string, sectionId: string) =>
  request<{ lessons: ApiLesson[] }>(`/api/v1/topics/${topicId}/sections/${sectionId}/lessons`).then(d => {
    console.log('[API] fetchLessons →', d.lessons.length, 'lessons', d.lessons);
    return d.lessons;
  });

export interface ApiListeningPart {
  id: string;
  lessonId: string;
  audioUrl: string;
  transcript: string | null;
  sortOrder: number;
}

export const fetchListeningParts = (topicId: string, sectionId: string, lessonId: string) =>
  request<{ parts: ApiListeningPart[] }>(`/api/v1/topics/${topicId}/sections/${sectionId}/lessons/${lessonId}/parts`).then(d => {
    console.log('[API] fetchListeningParts →', d.parts.length, 'parts');
    return d.parts;
  });

// --- Vocabulary API ---

export interface WordDefinition {
  definition: string;
  example?: string;
}

export interface WordMeaning {
  partOfSpeech: string;
  definitions: WordDefinition[];
}

export interface WordDetails {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  audioUrl: string | null;
  meanings?: WordMeaning[];
}

export async function fetchVocabularyWord(word: string): Promise<WordDetails | null> {
  try {
    const data = await request<{ word: WordDetails }>(`/api/v1/vocabulary/word/${encodeURIComponent(word.toLowerCase())}`);
    return data.word;
  } catch {
    return null;
  }
}

export async function fetchVocabularyTopics(): Promise<string[]> {
  try {
    const data = await request<{ topics: string[] }>('/api/v1/vocabulary/topics');
    return data.topics;
  } catch {
    return [];
  }
}

export async function fetchRandomVocabularyWords(topic: string | null, count: number): Promise<string[]> {
  const params = new URLSearchParams({ count: String(count) });
  if (topic) params.set('topic', topic);
  const data = await request<{ words: string[] }>(`/api/v1/vocabulary/random?${params}`);
  return data.words;
}
