
export interface TimeBlockState {
  hour: number;
  subject: string;
  duration: number; // in minutes
  date: string; // ISO string
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: any;
  userId: string;
  order: number;
  parentId: string | null;
}

export interface DailySummary {
  id: string; // YYYY-MM-DD
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  subjectMinutes: {
    [subjectId: string]: number;
  };
}

export interface UserSettings {
  sleepHours: number[];
  subjects: Subject[];
  language: 'english' | 'sinhala';
  enableTimer: boolean;
  enableDailyChallenge: boolean;
  enableTodoList: boolean;
  enableAiInsights: boolean;
  disableEditRestriction: boolean;
  streakGoal: number; // in hours
  hasCompletedOnboarding: boolean;
}
