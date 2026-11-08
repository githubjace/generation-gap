'use client';

import { motion } from 'framer-motion';
import { Check, Eye, Lightbulb, Lock, SkipForward } from 'lucide-react';
import { getGeneration } from '@/lib/generations';
import type { TriviaQuestion } from '@/lib/types';

type Props = {
  question: TriviaQuestion;
  teamName: string;
  revealed: boolean;
  onReveal: () => void;
  onScore: (correct: boolean) => void;
  onSkip: () => void;
};

export default function TriviaCard({ question, teamName, revealed, onReveal, onScore, onSkip }: Props) {
  const gen = getGeneration(question.generation);

  return (
    <div style={{ perspective: 1200 }}>
      <motion.article
        initial={{ rotateY: -75, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        exit={{ rotateY: 75, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="rounded-3xl border-2 border-transparent p-5"
        style={{
          background: `linear-gradient(#171329,#171329) padding-box, linear-gradient(135deg, ${gen.c1}, ${gen.c2}) border-box`,
          boxShadow: `0 0 40px -12px ${gen.c1}`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-ink"
            style={{ background: gen.accent }}
          >
            {gen.label}
          </span>
          <span className="truncate text-sm text-muted">For {teamName}</span>
        </div>

        <h2 className="mt-4 text-2xl font-semibold leading-snug text-white sm:text-3xl">{question.question}</h2>

        <div aria-live="polite" className="mt-6">
          {!revealed ? (
            <div className="flex min-h-[7rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-5 text-center">
              <Lock className="h-5 w-5 text-muted" aria-hidden />
              <p className="text-sm text-muted">Talk it over, say your answer, then reveal it to check.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div
                className="rounded-2xl border-2 px-4 py-4"
                style={{ borderColor: gen.accent, background: `${gen.accent}1f` }}
              >
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: gen.accent }}>
                  <Check className="h-4 w-4" aria-hidden />
                  Answer
                </p>
                <p className="mt-1 text-2xl font-bold leading-snug text-white">{question.correct_answer}</p>
              </div>

              {question.explanation && (
                <div className="flex gap-3 rounded-xl border border-line bg-raised px-4 py-3">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" style={{ color: gen.accent }} aria-hidden />
                  <p className="text-sm leading-relaxed text-white">{question.explanation}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {!revealed ? (
            <>
              <button
                type="button"
                onClick={onReveal}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-display text-lg text-ink transition-transform active:scale-[0.98]"
                style={{ background: gen.accent }}
              >
                <Eye className="h-5 w-5" aria-hidden />
                Show answer
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted transition-colors hover:text-white"
              >
                <SkipForward className="h-4 w-4" aria-hidden />
                Skip this question
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onScore(true)}
                className="w-full rounded-2xl px-6 py-4 font-display text-lg text-ink transition-transform active:scale-[0.98]"
                style={{ background: gen.accent }}
              >
                +1 Point (Correct)
              </button>
              <button
                type="button"
                onClick={() => onScore(false)}
                className="w-full rounded-2xl border-2 border-line bg-raised px-6 py-4 font-display text-lg text-white transition-transform active:scale-[0.98]"
              >
                0 Points (Incorrect)
              </button>
            </>
          )}
        </div>
      </motion.article>
    </div>
  );
}
