'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Pencil, Plus, RotateCcw } from 'lucide-react';
import { BRAND_GRADIENT, BRAND_STRIPES } from '@/lib/generations';
import type { Team } from '@/lib/types';

type Props = {
  teams: Team[];
  activeIndex: number;
  onAdjust: (teamId: string, delta: number) => void;
  onNewGame: () => void;
};

export default function Scoreboard({ teams, activeIndex, onAdjust, onNewGame }: Props) {
  const [editing, setEditing] = useState(false);
  const refs = useRef<Record<string, HTMLLIElement | null>>({});
  const activeId = teams[activeIndex]?.id;

  useEffect(() => {
    if (!activeId) return;
    refs.current[activeId]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[#0c0a16]/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="h-1.5 w-full" style={{ backgroundImage: BRAND_STRIPES }} aria-hidden />

      <div className="flex items-center justify-between px-4 pt-3">
        <span className="font-display text-lg">Generation Gap</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-pressed={editing}
            className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
              editing ? 'border-white bg-white text-ink' : 'border-line bg-panel text-white'
            }`}
          >
            {editing ? <Check className="h-4 w-4" aria-hidden /> : <Pencil className="h-4 w-4" aria-hidden />}
            {editing ? 'Done' : 'Edit scores'}
          </button>
          <button
            type="button"
            onClick={onNewGame}
            aria-label="Start a new game"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-panel text-muted transition-colors hover:text-white"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-4 pb-3 pt-3">
        {teams.map((team, i) => {
          const active = i === activeIndex;
          return (
            <li
              key={team.id}
              ref={(el) => {
                refs.current[team.id] = el;
              }}
              aria-current={active ? 'true' : undefined}
              className="w-36 shrink-0 snap-center rounded-2xl border-2 border-transparent px-3 py-2.5"
              style={{
                background: active
                  ? `linear-gradient(#1f1a35,#1f1a35) padding-box, ${BRAND_GRADIENT} border-box`
                  : 'linear-gradient(#171329,#171329) padding-box, linear-gradient(#2c2646,#2c2646) border-box',
                boxShadow: active ? '0 0 22px -8px #FF4FA3' : undefined,
              }}
            >
              <p className="truncate text-sm font-semibold text-white">{team.name}</p>
              <p className="text-xs text-muted">{active ? 'Up now' : 'Waiting'}</p>
              <div className="mt-1 flex items-center justify-between">
                {editing && (
                  <button
                    type="button"
                    onClick={() => onAdjust(team.id, -1)}
                    aria-label={`Subtract a point from ${team.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-raised text-white active:scale-95"
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </button>
                )}
                <span
                  className={`font-display text-3xl tabular-nums ${editing ? '' : 'w-full text-left'}`}
                  aria-label={`${team.score} points`}
                >
                  {team.score}
                </span>
                {editing && (
                  <button
                    type="button"
                    onClick={() => onAdjust(team.id, 1)}
                    aria-label={`Add a point to ${team.name}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-raised text-white active:scale-95"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
