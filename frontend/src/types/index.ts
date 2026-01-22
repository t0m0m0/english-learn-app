export interface Word {
  id: number;
  word: string;
  frequency: number;
  partOfSpeech: string | null;
  createdAt?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
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

export type LearningMode = 'direct-connect' | 'listening' | 'mixing';

export interface MixingWord {
  verb: Word;
  noun: Word;
  adjective: Word;
}
