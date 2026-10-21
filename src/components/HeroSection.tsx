import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Layers, Zap } from 'lucide-react';
import { CharacterConfig, HeroCMS } from '../types/cms';
import { HeroCharacterCard } from './HeroCharacterCard';

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

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeakIntro = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = hero.voiceGreeting.replace(/\s*&\s*/g, ' and ');
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = character.voiceRate || 1.0;
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

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <section
      id="hero"
      className="relative z-10 flex min-h-screen items-center pt-28 pb-16 px-4 sm:px-8 lg:px-14"
    >
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left 7 Columns: Clean Intro Text, Bio & Conversion Actions */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-slate-900/75 px-4 py-1.5 text-xs sm:text-sm font-medium text-cyan-300 backdrop-blur-md shadow-lg shadow-cyan-950/30">
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

          {/* Clean Executive Bio Note */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-900/65 p-5 backdrop-blur-xl">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {hero.founderBio}
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={onStartOrder}
              className="group inline-flex items-center gap-2.5 rounded-xl px-6 py-3.5 text-sm sm:text-base font-semibold text-slate-950 shadow-xl shadow-cyan-500/20 transition duration-200 hover:scale-[1.02]"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, #38bdf8)`,
              }}
            >
              <span>{hero.primaryCtaLabel}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={onExploreWork}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-6 py-3.5 text-sm sm:text-base font-medium text-slate-100 backdrop-blur-md transition hover:border-cyan-400/50 hover:bg-slate-800/80"
            >
              <span>{hero.secondaryCtaLabel}</span>
            </button>
          </div>

          {/* Clean Conversion Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/55 px-3.5 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5" />
                <span>Fast Delivery</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">24h Architecture Quote</p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/55 px-3.5 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-semibold">
                <Layers className="h-3.5 w-3.5" />
                <span>Full-Stack &amp; AI</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Web, Cloud &amp; Brand</p>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-slate-900/55 px-3.5 py-2.5 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Client Portal</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Live Order Tracking</p>
            </div>
          </div>
        </motion.div>

        {/* Right 5 Columns: Single Clean Executive CEO Character Card */}
        <div className="lg:col-span-5">
          <HeroCharacterCard
            character={character}
            founderName={hero.founderName}
            founderTitle={hero.founderTitle}
            voiceGreeting={hero.voiceGreeting}
            isSpeaking={isSpeaking}
            isOwner={isOwner}
            onToggleSpeak={handleSpeakIntro}
            onEditCharacter={onEditCharacter}
          />
        </div>
      </div>
    </section>
  );
};
