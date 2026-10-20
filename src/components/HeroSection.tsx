import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Edit3,
  Mic,
  Rotate3d,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { AvatarConfig, HeroCMS, ThemeCMS } from '../types/cms';
import { SpeechFrameState, speechEngine } from '../utils/speechEngine';
import { AvatarStageCanvas } from './three/AvatarStageCanvas';

interface HeroSectionProps {
  hero: HeroCMS;
  theme: ThemeCMS;
  avatarConfig: AvatarConfig;
  speechState: SpeechFrameState;
  isOwner: boolean;
  onQuickEditHero: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  hero,
  theme,
  avatarConfig,
  speechState,
  isOwner,
  onQuickEditHero,
}) => {
  const handleVoiceTrigger = () => {
    speechEngine.toggleSpeak(hero.voiceGreetingScript);
  };

  return (
    <section
      id="hero"
      className="relative pt-28 sm:pt-32 pb-20 lg:pb-28 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* ==========================================================
              LEFT SIDE: COMPANY INTRODUCTION, DYNAMIC BIO & OVERVIEW
          ========================================================== */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Dynamic Status Badge + Silent Owner Inline Edit Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-xs font-mono tracking-wide uppercase"
                style={{
                  borderColor: `${theme.primaryAccent}45`,
                  backgroundColor: `${theme.primaryAccent}12`,
                  color: '#e0f2fe',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: theme.primaryAccent }}
                />
                <span>{hero.statusBadge}</span>
              </div>

              {isOwner && (
                <button
                  onClick={onQuickEditHero}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-500/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Hero &amp; Bio</span>
                </button>
              )}
            </div>

            {/* Ultra-Modern Display Heading */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl xl:text-6xl tracking-tight leading-[1.08] text-white">
              {hero.heroHeadlinePrefix}{' '}
              <span
                className="bg-clip-text text-transparent inline-block"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent} 0%, ${theme.secondaryAccent} 52%, ${theme.tertiaryAccent} 100%)`,
                }}
              >
                {hero.heroHeadlineHighlight}
              </span>{' '}
              {hero.heroHeadlineSuffix}
            </h1>

            {/* Agency Overview Copy */}
            <p className="text-base sm:text-lg text-slate-300/95 leading-relaxed max-w-2xl">
              {hero.heroSubheading}
            </p>

            {/* CEO & Founder Glassmorphic Bio Card */}
            <div
              className="rounded-2xl border border-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-2xl relative overflow-hidden"
              style={{
                backgroundColor: `rgba(15, 23, 42, ${theme.glassOpacity})`,
              }}
            >
              <div
                className="absolute top-0 left-0 w-1 h-full"
                style={{
                  background: `linear-gradient(180deg, ${theme.primaryAccent}, ${theme.tertiaryAccent})`,
                }}
              />
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img
                    src="./images/scan-sample-sarib.jpg"
                    alt={hero.founderName}
                    className="w-14 h-14 rounded-2xl object-cover border border-cyan-400/40 shadow-md"
                  />
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-950 shadow"
                    style={{ backgroundColor: theme.primaryAccent }}
                    title="Founder & CEO"
                  >
                    <Award className="w-3 h-3" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display font-bold text-base sm:text-lg text-white">
                      {hero.ceoBioTitle}
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                      {hero.socialHandle}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300/90 leading-relaxed">
                    {hero.ceoBioText}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-display font-semibold text-sm sm:text-base text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.38)] transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                }}
              >
                <span>{hero.primaryCtaLabel}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>

              <a
                href="#avatar-studio"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-display font-semibold text-sm sm:text-base text-white border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] hover:border-cyan-400/50 backdrop-blur-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{hero.secondaryCtaLabel}</span>
              </a>

              <button
                type="button"
                onClick={handleVoiceTrigger}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl text-xs sm:text-sm font-medium text-cyan-200 border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all"
              >
                <Volume2 className="w-4 h-4 text-cyan-300" />
                <span>{speechState.isSpeaking ? 'Stop Greeting' : 'Hear CEO Intro'}</span>
              </button>
            </div>

            {/* Key SwiftStack Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {hero.stats.map((stat) => (
                <div
                  key={stat.id}
                  className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-md px-4 py-3"
                >
                  <div
                    className="font-display font-bold text-xl sm:text-2xl"
                    style={{ color: theme.primaryAccent }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ==========================================================
              RIGHT SIDE: INTERACTIVE 3D AVATAR STAGE & FLOATING VOICE TRIGGER
          ========================================================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            <div
              className="relative h-[500px] sm:h-[560px] rounded-3xl border border-white/15 backdrop-blur-2xl overflow-hidden shadow-[0_25px_70px_rgba(2,6,23,0.85)]"
              style={{
                background: `radial-gradient(circle at 50% 28%, ${theme.primaryAccent}22 0%, ${theme.secondaryAccent}12 42%, rgba(9, 14, 28, ${theme.glassOpacity + 0.18}) 100%)`,
              }}
            >
              {/* FLOATING CIRCULAR VOICE TRIGGER DIRECTLY ABOVE THE AVATAR */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceTrigger}
                  aria-label="Trigger Avatar Voice Greeting"
                  className="group relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_0_32px_rgba(6,182,212,0.55)] border border-cyan-300/60 transition-transform duration-300 hover:scale-110 active:scale-95"
                  style={{
                    background: speechState.isSpeaking
                      ? `linear-gradient(135deg, #ef4444, ${theme.secondaryAccent})`
                      : `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                  }}
                >
                  {/* Animated Sonar Pulse Rings */}
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-40"
                    style={{ backgroundColor: theme.primaryAccent }}
                  />
                  {speechState.isSpeaking ? (
                    <Square className="w-5 h-5 fill-white relative z-10" />
                  ) : (
                    <Mic className="w-6 h-6 relative z-10" />
                  )}
                </button>

                {/* Real-time Audio Equalizer Pill */}
                <div className="px-3 py-1 rounded-full bg-slate-950/85 border border-white/15 backdrop-blur-md flex items-center gap-2 shadow-lg">
                  <div className="flex items-end gap-[3px] h-3.5">
                    {speechState.energyBars.map((val, idx) => (
                      <span
                        key={idx}
                        className="w-[2.5px] rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(22, Math.round(val * 100))}%`,
                          backgroundColor: speechState.isSpeaking
                            ? theme.primaryAccent
                            : '#64748b',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-cyan-200 whitespace-nowrap">
                    {speechState.isSpeaking
                      ? 'Speaking Live · Lip-Sync Active'
                      : 'Click Voice Icon to Greet'}
                  </span>
                </div>
              </div>

              {/* LIVE FLOATING SPEECH SUBTITLE HUD WHEN SPEAKING */}
              {speechState.isSpeaking && speechState.words.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-14 inset-x-4 z-20 rounded-2xl bg-slate-950/88 border border-cyan-400/35 backdrop-blur-xl p-3.5 shadow-2xl"
                >
                  <div className="text-xs leading-relaxed text-slate-200 max-h-20 overflow-y-auto">
                    {speechState.words.map((word, idx) => {
                      const active = idx === speechState.currentWordIndex;
                      const spoken = idx < speechState.currentWordIndex;
                      return (
                        <span
                          key={idx}
                          className={`inline-block mr-1 transition-colors ${
                            active
                              ? 'text-cyan-300 font-bold underline decoration-cyan-400'
                              : spoken
                                ? 'text-white'
                                : 'text-slate-400'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                  <div className="mt-2 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-100"
                      style={{
                        width: `${Math.round(speechState.progress * 100)}%`,
                        backgroundColor: theme.primaryAccent,
                      }}
                    />
                  </div>
                </motion.div>
              )}

              {/* INTERACTIVE 3D BITMOJI AVATAR CANVAS */}
              <div className="w-full h-full pt-8 cursor-grab active:cursor-grabbing">
                <AvatarStageCanvas
                  config={avatarConfig}
                  speechState={speechState}
                  primaryAccent={theme.primaryAccent}
                  secondaryAccent={theme.secondaryAccent}
                  cameraZ={3.92}
                  cameraY={0.22}
                  enableZoom={false}
                />
              </div>

              {/* Bottom Stage Telemetry Bar */}
              <div className="absolute bottom-3 inset-x-4 z-10 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/75 border border-white/10 backdrop-blur-md text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: theme.primaryAccent }}
                  />
                  <span className="font-semibold text-white">{hero.founderName}</span>
                  <span className="text-slate-400 hidden sm:inline">· 3D Twin</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300 font-mono">
                  <Rotate3d className="w-3.5 h-3.5" />
                  <span>Drag 360°</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
