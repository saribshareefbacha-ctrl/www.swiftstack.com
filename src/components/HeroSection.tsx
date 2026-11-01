import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  HeroCMS,
  RealTimeMetricItem,
  ThemeCMS,
  VoiceEngineConfig,
} from '../types/cms';
import {
  buildPakistaniSpeechMap,
  computeCalibratedVoiceParams,
  computeCalibratedWordDelays,
  selectPakistaniEnglishVoice,
} from '../utils/voiceEngine';

interface HeroSectionProps {
  hero: HeroCMS;
  metrics: RealTimeMetricItem[];
  liveProjectsCount: number;
  liveOrdersCount: number;
  theme: ThemeCMS;
  voice: VoiceEngineConfig;
  onExploreServices: () => void;
  onStartOrder: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  metrics,
  liveProjectsCount,
  liveOrdersCount,
  theme,
  voice,
  onExploreServices,
  onStartOrder,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number>(-1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const stepTimeoutRef = useRef<number | null>(null);
  const currentWordRef = useRef<number>(-1);
  const liveDelayMsRef = useRef<number>(voice.highlightDelayMs || 460);
  const liveFreqRef = useRef<number>(voice.speechFrequency || 0.95);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    liveDelayMsRef.current = voice.highlightDelayMs || 460;
    liveFreqRef.current = voice.speechFrequency || 0.95;
  }, [voice.highlightDelayMs, voice.speechFrequency]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const syncVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length > 0) {
        setAvailableVoices(list);
      }
    };
    syncVoices();
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', syncVoices);
    };
  }, []);

  const selectedVoiceInfo = useMemo(
    () =>
      selectPakistaniEnglishVoice(
        availableVoices,
        voice.voiceGender,
        voice.preferredVoiceURI
      ),
    [availableVoices, voice.voiceGender, voice.preferredVoiceURI]
  );

  const speechMap = useMemo(
    () =>
      buildPakistaniSpeechMap(
        hero.introSpeechText || '',
        voice.pakistaniAccentPhonetics,
        selectedVoiceInfo.isNativeSouthAsian
      ),
    [hero.introSpeechText, voice.pakistaniAccentPhonetics, selectedVoiceInfo.isNativeSouthAsian]
  );

  const computedMetrics = useMemo(() => {
    return metrics.map((m) => {
      if (m.liveAutoIncrement === 'projects_plus_orders' && typeof m.baseNumber === 'number') {
        return {
          ...m,
          displayValue: `${m.baseNumber + liveProjectsCount + liveOrdersCount}${m.suffix ?? ''}`,
        };
      }
      if (m.liveAutoIncrement === 'orders_count' && typeof m.baseNumber === 'number') {
        return {
          ...m,
          displayValue: `${m.baseNumber + liveOrdersCount}${m.suffix ?? ''}`,
        };
      }
      return {
        ...m,
        displayValue: m.value,
      };
    });
  }, [metrics, liveProjectsCount, liveOrdersCount]);

  const clearWordTimer = useCallback(() => {
    if (stepTimeoutRef.current !== null) {
      window.clearTimeout(stepTimeoutRef.current);
      stepTimeoutRef.current = null;
    }
  }, []);

  const stopSpeechCompletely = useCallback(() => {
    clearWordTimer();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    currentWordRef.current = -1;
    setIsPlaying(false);
    setIsPaused(false);
    setActiveWordIndex(-1);
  }, [clearWordTimer]);

  useEffect(() => {
    return () => {
      stopSpeechCompletely();
    };
  }, [stopSpeechCompletely]);

  const scheduleNextWordStep = useCallback(
    (wordIndex: number) => {
      clearWordTimer();
      const total = speechMap.rawWords.length;
      if (wordIndex >= total) return;

      currentWordRef.current = wordIndex;
      setActiveWordIndex(wordIndex);

      const perWordDelays = computeCalibratedWordDelays(
        speechMap.rawWords,
        liveDelayMsRef.current,
        liveFreqRef.current
      );
      const waitMs = perWordDelays[wordIndex] ?? liveDelayMsRef.current;

      stepTimeoutRef.current = window.setTimeout(() => {
        if (currentWordRef.current + 1 < total) {
          scheduleNextWordStep(currentWordRef.current + 1);
        }
      }, waitMs);
    },
    [clearWordTimer, speechMap.rawWords]
  );

  const startIntroSpeech = useCallback(() => {
    if (!speechMap.rawWords.length) return;
    clearWordTimer();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsPlaying(true);
      setIsPaused(false);
      scheduleNextWordStep(0);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(speechMap.spokenText);
    utteranceRef.current = utterance;

    const { rate, pitch } = computeCalibratedVoiceParams(
      voice,
      selectedVoiceInfo.matchedGender
    );

    if (selectedVoiceInfo.voice) {
      utterance.voice = selectedVoiceInfo.voice;
      utterance.lang = selectedVoiceInfo.voice.lang || 'en-PK';
    } else {
      utterance.lang = 'en-PK';
    }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name && event.name !== 'word') return;
      const charIdx = event.charIndex ?? 0;
      let matched = 0;
      for (let i = 0; i < speechMap.spans.length; i++) {
        if (charIdx >= speechMap.spans[i].startChar) {
          matched = i;
        } else {
          break;
        }
      }
      if (matched < currentWordRef.current) {
        scheduleNextWordStep(matched);
      }
    };

    utterance.onend = () => {
      clearWordTimer();
      currentWordRef.current = -1;
      setIsPlaying(false);
      setIsPaused(false);
      setActiveWordIndex(-1);
    };

    utterance.onerror = () => {
      clearWordTimer();
      currentWordRef.current = -1;
      setIsPlaying(false);
      setIsPaused(false);
      setActiveWordIndex(-1);
    };

    setIsPlaying(true);
    setIsPaused(false);
    stepTimeoutRef.current = window.setTimeout(() => {
      scheduleNextWordStep(0);
    }, 115);

    window.speechSynthesis.speak(utterance);
  }, [clearWordTimer, scheduleNextWordStep, selectedVoiceInfo, speechMap, voice]);

  const handleTogglePlayPause = () => {
    if (!isPlaying) {
      startIntroSpeech();
      return;
    }

    if (!isPaused) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      clearWordTimer();
      setIsPaused(true);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      setIsPaused(false);
      scheduleNextWordStep(Math.max(0, currentWordRef.current));
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ss-responsive-grid grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column: Agency Headline, Value Props, CTAs & Real-Time Firestore Metrics */}
          <div className="ss-hero-col space-y-6 lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="ss-glass-card inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </span>
              <span className="font-mono text-xs font-semibold tracking-wide text-cyan-300">
                {hero.badgeText}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.05 }}
              className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl xl:text-[3.3rem] xl:leading-[1.1]"
            >
              <span>{hero.headlinePrefix} </span>
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})`,
                }}
              >
                {hero.headlineGradient}
              </span>
              <span> {hero.headlineSuffix}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.1 }}
              className="max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg"
            >
              {hero.subheadline}
            </motion.p>

            {/* Primary & Secondary Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.15 }}
              className="flex flex-wrap items-center gap-3.5 pt-1"
            >
              <button
                type="button"
                onClick={onStartOrder}
                className="keep-white-text ss-cta-btn group inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-xl"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                <span>{hero.primaryCtaLabel}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>

              <button
                type="button"
                onClick={onExploreServices}
                className="ss-glass-btn inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white"
              >
                <span>{hero.secondaryCtaLabel}</span>
              </button>
            </motion.div>

            {/* Real-Time Dynamic Metrics Synced Live with Firebase Firestore */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.2 }}
              className="grid grid-cols-3 gap-3 pt-2"
            >
              {computedMetrics.map((stat) => (
                <div
                  key={stat.id}
                  className="ss-glass-card ss-glass-interactive rounded-2xl p-3.5 sm:p-4"
                >
                  <div className="flex items-center justify-between gap-1">
                    <div
                      className="font-display text-lg font-extrabold sm:text-2xl"
                      style={{ color: theme.primaryColor }}
                    >
                      {stat.displayValue}
                    </div>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" title="Live synced metric" />
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-slate-300 sm:text-xs">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Clean Minimalist Public Voice Intro Card (ZERO Public Sliders/Controls) */}
          <div className="ss-hero-col lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="ss-glass-card relative rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6"
            >
              {/* Minimalist Studio Header */}
              <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                    SwiftStack Interactive Intro
                  </span>
                </div>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
                  {isPlaying ? (isPaused ? 'Paused' : 'Playing Audio') : 'Audio Briefing'}
                </span>
              </div>

              {/* Centered Glowing Circular Play / Pause Button */}
              <div className="relative flex flex-col items-center justify-center py-4">
                <div className="relative flex items-center justify-center">
                  {isPlaying && !isPaused && (
                    <>
                      <motion.span
                        animate={{ scale: [1, 1.5, 1.82], opacity: [0.55, 0.2, 0] }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeOut' }}
                        className="pointer-events-none absolute h-20 w-20 rounded-full"
                        style={{
                          border: `1.5px solid ${theme.primaryColor}`,
                          boxShadow: `0 0 28px ${theme.primaryColor}`,
                        }}
                      />
                      <motion.span
                        animate={{ scale: [1, 1.32, 1.56], opacity: [0.42, 0.14, 0] }}
                        transition={{
                          duration: 2.1,
                          delay: 0.65,
                          repeat: Infinity,
                          ease: 'easeOut',
                        }}
                        className="pointer-events-none absolute h-20 w-20 rounded-full"
                        style={{
                          border: `1.5px solid ${theme.secondaryColor}`,
                        }}
                      />
                    </>
                  )}

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTogglePlayPause}
                    aria-label={
                      isPlaying && !isPaused
                        ? 'Pause SwiftStack Voice Intro'
                        : 'Play SwiftStack Voice Intro'
                    }
                    className="keep-white-text relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-2xl transition-shadow"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      boxShadow:
                        isPlaying && !isPaused
                          ? `0 0 42px ${theme.primaryColor}aa, inset 0 1.5px 2px rgba(255,255,255,0.65)`
                          : `0 14px 34px rgba(6, 182, 212, 0.45), inset 0 1.5px 2px rgba(255,255,255,0.6)`,
                    }}
                  >
                    {isPlaying && !isPaused ? (
                      <Pause className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 translate-x-0.5 text-white" />
                    )}
                  </motion.button>

                  {isPlaying && (
                    <button
                      type="button"
                      onClick={stopSpeechCompletely}
                      title="Reset Audio Intro"
                      aria-label="Reset Audio Intro"
                      className="ss-glass-btn absolute -right-14 flex h-10 w-10 items-center justify-center rounded-full text-slate-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Subtle Live Equalizer Wave */}
                <div className="mt-3.5 flex items-center justify-center h-5">
                  {isPlaying && !isPaused ? (
                    <div className="flex items-end gap-1 h-4">
                      {[0.45, 0.95, 0.65, 1, 0.55, 0.85, 0.4].map((h, i) => (
                        <motion.span
                          key={i}
                          animate={{ scaleY: [0.3, h, 0.35] }}
                          transition={{
                            duration: 0.65,
                            repeat: Infinity,
                            delay: i * 0.08,
                            ease: 'easeInOut',
                          }}
                          className="w-1 h-3.5 origin-bottom rounded-full bg-cyan-400"
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-cyan-300">
                      Tap Play to Hear Our Studio Introduction
                    </span>
                  )}
                </div>
              </div>

              {/* Floating Kinetic Intro Script with Real-Time Cyan/Blue Word-by-Word Glowing Highlights */}
              <motion.div
                animate={isPlaying && !isPaused ? { y: [0, -4, 0] } : { y: 0 }}
                transition={{
                  duration: 3.4,
                  repeat: isPlaying && !isPaused ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className="ss-glass-card rounded-2xl p-5 sm:p-6"
              >
                <p className="text-center font-display text-base sm:text-lg leading-relaxed font-medium text-slate-100">
                  {speechMap.rawWords.map((word, idx) => {
                    const isActive = idx === activeWordIndex;
                    const isSpoken = activeWordIndex > idx;
                    return (
                      <React.Fragment key={`${word}-${idx}`}>
                        <span
                          className={`inline-block px-1.5 py-0.5 transition-all duration-150 ${
                            isActive
                              ? 'ss-word-highlight -translate-y-0.5 scale-105 font-bold text-cyan-200'
                              : isSpoken
                                ? 'text-white'
                                : 'text-slate-200'
                          }`}
                        >
                          {word}
                        </span>{' '}
                      </React.Fragment>
                    );
                  })}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
