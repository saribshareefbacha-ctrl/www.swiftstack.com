import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Minus,
  Plus,
  Send,
  ShoppingCart,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { CartItem, InquiryItem, ServiceItem, ThemeCMS, UserProfile } from '../types/cms';
import { api } from '../utils/api';
import { GlassSpinner, pushToast } from './GlassUI';

interface ClientPortalModalProps {
  isOpen: boolean;
  initialTab?: 'cart' | 'orders' | 'new' | 'profile';
  user: UserProfile | null;
  services: ServiceItem[];
  inquiries: InquiryItem[];
  cart: CartItem[];
  theme: ThemeCMS;
  onClose: () => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onUpdateCartQty: (serviceId: string, delta: number) => void;
  onRemoveCartItem: (serviceId: string) => void;
  onClearCart: () => void;
  onAddServiceToCart: (service: ServiceItem) => void;
  onUserUpdated: (user: UserProfile) => void;
}

const STATUS_STYLES: Record<string, { label: string; classes: string }> = {
  new: {
    label: 'Submitted · Pending Review',
    classes: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
  in_review: {
    label: 'In Technical Review',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  quoted: {
    label: 'Official Quote Ready',
    classes: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
  },
  in_progress: {
    label: 'Active Sprint In Progress',
    classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
  },
  completed: {
    label: 'Delivered & Completed',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
};

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  initialTab = 'cart',
  user,
  services,
  inquiries,
  cart,
  theme,
  onClose,
  onOpenAuth,
  onUpdateCartQty,
  onRemoveCartItem,
  onClearCart,
  onAddServiceToCart,
  onUserUpdated,
}) => {
  const [tab, setTab] = useState<'cart' | 'orders' | 'new' | 'profile'>(initialTab);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [company, setCompany] = useState(user?.company || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const [checkoutName, setCheckoutName] = useState(user?.displayName || '');
  const [checkoutEmail, setCheckoutEmail] = useState(user?.email || '');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);

  const [serviceTitle, setServiceTitle] = useState(services[0]?.title || 'Custom Service');
  const [budgetRange, setBudgetRange] = useState('$1,000 – $2,500 (Growth Build)');
  const [timeline, setTimeline] = useState('2 – 4 Weeks');
  const [projectDetails, setProjectDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setCheckoutDone(false);
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setCompany(user.company);
      setCheckoutName(user.displayName);
      setCheckoutEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const clientOrders = user
    ? inquiries.filter(
        (i) => i.clientId === user.id || i.clientEmail.toLowerCase() === user.email.toLowerCase()
      )
    : [];

  const cartSubtotal = cart.reduce((sum, item) => sum + item.basePriceUsd * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    setSubmitting(true);
    try {
      const summaryTitles = cart.map((c) => `${c.title} (×${c.quantity})`).join(' + ');
      await api.submitInquiry({
        clientId: user?.id || null,
        clientName: checkoutName || user?.displayName || 'SwiftStack Shopper',
        clientEmail: checkoutEmail || user?.email || '',
        companyName: user?.company || '',
        serviceTitle: summaryTitles,
        budgetRange: `Shopping Cart Order ($${cartSubtotal.toLocaleString()} USD)`,
        timeline: 'Priority Kickoff',
        projectDetails:
          checkoutNotes.trim() ||
          `Direct Shopping Cart Order for ${totalItems} item(s): ${summaryTitles}.`,
        cartSummary: cart,
      });
      onClearCart();
      setCheckoutNotes('');
      setCheckoutDone(true);
      pushToast(
        'Shopping Cart Order Placed!',
        `Order total $${cartSubtotal.toLocaleString()} USD sent to SwiftStack.`,
        'success'
      );
      if (user) {
        setTimeout(() => {
          setCheckoutDone(false);
          setTab('orders');
        }, 1200);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const res = await api.updateProfile(user, { displayName, company });
      onUserUpdated(res.user);
      setProfileSaved(true);
      pushToast('Profile Saved', 'Your account profile details were updated.', 'success');
      setTimeout(() => setProfileSaved(false), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await api.submitInquiry({
        clientId: user.id,
        clientName: user.displayName,
        clientEmail: user.email,
        companyName: user.company,
        serviceTitle,
        budgetRange,
        timeline,
        projectDetails,
      });
      setProjectDetails('');
      pushToast('Brief Submitted', 'Your project brief is now live in your orders list.', 'success');
      setTab('orders');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="SwiftStack Shopping Cart & Client Portal"
    >
      <div className="ss-modal-surface relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="keep-white-text w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-white"
              style={{
                backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              }}
            >
              {user ? user.displayName.charAt(0).toUpperCase() : <ShoppingCart className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {user ? `${user.displayName}'s SwiftStack Portal` : 'SwiftStack Shopping Cart'}
              </h2>
              <p className="text-xs text-slate-300">
                {user
                  ? `${user.email}${user.company ? ` · ${user.company}` : ''}`
                  : 'Add services to cart and check out seamlessly'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close portal"
            className="ss-glass-btn p-2 rounded-xl text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/15 bg-white/[0.03] shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('cart')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              tab === 'cart' ? 'keep-white-text text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
            style={
              tab === 'cart'
                ? {
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                  }
                : undefined
            }
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Shopping Cart ({totalItems})</span>
          </button>

          {user ? (
            <>
              <button
                type="button"
                onClick={() => setTab('orders')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  tab === 'orders'
                    ? 'keep-white-text text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                style={
                  tab === 'orders'
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      }
                    : undefined
                }
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>My Orders &amp; Quotes ({clientOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('new')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  tab === 'new'
                    ? 'keep-white-text text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                style={
                  tab === 'new'
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      }
                    : undefined
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom Project Brief</span>
              </button>

              <button
                type="button"
                onClick={() => setTab('profile')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  tab === 'profile'
                    ? 'keep-white-text text-white shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
                style={
                  tab === 'profile'
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      }
                    : undefined
                }
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Profile Settings</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-cyan-400 hover:underline"
            >
              <span>Sign in to view order history</span>
            </button>
          )}
        </div>

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {tab === 'cart' && (
            <div className="space-y-6">
              {checkoutDone ? (
                <div className="ss-glass-card rounded-2xl p-8 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="font-display text-2xl font-bold text-white">
                    Order Confirmed &amp; Sent to SwiftStack!
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Your selected digital services have been queued for onboarding with founder
                    Muhammad Sarib Randhawa.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <div className="space-y-5">
                  <div className="ss-glass-card rounded-2xl p-8 text-center space-y-3">
                    <ShoppingCart className="w-10 h-10 text-cyan-400 mx-auto" />
                    <h3 className="font-display text-lg font-bold text-white">
                      Your SwiftStack Cart is Empty
                    </h3>
                    <p className="text-sm text-slate-300 max-w-md mx-auto">
                      Quick-add any digital package below or browse the full service catalog.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {services.slice(0, 4).map((srv) => (
                      <div
                        key={srv.id}
                        className="ss-glass-card rounded-2xl p-4 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-mono text-cyan-400">{srv.category}</div>
                          <div className="text-sm font-bold text-white truncate">{srv.title}</div>
                          <div className="text-xs text-slate-300 mt-0.5">{srv.priceLabel}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddServiceToCart(srv)}
                          className="keep-white-text shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-white"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Cart Items List */}
                  <div className="lg:col-span-7 space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.serviceId}
                        className="ss-glass-card rounded-2xl p-4 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono text-cyan-400">
                            {item.category}
                          </span>
                          <h4 className="font-display text-sm sm:text-base font-bold text-white truncate">
                            {item.title}
                          </h4>
                          <div className="text-xs text-slate-300 mt-0.5">
                            ${item.basePriceUsd.toLocaleString()} USD base · {item.priceLabel}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, -1)}
                            aria-label="Decrease quantity"
                            className="ss-glass-btn p-1.5 rounded-lg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, 1)}
                            aria-label="Increase quantity"
                            className="ss-glass-btn p-1.5 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveCartItem(item.serviceId)}
                            aria-label="Remove item"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checkout Summary Form */}
                  <form
                    onSubmit={handleCartCheckout}
                    className="lg:col-span-5 ss-glass-card rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/15 pb-3">
                      <span className="text-xs font-mono uppercase text-slate-300">
                        Estimated Order Total
                      </span>
                      <span className="font-display text-xl font-extrabold text-cyan-400">
                        ${cartSubtotal.toLocaleString()} USD
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={checkoutName}
                        onChange={(e) => setCheckoutName(e.target.value)}
                        placeholder="Your full name"
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Project Kickoff Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        placeholder="Preferred domain, brand colors, or timeline notes..."
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="keep-white-text ss-cta-btn w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg inline-flex items-center justify-center gap-2"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                      }}
                    >
                      {submitting ? (
                        <>
                          <GlassSpinner size="sm" />
                          <span>Placing Order...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Confirm Order &amp; Lock Quote</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && user && (
            <>
              {clientOrders.length === 0 ? (
                <div className="ss-glass-card rounded-2xl p-10 text-center space-y-4">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <h3 className="font-display text-lg font-bold text-white">
                    No Project Orders Yet
                  </h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Submit a service order or cart checkout and track live status updates and
                    official quotes right here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab('new')}
                    className="keep-white-text px-5 py-2.5 rounded-xl text-xs font-bold text-white"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                    }}
                  >
                    Create Your First Order Request
                  </button>
                </div>
              ) : (
                clientOrders.map((order) => {
                  const badge = STATUS_STYLES[order.status] || STATUS_STYLES.new;
                  return (
                    <div key={order.id} className="ss-glass-card rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono text-cyan-400">
                            Order #{order.id.slice(0, 8)}
                          </span>
                          <h3 className="font-display text-lg font-bold text-white">
                            {order.serviceTitle}
                          </h3>
                        </div>
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <p className="text-sm text-slate-200 leading-relaxed">
                        {order.projectDetails}
                      </p>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-300">
                        <span>
                          Budget: <strong className="text-white">{order.budgetRange}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          Timeline: <strong className="text-white">{order.timeline}</strong>
                        </span>
                      </div>

                      {(order.quotedAmount || order.adminResponse) && (
                        <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-4 space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono uppercase text-cyan-300">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              SwiftStack Official Response
                            </span>
                            {order.quotedAmount && (
                              <span className="font-bold text-white text-sm">
                                Quote: {order.quotedAmount}
                              </span>
                            )}
                          </div>
                          {order.adminResponse && (
                            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                              {order.adminResponse}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {tab === 'new' && user && (
            <form onSubmit={handleNewOrder} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                  Select SwiftStack Service
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
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                    Budget Range
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option>$300 – $1,000 (Starter Package)</option>
                    <option>$1,000 – $2,500 (Growth Build)</option>
                    <option>$2,500 – $5,000 (Full Platform / 3D)</option>
                    <option>$5,000 – $10,000+ (Enterprise Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                    Target Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                  >
                    <option>Urgent (Within 1 Week)</option>
                    <option>2 – 4 Weeks</option>
                    <option>1 – 2 Months</option>
                    <option>Ongoing Retainer Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                  Project Scope &amp; Deliverables *
                </label>
                <textarea
                  required
                  rows={4}
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  placeholder="Describe your goals, features, references, and target launch window..."
                  className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                {submitting ? (
                  <>
                    <GlassSpinner size="sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Order Request</span>
                  </>
                )}
              </button>
            </form>
          )}

          {tab === 'profile' && user && (
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              {profileSaved && (
                <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/35 px-4 py-2.5 text-xs text-emerald-300">
                  Profile settings saved to Firebase successfully.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-200 mb-1.5">
                  Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm opacity-60 cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
                }}
              >
                {submitting && <GlassSpinner size="sm" />}
                <span>Save Profile Changes</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
