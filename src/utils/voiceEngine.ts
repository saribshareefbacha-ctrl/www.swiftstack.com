import { VoiceEngineConfig, VoiceGender } from '../types/cms';

/**
 * Authentic Pakistani / South Asian English Phonetic Lexicon
 * Preserves soft dental aspirated consonants ('dh' in Randhawa -> 'Run-dhaa-waa')
 * and open South Asian vowels without American retroflex/flapping artifacts,
 * while maintaining exact 1-to-1 word index mapping for real-time visual highlighting.
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

  // Extract leading punctuation, core word, and trailing punctuation
  const match = token.match(/^([^\w@]*)([\w@'-]+)([^\w]*)$/);
  if (!match) return token;

  const [, prefix, core, suffix] = match;
  const lower = core.toLowerCase();

  if (enablePhonetics && PAKISTANI_PHONETIC_LEXICON[lower]) {
    // Even on native South Asian voices, "Run-dhaa-waa" and "Saa-rib" ensure crystal-clear dental 'dh' & open 'aa'
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
    cursor = endChar + 1; // +1 for joining space
  });

  return {
    rawWords,
    spokenText: spokenParts.join(' '),
    spans,
  };
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

/**
 * Selects the best South Asian / Pakistani English (`en-PK` -> `en-IN` -> Commonwealth `en-GB`)
 * SpeechSynthesisVoice matching the requested Male/Female voice gender, avoiding flat `en-US` defaults.
 */
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

    // 1. Pakistani & South Asian English Accent Priority
    if (lang.startsWith('en-pk') || name.includes('pakistan') || name.includes('asad') || name.includes('uzma')) {
      score += 140;
    } else if (lang.startsWith('en-in') || name.includes('india') || name.includes('rishi') || name.includes('prabhat') || name.includes('neerja') || name.includes('veena')) {
      score += 110;
    } else if (lang.startsWith('en-gb') || lang.startsWith('en-sg') || lang.startsWith('en-ae') || lang.startsWith('en-ie')) {
      // Non-rhotic Commonwealth vowel cadence aligns closely with educated Pakistani English
      score += 75;
    } else if (lang.startsWith('en-au') || lang.startsWith('en-nz') || lang.startsWith('en-za')) {
      score += 55;
    } else if (lang.startsWith('en-us')) {
      // Deprioritize American accent whenever Pakistani / South Asian / Commonwealth voices exist
      score += 15;
    } else {
      score += 30;
    }

    // 2. Male / Female Gender Accuracy Priority
    if (detectedGender === targetGender) {
      score += 95;
    } else if (detectedGender !== 'unknown' && detectedGender !== targetGender) {
      score -= 80;
    }

    // 3. Natural / Neural quality bonus
    if (name.includes('natural') || name.includes('neural') || name.includes('online') || name.includes('google')) {
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

/**
 * Computes calibrated utterance rate & pitch so Male vs Female selection is
 * unmistakably audible even on systems with only one neutral voice installed.
 */
export function computeCalibratedVoiceParams(
  config: VoiceEngineConfig,
  matchedGenderNatively: boolean
): { rate: number; pitch: number } {
  const rate = Math.min(1.5, Math.max(0.6, Number(config.speechFrequency) || 0.96));
  let basePitch = Number(config.voicePitch) || 1.0;

  if (!matchedGenderNatively) {
    basePitch = config.voiceGender === 'female' ? basePitch * 1.18 : basePitch * 0.9;
  }

  const pitch = Math.min(1.8, Math.max(0.55, Number(basePitch.toFixed(2))));
  return { rate, pitch };
}
