import React, { useState } from 'react';
import { Menu, X, User, LogOut, Sparkles, Sliders, Briefcase } from 'lucide-react';
import { SwiftStackLogo } from './SwiftStackLogo';
import { UserProfile } from '../types/cms';

interface NavbarProps {
  primaryColor: string;
  secondaryColor: string;
  currentUser: UserProfile | null;
  activeOrdersCount?: number;
  onOpenAuth: () => void;
  onOpenPortal: () => void;
  onOpenOwnerStudio: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  primaryColor,
  secondaryColor,
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

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 sm:px-8 pt-4">
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-slate-800/85 bg-slate-950/80 px-5 py-3 backdrop-blur-xl shadow-2xl shadow-slate-950/60">
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('#hero');
          }}
        >
          <SwiftStackLogo primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
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

        {/* Auth & Portal Controls (Zero Public Admin Links) */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <>
              {currentUser.role === 'owner' ? (
                <button
                  type="button"
                  onClick={onOpenOwnerStudio}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Manage Site</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenPortal}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-cyan-400/40"
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
                className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2 text-xs sm:text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
              >
                <User className="h-4 w-4 text-cyan-400" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTo('#order')}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, #38bdf8)`,
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
          className="md:hidden rounded-xl border border-slate-800 bg-slate-900/80 p-2 text-slate-200"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-7xl rounded-2xl border border-slate-800 bg-slate-950/95 p-5 backdrop-blur-xl md:hidden space-y-4">
          <div className="flex flex-col space-y-2.5">
            {navLinks.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollTo(link.href)}
                className="rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-200 hover:bg-slate-900"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 flex flex-col gap-2.5">
            {currentUser ? (
              <>
                {currentUser.role === 'owner' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenOwnerStudio();
                    }}
                    className="w-full rounded-xl border border-cyan-400/50 bg-cyan-500/15 py-2.5 text-center text-sm font-semibold text-cyan-300"
                  >
                    Manage Site
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenPortal();
                    }}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 text-center text-sm font-medium text-white"
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
                  className="w-full rounded-xl border border-slate-800 py-2 text-center text-xs text-rose-400"
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
                className="w-full rounded-xl border border-cyan-500/40 bg-slate-900 py-2.5 text-center text-sm font-semibold text-white"
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
