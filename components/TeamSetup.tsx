'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { BRAND_STRIPES, GENERATIONS } from '@/lib/generations';

const MIN_TEAMS = 2;
const MAX_TEAMS = 6;
const DEFAULT_NAMES = [
  'Boomer Busters',
  'Gen Z Zoomers',
  'Millennial Meltdown',
  'Gen X Slackers',
  'Alpha Aces',
  'Trivia Newton-John',
];

type Props = { onStart: (names: string[]) => void };
type Slot = { id: number; name: string };

export default function TeamSetup({ onStart }: Props) {
  const nextId = useRef(2);
  const [slots, setSlots] = useState<Slot[]>([
    { id: 0, name: '' },
    { id: 1, name: '' },
  ]);

  const addTeam = () => {
    setSlots((s) => (s.length >= MAX_TEAMS ? s : [...s, { id: nextId.current++, name: '' }]));
  };
  const removeTeam = (id: number) => {
    setSlots((s) => (s.length <= MIN_TEAMS ? s : s.filter((x) => x.id !== id)));
  };
  const rename = (id: number, name: string) => {
    setSlots((s) => s.map((x) => (x.id === id ? { ...x, name } : x)));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(slots.map((s, i) => s.name.trim() || DEFAULT_NAMES[i]));
  };

  return (
    <motion.div
      className="flex min-h-dvh flex-col"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="h-2 w-full" style={{ backgroundImage: BRAND_STRIPES }} aria-hidden />

      <div className="flex flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10">
        <h1 className="title-retro font-display text-5xl leading-[1.05] sm:text-6xl">
          Generation
          <br />
          Gap
        </h1>
        <p className="mt-4 max-w-sm text-base text-muted">
          Trivia that spans every age at the table. Add your teams, then take turns drawing cards.
        </p>

        <form onSubmit={submit} className="mt-8 flex flex-1 flex-col">
          <fieldset className="space-y-3">
            <legend className="mb-3 text-sm font-semibold text-white">
              Teams ({slots.length} of {MAX_TEAMS})
            </legend>
            {slots.map((slot, i) => {
              const gen = GENERATIONS[i % GENERATIONS.length];
              return (
                <motion.div
                  key={slot.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-stretch gap-2"
                >
                  <span
                    className="w-1.5 shrink-0 rounded-full"
                    style={{ background: gen.accent }}
                    aria-hidden
                  />
                  <input
                    value={slot.name}
                    onChange={(e) => rename(slot.id, e.target.value)}
                    placeholder={DEFAULT_NAMES[i]}
                    maxLength={20}
                    aria-label={`Team ${i + 1} name`}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-3.5 text-base text-white placeholder:text-muted/70"
                  />
                  {slots.length > MIN_TEAMS && (
                    <button
                      type="button"
                      onClick={() => removeTeam(slot.id)}
                      aria-label={`Remove team ${i + 1}`}
                      className="flex w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-white"
                    >
                      <X className="h-5 w-5" aria-hidden />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </fieldset>

          {slots.length < MAX_TEAMS && (
            <button
              type="button"
              onClick={addTeam}
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-line px-4 py-3.5 text-sm font-semibold text-muted transition-colors hover:border-white/40 hover:text-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add team
            </button>
          )}

          <div className="mt-auto pt-10">
            <button
              type="submit"
              className="w-full rounded-2xl px-6 py-4 font-display text-xl text-ink transition-transform active:scale-[0.98]"
              style={{ backgroundImage: 'linear-gradient(90deg, #FFB703, #FF4FA3)' }}
            >
              Start game
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
