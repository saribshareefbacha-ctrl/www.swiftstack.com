import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  X,
} from 'lucide-react';
import { UserProfile } from '../types/cms';
import {
  api,
  getAvailableGoogleChooserAccounts,
  QuickGoogleAccountOption,
  syncFirebasePersistenceMode,
} from '../utils/api';
import { SwiftStackLogo } from './SwiftStackLogo';
import { GlassSpinner, pushToast } from './GlassUI';

interface AuthModalProps {
  isOpen: boolean;
  initialTab?: 'login' | 'register';
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  monogram: string;
  profileIconUrl: string;
  onClose: () => void;
  onAuthenticated: (user: UserProfile, openDashboardIfStaff?: boolean) => void;
}

const GoogleGLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.3-2 3l3.2 2.5c1.9-1.7 3-4.3 3-7.4 0-.7-.1-1.4-.2-2H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.9v2.6C4.6 19.8 8 22 12 22z"
    />
    <path
      fill="#4A90E2"
      d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.6H2.9C2.3 8.9 2 10.4 2 12s.3 3.1.9 4.4l3.3-2.6z"
    />
    <path
      fill="#FBBC05"
      d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9C17 2.9 14.7 2 12 2 8 2 4.6 4.2 2.9 7.6l3.3 2.6c.8-2.5 3.1-4.3 5.8-4.3z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialTab = 'login',
  primaryColor,
  secondaryColor,
  companyName,
  monogram,
  profileIconUrl,
  onClose,
  onAuthenticated,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [company, setCompany] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInstantGoogleChooser, setShowInstantGoogleChooser] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState<QuickGoogleAccountOption[]>([]);

  useEffect(() => {
    setTab(initialTab);
    setError('');
    setShowInstantGoogleChooser(false);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const completeSignIn = (user: UserProfile) => {
    if (user.role === 'owner') {
      pushToast(
        'Master Owner Verified',
        `Welcome back ${user.displayName} (${user.email}). Unlocking Owner Admin Dashboard!`,
        'success'
      );
      onAuthenticated(user, true);
    } else if (user.role === 'subadmin') {
      pushToast(
        'Sub-Admin Portal Unlocked',
        `Signed in as ${user.displayName}. Opening Sub-Admin Portal.`,
        'success'
      );
      onAuthenticated(user, true);
    } else {
      pushToast(
        'Signed In Successfully',
        `Welcome to SwiftStack, ${user.displayName}!`,
        'success'
      );
      onAuthenticated(user, false);
    }
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login(identifier.trim(), loginPassword, rememberMe);
      completeSignIn(res.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Invalid credentials. Please check your username/email and password.');
      } else {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      }
      pushToast('Authentication Failed', 'Please verify your email/username and password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register({
        displayName,
        email: regEmail,
        password: regPassword,
        company,
        rememberMe,
      });
      completeSignIn(res.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Switch to Login instead.');
      } else {
        setError(err instanceof Error ? err.message : 'Account creation failed');
      }
      pushToast('Sign Up Error', 'Unable to register account with those details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleContinue = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const res = await api.signInWithGoogle(rememberMe);
      if (res.redirecting) {
        return;
      }
      if (res.needsAccountChooser) {
        setGoogleAccounts(getAvailableGoogleChooserAccounts());
        setShowInstantGoogleChooser(true);
        return;
      }
      if (res.user) {
        completeSignIn(res.user);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(err instanceof Error ? err.message : 'Google Sign-In encountered an error.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleInstantGooglePick = async (account: QuickGoogleAccountOption) => {
    setGoogleLoading(true);
    try {
      const res = await api.selectGoogleAccountInstant(account, rememberMe);
      completeSignIn(res.user);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="SwiftStack Authentication"
    >
      <div className="ss-modal-surface relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="ss-glass-btn absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <SwiftStackLogo
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              companyName={companyName}
              monogram={monogram}
              profileIconUrl={profileIconUrl}
              showSubtext={false}
            />
            <h2 className="font-display text-2xl font-extrabold text-white pt-1">
              {tab === 'login' ? 'Sign In to SwiftStack' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-slate-300 max-w-xs">
              Continue instantly with Google or sign in with your account credentials.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/35 p-3.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct One-Click Google Sign-In */}
          {!showInstantGoogleChooser ? (
            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={handleGoogleContinue}
              className="keep-dark-text w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 text-sm font-bold shadow-md border border-slate-200 inline-flex items-center justify-center gap-2.5 transition disabled:opacity-60"
            >
              {googleLoading ? (
                <GlassSpinner size="sm" />
              ) : (
                <GoogleGLogo className="w-4 h-4 shrink-0" />
              )}
              <span>{googleLoading ? 'Opening Google Accounts...' : 'Continue with Google'}</span>
            </button>
          ) : (
            /* Zero-Input 1-Click Google Account Picker when running inside unlisted sandbox host */
            <div className="ss-glass-card rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <GoogleGLogo className="w-4 h-4" />
                  <span>Choose an account to continue to SwiftStack</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstantGoogleChooser(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Back
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {googleAccounts.map((acc) => {
                  const isOwnerEmail =
                    acc.email.toLowerCase() === 'saribshareefbacha@gmail.com' ||
                    acc.email.toLowerCase() === 'swiftstackdigi01@gmail.com';
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={googleLoading}
                      onClick={() => handleInstantGooglePick(acc)}
                      className="w-full flex items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/5 hover:border-cyan-400/60 p-3 text-left transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="keep-white-text w-9 h-9 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          }}
                        >
                          {isOwnerEmail ? (
                            <Crown className="w-4 h-4" />
                          ) : (
                            acc.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {acc.displayName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 truncate">
                            {acc.email}
                          </div>
                          <div className="text-[10px] font-semibold text-cyan-300">
                            {acc.badge}
                          </div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-white/15" />
            <span className="shrink mx-3 text-[11px] font-mono uppercase text-slate-400">
              or with account
            </span>
            <div className="flex-grow border-t border-white/15" />
          </div>

          {/* Login / Sign Up Switcher */}
          <div className="grid grid-cols-2 rounded-2xl bg-white/5 p-1 border border-white/15">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                tab === 'login' ? 'keep-white-text text-white shadow' : 'text-slate-300'
              }`}
              style={
                tab === 'login'
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }
                  : undefined
              }
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                tab === 'register' ? 'keep-white-text text-white shadow' : 'text-slate-300'
              }`}
              style={
                tab === 'register'
                  ? {
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }
                  : undefined
              }
            >
              Sign Up
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@company.com or username"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-11 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-300 transition"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setRememberMe(next);
                      syncFirebasePersistenceMode(next);
                    }}
                    className="rounded border-slate-500 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Remember Me</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">Persistent Session</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="keep-white-text ss-cta-btn w-full py-3 px-5 rounded-xl text-sm font-bold text-white shadow-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {loading ? (
                  <>
                    <GlassSpinner size="sm" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ayesha Khan"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Company / Brand (Optional)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your Startup or Organization"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="ss-glass-input w-full rounded-xl pl-10 pr-11 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-cyan-300 transition"
                  >
                    {showRegPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setRememberMe(next);
                    syncFirebasePersistenceMode(next);
                  }}
                  className="rounded border-slate-500 text-cyan-500"
                />
                <span>Remember Me on this device</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="keep-white-text ss-cta-btn w-full py-3 px-5 rounded-xl text-sm font-bold text-white shadow-lg inline-flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {loading ? (
                  <>
                    <GlassSpinner size="sm" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
