import React, { useState } from 'react';
import {
  Menu,
  X,
  User,
  LogOut,
  Sparkles,
  Sliders,
  Briefcase,
  Sun,
  Moon,
  Cpu,
  Layers,
} from 'lucide-react';
import { SwiftStackLogo } from './SwiftStackLogo';
import { ThemeMode, UserProfile } from '../types/cms';

interface NavbarProps {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  monogram: string;
  profileIconUrl: string;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  currentUser: UserProfile | null;
  activeOrdersCount?: number;
  onOpenAuth: () => void;
  onOpenPortal: () => void;
  onOpenOwnerStudio: () => void;
  onLogout: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'glass', label: 'Glass', icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'dark', label: 'Dark', icon: <Moon className="h-3.5 w-3.5" /> },
  { id: 'light', label: 'Light', icon: <Sun className="h-3.5 w-3.5" /> },
  { id: 'cyber', label: 'Cyber', icon: <Cpu className="h-3.5 w-3.5" /> },
];

export const Navbar: React.FC<NavbarProps> = ({
  primaryColor,
  secondaryColor,
  companyName,
  monogram,
  profileIconUrl,
  themeMode,
  onChangeThemeMode,
  currentUser,
  activeOrdersCount = 0,
  onOpenAuth,
  onOpenPortal,
  onOpenOwnerStudio,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Order & Quote', href: '#order' },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 pt-4">
      <nav className="ss-glass-card mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border px-5 py-3">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('#hero');
          }}
        >
          <SwiftStackLogo
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            companyName={companyName}
            monogram={monogram}
            profileIconUrl={profileIconUrl}
          />
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden xl:flex items-center gap-7">
          {navLinks.map((link) => (
            <button
              key={link.href}
              type="button"
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-slate-300 transition hover:text-cyan-400"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Controls: 4-Mode Theme Engine + Unified Auth / Role Portal */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* 4-Mode Multi-Theme Switcher */}
          <div
            role="group"
            aria-label="Theme Switcher"
            className="flex items-center rounded-xl border border-slate-700/60 bg-slate-950/60 p-1"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeThemeMode(opt.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    active
                      ? 'keep-white-text shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }
                      : undefined
                  }
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {currentUser ? (
            <>
              {isStaff ? (
                <button
                  type="button"
                  onClick={onOpenOwnerStudio}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>
                    {currentUser.role === 'owner' ? 'Owner CMS' : 'Sub-Admin Portal'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="ss-glass-card inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40"
                >
                  <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{currentUser.displayName.split(' ')[0]}'s Portal</span>
                  {activeOrdersCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="ss-glass-card inline-flex items-center justify-center rounded-xl border p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="ss-glass-card inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/50"
              >
                <User className="h-4 w-4 text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTo('#order')}
                className="keep-white-text inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-lg transition hover:opacity-95"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start Project</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
          className="ss-glass-card md:hidden rounded-xl border p-2 text-slate-200"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="ss-modal-surface mx-auto mt-2 max-w-7xl rounded-2xl border p-5 md:hidden space-y-4">
          {/* Mobile Theme Switcher */}
          <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-slate-700/50 bg-slate-950/50 p-1">
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeThemeMode(opt.id)}
                  className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold ${
                    active ? 'keep-white-text' : 'text-slate-400'
                  }`}
                  style={
                    active
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }
                      : undefined
                  }
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-800/40"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-700/40 pt-3 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                {isStaff ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenOwnerStudio();
                    }}
                    className="w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 py-2.5 text-center text-sm font-semibold text-cyan-300"
                  >
                    {currentUser.role === 'owner' ? 'Open Owner CMS' : 'Open Sub-Admin Portal'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPortal();
                    }}
                    className="ss-glass-card w-full rounded-xl border py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Open Client Portal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full rounded-xl border border-slate-700/60 py-2 text-center text-xs text-rose-400"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="keep-white-text w-full rounded-xl py-2.5 text-center text-sm font-bold shadow"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                Sign In / Continue with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
