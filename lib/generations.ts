import type { GenKey } from './types';

export type Generation = {
  key: GenKey;
  label: string;
  years: string;
  tagline: string;
  /** Gradient endpoints for borders and headings. */
  c1: string;
  c2: string;
  /** Bright solid color used for buttons (always paired with dark ink text). */
  accent: string;
  /** Guidance handed to Gemini so questions fit the era. */
  era: string;
};

export const GENERATIONS: Generation[] = [
  {
    key: 'boomer',
    label: 'Baby Boomers',
    years: 'Born 1946–1964',
    tagline: "Rock 'n' roll, moon landings, and Motown",
    c1: '#FFB703',
    c2: '#FF6B1A',
    accent: '#FFB703',
    era: "Born 1946–1964. Draw on roughly 1950–1980: rock 'n' roll, Motown, the British Invasion, the space race, classic TV, early fast food and toys, Cold War and 1960s–70s history, muscle cars.",
  },
  {
    key: 'genx',
    label: 'Gen X',
    years: 'Born 1965–1980',
    tagline: 'Mixtapes, arcades, and MTV',
    c1: '#C14BFF',
    c2: '#19C3B1',
    accent: '#19C3B1',
    era: 'Born 1965–1980. Draw on roughly 1975–2000: MTV, arcades and early home consoles, John Hughes films, hip-hop and grunge, first personal computers, mixtapes, Saturday-morning cartoons.',
  },
  {
    key: 'millennial',
    label: 'Millennials',
    years: 'Born 1981–1996',
    tagline: 'Dial-up, boy bands, and Pokémon',
    c1: '#F2A99B',
    c2: '#22D3EE',
    accent: '#22D3EE',
    era: 'Born 1981–1996. Draw on roughly 1990–2010: 90s sitcoms and cartoons, boy bands and pop-punk, dial-up internet, early social media, Pokémon, Harry Potter, flip phones, iPods, Y2K.',
  },
  {
    key: 'genz',
    label: 'Gen Z',
    years: 'Born 1997–2012',
    tagline: 'Snaps, streams, and Fortnite',
    c1: '#B6FF00',
    c2: '#9B6BFF',
    accent: '#B6FF00',
    era: 'Born 1997–2012. Draw on roughly 2008–2024: smartphones, YouTube, Vine, TikTok, Snapchat, Minecraft, Fortnite, streaming, Marvel films, K-pop, modern slang and memes.',
  },
  {
    key: 'genalpha',
    label: 'Gen Alpha',
    years: 'Born 2013–present',
    tagline: 'Roblox, Bluey, and AI',
    c1: '#3D7BFF',
    c2: '#FF3D9A',
    accent: '#FF4FA3',
    era: 'Born 2013–present. Draw on roughly 2015–now: tablets, YouTube Kids, Roblox, Minecraft, Bluey, Disney and Disney+, Pokémon GO, AI chatbots, current slang. Keep everything family-friendly and suitable for children.',
  },
];

export const GEN_KEYS: GenKey[] = GENERATIONS.map((g) => g.key);

export function getGeneration(key: GenKey): Generation {
  return GENERATIONS.find((g) => g.key === key) ?? GENERATIONS[0];
}

export function isGenKey(value: unknown): value is GenKey {
  return typeof value === 'string' && (GEN_KEYS as string[]).includes(value);
}

/** Five hard-edged color bars, one per generation. */
export const BRAND_STRIPES = `linear-gradient(90deg, ${GENERATIONS.map(
  (g, i) => `${g.accent} ${i * 20}% ${(i + 1) * 20}%`,
).join(', ')})`;

/** Smooth version used for the active-team border. */
export const BRAND_GRADIENT = `linear-gradient(135deg, ${GENERATIONS.map((g) => g.accent).join(', ')})`;
