export interface Answer {
  text: string;
  weight?: number | null;
}

export interface Question {
  id: number;
  text: string;
  answers: Answer[];
}

export interface GameStatus {
  question: Question | null;
  revealed_answers: Answer[];
  score: number;
  strikes: number;
  max_strikes: number;
  completed: boolean;
  current_index: number | null;
  total_questions: number;
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
