import { NextResponse } from 'next/server';
import { isGenKey } from '@/lib/generations';
import { generateAndStore } from '@/lib/trivia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Creates a batch of 5 new questions with Gemini, saves them to Supabase,
 * and returns one of them. /api/next-question calls the same logic automatically
 * whenever fewer than 3 unplayed questions remain.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { generation } = (body ?? {}) as { generation?: unknown };
  if (!isGenKey(generation)) {
    return NextResponse.json({ error: 'Unknown generation.' }, { status: 400 });
  }

  try {
    const created = await generateAndStore(generation);
    const question = created[Math.floor(Math.random() * created.length)];
    return NextResponse.json({ question, added: created.length });
  } catch (e) {
    console.error('[generate-trivia]', e);
    const message = e instanceof Error ? e.message : 'Could not generate questions.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
