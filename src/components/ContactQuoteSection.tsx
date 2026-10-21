import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Globe2,
  Mail,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { CartItem, ServiceItem, SiteBrandingMeta, ThemeCMS, UserProfile } from '../types/cms';
import { api } from '../utils/api';
import { GlassSpinner, pushToast } from './GlassUI';

interface ContactQuoteSectionProps {
  services: ServiceItem[];
  branding: SiteBrandingMeta;
  theme: ThemeCMS;
  currentUser: UserProfile | null;
  cart: CartItem[];
  preselectedService: string;
  onInquiryCreated: () => void;
  onClearCart: () => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onOpenClientPortal: () => void;
  onOpenCart: () => void;
}

const BUDGET_RANGES = [
  '$300 – $1,000 (Starter Package)',
  '$1,000 – $2,500 (Growth Build)',
  '$2,500 – $5,000 (Full Platform / 3D)',
  '$5,000 – $10,000+ (Enterprise Custom)',
];

const TIMELINES = [
  'Urgent (Within 1 Week)',
  '2 – 4 Weeks',
  '1 – 2 Months',
  'Ongoing Retainer Partnership',
];

export const ContactQuoteSection: React.FC<ContactQuoteSectionProps> = ({
  services,
  branding,
  theme,
  currentUser,
  cart,
  preselectedService,
  onInquiryCreated,
  onClearCart,
  onOpenAuth,
  onOpenClientPortal,
  onOpenCart,
}) => {
  const [clientName, setClientName] = useState(currentUser?.displayName || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [companyName, setCompanyName] = useState(currentUser?.company || '');
  const [serviceTitle, setServiceTitle] = useState(
    preselectedService || services[0]?.title || 'Full-Stack Web & Cloud Applications'
  );
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [timeline, setTimeline] = useState(TIMELINES[1]);
  const [projectDetails, setProjectDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setClientName(currentUser.displayName);
      setClientEmail(currentUser.email);
      if (currentUser.company) setCompanyName(currentUser.company);
    }
  }, [currentUser]);

  useEffect(() => {
    if (preselectedService) {
      setServiceTitle(preselectedService);
    }
  }, [preselectedService]);

  const cartTotalUsd = cart.reduce((acc, item) => acc + item.basePriceUsd * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.submitInquiry({
        clientId: currentUser?.id || null,
        clientName,
        clientEmail,
        companyName,
        serviceTitle,
        budgetRange:
          cart.length > 0
            ? `Cart Bundle ($${cartTotalUsd.toLocaleString()}) · ${budgetRange}`
            : budgetRange,
        timeline,
        projectDetails,
        cartSummary: cart,
      });
      setSubmittedSuccess(true);
      setProjectDetails('');
      if (cart.length > 0) {
        onClearCart();
      }
      pushToast(
        'Order & Quote Dispatched!',
        'Muhammad Sarib Randhawa & the SwiftStack team received your brief.',
        'success'
      );
      onInquiryCreated();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send request right now.');
      pushToast('Submission Error', 'Unable to send your brief right now.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="order" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="ss-responsive-grid grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Why SwiftStack & Direct Studio Info */}
          <div className="ss-hero-col lg:col-span-5 space-y-6">
            <div className="ss-glass-card inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start Your Project Today</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Ready to Build Something Extraordinary with{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                SwiftStack?
              </span>
            </h2>

            <p className="text-base text-slate-300 leading-relaxed">
              Submit your project brief or check out directly from your shopping cart. Every inquiry
              is synced in real time to Firebase and reviewed personally by founder{' '}
              <strong className="text-white">{branding.founderName}</strong>.
            </p>

            {cart.length > 0 && (
              <div className="ss-glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-mono uppercase text-cyan-400">
                    Active Shopping Cart Attached
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {cart.reduce((s, i) => s + i.quantity, 0)} Service(s) · Est. $
                    {cartTotalUsd.toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="ss-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Review Cart</span>
                </button>
              </div>
            )}

            <div className="space-y-3.5 pt-1">
              <div className="ss-glass-card ss-glass-interactive flex items-start gap-3.5 rounded-2xl p-4">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Fast 24-Hour Proposal Turnaround</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Clear technical architecture, milestone roadmap, and transparent pricing.
                  </p>
                </div>
              </div>

              <div className="ss-glass-card ss-glass-interactive flex items-start gap-3.5 rounded-2xl p-4">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Real-Time Client Portal Tracking</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentUser ? (
                      <>
                        Signed in as <strong className="text-white">{currentUser.email}</strong>.
                        View live status updates anytime in your Client Portal.
                      </>
                    ) : (
                      <>
                        Sign in with Google or create an account to manage orders in one click.{' '}
                        <button
                          type="button"
                          onClick={() => onOpenAuth('register')}
                          className="text-cyan-400 underline font-semibold"
                        >
                          Sign in / Register
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="ss-glass-card ss-glass-interactive flex items-start gap-3.5 rounded-2xl p-4">
                <Globe2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Direct Founder Contact</h3>
                  <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{branding.contactEmail}</span>
                    <span>·</span>
                    <span>{branding.locationText}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Pure-Sheesha Order & Quote Form */}
          <div className="ss-hero-col lg:col-span-7">
            <div className="ss-glass-card rounded-3xl p-6 sm:p-9 shadow-2xl">
              {submittedSuccess ? (
                <div className="py-10 text-center space-y-5">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Order Request Received by SwiftStack!
                  </h3>
                  <p className="max-w-md mx-auto text-sm text-slate-300 leading-relaxed">
                    Thank you, <strong className="text-white">{clientName}</strong>. Your inquiry
                    for <strong className="text-cyan-400">{serviceTitle}</strong> is live in our
                    cloud portal and will receive an official quote shortly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {currentUser && currentUser.role === 'client' && (
                      <button
                        type="button"
                        onClick={onOpenClientPortal}
                        className="keep-white-text ss-cta-btn px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                        }}
                      >
                        View Status in Client Portal
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSubmittedSuccess(false)}
                      className="ss-glass-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    >
                      Submit Another Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4">
                    <h3 className="font-display text-xl font-bold text-white">
                      Project Brief &amp; Custom Quote Request
                    </h3>
                    <span className="text-xs font-mono text-cyan-400">Free Consultation</span>
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl bg-rose-500/15 border border-rose-500/35 px-4 py-3 text-xs text-rose-300">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="alex@company.com"
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Company / Brand Name
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Optional organization or brand"
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Service Needed *
                      </label>
                      <select
                        value={serviceTitle}
                        onChange={(e) => setServiceTitle(e.target.value)}
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.title}>
                            {s.title} ({s.priceLabel})
                          </option>
                        ))}
                        {!services.some((s) => s.title === serviceTitle) && (
                          <option value={serviceTitle}>{serviceTitle}</option>
                        )}
                        <option value="Custom Multi-Service Package">
                          Custom Multi-Service Package
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Estimated Budget
                      </label>
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      >
                        {BUDGET_RANGES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                        Target Timeline
                      </label>
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                      >
                        {TIMELINES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-200 mb-1.5">
                      Project Goals &amp; Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={projectDetails}
                      onChange={(e) => setProjectDetails(e.target.value)}
                      placeholder="Tell SwiftStack what you want to launch, key features, design references, or business goals..."
                      className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="keep-white-text ss-cta-btn w-full py-3.5 px-6 rounded-2xl text-sm font-bold text-white shadow-xl inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                    }}
                  >
                    {submitting ? (
                      <>
                        <GlassSpinner size="sm" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Project Brief &amp; Request Quote</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
