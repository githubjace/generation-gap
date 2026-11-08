'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Loader2 } from 'lucide-react';
import { GENERATIONS } from '@/lib/generations';
import type { GenKey } from '@/lib/types';

type Props = {
  teamName: string;
  loadingKey: GenKey | null;
  error: string | null;
  onPick: (key: GenKey) => void;
};

export default function GenerationSelector({ teamName, loadingKey, error, onPick }: Props) {
  const busy = loadingKey !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="font-display text-2xl leading-tight">{teamName}, pick a generation</h2>
      <p className="mt-1 text-sm text-muted">Tap a card to draw a question from that era.</p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-400/50 bg-red-500/10 px-4 py-3 text-sm text-red-100"
        >
          {error}
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {GENERATIONS.map((g) => {
          const isLoading = loadingKey === g.key;
          return (
            <li key={g.key}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={busy}
                onClick={() => onPick(g.key)}
                aria-busy={isLoading}
                className="flex w-full items-center gap-4 rounded-2xl border-2 border-transparent px-4 py-4 text-left transition-opacity disabled:cursor-wait"
                style={{
                  background: `linear-gradient(#171329,#171329) padding-box, linear-gradient(135deg, ${g.c1}, ${g.c2}) border-box`,
                  boxShadow: `0 0 28px -10px ${g.c1}`,
                  opacity: busy && !isLoading ? 0.45 : 1,
                }}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-display text-xl"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${g.c1}, ${g.c2})`,
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {g.label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-white">{g.years}</span>
                  <span className="block text-sm text-muted">
                    {isLoading ? 'Drawing a card…' : g.tagline}
                  </span>
                </span>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 shrink-0 animate-spin" style={{ color: g.accent }} aria-hidden />
                ) : (
                  <ChevronRight className="h-6 w-6 shrink-0" style={{ color: g.accent }} aria-hidden />
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
