import React, { useState } from 'react';
import {
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  User as UserIcon,
  X,
  Zap,
} from 'lucide-react';
import { SwiftStackLogo } from './SwiftStackLogo';
import { ThemeMode, UserProfile, ViewLayoutMode } from '../types/cms';

interface NavbarProps {
  currentUser: UserProfile | null;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  monogram: string;
  profileIconUrl: string;
  themeMode: ThemeMode;
  viewMode: ViewLayoutMode;
  cartCount: number;
  onChangeThemeMode: (mode: ThemeMode) => void;
  onToggleViewMode: (nextMode: ViewLayoutMode) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onOpenAdminPanel: () => void;
  onOpenClientPortal: () => void;
  onOpenCart: () => void;
  onLogout: () => void;
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'glass', label: 'Sheesha Glass', icon: Sparkles },
  { id: 'light', label: 'Crystal Light', icon: Sun },
  { id: 'dark', label: 'Obsidian Dark', icon: Moon },
  { id: 'cyber', label: 'Cyber Neon', icon: Zap },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  primaryColor,
  secondaryColor,
  companyName,
  monogram,
  profileIconUrl,
  themeMode,
  viewMode,
  cartCount,
  onChangeThemeMode,
  onToggleViewMode,
  onOpenAuth,
  onOpenAdminPanel,
  onOpenClientPortal,
  onOpenCart,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Services & Shop', href: '#services' },
    { label: 'Portfolio', href: '#projects' },
    { label: 'Order & Quote', href: '#order' },
  ];

  const isStaff = currentUser?.role === 'owner' || currentUser?.role === 'subadmin';
  const nextViewMode: ViewLayoutMode = viewMode === 'desktop' ? 'mobile' : 'desktop';

  return (
    <header className="ss-top-header fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 pt-3">
      <nav
        aria-label="SwiftStack primary navigation"
        className="ss-glass-card mx-auto max-w-7xl rounded-2xl px-4 sm:px-6 py-3"
      >
        <div className="flex items-center justify-between gap-2.5">
          {/* SwiftStack Monogram & Brand */}
          <a
            href="#hero"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl shrink-0"
          >
            <SwiftStackLogo
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              companyName={companyName}
              monogram={monogram}
              profileIconUrl={profileIconUrl}
            />
          </a>

          {/* Navigation Links (Desktop View) */}
          <div className="ss-desktop-nav-only hidden xl:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-200 hover:text-cyan-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Controls: View Toggle, Sheesha Theme Switcher, Cart & Auth/Admin */}
          <div className="ss-desktop-nav-only hidden lg:flex items-center gap-2">
            {/* Persistent Anytime Desktop View <-> Mobile View Toggle */}
            <button
              type="button"
              onClick={() => onToggleViewMode(nextViewMode)}
              title={`Currently in ${viewMode === 'desktop' ? 'Desktop View' : 'Mobile View'} — Click to switch to ${nextViewMode === 'desktop' ? 'Desktop View' : 'Mobile View'}`}
              className="ss-glass-btn inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-cyan-300"
            >
              {viewMode === 'desktop' ? (
                <>
                  <Monitor className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Desktop</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Mobile</span>
                </>
              )}
            </button>

            {/* Theme Mode Switcher */}
            <div
              role="group"
              aria-label="Visual Theme Mode"
              className="ss-glass-card inline-flex items-center rounded-xl p-1 gap-0.5"
            >
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeThemeMode(opt.id)}
                    title={opt.label}
                    aria-label={opt.label}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'keep-white-text text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          }
                        : undefined
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden 2xl:inline">{opt.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open Shopping Cart"
              className="ss-glass-btn relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline">Cart</span>
              {cartCount > 0 && (
                <span
                  className="keep-white-text ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {isStaff ? (
                  <button
                    type="button"
                    onClick={onOpenAdminPanel}
                    className="keep-white-text ss-cta-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-md"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    {currentUser.role === 'owner' ? (
                      <Crown className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {currentUser.role === 'owner' ? 'Owner Dashboard' : 'Sub-Admin Portal'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenClientPortal}
                    className="ss-glass-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="max-w-[115px] truncate">{currentUser.displayName}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign out"
                  aria-label="Sign out"
                  className="ss-glass-btn p-2 rounded-xl text-slate-300 hover:text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Compact Bar Controls (Mobile View OR Smaller Screens) */}
          <div className="ss-mobile-nav-only flex lg:hidden items-center gap-1.5">
            {/* Quick Anytime View Toggle right in the mobile header bar too! */}
            <button
              type="button"
              onClick={() => onToggleViewMode(nextViewMode)}
              title={`Switch to ${nextViewMode === 'desktop' ? 'Desktop View' : 'Mobile View'}`}
              aria-label="Toggle Desktop or Mobile View"
              className="ss-glass-btn inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-bold text-cyan-300"
            >
              {viewMode === 'desktop' ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Desktop</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Mobile</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open Cart"
              className="ss-glass-btn relative p-2 rounded-xl text-slate-200"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              {cartCount > 0 && (
                <span className="keep-white-text absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="ss-glass-btn p-2 rounded-xl text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expandable Glass Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mt-4 pt-4 border-t border-white/15 flex flex-col gap-3">
            {/* View Mode Toggle Row */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onToggleViewMode('desktop');
                  setMobileMenuOpen(false);
                }}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                  viewMode === 'desktop'
                    ? 'keep-white-text text-white border-transparent shadow'
                    : 'border-white/20 text-slate-300'
                }`}
                style={
                  viewMode === 'desktop'
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }
                    : undefined
                }
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleViewMode('mobile');
                  setMobileMenuOpen(false);
                }}
                className={`inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border ${
                  viewMode === 'mobile'
                    ? 'keep-white-text text-white border-transparent shadow'
                    : 'border-white/20 text-slate-300'
                }`}
                style={
                  viewMode === 'mobile'
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }
                    : undefined
                }
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile View</span>
              </button>
            </div>

            {/* Theme Mode Switcher Row */}
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = themeMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeThemeMode(opt.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold border ${
                      active
                        ? 'keep-white-text text-white border-transparent'
                        : 'border-white/15 text-slate-300'
                    }`}
                    style={
                      active
                        ? {
                            backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          }
                        : undefined
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{opt.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}

            <div className="pt-2 border-t border-white/15 flex flex-col gap-2">
              {currentUser ? (
                <>
                  {isStaff ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAdminPanel();
                      }}
                      className="keep-white-text w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <Crown className="w-4 h-4" />
                      <span>
                        {currentUser.role === 'owner'
                          ? 'Open Owner Dashboard'
                          : 'Open Sub-Admin Portal'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenClientPortal();
                      }}
                      className="ss-glass-btn w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                      <span>My Client Portal ({currentUser.displayName})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-4 rounded-xl text-sm font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="keep-white-text w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
