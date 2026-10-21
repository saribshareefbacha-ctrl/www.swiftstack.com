import { VoiceEngineConfig, VoiceGender } from '../types/cms';

/**
 * Authentic Pakistani / South Asian English Phonetic Lexicon
 * Ensures "Randhawa" is pronounced naturally with a soft dental 'dh' ('Run-dhaa-waa')
 * matching Pakistani English phonetics rather than flat American retroflex vowels.
 */
const PAKISTANI_PHONETIC_LEXICON: Record<string, string> = {
  randhawa: 'Run-dhaa-waa',
  sarib: 'Saa-rib',
  muhammad: 'Mu-hum-mud',
  mohammed: 'Mu-hum-mud',
  zainab: 'Zay-nub',
  bilal: 'Bi-laal',
  chaudhry: 'Chaudh-ree',
  pakistan: 'Paa-kis-taan',
  pakistani: 'Paa-kis-taa-nee',
  swiftstack: 'Swift-Stack',
  soulsyllables: 'Soul-Syllables',
  '@soulsyllables': 'at Soul-Syllables',
};

export interface WordSpanEntry {
  index: number;
  rawWord: string;
  spokenWord: string;
  startChar: number;
  endChar: number;
}

export interface PreparedSpeechMap {
  rawWords: string[];
  spokenText: string;
  spans: WordSpanEntry[];
}

function transformTokenForPakistaniEnglish(
  token: string,
  enablePhonetics: boolean,
  isNativePkVoice: boolean
): string {
  if (token === '&') return 'and';
  if (token === '—' || token === '–') return ',';

  const match = token.match(/^([^\w@]*)([\w@'-]+)([^\w]*)$/);
  if (!match) return token;

  const [, prefix, core, suffix] = match;
  const lower = core.toLowerCase();

  if (enablePhonetics && PAKISTANI_PHONETIC_LEXICON[lower]) {
    if (isNativePkVoice && lower === 'muhammad') {
      return `${prefix}${core}${suffix}`;
    }
    return `${prefix}${PAKISTANI_PHONETIC_LEXICON[lower]}${suffix}`;
  }

  return token.replace(/&/g, ' and ');
}

export function buildPakistaniSpeechMap(
  text: string,
  enablePhonetics = true,
  isNativePkVoice = false
): PreparedSpeechMap {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  const spans: WordSpanEntry[] = [];
  const spokenParts: string[] = [];
  let cursor = 0;

  rawWords.forEach((rawWord, idx) => {
    const spokenWord = transformTokenForPakistaniEnglish(
      rawWord,
      enablePhonetics,
      isNativePkVoice
    );
    const startChar = cursor;
    const endChar = cursor + spokenWord.length;
    spans.push({
      index: idx,
      rawWord,
      spokenWord,
      startChar,
      endChar,
    });
    spokenParts.push(spokenWord);
    cursor = endChar + 1;
  });

  return {
    rawWords,
    spokenText: spokenParts.join(' '),
    spans,
  };
}

/**
 * Computes natural syllable + punctuation-aware per-word delay schedule (in ms)
 * anchored to the Owner's configured `highlightDelayMs` (`180ms` - `900ms` per word)
 * and scaled inversely by `speechFrequency` so word highlighting NEVER rushes ahead of speech.
 */
export function computeCalibratedWordDelays(
  rawWords: string[],
  baseDelayMs: number,
  speechFrequency: number
): number[] {
  const clampedBase = Math.min(900, Math.max(180, Number(baseDelayMs) || 460));
  const rateScale = 0.95 / Math.max(0.65, Math.min(1.4, speechFrequency || 0.95));

  return rawWords.map((word) => {
    const cleanLen = word.replace(/[^\w]/g, '').length;
    // Short words ("to", "I", "or") are slightly quicker; multi-syllable words ("infrastructure") hold longer
    const lengthFactor = Math.max(0.72, Math.min(1.48, 0.66 + cleanLen * 0.068));

    let punctuationPause = 0;
    if (/[.!?]$/.test(word)) {
      punctuationPause = 340;
    } else if (/[,;:—–]$/.test(word)) {
      punctuationPause = 200;
    }

    return Math.round((clampedBase * lengthFactor + punctuationPause) * rateScale);
  });
}

const MALE_VOICE_KEYWORDS = [
  'asad',
  'prabhat',
  'ravi',
  'rishi',
  'rehan',
  'daniel',
  'oliver',
  'arthur',
  'ryan',
  'thomas',
  'george',
  'james',
  'guy',
  'liam',
  'male',
  'man',
];

const FEMALE_VOICE_KEYWORDS = [
  'uzma',
  'neerja',
  'heera',
  'veena',
  'lekha',
  'serena',
  'libby',
  'sonia',
  'hazel',
  'kate',
  'martha',
  'samantha',
  'victoria',
  'karen',
  'moira',
  'tessa',
  'aria',
  'jenny',
  'female',
  'woman',
];

export function inferVoiceGender(voice: SpeechSynthesisVoice): VoiceGender | 'unknown' {
  const label = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  if (/\bfemale\b|\bwoman\b/.test(label)) return 'female';
  if (/\bmale\b|\bman\b/.test(label)) return 'male';
  if (FEMALE_VOICE_KEYWORDS.some((kw) => label.includes(kw))) return 'female';
  if (MALE_VOICE_KEYWORDS.some((kw) => label.includes(kw))) return 'male';
  return 'unknown';
}

export function selectPakistaniEnglishVoice(
  voices: SpeechSynthesisVoice[],
  targetGender: VoiceGender,
  preferredVoiceURI?: string
): { voice: SpeechSynthesisVoice | null; matchedGender: boolean; isNativeSouthAsian: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, matchedGender: false, isNativeSouthAsian: false };
  }

  if (preferredVoiceURI) {
    const exact = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (exact) {
      const lang = (exact.lang || '').toLowerCase();
      return {
        voice: exact,
        matchedGender: true,
        isNativeSouthAsian: lang.startsWith('en-pk') || lang.startsWith('en-in'),
      };
    }
  }

  const englishVoices = voices.filter((v) => /^en([-_]|$)/i.test(v.lang));
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  let bestVoice: SpeechSynthesisVoice = pool[0];
  let bestScore = -Infinity;

  for (const v of pool) {
    const lang = (v.lang || '').toLowerCase();
    const name = `${v.name} ${v.voiceURI}`.toLowerCase();
    const detectedGender = inferVoiceGender(v);

    let score = 0;

    if (
      lang.startsWith('en-pk') ||
      name.includes('pakistan') ||
      name.includes('asad') ||
      name.includes('uzma')
    ) {
      score += 140;
    } else if (
      lang.startsWith('en-in') ||
      name.includes('india') ||
      name.includes('rishi') ||
      name.includes('prabhat') ||
      name.includes('neerja') ||
      name.includes('veena')
    ) {
      score += 110;
    } else if (
      lang.startsWith('en-gb') ||
      lang.startsWith('en-sg') ||
      lang.startsWith('en-ae') ||
      lang.startsWith('en-ie')
    ) {
      score += 75;
    } else if (lang.startsWith('en-au') || lang.startsWith('en-nz') || lang.startsWith('en-za')) {
      score += 55;
    } else if (lang.startsWith('en-us')) {
      score += 15;
    } else {
      score += 30;
    }

    if (detectedGender === targetGender) {
      score += 95;
    } else if (detectedGender !== 'unknown' && detectedGender !== targetGender) {
      score -= 80;
    }

    if (
      name.includes('natural') ||
      name.includes('neural') ||
      name.includes('online') ||
      name.includes('google')
    ) {
      score += 18;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
    }
  }

  const chosenLang = (bestVoice.lang || '').toLowerCase();
  const chosenGender = inferVoiceGender(bestVoice);

  return {
    voice: bestVoice,
    matchedGender: chosenGender === targetGender,
    isNativeSouthAsian: chosenLang.startsWith('en-pk') || chosenLang.startsWith('en-in'),
  };
}

export function computeCalibratedVoiceParams(
  config: VoiceEngineConfig,
  matchedGenderNatively: boolean
): { rate: number; pitch: number } {
  const rate = Math.min(1.5, Math.max(0.6, Number(config.speechFrequency) || 0.95));
  let basePitch = Number(config.voicePitch) || 1.0;

  if (!matchedGenderNatively) {
    basePitch = config.voiceGender === 'female' ? basePitch * 1.18 : basePitch * 0.9;
  }

  const pitch = Math.min(1.8, Math.max(0.55, Number(basePitch.toFixed(2))));
  return { rate, pitch };
}
