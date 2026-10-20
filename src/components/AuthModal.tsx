import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, User, Building2, X } from 'lucide-react';
import { HeroCMS, ThemeCMS, UserProfile } from '../types/cms';
import { api, setStoredToken } from '../utils/api';

interface AuthModalProps {
  open: boolean;
  hero: HeroCMS;
  theme: ThemeCMS;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  hero,
  theme,
  onClose,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'google-picker'>('signin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const res = await api.login(identifier, password);
        setStoredToken(res.token);
        onAuthenticated(res.user);
        setIdentifier('');
        setPassword('');
        onClose();
      } else {
        const res = await api.register({
          displayName,
          email: identifier,
          password,
          company,
        });
        setStoredToken(res.token);
        onAuthenticated(res.user);
        setIdentifier('');
        setPassword('');
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (email: string, name: string, org = '') => {
    setError('');
    setLoading(true);
    try {
      const res = await api.googleAuth({
        email,
        displayName: name,
        company: org,
      });
      setStoredToken(res.token);
      onAuthenticated(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-white/15 p-6 sm:p-8 shadow-[0_25px_70px_rgba(2,6,23,0.95)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Sign In Modal"
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-sm text-white shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
                }}
              >
                {hero.companyAbbreviation}
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  {mode === 'signup' ? 'Create Account' : 'Sign In / Continue'}
                </h2>
                <p className="text-xs text-slate-400">
                  Access your {hero.companyName} project portal &amp; saved preferences
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-xs text-red-200">
                {error}
              </div>
            )}

            {mode === 'google-picker' ? (
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                  Google OAuth 2.0 · Choose an Account
                </div>

                {/* Instant Demo Google Account Option */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleGoogleLogin('zainab@lumina-tech.io', 'Zainab Malik', 'Lumina Tech Labs')
                  }
                  className="w-full p-3.5 rounded-2xl bg-slate-950/85 hover:bg-slate-800 border border-white/15 flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-xs text-slate-950">
                    ZM
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">Zainab Malik</div>
                    <div className="text-xs text-slate-400 truncate">zainab@lumina-tech.io</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400" />
                </button>

                {/* Or Enter Any Google Workspace / Gmail Address */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGoogleLogin(
                      googleEmail,
                      googleName || googleEmail.split('@')[0] || 'Google Client'
                    );
                  }}
                  className="p-4 rounded-2xl bg-slate-950/65 border border-white/10 space-y-3"
                >
                  <div className="text-xs font-medium text-slate-300">
                    Or continue with your own Google email:
                  </div>
                  <input
                    required
                    type="text"
                    placeholder="Your Name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    required
                    type="email"
                    placeholder="you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-white text-slate-950 font-semibold text-xs hover:bg-slate-100 transition-colors"
                  >
                    {loading ? 'Authenticating...' : 'Continue with Google Account'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white pt-1"
                >
                  ← Back to standard Sign In
                </button>
              </div>
            ) : (
              <>
                {/* Integrated Continue with Google Button */}
                <button
                  type="button"
                  onClick={() => setMode('google-picker')}
                  className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm flex items-center justify-center gap-3 shadow-md transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.04-4.38 3.04-7.47 0-.72-.06-1.41-.19-2.04H12z"
                    />
                    <path
                      fill="#34A853"
                      d="M6.53 14.28l-.74.57-2.64 2.05C4.83 20.23 8.15 22.5 12 22.5c2.7 0 4.96-.89 6.62-2.42l-3.3-2.56c-.91.61-2.07.98-3.32.98-2.55 0-4.72-1.72-5.49-4.05z"
                    />
                    <path
                      fill="#4A90E2"
                      d="M3.15 7.6C2.42 9.04 2 10.67 2 12.4c0 1.73.42 3.36 1.15 4.8l3.38-2.62c-.2-.6-.33-1.24-.33-1.91s.13-1.31.33-1.91L3.15 7.6z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12 6.28c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.95 3.28 14.7 2.3 12 2.3 8.15 2.3 4.83 4.57 3.15 7.9l3.38 2.62c.77-2.33 2.94-4.24 5.47-4.24z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative my-5 flex items-center">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="mx-3 text-[11px] font-mono uppercase text-slate-500">
                    or continue with credentials
                  </span>
                  <div className="flex-grow border-t border-white/10" />
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                  {mode === 'signup' && (
                    <>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          required
                          type="text"
                          placeholder="Full Name"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Company or Brand (Optional)"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </>
                  )}

                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type={mode === 'signup' ? 'email' : 'text'}
                      placeholder={mode === 'signup' ? 'Email Address' : 'Username or Email'}
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-95 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }}
                  >
                    <span>
                      {loading
                        ? 'Signing In...'
                        : mode === 'signup'
                          ? 'Create SwiftStack Account'
                          : 'Sign In'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-slate-400">
                  {mode === 'signin' ? (
                    <>
                      New to {hero.companyName}?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('signup');
                        }}
                        className="text-cyan-300 font-semibold hover:underline"
                      >
                        Create a Client Account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('signin');
                        }}
                        className="text-cyan-300 font-semibold hover:underline"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
