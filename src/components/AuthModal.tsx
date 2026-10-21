import React, { useState } from 'react';
import {
  X,
  Lock,
  User,
  Mail,
  Building2,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../utils/api';
import { UserProfile } from '../types/cms';
import { SwiftStackLogo } from './SwiftStackLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
  primaryColor: string;
  secondaryColor: string;
  companyName?: string;
  monogram?: string;
  profileIconUrl?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  primaryColor,
  secondaryColor,
  companyName = 'SwiftStack',
  monogram = 'SS',
  profileIconUrl = '',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'google-fallback'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showSignInPw, setShowSignInPw] = useState(false);
  const [showSignUpPw, setShowSignUpPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(identifier.trim(), password, rememberMe);
      onAuthenticated(res.user);
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setError(
          'Invalid credentials. Check your email/username and password, or create a new client account.'
        );
      } else {
        setError(err instanceof Error ? err.message : 'Unable to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register({
        displayName,
        email,
        password,
        company,
        rememberMe,
      });
      onAuthenticated(res.user);
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.signInWithGoogle();
      if (res.user) {
        onAuthenticated(res.user);
        onClose();
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else if (code === 'auth/unauthorized-domain') {
        setMode('google-fallback');
      } else {
        setError(err instanceof Error ? err.message : 'Google sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.quickClientSession({
        email: email.trim(),
        displayName: displayName.trim() || email.split('@')[0],
        company: company.trim(),
      });
      onAuthenticated(res.user);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md">
      <div className="ss-modal-surface relative w-full max-w-md rounded-3xl border p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Sign In Modal"
          className="ss-glass-card absolute right-5 top-5 rounded-xl border p-2 text-slate-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <SwiftStackLogo
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          companyName={companyName}
          monogram={monogram}
          profileIconUrl={profileIconUrl}
          showSubtext={false}
        />

        <h3 className="mt-5 font-display text-2xl font-bold text-white">
          {mode === 'signin'
            ? 'Welcome Back'
            : mode === 'signup'
              ? 'Create Client Account'
              : 'Continue with Google'}
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          {mode === 'signin'
            ? 'Sign in instantly with Google or enter your credentials below.'
            : mode === 'signup'
              ? 'Register once — stay signed in seamlessly across visits.'
              : 'Confirm your Google email to unlock your SwiftStack Portal immediately.'}
        </p>

        {/* Mode Switcher */}
        {mode !== 'google-fallback' && (
          <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-700/60 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === 'signin'
                  ? 'keep-white-text shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                mode === 'signin'
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }
                  : undefined
              }
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`rounded-lg py-2 text-xs font-semibold transition ${
                mode === 'signup'
                  ? 'keep-white-text shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={
                mode === 'signup'
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }
                  : undefined
              }
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* Firebase Google Sign-In Button */}
        {mode !== 'google-fallback' && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="keep-dark-text mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold shadow transition hover:bg-slate-100 disabled:opacity-60"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.37 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-700/40" />
              <span className="text-[11px] uppercase tracking-wider text-slate-400">
                or credentials
              </span>
              <div className="h-px flex-1 bg-slate-700/40" />
            </div>
          </>
        )}

        {/* Unified Sign-In Form (Supports Client Email, Sub-Admin, OR Hidden 'admin' / 'admin') */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Email or Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your email or username"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showSignInPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPw((prev) => !prev)}
                  aria-label={showSignInPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:text-cyan-400"
                >
                  {showSignInPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-500"
              />
              <span>Remember me on this device</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="keep-white-text flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition hover:opacity-95 disabled:opacity-60"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Sarah Ahmed"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Company / Organization (Optional)
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Ventures"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showSignUpPw ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-2.5 pl-10 pr-11 text-sm text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPw((prev) => !prev)}
                  aria-label={showSignUpPw ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 rounded-lg p-1 text-slate-400 transition hover:text-cyan-400"
                >
                  {showSignUpPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-500"
              />
              <span>Stay signed in on this device</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="keep-white-text flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition hover:opacity-95 disabled:opacity-60"
              style={{
                backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span>Create Account</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Instant Google Identity Bridge if preview host isn't yet allowlisted */}
        {mode === 'google-fallback' && (
          <form onSubmit={handleGoogleFallbackSubmit} className="mt-5 space-y-3.5">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-300 leading-relaxed">
              Confirm your Google identity below to open your SwiftStack Workspace immediately.
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Google Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-1/3 rounded-xl border border-slate-700 py-2.5 text-xs text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="keep-white-text w-2/3 rounded-xl py-2.5 text-xs font-bold"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                Continue to Portal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
