'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import TeamSetup from '@/components/TeamSetup';
import Scoreboard from '@/components/Scoreboard';
import GenerationSelector from '@/components/GenerationSelector';
import TriviaCard from '@/components/TriviaCard';
import { GEN_KEYS } from '@/lib/generations';
import type { GameState, GenKey, Team, TriviaQuestion } from '@/lib/types';

const STORAGE_KEY = 'generation-gap:v1';

function emptySeen(): Record<GenKey, string[]> {
  return Object.fromEntries(GEN_KEYS.map((k) => [k, [] as string[]])) as Record<GenKey, string[]>;
}

function initialState(): GameState {
  return { phase: 'setup', teams: [], activeIndex: 0, seen: emptySeen(), current: null };
}

function makeId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function isTeam(t: unknown): t is Team {
  const r = t as Team;
  return !!r && typeof r.id === 'string' && typeof r.name === 'string' && typeof r.score === 'number';
}

function isQuestion(q: unknown): q is TriviaQuestion {
  const r = q as TriviaQuestion;
  return (
    !!r &&
    typeof r.id === 'string' &&
    typeof r.question === 'string' &&
    typeof r.correct_answer === 'string' &&
    GEN_KEYS.includes(r.generation)
  );
}

/** Reads a saved game from localStorage, falling back to a fresh setup screen. */
function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    const saved = JSON.parse(raw) as Partial<GameState>;
    if (saved.phase !== 'play' || !Array.isArray(saved.teams)) return initialState();

    const teams = saved.teams.filter(isTeam);
    if (teams.length < 2) return initialState();

    const seen = emptySeen();
    for (const k of GEN_KEYS) {
      const list = saved.seen?.[k];
      if (Array.isArray(list)) seen[k] = list.filter((x): x is string => typeof x === 'string');
    }

    const activeIndex =
      typeof saved.activeIndex === 'number' && saved.activeIndex >= 0 && saved.activeIndex < teams.length
        ? saved.activeIndex
        : 0;

    const current =
      saved.current && isQuestion(saved.current.question)
        ? { question: saved.current.question, revealed: Boolean(saved.current.revealed) }
        : null;

    return { phase: 'play', teams, activeIndex, seen, current };
  } catch {
    return initialState();
  }
}

export default function Page() {
  const [game, setGame] = useState<GameState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [loadingKey, setLoadingKey] = useState<GenKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore a saved game after the first client render (avoids a hydration mismatch).
  useEffect(() => {
    setGame(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      // Storage can be full or blocked (private mode). The game still works without it.
    }
  }, [game, hydrated]);

  const startGame = useCallback((names: string[]) => {
    setError(null);
    setGame({
      phase: 'play',
      teams: names.map((name) => ({ id: makeId(), name, score: 0 })),
      activeIndex: 0,
      seen: emptySeen(),
      current: null,
    });
  }, []);

  const newGame = useCallback(() => {
    if (window.confirm('End this game and start over? Scores will be lost.')) {
      setError(null);
      setLoadingKey(null);
      setGame(initialState());
    }
  }, []);

  const pickGeneration = useCallback(
    async (generation: GenKey) => {
      if (loadingKey) return;
      setLoadingKey(generation);
      setError(null);
      try {
        const res = await fetch('/api/next-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ generation, seenIds: game.seen[generation] }),
        });
        const data = (await res.json().catch(() => null)) as
          | { question?: TriviaQuestion; error?: string }
          | null;
        if (!res.ok || !data?.question) {
          throw new Error(data?.error ?? 'Could not load a question. Try again.');
        }
        const question = data.question;
        setGame((g) => ({
          ...g,
          seen: { ...g.seen, [generation]: [...g.seen[generation], question.id] },
          current: { question, revealed: false },
        }));
      } catch (e) {
        setError(
          e instanceof TypeError
            ? 'No connection. Check your signal and try again.'
            : e instanceof Error
              ? e.message
              : 'Could not load a question. Try again.',
        );
      } finally {
        setLoadingKey(null);
      }
    },
    [loadingKey, game.seen],
  );

  const reveal = useCallback(() => {
    setGame((g) => (g.current ? { ...g, current: { ...g.current, revealed: true } } : g));
  }, []);

  const skip = useCallback(() => {
    setGame((g) => ({ ...g, current: null }));
  }, []);

  /** Awards the point (if correct), clears the card, and passes the turn. */
  const finishTurn = useCallback((correct: boolean) => {
    setGame((g) => {
      if (!g.current) return g;
      return {
        ...g,
        teams: g.teams.map((t, i) => (i === g.activeIndex && correct ? { ...t, score: t.score + 1 } : t)),
        activeIndex: (g.activeIndex + 1) % g.teams.length,
        current: null,
      };
    });
  }, []);

  const adjustScore = useCallback((teamId: string, delta: number) => {
    setGame((g) => ({
      ...g,
      teams: g.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + delta } : t)),
    }));
  }, []);

  const activeTeam = game.teams[game.activeIndex];

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
        {!hydrated ? null : game.phase === 'setup' ? (
          <TeamSetup onStart={startGame} />
        ) : (
          <>
            <Scoreboard
              teams={game.teams}
              activeIndex={game.activeIndex}
              onAdjust={adjustScore}
              onNewGame={newGame}
            />
            <section className="flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
              <AnimatePresence mode="wait">
                {game.current ? (
                  <TriviaCard
                    key={game.current.question.id}
                    question={game.current.question}
                    teamName={activeTeam?.name ?? ''}
                    revealed={game.current.revealed}
                    onReveal={reveal}
                    onScore={finishTurn}
                    onSkip={skip}
                  />
                ) : (
                  <GenerationSelector
                    key="selector"
                    teamName={activeTeam?.name ?? ''}
                    loadingKey={loadingKey}
                    error={error}
                    onPick={pickGeneration}
                  />
                )}
              </AnimatePresence>
            </section>
          </>
        )}
      </main>
    </MotionConfig>
  );
}
