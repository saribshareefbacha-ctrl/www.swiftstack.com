import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Layers, Zap, Volume2, VolumeX } from 'lucide-react';
import { CharacterConfig, HeroCMS } from '../types/cms';
import { HeroCharacterCard, VisemePhase } from './HeroCharacterCard';

interface HeroSectionProps {
  hero: HeroCMS;
  character: CharacterConfig;
  primaryColor: string;
  secondaryColor: string;
  isOwner?: boolean;
  onExploreWork: () => void;
  onStartOrder: () => void;
  onEditCharacter?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  character,
  primaryColor,
  secondaryColor,
  isOwner = false,
  onExploreWork,
  onStartOrder,
  onEditCharacter,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [visemePhase, setVisemePhase] = useState<VisemePhase>('idle');

  const visemeTimerRef = useRef<number | null>(null);
  const fallbackWordTimerRef = useRef<number | null>(null);
  const boundaryReceivedRef = useRef(false);

  // Build normalized spoken string & word character span table so charIndex maps cleanly to display words
  const speechMap = useMemo(() => {
    const rawWords = hero.voiceGreeting.trim().split(/\s+/).filter(Boolean);
    const spokenWords = rawWords.map((w) => (w === '&' ? 'and' : w.replace(/&/g, ' and ')));
    const spans: { index: number; start: number; end: number; raw: string }[] = [];
    let cursor = 0;
    spokenWords.forEach((sw, idx) => {
      const start = cursor;
      const end = cursor + sw.length;
      spans.push({ index: idx, start, end, raw: rawWords[idx] });
      cursor = end + 1; // +1 space
    });
    return {
      rawWords,
      spokenText: spokenWords.join(' '),
      spans,
    };
  }, [hero.voiceGreeting]);

  const stopAllSpeechTimers = () => {
    if (visemeTimerRef.current) {
      window.clearInterval(visemeTimerRef.current);
      visemeTimerRef.current = null;
    }
    if (fallbackWordTimerRef.current) {
      window.clearInterval(fallbackWordTimerRef.current);
      fallbackWordTimerRef.current = null;
    }
    setIsSpeaking(false);
    setActiveWordIndex(-1);
    setVisemePhase('idle');
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      stopAllSpeechTimers();
    };
  }, []);

  const handleSpeakIntro = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      stopAllSpeechTimers();
      return;
    }

    window.speechSynthesis.cancel();
    stopAllSpeechTimers();

    const utterance = new SpeechSynthesisUtterance(speechMap.spokenText);
    const rate = character.voiceRate || 1.0;
    utterance.rate = rate;
    utterance.pitch = character.voicePitch || 1.02;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find(
        (v) =>
          /en/i.test(v.lang) && /(daniel|alex|google uk english male|guy|david)/i.test(v.name)
      ) || voices.find((v) => /en/i.test(v.lang));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    boundaryReceivedRef.current = false;
    setIsSpeaking(true);
    setActiveWordIndex(0);
    setVisemePhase('wave');

    const startTime = Date.now();
    let tickCount = 0;

    // Smooth real-time mouth lip-sync & initial welcome hand wave
    visemeTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      tickCount += 1;
      if (elapsed < 1250) {
        setVisemePhase(tickCount % 3 === 0 ? 'open' : 'wave');
      } else {
        setVisemePhase(tickCount % 2 === 0 ? 'open' : 'idle');
      }
    }, 135);

    // Exact native word-boundary synchronization
    utterance.onboundary = (event) => {
      if (event.name === 'word' || typeof event.charIndex === 'number') {
        boundaryReceivedRef.current = true;
        const cIdx = event.charIndex;
        const found = speechMap.spans.find((sp) => cIdx >= sp.start && cIdx <= sp.end + 1);
        if (found) {
          setActiveWordIndex(found.index);
        }
      }
    };

    // Calibrated fallback word stepper for voices/platforms that omit boundary events
    const msPerWord = Math.max(210, Math.round(335 / rate));
    fallbackWordTimerRef.current = window.setInterval(() => {
      if (!boundaryReceivedRef.current) {
        setActiveWordIndex((prev) =>
          prev + 1 < speechMap.rawWords.length ? prev + 1 : prev
        );
      }
    }, msPerWord);

    utterance.onend = () => stopAllSpeechTimers();
    utterance.onerror = () => stopAllSpeechTimers();

    window.speechSynthesis.speak(utterance);
  };

  return (
    <section
      id="hero"
      className="relative z-10 flex min-h-screen items-center pt-28 pb-16 px-4 sm:px-8 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left 7 Columns: Agency Intro Copy & Conversion Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="ss-glass-card inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs sm:text-sm font-semibold text-cyan-300">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            <span>{hero.badgeText}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight text-white leading-[1.09]">
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

          {/* Clean Frosted Bio Card */}
          <div className="ss-glass-card rounded-2xl border p-5">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {hero.founderBio}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <button
              type="button"
              onClick={onStartOrder}
              className="keep-white-text group inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm sm:text-base font-bold shadow-xl transition duration-200 hover:scale-[1.02]"
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
              className="ss-glass-card inline-flex items-center gap-2 rounded-xl border px-5 py-3.5 text-sm sm:text-base font-semibold text-slate-100 transition hover:border-cyan-400/50"
            >
              <span>{hero.secondaryCtaLabel}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeakIntro}
              className="ss-glass-card inline-flex items-center gap-2 rounded-xl border px-4 py-3.5 text-xs sm:text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/60"
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  <span>Stop Greeting</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  <span>CEO Voice Intro</span>
                </>
              )}
            </button>
          </div>

          {/* Clean Conversion Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
            <div className="ss-glass-card rounded-xl border px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5" />
                <span>Fast Delivery</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">24h Architecture Quote</p>
            </div>
            <div className="ss-glass-card rounded-xl border px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                <Layers className="h-3.5 w-3.5" />
                <span>Full-Stack &amp; AI</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Web, Cloud &amp; Brand</p>
            </div>
            <div className="ss-glass-card rounded-xl border px-3.5 py-2.5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Client Portal</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Live Order Tracking</p>
            </div>
          </div>
        </motion.div>

        {/* Right 5 Columns: Seamless Transparent-Glass CEO Character Card */}
        <div className="lg:col-span-5">
          <HeroCharacterCard
            character={character}
            founderName={hero.founderName}
            founderTitle={hero.founderTitle}
            voiceGreeting={hero.voiceGreeting}
            isSpeaking={isSpeaking}
            visemePhase={visemePhase}
            activeWordIndex={activeWordIndex}
            isOwner={isOwner}
            onToggleSpeak={handleSpeakIntro}
            onEditCharacter={onEditCharacter}
          />
        </div>
      </div>
    </section>
  );
};
