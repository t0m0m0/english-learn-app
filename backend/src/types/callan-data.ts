export interface QAItemData {
  question: string;
  answer: string;
}

export interface LessonData {
  lesson: number;
  title: string;
  description: string;
  qaItems: QAItemData[];
}

export interface StageData {
  stage: number;
  title: string;
  description: string;
  lessons: LessonData[];
}

export interface CallanData {
  stages: StageData[];
}
