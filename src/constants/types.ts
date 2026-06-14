export interface Topic {
  id: string;
  title: string;
  lessonCount: number;
  completedLessons: number;
  iconColor: readonly string[];
  iconName: string;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  lessonCount: number;
  completedLessons: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  isCompleted?: boolean;
  parts: ListeningPart[];
}

export interface ListeningPart {
  id: string;
  audioUrl: string;
  transcript: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  topicId: string;
  topicName: string;
  isSaved?: boolean;
  isLearned?: boolean;
}

export interface UserProgress {
  streak: number;
  lastStudyDate: string;
  completedLessons: string[];
  learnedWords: string[];
  savedWords: string[];
  dailyGoal: {
    lessons: number;
    words: number;
  };
  todayCompleted: {
    lessons: number;
    words: number;
    date: string;
  };
  weeklyActivity: Record<string, number>; // 'YYYY-MM-DD' → lessons completed
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  earned: boolean;
  earnedDate?: string;
}
