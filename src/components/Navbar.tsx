import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  LogIn,
  LogOut,
  Menu,
  Sliders,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { HeroCMS, ThemeCMS, UserProfile } from '../types/cms';

interface NavbarProps {
  hero: HeroCMS;
  theme: ThemeCMS;
  currentUser: UserProfile | null;
  unreadInquiriesCount: number;
  onOpenAuthModal: () => void;
  onOpenClientPortal: () => void;
  onOpenAdminPanel: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  hero,
  theme,
  currentUser,
  unreadInquiriesCount,
  onOpenAuthModal,
  onOpenClientPortal,
  onOpenAdminPanel,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  const navItems = [
    { label: 'Overview', href: '#hero' },
    { label: 'Services', href: '#services' },
    { label: '3D Avatar Studio', href: '#avatar-studio' },
    { label: 'Projects', href: '#projects' },
    { label: 'Start a Project', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      {/* Scroll-Driven Laser Progress Bar */}
      <motion.div
        className="h-[2.5px] origin-left w-full"
        style={{
          scaleX,
          background: `linear-gradient(90deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3">
        <div
          className="rounded-2xl border border-white/10 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between shadow-[0_8px_32px_rgba(2,6,23,0.65)]"
          style={{
            backgroundColor: `rgba(2, 6, 23, ${Math.min(0.92, theme.glassOpacity + 0.12)})`,
          }}
        >
          {/* SwiftStack (SS) Brand Mark */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm tracking-tight text-white shadow-lg overflow-hidden border border-white/20 transition-transform duration-300 group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
              }}
            >
              <span className="relative z-10 drop-shadow-sm">{hero.companyAbbreviation}</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-lg tracking-tight text-white">
                  {hero.companyName}
                </span>
                <span
                  className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md border"
                  style={{
                    color: theme.primaryAccent,
                    borderColor: `${theme.primaryAccent}44`,
                    backgroundColor: `${theme.primaryAccent}14`,
                  }}
                >
                  {hero.companyAbbreviation}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block leading-none">
                {hero.founderName}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Strictly clean public navigation) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Auth / Dynamic Silent Elevation Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            {!currentUser ? (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] hover:border-cyan-400/50 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4 text-cyan-400" />
                <span>Sign In</span>
              </button>
            ) : currentUser.role === 'owner' ? (
              /* SILENT OWNER ELEVATION: Dynamically unlocked ONLY after authenticating as owner */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdminPanel}
                  className="relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-slate-950 shadow-lg transition-transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                  }}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Customize Platform</span>
                  {unreadInquiriesCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-950 text-cyan-300">
                      {unreadInquiriesCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Signed-in Client View */
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenClientPortal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border border-cyan-400/40 bg-cyan-500/15 hover:bg-cyan-500/25 transition-all"
                >
                  <UserCheck className="w-4 h-4 text-cyan-300" />
                  <span>{currentUser.displayName.split(' ')[0]}&apos;s Portal</span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle Menu"
            className="md:hidden p-2 rounded-xl border border-white/10 text-slate-200 hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-2xl p-4 shadow-2xl space-y-2"
          >
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10"
              >
                {item.label}
              </a>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              {!currentUser ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-white/10 border border-white/15 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 text-cyan-400" />
                  <span>Sign In / Continue</span>
                </button>
              ) : currentUser.role === 'owner' ? (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAdminPanel();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-950 flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open Platform Customizer</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-300 border border-white/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenClientPortal();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4 text-cyan-300" />
                    <span>Open My Client Portal</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-300 border border-white/10"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};
