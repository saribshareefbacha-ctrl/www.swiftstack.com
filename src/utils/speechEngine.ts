export interface SpeechFrameState {
  isSpeaking: boolean;
  mouthOpen: number;
  mouthWide: number;
  gesturePhase: 'idle' | 'wave' | 'self' | 'present';
  currentWordIndex: number;
  words: string[];
  progress: number;
  energyBars: number[];
}

type Listener = (state: SpeechFrameState) => void;

class AvatarSpeechEngine {
  private listeners = new Set<Listener>();
  private rafId: number | null = null;
  private startTime = 0;
  private estimatedDurationMs = 10000;
  private boundaryWordIdx = -1;
  private state: SpeechFrameState = {
    isSpeaking: false,
    mouthOpen: 0,
    mouthWide: 0.15,
    gesturePhase: 'idle',
    currentWordIndex: -1,
    words: [],
    progress: 0,
    energyBars: [0.15, 0.25, 0.2, 0.3, 0.18, 0.26, 0.15],
  };

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getState(): SpeechFrameState {
    return this.state;
  }

  private emit() {
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  private playActivationChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.045);
        gain.gain.setValueAtTime(0.0001, now + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.045, now + i * 0.045 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.045 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.045);
        osc.stop(now + i * 0.045 + 0.32);
      });
      setTimeout(() => {
        ctx.close().catch(() => {});
      }, 900);
    } catch {
      // Ignore WebAudio restrictions if blocked
    }
  }

  private selectPreferredMaleVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const preferredPatterns = [
      /Google UK English Male/i,
      /Microsoft Ryan/i,
      /Microsoft Guy/i,
      /Microsoft Christopher/i,
      /Daniel/i,
      /Alex/i,
      /Google US English/i,
      /Male/i,
    ];

    for (const pattern of preferredPatterns) {
      const match = voices.find((v) => v.lang.startsWith('en') && pattern.test(v.name));
      if (match) return match;
    }

    return voices.find((v) => v.lang.startsWith('en')) || voices[0];
  }

  private computePhonemeViseme(char: string, tSec: number): { open: number; wide: number } {
    const c = char.toLowerCase();
    if ('aáàâä'.includes(c)) return { open: 0.88, wide: 0.35 };
    if ('eéèêëiíìîïy'.includes(c)) return { open: 0.56, wide: 0.55 };
    if ('oóòôöuúùûüw'.includes(c)) return { open: 0.72, wide: -0.35 };
    if ('mbp'.includes(c)) return { open: 0.06, wide: 0.05 };
    if ('fv'.includes(c)) return { open: 0.22, wide: 0.22 };
    if ('sztdnlrkgcjh'.includes(c)) {
      return { open: 0.38 + 0.14 * Math.sin(tSec * 24), wide: 0.2 };
    }
    if (',.;!?—-'.includes(c)) return { open: 0.04, wide: 0.18 };
    return { open: 0.28, wide: 0.18 };
  }

  toggleSpeak(script: string) {
    if (this.state.isSpeaking) {
      this.stop();
      return;
    }
    this.speak(script);
  }

  speak(script: string) {
    this.stop();
    const cleanText = script.trim();
    if (!cleanText) return;

    this.playActivationChime();

    const words = cleanText.split(/\s+/);
    // Average clear speaking cadence ~155 words/minute (~385ms per word)
    this.estimatedDurationMs = Math.max(3500, words.length * 380);
    this.startTime = performance.now();
    this.boundaryWordIdx = -1;

    let synthActive = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const selectedVoice = this.selectPreferredMaleVoice();
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = 1.02;
        utterance.pitch = 0.98;
        utterance.volume = 1.0;

        utterance.onboundary = (event) => {
          if (typeof event.charIndex === 'number') {
            const prefix = cleanText.slice(0, event.charIndex);
            const idx = prefix.trim() ? prefix.trim().split(/\s+/).length : 0;
            this.boundaryWordIdx = Math.min(words.length - 1, idx);
          }
        };

        utterance.onend = () => {
          this.stop();
        };

        utterance.onerror = () => {
          // Allow visual & viseme speech simulation to finish cleanly if headless TTS unavailable
        };

        window.speechSynthesis.speak(utterance);
        synthActive = true;
      } catch {
        synthActive = false;
      }
    }

    this.state = {
      isSpeaking: true,
      mouthOpen: 0.3,
      mouthWide: 0.25,
      gesturePhase: 'wave',
      currentWordIndex: 0,
      words,
      progress: 0,
      energyBars: [0.4, 0.7, 0.5, 0.85, 0.6, 0.75, 0.35],
    };
    this.emit();

    const tick = () => {
      const elapsed = performance.now() - this.startTime;
      const rawProgress = Math.min(1, elapsed / this.estimatedDurationMs);

      const fallbackWordIdx = Math.min(words.length - 1, Math.floor(rawProgress * words.length));
      const wordIdx = this.boundaryWordIdx >= 0 ? this.boundaryWordIdx : fallbackWordIdx;
      const activeWord = words[wordIdx] || '';

      // Pick current character inside active word
      const tSec = elapsed / 1000;
      const charSubIdx =
        activeWord.length > 0 ? Math.floor((tSec * 12) % activeWord.length) : 0;
      const activeChar = activeWord[charSubIdx] || ' ';
      const targetViseme = this.computePhonemeViseme(activeChar, tSec);

      // Rhythmic syllable envelope for lifelike jaw motion
      const syllablePulse = 0.68 + 0.32 * Math.sin(tSec * 15.5) * Math.cos(tSec * 6.2);
      const nextOpen =
        this.state.mouthOpen * 0.55 + targetViseme.open * syllablePulse * 0.45;
      const nextWide = this.state.mouthWide * 0.65 + targetViseme.wide * 0.35;

      let gesturePhase: SpeechFrameState['gesturePhase'] = 'present';
      if (elapsed < 2200) {
        gesturePhase = 'wave';
      } else if (elapsed < 5200) {
        gesturePhase = 'self';
      }

      const energyBars = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const wave =
          0.25 +
          0.65 *
            Math.abs(Math.sin(tSec * (7 + i * 1.9) + i * 0.85)) *
            (0.4 + nextOpen * 0.8);
        return Math.min(1, Math.max(0.12, wave));
      });

      const speechStillRunning =
        synthActive &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        window.speechSynthesis.speaking;

      if (rawProgress >= 1 && !speechStillRunning) {
        this.stop();
        return;
      }

      this.state = {
        isSpeaking: true,
        mouthOpen: nextOpen,
        mouthWide: nextWide,
        gesturePhase,
        currentWordIndex: wordIdx,
        words,
        progress: speechStillRunning && rawProgress >= 0.98 ? 0.98 : rawProgress,
        energyBars,
      };
      this.emit();
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.state = {
      ...this.state,
      isSpeaking: false,
      mouthOpen: 0,
      mouthWide: 0.2,
      gesturePhase: 'idle',
      currentWordIndex: -1,
      progress: 0,
      energyBars: [0.15, 0.25, 0.2, 0.3, 0.18, 0.26, 0.15],
    };
    this.emit();
  }
}

export const speechEngine = new AvatarSpeechEngine();
