import { GoogleGenAI, Type } from '@google/genai';
import { getSupabase } from './supabase';
import { getGeneration } from './generations';
import type { GenKey, TriviaQuestion } from './types';

const MODEL = 'gemini-2.5-flash';
const BATCH_SIZE = 5;
/** When fewer unplayed questions than this remain, ask Gemini for more. */
const MIN_UNPLAYED = 3;

type Row = {
  id: string;
  generation: GenKey;
  question: string;
  correct_answer: string;
  explanation: string | null;
};

type Candidate = {
  question: string;
  correct_answer: string;
  explanation: string;
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function toQuestion(row: Row): TriviaQuestion {
  return {
    id: row.id,
    generation: row.generation,
    question: row.question,
    correct_answer: row.correct_answer,
    explanation: row.explanation ?? '',
  };
}

function cleanCandidates(raw: unknown, known: Set<string>): Candidate[] {
  if (!Array.isArray(raw)) return [];
  const out: Candidate[] = [];
  const seenInBatch = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.question !== 'string' || typeof r.correct_answer !== 'string') continue;

    const question = r.question.trim();
    const answer = r.correct_answer.trim();
    if (!question || !answer || answer.length > 80) continue;

    const key = normalize(question);
    if (known.has(key) || seenInBatch.has(key)) continue;

    seenInBatch.add(key);
    out.push({
      question,
      correct_answer: answer,
      explanation: typeof r.explanation === 'string' ? r.explanation.trim() : '',
    });
  }
  return out;
}

/**
 * Asks Gemini for a fresh batch of questions, stores them in Supabase,
 * and returns the stored questions.
 */
export async function generateAndStore(generation: GenKey): Promise<TriviaQuestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Server is missing GEMINI_API_KEY.');

  const supabase = getSupabase();
  const gen = getGeneration(generation);

  const { data: existing, error: readError } = await supabase
    .from('trivia_questions')
    .select('question')
    .eq('generation', generation)
    .order('created_at', { ascending: false })
    .limit(60);
  if (readError) {
    console.error('[trivia] read existing failed:', readError.message);
    throw new Error('Could not read the question bank.');
  }

  const existingQuestions: string[] = (existing ?? []).map((r) => String(r.question));
  const known = new Set<string>(existingQuestions.map(normalize));
  const avoidList = existingQuestions
    .slice(0, 40)
    .map((q) => `- ${q}`)
    .join('\n');

  const prompt = `You write trivia cards for a party game. Create ${BATCH_SIZE} NEW open-ended trivia questions for the "${gen.label}" generation.

Era guidance: ${gen.era}

Rules:
- These are OPEN-ENDED questions. Players answer out loud with no choices to pick from, so never write "which of these" or mention options.
- Every question must be factual and verifiable, with ONE short, unambiguous answer (a name, title, word, number, or year). If you are not certain of a fact, pick a different question.
- Phrase each question so only one answer fits (include the year, medium, or a clue). Good: "Which Nintendo handheld, released in 1989, came packed in with Tetris?" Bad: "What was a popular toy?"
- "correct_answer" is the short answer only, at most 6 words. If a common alternate name exists, add it in parentheses.
- Vary the topics across pop culture, music, TV and film, slang, history, technology, games, and sports.
- Mix easy and medium difficulty.
- Avoid questions about politics, tragedies, or anything adult.
- "explanation" is one or two sentences with a fun, accurate background fact.
- Do not reuse or closely paraphrase any of these existing questions:
${avoidList || '(none yet)'}`;

  const ai = new GoogleGenAI({ apiKey });
  let text: string;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        thinkingConfig: { thinkingBudget: 1024 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              correct_answer: { type: Type.STRING },
              explanation: { type: Type.STRING },
            },
            required: ['question', 'correct_answer', 'explanation'],
          },
        },
      },
    });
    text = response.text ?? '';
  } catch (e) {
    console.error('[trivia] Gemini request failed:', e);
    throw new Error('The question generator is unavailable right now.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim());
  } catch {
    console.error('[trivia] Gemini returned invalid JSON:', text.slice(0, 200));
    throw new Error('The question generator returned an unreadable response.');
  }

  const fresh = cleanCandidates(parsed, known);
  if (fresh.length === 0) throw new Error('The question generator did not return usable questions.');

  const { data, error } = await supabase
    .from('trivia_questions')
    .insert(fresh.map((c) => ({ generation, ...c })))
    .select('id, generation, question, correct_answer, explanation');
  if (error || !data) {
    console.error('[trivia] insert failed:', error?.message);
    throw new Error('Could not save the new questions.');
  }

  return (data as Row[]).map(toQuestion);
}

/**
 * Returns one question the current game has not seen yet.
 * If fewer than MIN_UNPLAYED remain, a new batch is generated first.
 */
export async function getNextQuestion(
  generation: GenKey,
  seenIds: string[],
): Promise<{ question: TriviaQuestion; generated: boolean }> {
  const supabase = getSupabase();
  const seen = new Set(seenIds);

  const { data, error } = await supabase
    .from('trivia_questions')
    .select('id')
    .eq('generation', generation)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) {
    console.error('[trivia] list ids failed:', error.message);
    throw new Error('Could not read the question bank.');
  }

  const unplayed = (data ?? []).map((r) => String(r.id)).filter((id) => !seen.has(id));

  if (unplayed.length < MIN_UNPLAYED) {
    try {
      const fresh = await generateAndStore(generation);
      if (fresh.length > 0) return { question: pickRandom(fresh), generated: true };
    } catch (e) {
      // Fall through: serve a stored question if any remain.
      console.error('[trivia] generation fallback failed:', e);
      if (unplayed.length === 0) {
        throw new Error(
          'You have played every stored question here and a new batch could not be created. Try another generation, or try again in a moment.',
        );
      }
    }
  }

  const id = pickRandom(unplayed);
  const { data: row, error: rowError } = await supabase
    .from('trivia_questions')
    .select('id, generation, question, correct_answer, explanation')
    .eq('id', id)
    .single();
  if (rowError || !row) {
    console.error('[trivia] fetch row failed:', rowError?.message);
    throw new Error('Could not load that question.');
  }
  return { question: toQuestion(row as Row), generated: false };
}
