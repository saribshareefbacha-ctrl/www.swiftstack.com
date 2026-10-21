import React, { useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Volume2, VolumeX, CheckCircle2, Edit3 } from 'lucide-react';
import { CHARACTER_PRESET_FRAMES } from '../data/defaultSeed';
import { CharacterConfig } from '../types/cms';

export type VisemePhase = 'idle' | 'open' | 'wave';

interface HeroCharacterCardProps {
  character: CharacterConfig;
  founderName: string;
  founderTitle: string;
  voiceGreeting: string;
  isSpeaking: boolean;
  visemePhase: VisemePhase;
  activeWordIndex: number;
  isOwner?: boolean;
  onToggleSpeak: () => void;
  onEditCharacter?: () => void;
}

export const HeroCharacterCard: React.FC<HeroCharacterCardProps> = ({
  character,
  founderName,
  founderTitle,
  voiceGreeting,
  isSpeaking,
  visemePhase,
  activeWordIndex,
  isOwner = false,
  onToggleSpeak,
  onEditCharacter,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-7, 7]), {
    stiffness: 200,
    damping: 24,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const frames =
    CHARACTER_PRESET_FRAMES[character.presetStyle] || CHARACTER_PRESET_FRAMES['executive-polo'];
  const hasCustomImg = Boolean(character.customImageUrl && character.customImageUrl.trim().length > 0);

  const auraHex = character.auraColor || '#06b6d4';

  const words = useMemo(() => {
    return voiceGreeting.trim().split(/\s+/).filter(Boolean);
  }, [voiceGreeting]);

  // Synchronized body & gesture rhythm during speech vs idle
  const figureMotion = isSpeaking
    ? {
        y: [0, -7, -2, -8, 0],
        rotate: [0, 0.9, -0.8, 0.6, 0],
        scale: [1, 1.022, 1.008, 1.025, 1],
      }
    : character.gestureAnimation === 'dynamic'
      ? {
          y: [0, -9, 0],
          rotate: [0, 0.8, -0.8, 0],
          scale: [1, 1.012, 1],
        }
      : character.gestureAnimation === 'still'
        ? {
            y: [0, -2, 0],
            scale: 1,
          }
        : {
            y: [0, -6, 0],
            rotate: [0, 0.45, -0.45, 0],
            scale: [1, 1.008, 1],
          };

  const showWaveFrame = !hasCustomImg && isSpeaking && visemePhase === 'wave' && Boolean(frames.wave);
  const showOpenFrame = !hasCustomImg && isSpeaking && visemePhase === 'open' && !showWaveFrame;

  return (
    <div style={{ perspective: 1100 }} className="relative mx-auto w-full max-w-[455px] select-none">
      {/* Seamless Transparent Frosted Glass Card — Zero Solid Black Container */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="ss-glass-card group relative overflow-hidden rounded-[2.25rem] border transition-all duration-300"
      >
        {/* Ambient Soft Radial Glow (Pure Light Halo — Transparent Backdrop) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-6 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${auraHex}42 0%, transparent 72%)`,
            opacity: isSpeaking ? 0.95 : 0.58,
          }}
        />

        {/* Top Floating Status Pill + Strictly Owner-Only Quick Edit */}
        <div className="relative z-20 flex items-center justify-between px-6 pt-5">
          <div className="ss-glass-card inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-200">{character.greetingBadgeText || 'Founder & CEO'}</span>
          </div>

          {isOwner && onEditCharacter && (
            <button
              type="button"
              onClick={onEditCharacter}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25 transition"
            >
              <Edit3 className="h-3 w-3" />
              <span>Customize</span>
            </button>
          )}
        </div>

        {/* Pure Transparent 3D CEO Character Viewport (Zero Dark Box) */}
        <div className="relative z-10 mx-auto flex h-[345px] sm:h-[385px] w-full items-end justify-center overflow-hidden bg-transparent px-4 pt-1">
          {/* Live Soundwave Halo Behind Shoulders When Speaking */}
          {isSpeaking && (
            <motion.div
              initial={{ scale: 0.86, opacity: 0.45 }}
              animate={{ scale: [0.9, 1.16, 0.92], opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute top-14 h-56 w-56 rounded-full border-2 border-cyan-400/45"
              style={{ boxShadow: `0 0 65px ${auraHex}40` }}
            />
          )}

          {/* Synchronized Multi-Frame Transparent Cutout Stack */}
          <motion.div
            animate={figureMotion}
            whileHover={{ scale: 1.022, y: -4 }}
            transition={{
              duration: isSpeaking ? 1.65 : 4.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex h-full w-full items-end justify-center bg-transparent"
          >
            {hasCustomImg ? (
              <img
                src={character.customImageUrl}
                alt={`${founderName} — ${founderTitle}`}
                className="h-[97%] w-auto max-w-full bg-transparent object-contain object-bottom drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)]"
              />
            ) : (
              <div className="relative flex h-[97%] w-full items-end justify-center bg-transparent">
                {/* Base Smile / Consonant Frame */}
                <img
                  src={frames.idle}
                  alt={`${founderName} — ${founderTitle}`}
                  className={`h-full w-auto max-w-full bg-transparent object-contain object-bottom drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)] transition-opacity duration-100 ${
                    showOpenFrame || showWaveFrame ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Preloaded Lip-Sync Open-Vowel & Subtle Hand Gesture Frame */}
                <img
                  src={frames.open}
                  alt=""
                  aria-hidden="true"
                  className={`pointer-events-none absolute bottom-0 h-full w-auto max-w-full bg-transparent object-contain object-bottom drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)] transition-opacity duration-100 ${
                    showOpenFrame ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                {/* Preloaded Greeting Hand-Wave Frame */}
                {frames.wave && (
                  <img
                    src={frames.wave}
                    alt=""
                    aria-hidden="true"
                    className={`pointer-events-none absolute bottom-0 h-full w-auto max-w-full bg-transparent object-contain object-bottom drop-shadow-[0_18px_28px_rgba(15,23,42,0.28)] transition-opacity duration-150 ${
                      showWaveFrame ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Frosted Glass Identity Footer + Real-Time Word-by-Word Highlighted Speech Box */}
        <div className="relative z-20 border-t border-slate-700/35 px-6 py-4 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
                  {founderName}
                </h2>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
              </div>
              <p className="text-xs font-medium text-slate-400">{founderTitle}</p>
            </div>

            <button
              type="button"
              onClick={onToggleSpeak}
              aria-label={isSpeaking ? 'Stop CEO audio greeting' : 'Play CEO audio greeting'}
              className="keep-white-text inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg transition hover:opacity-95"
              style={{
                background: isSpeaking
                  ? 'linear-gradient(135deg, #ef4444, #db2777)'
                  : `linear-gradient(135deg, ${auraHex}, #6366f1)`,
              }}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  <span>Play Intro</span>
                </>
              )}
            </button>
          </div>

          {/* Live Word-by-Word Karaoke Speech Transcript Box */}
          <div
            aria-live="polite"
            className="max-h-24 overflow-y-auto rounded-2xl border border-slate-700/40 bg-slate-950/35 px-3.5 py-2.5 text-xs leading-relaxed no-scrollbar"
          >
            {words.map((word, idx) => {
              const isCurrent = isSpeaking && idx === activeWordIndex;
              const isPast = isSpeaking && idx < activeWordIndex;
              return (
                <span
                  key={`${word}-${idx}`}
                  className={`mr-1 inline-block rounded px-1 py-0.5 transition-all duration-100 ${
                    isCurrent
                      ? 'keep-white-text font-bold scale-105 shadow-sm'
                      : isPast
                        ? 'font-semibold text-white'
                        : 'text-slate-300'
                  }`}
                  style={
                    isCurrent
                      ? {
                          background: `linear-gradient(135deg, ${auraHex}, #6366f1)`,
                        }
                      : undefined
                  }
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
