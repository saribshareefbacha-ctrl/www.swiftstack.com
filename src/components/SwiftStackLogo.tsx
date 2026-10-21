import React from 'react';

interface SwiftStackLogoProps {
  primaryColor?: string;
  secondaryColor?: string;
  showSubtext?: boolean;
}

export const SwiftStackLogo: React.FC<SwiftStackLogoProps> = ({
  primaryColor = '#06b6d4',
  secondaryColor = '#3b82f6',
  showSubtext = true,
}) => {
  return (
    <div className="inline-flex items-center gap-3 select-none">
      <div
        className="relative flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-black tracking-tight text-slate-950 shadow-lg"
        style={{
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <span>SS</span>
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            SwiftStack
          </span>
          <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
            SS
          </span>
        </div>
        {showSubtext && (
          <p className="text-[11px] font-medium text-slate-400">
            Digital Engineering &amp; AI Studio
          </p>
        )}
      </div>
    </div>
  );
};
