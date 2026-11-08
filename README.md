# Generation Gap

A mobile-first trivia companion for game night. Five generations, 2–6 teams, no sign-in, and a question bank that never runs dry: Supabase stores the questions and Gemini writes new ones when a category runs low.

## 1. Install

```bash
npm install
```

Or, starting from scratch:

```bash
npm install next react react-dom framer-motion lucide-react @supabase/supabase-js @google/genai
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss@3 postcss autoprefixer
```

## 2. Set up Supabase

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql`, and run it. This creates the `trivia_questions` table and loads 50 starter questions (10 per generation).
3. In **Project Settings → API**, copy the project URL and the `service_role` key.

## 3. Add environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep secret) |
| `GEMINI_API_KEY` | aistudio.google.com/apikey |

All three are read on the server only. The browser never talks to Supabase or Gemini directly, and row-level security is on with no public policies.

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000.

## 5. Deploy to Vercel

Push to GitHub, import the repo in Vercel, and add the same three environment variables in **Project Settings → Environment Variables**. The API routes set `maxDuration = 60`, which is the Hobby plan limit.

## How the question flow works

1. A team taps a generation. The page posts `{ generation, seenIds }` to `/api/next-question`.
2. The server lists that generation's question ids and removes the ones already seen in this game.
3. If fewer than 3 unplayed questions remain, it calls Gemini (`gemini-2.5-flash`) for 5 new questions, checks them (short answer present, no duplicates), saves them to Supabase, and serves one right away.
4. If Gemini fails but unplayed questions remain, the game keeps going with those. If none remain, the team sees a clear message and can pick another generation.
5. Cards are open-ended: teams discuss and answer out loud, tap **Show answer** to see the answer and a fun fact, then award the point themselves.

`/api/generate-trivia` exposes the same generator on its own (`POST { "generation": "genz" }`).

## Game state

Teams, scores, whose turn it is, the current card, and the list of seen question ids are saved to `localStorage` (`generation-gap:v1`), so a refresh or a locked phone doesn't lose the game. Starting a new game clears it.

## Project layout

```
app/page.tsx                    game state + localStorage persistence
app/api/next-question/route.ts  picks an unseen question, tops up with Gemini
app/api/generate-trivia/route.ts  standalone "write 5 new questions" endpoint
components/TeamSetup.tsx
components/Scoreboard.tsx
components/GenerationSelector.tsx
components/TriviaCard.tsx
lib/trivia.ts                   Supabase + Gemini logic
lib/generations.ts              generation names, colors, era guidance
supabase/schema.sql             table, RLS, and 50 seed questions
```

## Things to know

- **Generated facts can be wrong.** Gemini's prompt asks for verifiable facts and the server rejects malformed output, but it can't fact-check. Skim the `trivia_questions` table now and then and delete anything off.
- **The generator endpoints are open.** Anyone who finds them can trigger Gemini calls. Before sharing the URL widely, add rate limiting (Vercel Firewall rules work well).
- **Shadcn UI** isn't used; the components are plain Tailwind to keep the install small.
