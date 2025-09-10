// Text ➜ Adaptive cover utilities (keywords, motif, deterministic seed/score, background)

export type AdaptiveDecision =
  | {
      source: 'generated';
      score: number; // 0..1
      motif: string;
      seed: string;
      quality: 'medium';
      spec: string;
      keywords: string[];
      bgStyle: React.CSSProperties;
    }
  | {
      source: 'retrieved';
      score: number; // 0..1
      motif: string;
      iconId: string;
      keywords: string[];
      bgStyle: React.CSSProperties;
    };

const STOPWORDS = new Set([
  'the','a','an','and','or','but','of','in','on','at','to','for','from','by','with','about','as','into','like',
  'is','are','was','were','be','been','being','it','this','that','these','those','i','you','he','she','we','they',
  'my','your','his','her','our','their','me','him','her','us','them','so','just','not','no','yes','do','does','did',
  'will','would','can','could','should','shall','than','then','there','here','over','under','very','more','most',
  'have','has','had'
]);

const MOTIF_BY_TITLE: Record<string, string> = {
  'morning clarity': 'mountain + sun',
  'shipped v1': 'trophy',
  'on persistence': 'metronome',
  'naming the fear': 'mask',
  'deep work sprint': 'hourglass',
  'tiny joy': 'cat',
  'bridging gaps': 'bridge',
  'letting go': 'crane',
  'flow state': 'ensō',
  'resilience checkpoint': 'kintsugi bowl',
  'signal over noise': 'funnel',
  'compassion loop': 'hand mirror',
};

function simpleHash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function pad5(n: number): string {
  return n.toString().padStart(5, '0');
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(title?: string | null, description?: string | null, max = 5): string[] {
  const text = `${title || ''} ${description || ''}`.trim();
  if (!text) return [];

  const tokens = tokenize(text).filter(t => !STOPWORDS.has(t) && t.length >= 3);

  // Count frequency
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }

  // Sort by frequency then lexical fallback for determinism
  const sorted = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  return sorted.slice(0, Math.max(3, Math.min(max, sorted.length))).map(([w]) => w);
}

function pickMotif(title?: string | null, keywords: string[] = []): string {
  const t = (title || '').toLowerCase();

  // Exact/contains match over motif table keys
  for (const key of Object.keys(MOTIF_BY_TITLE)) {
    if (t.includes(key)) return MOTIF_BY_TITLE[key];
  }

  // Fallback to top keyword
  return keywords[0] || 'symbol';
}

function mapHashToRange(h: number, min: number, max: number): number {
  const frac = (h % 1000) / 1000;
  return +(min + (max - min) * frac).toFixed(2);
}

function gradientFromKeywords(keywords: string[], title: string): React.CSSProperties {
  const key = keywords.join('-') || title || 'cover';
  const h = simpleHash(key);

  // Pick deterministic palette based on hash
  const palettes = [
    ['#1b7ced', '#66e2ff'], // blue-cyan
    ['#ff7a59', '#ffd166'], // coral-amber
    ['#9b5de5', '#f15bb5'], // purple-pink
    ['#06d6a0', '#118ab2'], // teal-blue
    ['#f77f00', '#fcbf49'], // orange-sand
    ['#22223b', '#4a4e69'], // indigo-slate
  ];
  const idx = h % palettes.length;
  const [c1, c2] = palettes[idx];

  const angle = (h % 360);
  const style: React.CSSProperties = {
    backgroundImage: `linear-gradient(${angle}deg, ${c1}, ${c2})`,
  };
  return style;
}

export function decideAdaptiveCover(title?: string | null, description?: string | null): AdaptiveDecision {
  const keywords = extractKeywords(title, description);
  const motif = pickMotif(title, keywords);

  // For step 1 we mark all as generated; later we can add "retrieved" detection
  const seedNum = simpleHash(title || description || 'cover') % 100000;
  const seed = `S${pad5(seedNum)}`;
  const score = mapHashToRange(simpleHash((title || '') + (description || '')), 0.55, 0.74);
  const bgStyle = gradientFromKeywords(keywords, title || '');

  return {
    source: 'generated',
    score,
    motif,
    seed,
    quality: 'medium',
    spec: 'centered silhouette, no text, transparent bg',
    keywords,
    bgStyle,
  };
}