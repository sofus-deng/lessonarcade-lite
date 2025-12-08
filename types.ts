
export type Audience = 'beginner' | 'intermediate' | 'advanced' | 'professional' | 'child';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // Only for multiple_choice
  correctAnswer?: string; // For internal reference/rubric
  explanation?: string; // Pre-generated explanation
  points: number;
}

export interface LessonLevel {
  id: string;
  title: string;
  description: string;
  timeRangeStart?: string; // e.g., "02:30"
  timeRangeEnd?: string;
  questions: QuizQuestion[];
}

export interface LessonProject {
  id: string;
  videoUrl: string;
  videoTitle: string;
  videoDescription: string;
  audience: Audience;
  difficulty: Difficulty;
  levels: LessonLevel[];
}

export interface EvaluationResult {
  isCorrect: boolean; // For MCQ
  score: number; // 0-100 for short answer, 0 or 100 for MCQ
  classification: 'correct' | 'partially_correct' | 'incorrect';
  feedback: string;
}

export interface PlaySession {
  currentLevelId: string | null;
  answers: Record<string, EvaluationResult>; // Keyed by question ID
  score: number;
  streak: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  accuracy: number; // 0-100
  completedAt: number; // timestamp
}
