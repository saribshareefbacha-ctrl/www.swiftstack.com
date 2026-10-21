import React, { useState } from 'react';
import {
  Briefcase,
  Cpu,
  Layers,
  LogOut,
  Menu,
  Moon,
  ShoppingBag,
  Sliders,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { ThemeMode, UserProfile } from '../types/cms';
import { SwiftStackLogo } from './SwiftStackLogo';

interface NavbarProps {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  monogram: string;
  profileIconUrl: string;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  cartCount: number;
  onOpenCart: () => void;
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
  cartCount,
  onOpenCart,
  currentUser,
  activeOrdersCount = 0,
  onOpenAuth,
  onOpenPortal,
  onOpenOwnerStudio,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Services & Shop', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Checkout & Quote', href: '#order' },
  ];

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 pt-4">
      <nav className="ss-glass-card mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-5 py-3">
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
              className="text-sm font-semibold text-slate-300 transition hover:text-cyan-400"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Glass Theme Switcher + Cart + Unified Auth */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme Mode Switcher */}
          <div
            role="group"
            aria-label="Theme Switcher"
            className="ss-glass-card flex items-center rounded-xl p-1"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeThemeMode(opt.id)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    active ? 'keep-white-text shadow-sm' : 'text-slate-400 hover:text-white'
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

          {/* Shopping Portal Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="ss-glass-btn relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="h-4 w-4 text-cyan-400" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span
                className="keep-white-text ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          {currentUser ? (
            <>
              {isStaff ? (
                <button
                  type="button"
                  onClick={onOpenOwnerStudio}
                  className="ss-glass-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold text-cyan-400"
                >
                  <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{currentUser.role === 'owner' ? 'Owner CMS' : 'Sub-Admin Portal'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="ss-glass-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{currentUser.displayName.split(' ')[0]}'s Portal</span>
                  {activeOrdersCount > 0 && (
                    <span className="ml-0.5 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-400">
                      {activeOrdersCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onLogout}
                title="Sign Out"
                className="ss-glass-btn inline-flex items-center justify-center rounded-xl p-2 text-slate-400 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="ss-glass-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold"
              >
                <User className="h-4 w-4 text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTo('#order')}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Start Order</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onOpenCart}
            className="ss-glass-btn relative rounded-xl p-2"
            aria-label="Open Cart"
          >
            <ShoppingBag className="h-4 w-4 text-cyan-400" />
            {cartCount > 0 && (
              <span
                className="keep-white-text absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="ss-glass-btn rounded-xl p-2"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Glass Drawer */}
      {mobileMenuOpen && (
        <div className="ss-modal-surface mx-auto mt-2 max-w-7xl rounded-2xl p-5 md:hidden space-y-4">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-400/25 p-1">
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

          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-200 hover:bg-cyan-500/10"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-400/25 pt-3 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                {isStaff ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenOwnerStudio();
                    }}
                    className="ss-glass-btn w-full rounded-xl py-2.5 text-center text-sm font-bold text-cyan-400"
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
                    className="ss-glass-btn w-full rounded-xl py-2.5 text-center text-sm font-semibold"
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
                  className="ss-glass-btn w-full rounded-xl py-2 text-center text-xs text-rose-400"
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
                className="keep-white-text ss-cta-btn w-full rounded-xl py-2.5 text-center text-sm font-bold shadow"
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
