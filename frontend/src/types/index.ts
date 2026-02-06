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


export interface CallanModeStats {
  qa: { total: number; correct: number; accuracy: number };
  shadowing: { total: number; practiced: number };
  dictation: { total: number; correct: number; accuracy: number };
}

export interface CallanProgressSummary {
  totalLessons: number;
  completedLessons: number;
  totalQAItems: number;
  practicedQAItems: number;
  byMode: CallanModeStats;
  streakDays: number;
}

// Listening Practice types
export interface ListeningPassage {
  id: string;
  title: string;
  text: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  topic: string | null;
  order: number;
  questions: ListeningQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ListeningQuestion {
  id: string;
  passageId: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options: string | null;
  answer: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListeningProgress {
  id: string;
  userId: number;
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
}

export interface ListeningProgressSummary {
  totalPassages: number;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

// Sound Change types
export interface SoundChangeCategory {
  id: string;
  name: string;
  nameJa: string;
  slug: string;
  description: string | null;
  order: number;
  exercises?: SoundChangeExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SoundChangeExercise {
  id: string;
  categoryId: string;
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  order: number;
  items?: SoundChangeExerciseItem[];
  category?: Pick<SoundChangeCategory, "name" | "nameJa" | "slug">;
  createdAt?: string;
  updatedAt?: string;
}

export interface SoundChangeExerciseItem {
  id: string;
  exerciseId: string;
  type: "fill_blank" | "dictation";
  audioPath: string;
  sentence: string;
  blank: string | null;
  blankIndex: number | null;
  explanation: string | null;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SoundChangeProgress {
  id: string;
  userId: number;
  itemId: string;
  accuracy: number;
  isCorrect: boolean;
  answeredAt: string;
}

export interface SoundChangeProgressSummary {
  totalCategories: number;
  totalItems: number;
  answeredItems: number;
  correctItems: number;
  averageAccuracy: number;
  byCategory: {
    categoryId: string;
    name: string;
    totalExercises: number;
    totalItems: number;
    answeredItems: number;
    averageAccuracy: number;
  }[];
}
