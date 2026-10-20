import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Check,
  Download,
  Eye,
  Glasses,
  Palette,
  RefreshCcw,
  Save,
  ScanFace,
  Scissors,
  Shirt,
  Sliders,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  AvatarConfig,
  AvatarExpression,
  BeardStyle,
  GlassesStyle,
  HairStyle,
  OutfitStyle,
  ThemeCMS,
} from '../types/cms';
import { DEFAULT_SARIB_AVATAR } from '../data/defaultSeed';
import { SpeechFrameState, speechEngine } from '../utils/speechEngine';
import { analyzePortraitImage, ScanBiometricReport } from '../utils/photoScanner';
import { AvatarStageCanvas } from './three/AvatarStageCanvas';

interface AvatarStudioSectionProps {
  avatarConfig: AvatarConfig;
  onChangeAvatar: (next: AvatarConfig) => void;
  onSaveGlobalAvatar?: (next: AvatarConfig) => Promise<void>;
  voiceScript: string;
  speechState: SpeechFrameState;
  theme: ThemeCMS;
  isOwner: boolean;
}

type StudioMode = 'manual' | 'scanner';
type CustomizerTab = 'hair' | 'beard' | 'skin' | 'eyes' | 'outfit' | 'accessories';

const SKIN_PRESETS = [
  { label: 'Warm Olive (Sarib)', hex: '#d49b72' },
  { label: 'Porcelain Ivory', hex: '#f3cfb6' },
  { label: 'Warm Sand', hex: '#e7b996' },
  { label: 'Golden Honey', hex: '#c98a5f' },
  { label: 'Rich Caramel', hex: '#a86b43' },
  { label: 'Warm Chestnut', hex: '#875133' },
  { label: 'Deep Espresso', hex: '#59331f' },
  { label: 'Sunlit Bronze', hex: '#be8158' },
];

const HAIR_PRESETS = [
  { label: 'Jet Charcoal (Sarib)', hex: '#16161a' },
  { label: 'Espresso Brown', hex: '#2c1d14' },
  { label: 'Warm Chestnut', hex: '#4e311f' },
  { label: 'Golden Blonde', hex: '#a87d44' },
  { label: 'Auburn Copper', hex: '#7c3621' },
  { label: 'Silver Platinum', hex: '#cbd5e1' },
  { label: 'Cyber Cyan Tint', hex: '#0891b2' },
  { label: 'Midnight Indigo', hex: '#312e81' },
];

const EYE_PRESETS = [
  { label: 'Deep Espresso (Sarib)', hex: '#3b2314' },
  { label: 'Warm Hazel', hex: '#6c5128' },
  { label: 'Golden Amber', hex: '#926020' },
  { label: 'Ocean Blue', hex: '#1d4ed8' },
  { label: 'Emerald Green', hex: '#15803d' },
  { label: 'Slate Storm', hex: '#475569' },
];

const SCAN_PRESET_PHOTOS = [
  {
    id: 'sarib',
    name: 'Muhammad Sarib Randhawa',
    role: 'CEO Signature Look',
    src: '/images/scan-sample-sarib.jpg',
  },
  {
    id: 'exec',
    name: 'Executive Architect',
    role: 'Glasses + Navy Blazer',
    src: '/images/scan-sample-exec.jpg',
  },
  {
    id: 'creative',
    name: 'Creative Director',
    role: 'Curly Crop + Cyber Hoodie',
    src: '/images/scan-sample-creative.jpg',
  },
];

const SCAN_STEPS = [
  'CALIBRATING 68-POINT FACIAL MESH LANDMARKS...',
  'SAMPLING MELANIN SUBSURFACE CHROMA & LIGHTING...',
  'ANALYZING CRANIAL HAIR VOLUME & MANDIBULAR BEARD CONTOUR...',
  'EXTRACTING COLLAR TRIM & GARMENT PALETTE VECTORS...',
  'SYNTHESIZING INTERACTIVE 3D BITMOJI AVATAR RIG...',
];

export const AvatarStudioSection: React.FC<AvatarStudioSectionProps> = ({
  avatarConfig,
  onChangeAvatar,
  onSaveGlobalAvatar,
  voiceScript,
  speechState,
  theme,
  isOwner,
}) => {
  const [studioMode, setStudioMode] = useState<StudioMode>('manual');
  const [activeTab, setActiveTab] = useState<CustomizerTab>('outfit');
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // AI Photo Scanner States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanImageSrc, setScanImageSrc] = useState<string>('/images/scan-sample-sarib.jpg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStepIdx, setScanStepIdx] = useState(0);
  const [scanReport, setScanReport] = useState<ScanBiometricReport | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const updateField = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    onChangeAvatar({ ...avatarConfig, [key]: value });
  };

  const triggerScanPipeline = async (src: string, presetId?: string) => {
    setScanImageSrc(src);
    setIsScanning(true);
    setScanReport(null);
    setScanStepIdx(0);

    for (let i = 1; i < SCAN_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 340));
      setScanStepIdx(i);
    }

    const report = await analyzePortraitImage(src, presetId);
    await new Promise((r) => setTimeout(r, 260));

    onChangeAvatar({
      ...avatarConfig,
      ...report.suggestedConfig,
    });
    setScanReport(report);
    setIsScanning(false);
  };

  const handleFilePicked = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        triggerScanPipeline(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportSnapshot = () => {
    const wrapper = document.getElementById('studio-3d-viewport');
    const canvas = wrapper?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'swiftstack-3d-avatar.png';
    link.href = url;
    link.click();
  };

  const handlePersistDefault = async () => {
    if (!onSaveGlobalAvatar) return;
    setSavingGlobal(true);
    try {
      await onSaveGlobalAvatar(avatarConfig);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2600);
    } finally {
      setSavingGlobal(false);
    }
  };

  const tabs: Array<{ id: CustomizerTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'hair', label: 'Hair', icon: Scissors },
    { id: 'beard', label: 'Beard', icon: Sparkles },
    { id: 'skin', label: 'Skin', icon: Palette },
    { id: 'eyes', label: 'Eyes', icon: Eye },
    { id: 'outfit', label: 'Outfit', icon: Shirt },
    { id: 'accessories', label: 'Extras', icon: Glasses },
  ];

  return (
    <section id="avatar-studio" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300">
              <ScanFace className="w-4 h-4 text-cyan-400" />
              <span>Interactive 3D Bitmoji Studio &amp; AI Biometric Scanner</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
              3D Avatar Customizer{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.tertiaryAccent})`,
                }}
              >
                &amp; AI Photo Scanner
              </span>
            </h2>
            <p className="text-slate-300/90 text-base sm:text-lg">
              Fine-tune hair geometry, groomed beard styles, skin tones, collared polo trims, and
              accessories live in 3D — or upload any portrait photo to let our AI Biometric Matrix
              auto-configure the 3D rig.
            </p>
          </div>

          {/* Mode Switcher: Manual Studio vs AI Photo Scanner */}
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-900/90 border border-white/15 backdrop-blur-xl self-start">
            <button
              type="button"
              onClick={() => setStudioMode('manual')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                studioMode === 'manual'
                  ? 'text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
              style={
                studioMode === 'manual'
                  ? {
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }
                  : undefined
              }
            >
              <Sliders className="w-4 h-4" />
              <span>Manual Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioMode('scanner')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                studioMode === 'scanner'
                  ? 'text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
              style={
                studioMode === 'scanner'
                  ? {
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }
                  : undefined
              }
            >
              <ScanFace className="w-4 h-4" />
              <span>AI Photo Scanner</span>
            </button>
          </div>
        </div>

        {/* Studio Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* ==========================================================
              LEFT 5 COLS: LIVE 3D STUDIO STAGE + SNAPSHOT & VOICE CONTROLS
          ========================================================== */}
          <div className="lg:col-span-5 flex flex-col">
            <div
              id="studio-3d-viewport"
              className="relative flex-1 min-h-[470px] rounded-3xl border border-white/15 backdrop-blur-2xl overflow-hidden shadow-2xl"
              style={{
                background: `radial-gradient(circle at 50% 32%, ${theme.primaryAccent}24 0%, rgba(15, 23, 42, ${theme.glassOpacity + 0.2}) 75%)`,
              }}
            >
              {/* Top Action Bar inside Viewport */}
              <div className="absolute top-4 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => speechEngine.toggleSpeak(voiceScript)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-xs font-semibold text-cyan-200 border border-cyan-400/35 backdrop-blur-md transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{speechState.isSpeaking ? 'Stop Lip-Sync' : 'Test Voice & Lip-Sync'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeAvatar({ ...DEFAULT_SARIB_AVATAR })}
                    title="Reset to Muhammad Sarib Randhawa Signature Look"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-xs font-medium text-slate-200 border border-white/15 backdrop-blur-md transition-all"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sarib Preset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportSnapshot}
                    title="Download PNG Render"
                    className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-white/15 backdrop-blur-md transition-all"
                  >
                    <Download className="w-4 h-4 text-cyan-300" />
                  </button>
                </div>
              </div>

              <div className="w-full h-full pt-8 cursor-grab active:cursor-grabbing">
                <AvatarStageCanvas
                  config={avatarConfig}
                  speechState={speechState}
                  primaryAccent={theme.primaryAccent}
                  secondaryAccent={theme.secondaryAccent}
                  cameraZ={3.78}
                  cameraY={0.22}
                  enableZoom={true}
                />
              </div>

              {/* Bottom Info & Save Global Default Button (when Owner is authenticated) */}
              <div className="absolute bottom-3.5 inset-x-4 z-20 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/10 backdrop-blur-md text-xs text-slate-300">
                <span>Live Synced w/ Hero 3D Stage · Scroll/Drag Enabled</span>
                {isOwner && onSaveGlobalAvatar && (
                  <button
                    type="button"
                    disabled={savingGlobal}
                    onClick={handlePersistDefault}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                  >
                    {savedToast ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved Globally!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingGlobal ? 'Saving...' : 'Save as Site Default'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ==========================================================
              RIGHT 7 COLS: GRANULAR STUDIO CONTROLS OR AI PHOTO SCANNER
          ========================================================== */}
          <div
            className="lg:col-span-7 rounded-3xl border border-white/15 backdrop-blur-2xl p-6 sm:p-7 flex flex-col justify-between shadow-2xl"
            style={{
              backgroundColor: `rgba(15, 23, 42, ${theme.glassOpacity})`,
            }}
          >
            {studioMode === 'manual' ? (
              <div className="space-y-6">
                {/* 6 Granular Category Tabs */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-semibold border transition-all ${
                          active
                            ? 'text-slate-950 border-transparent shadow-md'
                            : 'text-slate-300 bg-slate-950/55 border-white/10 hover:bg-white/10'
                        }`}
                        style={
                          active
                            ? {
                                background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                              }
                            : undefined
                        }
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: HAIR CUSTOMIZER */}
                {activeTab === 'hair' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        3D Sculpted Hairstyle
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(
                          [
                            ['modern-quiff', 'Modern Textured Short Quiff (Signature)'],
                            ['slick-side', 'Executive Side-Part Pompadour'],
                            ['curly-crop', 'Textured Curly Crop & Fade'],
                            ['wavy-flow', 'Medium Layered Flow'],
                            ['buzz-fade', 'Clean Precision Taper Buzz'],
                          ] as Array<[HairStyle, string]>
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateField('hairStyle', val)}
                            className={`px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all ${
                              avatarConfig.hairStyle === val
                                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Hair Shade &amp; Custom Tint
                        </label>
                        <input
                          type="color"
                          value={avatarConfig.hairColor}
                          onChange={(e) => updateField('hairColor', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                        {HAIR_PRESETS.map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => updateField('hairColor', p.hex)}
                            title={p.label}
                            className={`h-10 rounded-xl border-2 transition-transform hover:scale-105 ${
                              avatarConfig.hairColor.toLowerCase() === p.hex.toLowerCase()
                                ? 'border-cyan-400 scale-105'
                                : 'border-white/15'
                            }`}
                            style={{ backgroundColor: p.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BEARD CUSTOMIZER */}
                {activeTab === 'beard' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        Facial Hair &amp; Jawline Grooming
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(
                          [
                            ['full-groomed', 'Groomed Full Beard & Mustache (Signature)'],
                            ['royal-boxed', 'Sharp Boxed Corporate Beard'],
                            ['heavy-stubble', 'Designer Heavy Stubble'],
                            ['goatee-trim', 'Precision Goatee & Mustache'],
                            ['clean-shaven', 'Clean Shaven'],
                          ] as Array<[BeardStyle, string]>
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateField('beardStyle', val)}
                            className={`px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all ${
                              avatarConfig.beardStyle === val
                                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Beard Pigment
                        </label>
                        <button
                          type="button"
                          onClick={() => updateField('beardColor', avatarConfig.hairColor)}
                          className="text-xs text-cyan-300 hover:underline"
                        >
                          Match Hair Color
                        </button>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                        {HAIR_PRESETS.map((p) => (
                          <button
                            key={p.hex}
                            type="button"
                            onClick={() => updateField('beardColor', p.hex)}
                            title={p.label}
                            className={`h-10 rounded-xl border-2 transition-transform hover:scale-105 ${
                              avatarConfig.beardColor.toLowerCase() === p.hex.toLowerCase()
                                ? 'border-cyan-400 scale-105'
                                : 'border-white/15'
                            }`}
                            style={{ backgroundColor: p.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SKIN TONE & EYEBROWS */}
                {activeTab === 'skin' && (
                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Subsurface Skin Tone Palette
                        </label>
                        <input
                          type="color"
                          value={avatarConfig.skinTone}
                          onChange={(e) => updateField('skinTone', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent"
                        />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {SKIN_PRESETS.map((s) => (
                          <button
                            key={s.hex}
                            type="button"
                            onClick={() => updateField('skinTone', s.hex)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                              avatarConfig.skinTone.toLowerCase() === s.hex.toLowerCase()
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-full shrink-0 border border-white/25"
                              style={{ backgroundColor: s.hex }}
                            />
                            <span className="text-xs font-medium truncate">{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                          Eyebrow Arch &amp; Elevation
                        </label>
                        <span className="text-xs font-mono text-cyan-300">
                          {avatarConfig.eyebrowArch.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-0.2"
                        max="0.5"
                        step="0.02"
                        value={avatarConfig.eyebrowArch}
                        onChange={(e) => updateField('eyebrowArch', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 4: EYES & FACIAL EXPRESSION */}
                {activeTab === 'eyes' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        Iris Color &amp; Dual Specular Catchlights
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {EYE_PRESETS.map((eye) => (
                          <button
                            key={eye.hex}
                            type="button"
                            onClick={() => updateField('eyeColor', eye.hex)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                              avatarConfig.eyeColor.toLowerCase() === eye.hex.toLowerCase()
                                ? 'border-cyan-400 bg-cyan-500/15 text-white'
                                : 'border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full border border-white/30 shrink-0"
                              style={{ backgroundColor: eye.hex }}
                            />
                            <span className="text-xs font-medium">{eye.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        Resting Facial Expression
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(
                          [
                            ['confident-smile', 'Confident Founder Smile'],
                            ['friendly-grin', 'Warm Welcome Grin'],
                            ['focused-architect', 'Focused Systems Architect'],
                            ['visionary', 'Visionary Keynote'],
                          ] as Array<[AvatarExpression, string]>
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateField('expression', val)}
                            className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-medium border text-left transition-all ${
                              avatarConfig.expression === val
                                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                : 'border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: SIGNATURE OUTFIT & TRIMS */}
                {activeTab === 'outfit' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        3D Garment Architecture
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(
                          [
                            ['white-polo', 'White Collared Polo w/ Red & Blue Trims'],
                            ['executive-blazer', 'Midnight Executive Blazer & Shirt'],
                            ['cyber-hoodie', 'SwiftStack Cyber Tech Hoodie'],
                            ['henley-casual', 'Charcoal Ribbed Studio Henley'],
                            ['waistcoat-modern', 'Tailored Founder Waistcoat & Sleeves'],
                          ] as Array<[OutfitStyle, string]>
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              if (val === 'white-polo') {
                                onChangeAvatar({
                                  ...avatarConfig,
                                  outfitStyle: val,
                                  shirtPrimaryColor: '#f8fafc',
                                  shirtTrimColor1: '#ef4444',
                                  shirtTrimColor2: '#2563eb',
                                });
                              } else if (val === 'executive-blazer') {
                                onChangeAvatar({
                                  ...avatarConfig,
                                  outfitStyle: val,
                                  shirtPrimaryColor: '#1e293b',
                                  shirtTrimColor1: '#06b6d4',
                                });
                              } else if (val === 'cyber-hoodie') {
                                onChangeAvatar({
                                  ...avatarConfig,
                                  outfitStyle: val,
                                  shirtPrimaryColor: '#0f172a',
                                  shirtTrimColor1: '#06b6d4',
                                });
                              } else {
                                updateField('outfitStyle', val);
                              }
                            }}
                            className={`px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-medium border transition-all ${
                              avatarConfig.outfitStyle === val
                                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                : 'bg-slate-950/50 border-white/10 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Granular Color Pickers for Shirt, Collar/Cuff Trims & Dark Pants */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <label className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-2 cursor-pointer">
                        <span className="text-[11px] font-mono text-slate-400">Primary Shirt</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={avatarConfig.shirtPrimaryColor}
                            onChange={(e) => updateField('shirtPrimaryColor', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-white">
                            {avatarConfig.shirtPrimaryColor}
                          </span>
                        </div>
                      </label>

                      <label className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-2 cursor-pointer">
                        <span className="text-[11px] font-mono text-slate-400">Collar Trim 1</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={avatarConfig.shirtTrimColor1}
                            onChange={(e) => updateField('shirtTrimColor1', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-white">
                            {avatarConfig.shirtTrimColor1}
                          </span>
                        </div>
                      </label>

                      <label className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-2 cursor-pointer">
                        <span className="text-[11px] font-mono text-slate-400">Collar Trim 2</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={avatarConfig.shirtTrimColor2}
                            onChange={(e) => updateField('shirtTrimColor2', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-white">
                            {avatarConfig.shirtTrimColor2}
                          </span>
                        </div>
                      </label>

                      <label className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col gap-2 cursor-pointer">
                        <span className="text-[11px] font-mono text-slate-400">Trousers</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={avatarConfig.pantsColor}
                            onChange={(e) => updateField('pantsColor', e.target.value)}
                            className="w-7 h-7 rounded bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-white">
                            {avatarConfig.pantsColor}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* TAB 6: ACCESSORIES & HOLOGRAPHIC EXTRAS */}
                {activeTab === 'accessories' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
                        3D Optical &amp; Eyewear Frames
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {(
                          [
                            ['none', 'No Eyewear (Clean)'],
                            ['clear-tech', 'Clear Architect Frames'],
                            ['aviator', 'Gold Titanium Aviators'],
                            ['round-studio', 'Round Studio Optics'],
                            ['cyber-shades', 'Glowing Visor Shades'],
                          ] as Array<[GlassesStyle, string]>
                        ).map(([val, label]) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => updateField('glasses', val)}
                            className={`px-3.5 py-3 rounded-xl text-xs sm:text-sm font-medium border text-left transition-all ${
                              avatarConfig.glasses === val
                                ? 'border-cyan-400 bg-cyan-500/20 text-white'
                                : 'border-white/10 bg-slate-950/50 text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          key: 'watch' as const,
                          title: 'Chronograph Watch',
                          desc: 'Smart OLED wrist timepiece',
                        },
                        {
                          key: 'headset' as const,
                          title: 'Studio Headset',
                          desc: 'Wireless over-ear audio cans',
                        },
                        {
                          key: 'holoAura' as const,
                          title: '3D Orbital Aura',
                          desc: 'Floating cyan gyro-rings',
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => updateField(item.key, !avatarConfig[item.key])}
                          className={`p-4 rounded-2xl border text-left transition-all ${
                            avatarConfig[item.key]
                              ? 'border-cyan-400 bg-cyan-500/15 text-white'
                              : 'border-white/10 bg-slate-950/50 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs sm:text-sm">{item.title}</span>
                            <span
                              className={`w-3 h-3 rounded-full ${
                                avatarConfig[item.key] ? 'bg-cyan-400' : 'bg-slate-600'
                              }`}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ==========================================================
                 AI PHOTO SCANNER MATRIX DROPZONE & BIOMETRIC ANALYZER
              ========================================================== */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  {/* Interactive Scanning Matrix Window */}
                  <div className="sm:col-span-5 relative rounded-2xl overflow-hidden border border-cyan-400/40 bg-slate-950 aspect-square shadow-xl">
                    <img
                      src={scanImageSrc}
                      alt="Scanned Portrait"
                      className="w-full h-full object-cover"
                    />

                    {/* Cybernetic Reticle Overlay */}
                    <svg
                      viewBox="0 0 200 200"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                    >
                      <rect
                        x="28"
                        y="22"
                        width="144"
                        height="156"
                        rx="18"
                        fill="none"
                        stroke={theme.primaryAccent}
                        strokeWidth="1.2"
                        strokeDasharray="6 4"
                        opacity="0.8"
                      />
                      {/* Biometric Key Landmarks */}
                      {[
                        [76, 76],
                        [124, 76],
                        [100, 98],
                        [82, 124],
                        [118, 124],
                        [100, 148],
                        [64, 112],
                        [136, 112],
                      ].map(([cx, cy], i) => (
                        <g key={i}>
                          <circle
                            cx={cx}
                            cy={cy}
                            r="3"
                            fill={theme.primaryAccent}
                            opacity={isScanning ? 1 : 0.65}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r="7"
                            fill="none"
                            stroke={theme.primaryAccent}
                            strokeWidth="0.8"
                            opacity="0.5"
                          />
                        </g>
                      ))}
                    </svg>

                    {/* Animated Sweeping Laser Beam */}
                    {isScanning && (
                      <motion.div
                        initial={{ top: '0%' }}
                        animate={{ top: ['4%', '94%', '4%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-x-0 h-1 z-20 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${theme.primaryAccent}, #ffffff, ${theme.primaryAccent}, transparent)`,
                          boxShadow: `0 0 20px 4px ${theme.primaryAccent}`,
                        }}
                      />
                    )}

                    <div className="absolute bottom-2 inset-x-2 px-2.5 py-1.5 rounded-lg bg-slate-950/85 border border-white/15 text-[10px] font-mono text-cyan-300 truncate">
                      {isScanning
                        ? SCAN_STEPS[scanStepIdx]
                        : scanReport
                          ? `MATCH CONFIDENCE: ${scanReport.confidence}%`
                          : 'READY FOR PORTRAIT SCAN'}
                    </div>
                  </div>

                  {/* Upload Dropzone & Telemetry Results */}
                  <div className="sm:col-span-7 space-y-4">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        handleFilePicked(e.dataTransfer.files?.[0]);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
                        dragActive
                          ? 'border-cyan-300 bg-cyan-500/20'
                          : 'border-cyan-400/40 bg-slate-950/60 hover:bg-slate-950/85 hover:border-cyan-300'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFilePicked(e.target.files?.[0])}
                        className="hidden"
                      />
                      <Upload className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
                      <div className="font-display font-bold text-sm text-white">
                        Drop Any Portrait Photo or Click to Scan
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Extracts skin chroma, hair volume, facial hair density &amp; shirt colors
                        automatically into your 3D Avatar.
                      </p>
                    </div>

                    {scanReport && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-slate-950/75 border border-cyan-400/30 p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-cyan-300">
                          <span>AI BIOMETRIC TELEMETRY COMPLETE</span>
                          <span>{scanReport.confidence}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
                          <div>
                            <span className="text-slate-400">Hair:</span> {scanReport.hairStyleLabel}
                          </div>
                          <div>
                            <span className="text-slate-400">Beard:</span> {scanReport.beardStyleLabel}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Skin Chroma:</span>
                            <span
                              className="w-3.5 h-3.5 rounded-full inline-block border border-white/30"
                              style={{ backgroundColor: scanReport.skinToneHex }}
                            />
                            <span className="font-mono">{scanReport.skinToneHex}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Outfit:</span> {scanReport.outfitStyleLabel}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Instant One-Click Portrait Scan Presets */}
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Or Instant-Scan a Studio Portrait Sample:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SCAN_PRESET_PHOTOS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        disabled={isScanning}
                        onClick={() => triggerScanPipeline(sample.src, sample.id)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/65 hover:bg-white/10 border border-white/10 hover:border-cyan-400/50 text-left transition-all"
                      >
                        <img
                          src={sample.src}
                          alt={sample.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/15"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {sample.name}
                          </div>
                          <div className="text-[11px] text-cyan-300 truncate">{sample.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Studio Footer Bar */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                Real-time Three.js PBR Mesh Synthesis · Changes update both Studio &amp; Hero Stage
                live
              </span>
              <button
                type="button"
                onClick={() =>
                  setStudioMode(studioMode === 'manual' ? 'scanner' : 'manual')
                }
                className="text-cyan-300 font-semibold hover:underline"
              >
                {studioMode === 'manual'
                  ? 'Switch to AI Photo Scanner →'
                  : 'Fine-Tune Manually in Studio →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
