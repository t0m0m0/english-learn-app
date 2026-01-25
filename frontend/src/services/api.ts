import axios from 'axios';
import type { Word, Progress, Statistics, DailyStats, Lesson, QAItem, CallanProgress } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Default user ID for all operations (authentication removed)
export const DEFAULT_USER_ID = 1;

// Words API
export const wordsApi = {
  getAll: async (page = 1, limit = 20) => {
    const response = await api.get<{
      words: Word[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/words?page=${page}&limit=${limit}`);
    return response.data;
  },

  getByRange: async (start: number, end: number) => {
    const response = await api.get<{ words: Word[]; count: number }>(
      `/words/range/${start}/${end}`
    );
    return response.data;
  },

  getRandom: async (count = 10, maxFrequency = 3000) => {
    const response = await api.get<{ words: Word[] }>(
      `/words/random?count=${count}&maxFrequency=${maxFrequency}`
    );
    return response.data;
  },

  getByPartOfSpeech: async (pos: string, count = 10) => {
    const response = await api.get<{ words: Word[] }>(
      `/words/pos/${pos}?count=${count}`
    );
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<{ word: Word }>(`/words/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<{ words: Word[] }>(`/words/search/${query}`);
    return response.data;
  },
};

// Progress API
export const progressApi = {
  getUserProgress: async (userId: number = DEFAULT_USER_ID) => {
    const response = await api.get<{ progress: Progress[]; statistics: Statistics }>(
      `/progress/user/${userId}`
    );
    return response.data;
  },

  getReviewWords: async (userId: number = DEFAULT_USER_ID, limit = 20) => {
    const response = await api.get<{ words: Progress[] }>(
      `/progress/review/${userId}?limit=${limit}`
    );
    return response.data;
  },

  getNewWords: async (userId: number = DEFAULT_USER_ID, limit = 10, maxFrequency = 1000) => {
    const response = await api.get<{ words: Word[] }>(
      `/progress/new/${userId}?limit=${limit}&maxFrequency=${maxFrequency}`
    );
    return response.data;
  },

  updateProgress: async (userId: number = DEFAULT_USER_ID, wordId: number, correct: boolean) => {
    const response = await api.post<{ progress: Progress }>('/progress/update', {
      userId,
      wordId,
      correct,
    });
    return response.data;
  },

  getStats: async (userId: number = DEFAULT_USER_ID) => {
    const response = await api.get<DailyStats>(`/progress/stats/${userId}`);
    return response.data;
  },
};

// Lessons API
export const lessonsApi = {
  getAll: async (userId: number = DEFAULT_USER_ID) => {
    const response = await api.get<{ lessons: Lesson[] }>(`/lessons?userId=${userId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ lesson: Lesson }>(`/lessons/${id}`);
    return response.data;
  },

  create: async (data: { title: string; description?: string; order: number; userId?: number }) => {
    const response = await api.post<{ lesson: Lesson }>('/lessons', {
      ...data,
      userId: data.userId ?? DEFAULT_USER_ID,
    });
    return response.data;
  },

  update: async (id: string, data: { title?: string; description?: string; order?: number }) => {
    const response = await api.put<{ lesson: Lesson }>(`/lessons/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/lessons/${id}`);
    return response.data;
  },
};

// QA Items API
export const qaItemsApi = {
  create: async (lessonId: string, data: { question: string; answer: string; order: number }) => {
    const response = await api.post<{ qaItem: QAItem }>(`/lessons/${lessonId}/qa-items`, data);
    return response.data;
  },

  update: async (id: string, data: { question?: string; answer?: string; order?: number }) => {
    const response = await api.put<{ qaItem: QAItem }>(`/qa-items/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/qa-items/${id}`);
    return response.data;
  },

  reorder: async (lessonId: string, items: { id: string; order: number }[]) => {
    const response = await api.put<{ message: string }>(`/lessons/${lessonId}/qa-items/reorder`, { items });
    return response.data;
  },
};

// Callan Progress API
export const callanProgressApi = {
  recordProgress: async (data: {
    userId?: number;
    qaItemId: string;
    mode: 'qa' | 'shadowing' | 'dictation';
    isCorrect: boolean;
  }) => {
    const response = await api.post<{ progress: CallanProgress }>('/callan/progress', {
      ...data,
      userId: data.userId ?? DEFAULT_USER_ID,
    });
    return response.data;
  },

  getLessonProgress: async (lessonId: string, userId: number = DEFAULT_USER_ID, mode?: 'qa' | 'shadowing' | 'dictation') => {
    const params = new URLSearchParams({ userId: userId.toString() });
    if (mode) {
      params.append('mode', mode);
    }
    const response = await api.get<{ progress: CallanProgress[] }>(
      `/callan/progress/${lessonId}?${params.toString()}`
    );
    return response.data;
  },
};

export default api;
