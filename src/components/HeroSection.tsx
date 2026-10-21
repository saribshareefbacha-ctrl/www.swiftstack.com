import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Layers,
  Pause,
  Play,
  Settings2,
  ShieldCheck,
  Sparkles,
  Volume2,
  Zap,
} from 'lucide-react';
import { HeroCMS, VoiceEngineConfig, VoiceGender } from '../types/cms';
import {
  buildPakistaniSpeechMap,
  computeCalibratedVoiceParams,
  selectPakistaniEnglishVoice,
} from '../utils/voiceEngine';
import { triggerSignatureFingerTouch } from './FuturisticRobotCanvas';

interface HeroSectionProps {
  hero: HeroCMS;
  voiceConfig: VoiceEngineConfig;
  primaryColor: string;
  secondaryColor: string;
  isOwner?: boolean;
  onVoiceConfigChange: (next: VoiceEngineConfig) => void;
  onExploreWork: () => void;
  onStartOrder: () => void;
  onOpenVoiceCMS?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  voiceConfig,
  primaryColor,
  secondaryColor,
  isOwner = false,
  onVoiceConfigChange,
  onExploreWork,
  onStartOrder,
  onOpenVoiceCMS,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [showVoiceControls, setShowVoiceControls] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const fallbackWordTimerRef = useRef<number | null>(null);
  const boundaryReceivedRef = useRef(false);

  // Load Web Speech voices eagerly so Pakistani / South Asian voices are immediately ready
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const syncVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length > 0) setAvailableVoices(list);
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
        voiceConfig.voiceGender,
        voiceConfig.preferredVoiceURI
      ),
    [availableVoices, voiceConfig.voiceGender, voiceConfig.preferredVoiceURI]
  );

  const speechMap = useMemo(
    () =>
      buildPakistaniSpeechMap(
        hero.voiceGreeting,
        voiceConfig.pakistaniAccentPhonetics,
        selectedVoiceInfo.isNativeSouthAsian
      ),
    [
      hero.voiceGreeting,
      voiceConfig.pakistaniAccentPhonetics,
      selectedVoiceInfo.isNativeSouthAsian,
    ]
  );

  const stopSpeech = useCallback(() => {
    if (fallbackWordTimerRef.current) {
      window.clearInterval(fallbackWordTimerRef.current);
      fallbackWordTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setActiveWordIndex(-1);
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  const startSpeakingWithConfig = useCallback(
    (overrideConfig?: VoiceEngineConfig) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const cfg = overrideConfig || voiceConfig;

      stopSpeech();
      triggerSignatureFingerTouch();

      const voicesNow =
        availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const chosen = selectPakistaniEnglishVoice(
        voicesNow,
        cfg.voiceGender,
        cfg.preferredVoiceURI
      );
      const map = buildPakistaniSpeechMap(
        hero.voiceGreeting,
        cfg.pakistaniAccentPhonetics,
        chosen.isNativeSouthAsian
      );

      const utterance = new SpeechSynthesisUtterance(map.spokenText);
      if (chosen.voice) {
        utterance.voice = chosen.voice;
        utterance.lang = chosen.voice.lang;
      } else {
        utterance.lang = 'en-PK';
      }

      const { rate, pitch } = computeCalibratedVoiceParams(cfg, chosen.matchedGender);
      utterance.rate = rate;
      utterance.pitch = pitch;

      boundaryReceivedRef.current = false;
      setIsSpeaking(true);
      setActiveWordIndex(0);

      utterance.onboundary = (event) => {
        if (event.name === 'word' || typeof event.charIndex === 'number') {
          boundaryReceivedRef.current = true;
          const cIdx = event.charIndex;
          const found = map.spans.find(
            (sp) => cIdx >= sp.startChar && cIdx <= sp.endChar + 1
          );
          if (found) {
            setActiveWordIndex(found.index);
          }
        }
      };

      const msPerWord = Math.max(195, Math.round(330 / rate));
      fallbackWordTimerRef.current = window.setInterval(() => {
        if (!boundaryReceivedRef.current) {
          setActiveWordIndex((prev) =>
            prev + 1 < map.rawWords.length ? prev + 1 : prev
          );
        }
      }, msPerWord);

      utterance.onend = () => stopSpeech();
      utterance.onerror = () => stopSpeech();

      window.speechSynthesis.speak(utterance);
    },
    [availableVoices, hero.voiceGreeting, stopSpeech, voiceConfig]
  );

  const handleTogglePlay = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      startSpeakingWithConfig();
    }
  };

  const handleSelectGender = (gender: VoiceGender) => {
    const updated: VoiceEngineConfig = {
      ...voiceConfig,
      voiceGender: gender,
      preferredVoiceURI: '',
    };
    onVoiceConfigChange(updated);
    if (isSpeaking) {
      startSpeakingWithConfig(updated);
    }
  };

  const handleFrequencyChange = (freq: number) => {
    const updated: VoiceEngineConfig = {
      ...voiceConfig,
      speechFrequency: freq,
    };
    onVoiceConfigChange(updated);
    if (isSpeaking) {
      startSpeakingWithConfig(updated);
    }
  };

  const handlePitchChange = (pitchVal: number) => {
    const updated: VoiceEngineConfig = {
      ...voiceConfig,
      voicePitch: pitchVal,
    };
    onVoiceConfigChange(updated);
    if (isSpeaking) {
      startSpeakingWithConfig(updated);
    }
  };

  return (
    <section
      id="hero"
      className="relative z-10 flex min-h-screen items-center pt-28 pb-16 px-4 sm:px-8 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
        {/* Left 6 Columns: Executive Headline, Pure Glass Bio & Equal-Height Floating Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="lg:col-span-6 space-y-6"
        >
          <div className="ss-glass-card inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-400">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
            <span>{hero.badgeText}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl xl:text-[3.55rem] font-extrabold tracking-tight text-white leading-[1.08]">
            {hero.headlinePrefix}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {hero.headlineHighlight}
            </span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed">
            {hero.subheadline}
          </p>

          {/* Pure Ultra-Transparent Crystal Bio Card */}
          <div className="ss-glass-card ss-glass-interactive rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="font-display text-sm font-bold text-white">
                {hero.founderName}
              </span>
              <span className="text-[11px] font-mono font-semibold text-cyan-400">
                {hero.founderTitle}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {hero.founderBio}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              type="button"
              onClick={onStartOrder}
              className="keep-white-text ss-cta-btn group inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm sm:text-base font-bold shadow-lg"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <span>{hero.primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onExploreWork}
              className="ss-glass-btn inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm sm:text-base font-semibold"
            >
              <span>{hero.secondaryCtaLabel}</span>
            </button>
          </div>

          {/* Perfectly Aligned Equal-Height Floating Glass Stat Containers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="ss-glass-card ss-glass-interactive flex h-full flex-col justify-between rounded-2xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                <Zap className="h-3.5 w-3.5 shrink-0" />
                <span>24h Rapid Quote</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Milestone roadmap &amp; cart checkout</p>
            </div>

            <div className="ss-glass-card ss-glass-interactive flex h-full flex-col justify-between rounded-2xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Full-Stack &amp; AI</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">SaaS, APKs, Cloud SSL &amp; Media</p>
            </div>

            <div className="ss-glass-card ss-glass-interactive flex h-full flex-col justify-between rounded-2xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Live Portal Sync</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Real-time order &amp; status updates</p>
            </div>
          </div>
        </motion.div>

        {/* Right 6 Columns: Dynamic Text-Based Intro Stage & Pakistani English Voice Engine */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: 'easeOut' }}
          className="lg:col-span-6"
        >
          <div className="ss-glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Top Stage Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-400">
                <Volume2 className="h-3.5 w-3.5 shrink-0" />
                <span>{hero.voiceStageLabel || 'EXECUTIVE VOICE INTRODUCTION'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceControls((prev) => !prev)}
                  className="ss-glass-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                >
                  <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Voice Settings</span>
                </button>

                {isOwner && onOpenVoiceCMS && (
                  <button
                    type="button"
                    onClick={onOpenVoiceCMS}
                    className="ss-glass-btn rounded-xl px-3 py-1.5 text-xs font-semibold text-cyan-400"
                  >
                    Edit Intro CMS
                  </button>
                )}
              </div>
            </div>

            {/* Centerpiece Glowing Circular Play / Pause Button + Floating Harmonic Wave */}
            <div className="relative flex flex-col items-center justify-center py-4">
              {/* Outer pulsing digital energy halo */}
              <motion.div
                animate={
                  isSpeaking
                    ? { scale: [1, 1.32, 1], opacity: [0.45, 0.14, 0.45] }
                    : { scale: [1, 1.12, 1], opacity: [0.22, 0.36, 0.22] }
                }
                transition={{
                  duration: isSpeaking ? 1.8 : 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute h-28 w-28 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${primaryColor}55 0%, ${secondaryColor}25 60%, transparent 75%)`,
                }}
              />

              {/* Concentric Orbital Ring */}
              <motion.div
                animate={isSpeaking ? { rotate: 360 } : { rotate: 0 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="pointer-events-none absolute h-24 w-24 rounded-full border border-dashed border-cyan-400/45"
              />

              {/* Sleek Glowing Circular Play Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={
                  isSpeaking ? 'Pause Executive Audio Introduction' : 'Play Executive Audio Introduction'
                }
                className="keep-white-text relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-[0_0_38px_rgba(6,182,212,0.5)] transition-transform duration-300 hover:scale-105 focus:outline-none"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {isSpeaking ? (
                  <Pause className="h-8 w-8 fill-white text-white" />
                ) : (
                  <Play className="ml-1 h-8 w-8 fill-white text-white" />
                )}
              </button>

              {/* Status & Acoustic Wave Indicator */}
              <div className="mt-4 flex items-center gap-2.5">
                <span className="text-xs font-semibold text-slate-300">
                  {isSpeaking
                    ? `Speaking (${voiceConfig.voiceGender === 'female' ? 'Female' : 'Male'} · ${voiceConfig.speechFrequency.toFixed(2)}x)`
                    : 'Click to Play Executive Introduction'}
                </span>
                {isSpeaking && (
                  <span className="flex items-end gap-1 h-3.5" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['30%', '100%', '40%'] }}
                        transition={{
                          duration: 0.55 + bar * 0.1,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="w-1 rounded-full bg-cyan-400"
                      />
                    ))}
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic Floating Intro Text Stage with Real-Time Word-by-Word Cyan/Blue Highlighting */}
            <motion.div
              animate={
                isSpeaking
                  ? { y: [0, -5, 0] }
                  : { y: 0 }
              }
              transition={{
                duration: 3.4,
                repeat: isSpeaking ? Infinity : 0,
                ease: 'easeInOut',
              }}
              className="ss-glass-card rounded-2xl p-5 sm:p-6"
            >
              <p className="text-sm sm:text-base leading-[1.9] tracking-[-0.005em] text-slate-200 select-text">
                {speechMap.rawWords.map((word, idx) => {
                  const isCurrent = isSpeaking && idx === activeWordIndex;
                  const isSpokenPast =
                    isSpeaking && activeWordIndex > idx && activeWordIndex >= 0;
                  return (
                    <React.Fragment key={`${word}-${idx}`}>
                      <span
                        className={`inline-block rounded-md px-1 py-0.5 transition-all duration-150 ${
                          isCurrent
                            ? 'ss-word-highlight -translate-y-0.5 scale-[1.05] font-semibold'
                            : isSpokenPast
                              ? 'text-white opacity-95'
                              : 'text-slate-300'
                        }`}
                      >
                        {word}
                      </span>{' '}
                    </React.Fragment>
                  );
                })}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/30 pt-3 text-[11px] font-mono text-slate-400">
                <span>{hero.founderName} — {hero.companyName} ({hero.companyAbbreviation})</span>
                <span className="text-cyan-400">
                  Pakistani English Phonetics Active
                </span>
              </div>
            </motion.div>

            {/* Collapsible Live Voice Customization Panel (Male/Female, Frequency, Pitch) */}
            {showVoiceControls && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="ss-glass-card rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    Studio Voice Customization
                  </span>

                  {/* Male / Female Selector */}
                  <div className="inline-flex rounded-xl border border-slate-400/30 p-0.5">
                    {(['male', 'female'] as VoiceGender[]).map((g) => {
                      const active = voiceConfig.voiceGender === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => handleSelectGender(g)}
                          className={`rounded-lg px-3.5 py-1 text-xs font-semibold capitalize transition ${
                            active
                              ? 'keep-white-text shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          style={
                            active
                              ? {
                                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                }
                              : undefined
                          }
                        >
                          {g} Voice
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                      <span>Speech Frequency (Cadence)</span>
                      <span className="font-mono font-semibold text-cyan-400">
                        {voiceConfig.speechFrequency.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.65"
                      max="1.40"
                      step="0.05"
                      value={voiceConfig.speechFrequency}
                      onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                      <span>Voice Pitch Fine-Tune</span>
                      <span className="font-mono font-semibold text-cyan-400">
                        {voiceConfig.voicePitch.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.65"
                      max="1.35"
                      step="0.02"
                      value={voiceConfig.voicePitch}
                      onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
