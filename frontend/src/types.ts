export interface Answer {
  text: string;
  weight?: number | null;
}

export interface Question {
  id: number;
  text: string;
  answers: Answer[];
}

export type GameMode = 'host' | 'auto';

export interface GameStatus {
  code: string;
  mode: GameMode;
  status: 'waiting' | 'playing' | 'completed';
  question: Question | null;
  revealed_answers: Answer[];
  score: number;
  strikes: number;
  max_strikes: number;
  current_index: number | null;
  total_questions: number;
  total_answers: number;
  is_host: boolean;
}

export interface GuessResponse {
  correct: boolean;
  answer?: Answer;
  message?: string;
  strikes: number;
  score: number;
  advanced: boolean;
  status: GameStatus;
}
