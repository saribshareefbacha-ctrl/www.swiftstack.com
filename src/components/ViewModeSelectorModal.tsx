import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Monitor, Smartphone, Sparkles } from 'lucide-react';
import { ViewLayoutMode } from '../types/cms';
import { SwiftStackLogo } from './SwiftStackLogo';

interface ViewModeSelectorModalProps {
  isOpen: boolean;
  recommendedMode: ViewLayoutMode;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  monogram: string;
  profileIconUrl: string;
  onSelectMode: (mode: ViewLayoutMode) => void;
}

export const ViewModeSelectorModal: React.FC<ViewModeSelectorModalProps> = ({
  isOpen,
  recommendedMode,
  primaryColor,
  secondaryColor,
  companyName,
  monogram,
  profileIconUrl,
  onSelectMode,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-lg"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
            className="ss-modal-surface relative w-full max-w-xl overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <SwiftStackLogo
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                companyName={companyName}
                monogram={monogram}
                profileIconUrl={profileIconUrl}
                showSubtext={false}
              />

              <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-[11px] font-mono font-semibold text-cyan-300">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>WELCOME TO SWIFTSTACK (SS)</span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Choose Your Experience Mode
              </h2>
              <p className="max-w-md text-xs sm:text-sm text-slate-300 leading-relaxed">
                Select <strong className="text-white">Desktop View</strong> or{' '}
                <strong className="text-white">Mobile View</strong>. Your preference is saved in
                your browser and can be toggled anytime from the top bar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* [ Desktop View ] */}
              <button
                type="button"
                onClick={() => onSelectMode('desktop')}
                className="ss-glass-card ss-glass-interactive group flex flex-col justify-between rounded-2xl p-5 text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="keep-white-text flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <Monitor className="h-6 w-6" />
                    </div>
                    {recommendedMode === 'desktop' && (
                      <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Desktop View
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Pixel-perfect centered widescreen studio layout with multi-column grids and
                      zero horizontal overflow.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-xs font-bold text-cyan-300">
                  <span>[ Desktop View ]</span>
                  <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                </div>
              </button>

              {/* [ Mobile View ] */}
              <button
                type="button"
                onClick={() => onSelectMode('mobile')}
                className="ss-glass-card ss-glass-interactive group flex flex-col justify-between rounded-2xl p-5 text-left"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="keep-white-text flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${secondaryColor}, ${primaryColor})`,
                      }}
                    >
                      <Smartphone className="h-6 w-6" />
                    </div>
                    {recommendedMode === 'mobile' && (
                      <span className="rounded-full border border-cyan-400/40 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                        Recommended
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Mobile View
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Ergonomic single-column mobile interface with ultra-smooth touch scrolling and
                      quick thumb navigation.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3 text-xs font-bold text-cyan-300">
                  <span>[ Mobile View ]</span>
                  <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                </div>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
