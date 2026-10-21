import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Globe2,
  Mail,
  Minus,
  Plus,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CartItem, HeroCMS, ServiceItem, ThemeCMS, UserProfile } from '../types/cms';
import { api } from '../utils/api';
import { SwiftStackLogo } from './SwiftStackLogo';

interface ContactQuoteSectionProps {
  hero: HeroCMS;
  theme: ThemeCMS;
  services: ServiceItem[];
  cart: CartItem[];
  onUpdateCartQty: (serviceId: string, delta: number) => void;
  onClearCart: () => void;
  preselectedService: string;
  currentUser: UserProfile | null;
}

export const ContactQuoteSection: React.FC<ContactQuoteSectionProps> = ({
  hero,
  theme,
  services,
  cart,
  onUpdateCartQty,
  onClearCart,
  preselectedService,
  currentUser,
}) => {
  const [clientName, setClientName] = useState(currentUser?.displayName || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [companyName, setCompanyName] = useState(currentUser?.company || '');
  const [serviceTitle, setServiceTitle] = useState(
    preselectedService || services[0]?.title || 'Full-Stack Web Development & Custom SaaS Apps'
  );
  const [budgetRange, setBudgetRange] = useState('$3,000 – $7,500');
  const [timeline, setTimeline] = useState('2 – 4 Weeks');
  const [projectDetails, setProjectDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (preselectedService) {
      setServiceTitle(preselectedService);
    }
  }, [preselectedService]);

  useEffect(() => {
    if (currentUser) {
      setClientName((prev) => prev || currentUser.displayName);
      setClientEmail((prev) => prev || currentUser.email);
      setCompanyName((prev) => prev || currentUser.company);
    }
  }, [currentUser]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.basePriceUsd * item.quantity, 0),
    [cart]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const effectiveTitle =
        cart.length > 0
          ? `Shopping Cart Order (${cart.map((c) => `${c.title} x${c.quantity}`).join(', ')})`
          : serviceTitle;
      const effectiveBudget =
        cart.length > 0 ? `$${cartSubtotal.toLocaleString()} USD (Cart Subtotal)` : budgetRange;

      await api.submitInquiry({
        clientId: currentUser?.id || null,
        clientName,
        clientEmail,
        companyName,
        serviceTitle: effectiveTitle,
        budgetRange: effectiveBudget,
        timeline,
        projectDetails,
        cartSummary: cart,
      });
      if (cart.length > 0) {
        onClearCart();
      }
      setSubmittedSuccess(true);
      setProjectDetails('');
      setTimeout(() => setSubmittedSuccess(false), 6000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section id="order" className="relative py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Direct Agency & Live Cart Summary */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest text-cyan-400">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Portal Checkout &amp; Custom Brief</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                {hero.orderHeadingPrefix || 'Checkout Your Cart or'}{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                  }}
                >
                  {hero.orderHeadingHighlight || 'Commission a Custom Build'}
                </span>
              </h2>

              <p className="text-slate-300 text-base leading-relaxed">{hero.orderSubheading}</p>

              {/* Active Glass Shopping Cart Card */}
              <div className="ss-glass-card rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <ShoppingBag className="h-4 w-4 text-cyan-400" />
                    <span>Your Service Cart ({cart.length})</span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your cart is currently empty — select any package above with{' '}
                    <strong className="text-cyan-400">Add to Cart</strong> or submit a direct custom
                    project specification on the right.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.serviceId}
                        className="ss-glass-card flex items-center justify-between gap-2 rounded-xl px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-white">{item.title}</div>
                          <div className="text-[11px] font-mono text-cyan-400">
                            ${(item.basePriceUsd * item.quantity).toLocaleString()} ({item.priceLabel})
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, -1)}
                            className="ss-glass-btn rounded-lg p-1"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, 1)}
                            className="ss-glass-btn rounded-lg p-1"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-slate-400/25 pt-2.5 text-sm font-bold text-white">
                      <span>Estimated Cart Total</span>
                      <span className="font-mono text-cyan-400">
                        ${cartSubtotal.toLocaleString()} USD
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="ss-glass-card ss-glass-interactive flex items-center gap-3.5 p-4 rounded-2xl">
                  <Mail className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">Direct Executive Desk</div>
                    <div className="text-sm font-semibold text-white">{hero.contactEmail}</div>
                  </div>
                </div>

                <div className="ss-glass-card ss-glass-interactive flex items-center gap-3.5 p-4 rounded-2xl">
                  <Globe2 className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      Global Delivery &amp; Channels
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {hero.locationLabel} · {hero.socialHandle}
                    </div>
                  </div>
                </div>

                <div className="ss-glass-card ss-glass-interactive flex items-center gap-3.5 p-4 rounded-2xl">
                  <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">Real-Time Client Portal</div>
                    <div className="text-sm text-slate-300">
                      Sign in directly with Google anytime to track live order status and quotes.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Pure Glass Checkout & Quote Form */}
            <form
              onSubmit={handleSubmit}
              className="ss-glass-card lg:col-span-7 rounded-3xl p-6 sm:p-8 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-400/25 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    {cart.length > 0
                      ? `Complete Cart Order ($${cartSubtotal.toLocaleString()} USD)`
                      : 'Place an Order or Request Quote'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time Firebase Cloud sync · Reviewed directly by {hero.founderName}
                  </p>
                </div>
                <span className="ss-glass-card px-3 py-1 rounded-full text-[11px] font-mono font-bold text-cyan-400">
                  SwiftStack (SS)
                </span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-400/40 text-xs text-rose-400">
                  {errorMsg}
                </div>
              )}

              {submittedSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3 text-sm text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <span>
                    Order confirmed &amp; synced live to SwiftStack Cloud! Open your Client Portal
                    anytime to track milestone status and executive responses.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Zainab Malik"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Work or Google Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="zainab@company.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Company / Brand
                  </label>
                  <input
                    type="text"
                    placeholder="Optional organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Primary Service Package
                  </label>
                  <select
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.title}>
                        {srv.title} ({srv.priceLabel})
                      </option>
                    ))}
                    <option value="Custom Multi-Service Architecture">
                      Custom Multi-Service Architecture
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Estimated Investment Range
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  >
                    <option value="$1,500 – $3,000">$1,500 – $3,000</option>
                    <option value="$3,000 – $7,500">$3,000 – $7,500</option>
                    <option value="$7,500 – $15,000">$7,500 – $15,000</option>
                    <option value="$15,000+ Enterprise">$15,000+ Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Target Delivery Window
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm"
                  >
                    <option value="Urgent (< 2 Weeks)">Urgent (&lt; 2 Weeks)</option>
                    <option value="2 – 4 Weeks">2 – 4 Weeks</option>
                    <option value="1 – 2 Months">1 – 2 Months</option>
                    <option value="Ongoing Partnership">Ongoing Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Project Scope &amp; Objectives *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your product goals, key features, timeline, or target audience..."
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  className="ss-glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="keep-white-text ss-cta-btn w-full py-3.5 px-6 rounded-2xl font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                }}
              >
                <Send className="h-4 w-4" />
                <span>
                  {submitting
                    ? 'Submitting Order...'
                    : cart.length > 0
                      ? `Place Order (${cart.length} Item${cart.length > 1 ? 's' : ''} · $${cartSubtotal.toLocaleString()})`
                      : 'Submit Order & Request Quote'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Clean Glass Footer (Strictly zero visible Admin/CMS links) */}
      <footer className="ss-glass-card border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SwiftStackLogo
              monogram={hero.companyAbbreviation}
              primaryColor={theme.primaryAccent}
              secondaryColor={theme.secondaryAccent}
              iconOnly
              size={38}
            />
            <div>
              <div className="font-display font-bold text-sm text-white">
                {hero.companyName} ({hero.companyAbbreviation}) · Founded by {hero.founderName}
              </div>
              <div className="text-xs text-slate-400">
                Full-Stack Engineering · Shopping Portal · Cloud &amp; AI Studio ({hero.socialHandle})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#hero" className="hover:text-cyan-400 transition-colors">
              Overview
            </a>
            <a href="#services" className="hover:text-cyan-400 transition-colors">
              Services &amp; Shop
            </a>
            <a href="#projects" className="hover:text-cyan-400 transition-colors">
              Projects
            </a>
            <a href="#order" className="hover:text-cyan-400 transition-colors">
              Checkout &amp; Quote
            </a>
            <span>
              © {new Date().getFullYear()} {hero.companyName}. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};
