export interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
  createdAt?: string;
}

export interface Progress {
  id: number;
  userId: number;
  wordId: number;
  level: number;
  lastReviewed: string | null;
  nextReview: string | null;
  reviewCount: number;
  correctCount: number;
  word?: Word;
}

export interface Statistics {
  totalWords: number;
  learnedWords: number;
  masteredWords: number;
  progressPercent: number;
  masteryPercent: number;
}

export interface DailyStats {
  todayReviews: number;
  totalLearned: number;
  averageLevel: number;
  levelDistribution: { level: number; _count: number }[];
}

export interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    username: string;
  };
}

export type LearningMode = "direct-connect" | "listening" | "mixing";

export interface MixingWord {
  verb: Word;
  noun: Word;
  adjective: Word;
}

// Callan Method types
export interface QAItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  lessonId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order: number;
  userId: number;
  qaItems: QAItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CallanProgress {
  id: string;
  userId: number;
  qaItemId: string;
  mode: "qa" | "shadowing" | "dictation";
  correctCount: number;
  totalCount: number;
  lastPracticed: string | null;
  createdAt?: string;
  updatedAt?: string;
}
