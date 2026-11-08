export type GenKey = 'boomer' | 'genx' | 'millennial' | 'genz' | 'genalpha';

export type TriviaQuestion = {
  id: string;
  generation: GenKey;
  question: string;
  correct_answer: string;
  explanation: string;
};

export type Team = { id: string; name: string; score: number };

export type GameState = {
  phase: 'setup' | 'play';
  teams: Team[];
  activeIndex: number;
  /** Question ids already shown in this game, per generation. */
  seen: Record<GenKey, string[]>;
  current: { question: TriviaQuestion; revealed: boolean } | null;
};
