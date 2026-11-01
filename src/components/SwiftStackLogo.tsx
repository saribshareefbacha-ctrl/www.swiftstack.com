import React from 'react';

interface SwiftStackLogoProps {
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  monogram?: string;
  profileIconUrl?: string;
  showSubtext?: boolean;
  iconOnly?: boolean;
  size?: number;
}

export const SwiftStackLogo: React.FC<SwiftStackLogoProps> = ({
  primaryColor = '#06b6d4',
  secondaryColor = '#6366f1',
  companyName = 'SwiftStack',
  monogram = 'SS',
  profileIconUrl = '',
  showSubtext = true,
  iconOnly = false,
  size = 40,
}) => {
  const letters = (monogram || 'SS').trim().slice(0, 3).toUpperCase() || 'SS';

  const emblem = profileIconUrl ? (
    <img
      src={profileIconUrl}
      alt={companyName}
      style={{ width: `${size}px`, height: `${size}px` }}
      className="shrink-0 rounded-xl border border-cyan-400/40 object-cover shadow-[0_0_20px_rgba(34,211,238,0.42)]"
    />
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      style={{ width: `${size}px`, height: `${size}px` }}
      className="shrink-0 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ssLogoCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="ssLogoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
        <linearGradient id="ssLogoTextGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="16"
        fill="url(#ssLogoCardGrad)"
        stroke="url(#ssLogoRingGrad)"
        strokeWidth="3.5"
      />
      <circle cx="51" cy="13" r="3" fill="#22d3ee" />
      <text
        x="32"
        y="40.5"
        textAnchor="middle"
        fontFamily="Space Grotesk, Plus Jakarta Sans, sans-serif"
        fontWeight="900"
        fontSize={letters.length > 2 ? '19' : '25'}
        letterSpacing="-1"
        fill="url(#ssLogoTextGrad)"
      >
        {letters}
      </text>
    </svg>
  );

  if (iconOnly) {
    return emblem;
  }

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {emblem}
      <div className="leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="font-display text-lg font-bold tracking-tight text-white">
            {companyName}
          </span>
          <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-cyan-400 border border-cyan-500/35">
            {letters}
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
