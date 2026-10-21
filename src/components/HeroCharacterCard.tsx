import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Volume2, VolumeX, CheckCircle2, Edit3 } from 'lucide-react';
import { CHARACTER_PRESET_IMAGES } from '../data/defaultSeed';
import { CharacterConfig } from '../types/cms';

interface HeroCharacterCardProps {
  character: CharacterConfig;
  founderName: string;
  founderTitle: string;
  voiceGreeting: string;
  isSpeaking: boolean;
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
  isOwner = false,
  onToggleSpeak,
  onEditCharacter,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), {
    stiffness: 200,
    damping: 24,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
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

  const characterImgSrc =
    character.customImageUrl && character.customImageUrl.trim().length > 0
      ? character.customImageUrl
      : CHARACTER_PRESET_IMAGES[character.presetStyle] || CHARACTER_PRESET_IMAGES['executive-polo'];

  const auraHex = character.auraColor || '#06b6d4';

  const idleMotion =
    character.gestureAnimation === 'dynamic'
      ? {
          y: [0, -10, 0],
          rotate: [0, 1.1, -0.9, 0],
          scale: isSpeaking ? [1, 1.03, 1.01, 1.035, 1] : [1, 1.015, 1],
        }
      : character.gestureAnimation === 'still'
        ? {
            y: [0, -2, 0],
            scale: isSpeaking ? [1, 1.02, 1] : 1,
          }
        : {
            y: [0, -6, 0],
            rotate: [0, 0.55, -0.55, 0],
            scale: isSpeaking ? [1, 1.028, 1.008, 1.028, 1] : [1, 1.01, 1],
          };

  return (
    <div
      style={{ perspective: 1100 }}
      className="relative mx-auto w-full max-w-[445px] select-none"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="group relative overflow-hidden rounded-[2rem] border border-slate-700/65 bg-gradient-to-b from-slate-900/90 via-[#070f23]/95 to-[#050b1a] shadow-[0_28px_80px_-18px_rgba(6,182,212,0.3)] backdrop-blur-2xl"
      >
        {/* Subtle studio radial backlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle, ${auraHex}42 0%, transparent 72%)`,
            opacity: isSpeaking ? 0.95 : 0.65,
          }}
        />

        {/* Top executive badge + strict owner-only edit shortcut */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/75 bg-slate-950/75 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>{character.greetingBadgeText || 'Founder & CEO'}</span>
          </div>

          {isOwner && onEditCharacter && (
            <button
              type="button"
              onClick={onEditCharacter}
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/50 bg-cyan-500/15 px-3 py-1 text-[11px] font-semibold text-cyan-200 hover:bg-cyan-500/25 transition"
            >
              <Edit3 className="h-3 w-3" />
              <span>Customize CEO</span>
            </button>
          )}
        </div>

        {/* Single Clean Executive CEO 3D Portrait Viewport */}
        <div className="relative z-10 mx-auto flex h-[345px] sm:h-[380px] w-full items-end justify-center overflow-hidden px-4 pt-2">
          {/* Speaking pulse wave ring behind character */}
          {isSpeaking && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0.6 }}
              animate={{ scale: [0.9, 1.18, 0.95], opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute top-14 h-56 w-56 rounded-full border border-cyan-400/40"
              style={{
                boxShadow: `0 0 60px ${auraHex}35`,
              }}
            />
          )}

          {/* Animated 3D CEO Figure with natural breathing & subtle gesture */}
          <motion.div
            animate={idleMotion}
            whileHover={{ scale: 1.022, y: -4 }}
            transition={{
              duration: isSpeaking ? 2.2 : 4.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex h-full w-full items-end justify-center"
          >
            <img
              src={characterImgSrc}
              alt={`${founderName} — ${founderTitle}`}
              className="h-[96%] w-auto max-w-full object-contain object-bottom drop-shadow-[0_18px_36px_rgba(0,0,0,0.65)]"
              style={{
                maskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 82%, transparent 100%)',
              }}
            />
          </motion.div>
        </div>

        {/* Bottom Executive Identity Plate + Single Clean Web Speech Audio Control */}
        <div className="relative z-20 border-t border-slate-800/90 bg-slate-950/90 px-6 py-4 backdrop-blur-xl space-y-3">
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
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                isSpeaking
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 shadow-lg shadow-cyan-500/20'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4 text-cyan-300" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 text-cyan-400" />
                  <span>Play Intro</span>
                </>
              )}
            </button>
          </div>

          <p className="line-clamp-2 rounded-xl border border-slate-800/90 bg-slate-900/70 px-3 py-2 text-[11px] italic text-slate-300">
            &ldquo;{voiceGreeting}&rdquo;
          </p>
        </div>
      </motion.div>
    </div>
  );
};
