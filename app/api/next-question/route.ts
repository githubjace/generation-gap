import { NextResponse } from 'next/server';
import { isGenKey } from '@/lib/generations';
import { getNextQuestion } from '@/lib/trivia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { generation, seenIds } = (body ?? {}) as { generation?: unknown; seenIds?: unknown };
  if (!isGenKey(generation)) {
    return NextResponse.json({ error: 'Unknown generation.' }, { status: 400 });
  }

  const seen = Array.isArray(seenIds)
    ? seenIds.filter((x): x is string => typeof x === 'string' && UUID.test(x)).slice(0, 2000)
    : [];

  try {
    const result = await getNextQuestion(generation, seen);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[next-question]', e);
    const message = e instanceof Error ? e.message : 'Something went wrong. Try again.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
