import React, { useMemo } from 'react';
import {
  ArrowUpRight,
  Crown,
  Mail,
  MapPin,
  Monitor,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  SiteBrandingMeta,
  SocialLinkItem,
  ThemeCMS,
  UserProfile,
  ViewLayoutMode,
} from '../types/cms';
import { SwiftStackLogo } from './SwiftStackLogo';
import { SocialPlatformGlyph } from './SocialPlatformIcons';

interface GlassFooterProps {
  branding: SiteBrandingMeta;
  socialLinks: SocialLinkItem[];
  theme: ThemeCMS;
  viewMode: ViewLayoutMode;
  currentUser: UserProfile | null;
  onToggleViewMode: (nextMode: ViewLayoutMode) => void;
  onOpenAdminPanel: () => void;
  onOpenClientPortal: () => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export const GlassFooter: React.FC<GlassFooterProps> = ({
  branding,
  socialLinks,
  theme,
  viewMode,
  currentUser,
  onToggleViewMode,
  onOpenAdminPanel,
  onOpenClientPortal,
  onOpenAuth,
}) => {
  const activeSocials = useMemo(
    () => (socialLinks || []).filter((item) => item.enabled && item.url.trim().length > 0),
    [socialLinks]
  );

  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';
  const nextViewMode: ViewLayoutMode = viewMode === 'desktop' ? 'mobile' : 'desktop';

  return (
    <footer
      id="footer"
      className="relative z-10 border-t border-white/15 pt-14 pb-12 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Social & Direct Messaging Strip */}
        {activeSocials.length > 0 && (
          <div className="ss-glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                  Direct Channels &amp; Official Social Network
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                  Connect Directly with {branding.companyName}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {activeSocials.map((soc) => {
                  const accent = soc.accentColor || theme.primaryColor;
                  return (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${soc.label}${soc.handleOrTagline ? ` — ${soc.handleOrTagline}` : ''}`}
                      className="ss-glass-btn group inline-flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-white"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                        style={{
                          backgroundColor: `${accent}24`,
                          color: accent,
                          border: `1px solid ${accent}50`,
                        }}
                      >
                        <SocialPlatformGlyph item={soc} className="w-4 h-4" />
                      </span>
                      <span className="flex flex-col leading-tight">
                        <span className="text-xs font-bold text-white">{soc.label}</span>
                        {soc.handleOrTagline && (
                          <span className="text-[10px] font-normal text-slate-300">
                            {soc.handleOrTagline}
                          </span>
                        )}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main Footer Grid */}
        <div className="ss-responsive-grid grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-white/15">
          <div className="ss-hero-col md:col-span-5 space-y-3.5">
            <SwiftStackLogo
              primaryColor={theme.primaryColor}
              secondaryColor={theme.secondaryColor}
              companyName={branding.companyName}
              monogram={branding.monogram}
              profileIconUrl={branding.profileIconUrl}
            />
            <p className="text-sm text-slate-300 max-w-md leading-relaxed">
              {branding.footerTagline}
            </p>
            <div className="space-y-1.5 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a
                  href={`mailto:${branding.contactEmail}`}
                  className="hover:text-cyan-300 transition-colors"
                >
                  {branding.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{branding.locationText}</span>
              </div>
            </div>
            <p className="text-xs font-mono text-cyan-400 pt-1">
              Founded &amp; Owned by {branding.founderName}
            </p>
          </div>

          <div className="ss-hero-col md:col-span-3 space-y-2.5">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Platform Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="#hero" className="hover:text-cyan-400 transition-colors">
                  Studio Introduction
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-cyan-400 transition-colors">
                  Services &amp; Digital Shop
                </a>
              </li>
              <li>
                <a href="#projects" className="hover:text-cyan-400 transition-colors">
                  Portfolio Case Studies
                </a>
              </li>
              <li>
                <a href="#order" className="hover:text-cyan-400 transition-colors">
                  Request Custom Quote
                </a>
              </li>
            </ul>
          </div>

          <div className="ss-hero-col md:col-span-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Workspace &amp; Account Controls
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Switch seamlessly between pixel-perfect Desktop View and Mobile View, track active
              orders, or sign in with Google.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => onToggleViewMode(nextViewMode)}
                className="ss-glass-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-cyan-300"
              >
                {viewMode === 'desktop' ? (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile View</span>
                  </>
                ) : (
                  <>
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop View</span>
                  </>
                )}
              </button>

              {isStaff ? (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="keep-white-text inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  }}
                >
                  {currentUser?.role === 'owner' ? (
                    <Crown className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {currentUser?.role === 'owner'
                      ? 'Open Owner Dashboard'
                      : 'Open Sub-Admin Portal'}
                  </span>
                </button>
              ) : currentUser ? (
                <button
                  type="button"
                  onClick={onOpenClientPortal}
                  className="ss-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Open My Client Portal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="ss-glass-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>{branding.copyrightText}</span>
          <span>SwiftStack (SS) · Pure Sheesha Glass Edition</span>
        </div>
      </div>
    </footer>
  );
};
