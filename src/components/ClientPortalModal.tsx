import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FolderKanban,
  Layers,
  Minus,
  Plus,
  PlusCircle,
  Save,
  Send,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { CartItem, InquiryItem, ProjectItem, ServiceItem, UserProfile } from '../types/cms';
import { api } from '../utils/api';

interface ClientPortalModalProps {
  isOpen: boolean;
  initialTab?: 'cart' | 'orders' | 'new-order' | 'services' | 'projects' | 'profile';
  onClose: () => void;
  user: UserProfile;
  cart: CartItem[];
  onAddToCart: (service: ServiceItem) => void;
  onUpdateCartQty: (serviceId: string, delta: number) => void;
  onClearCart: () => void;
  services: ServiceItem[];
  projects: ProjectItem[];
  allOrders: InquiryItem[];
  onUserUpdated: (user: UserProfile) => void;
  primaryColor: string;
  secondaryColor?: string;
}

const BUDGET_RANGES = [
  '$1,500 – $3,000',
  '$3,000 – $7,500',
  '$7,500 – $15,000',
  '$15,000+ Enterprise',
];

const TIMELINES = [
  'Urgent (< 2 Weeks)',
  '2 – 4 Weeks',
  '1 – 2 Months',
  'Flexible / Ongoing Partnership',
];

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  isOpen,
  initialTab = 'orders',
  onClose,
  user,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  services,
  projects,
  allOrders,
  onUserUpdated,
  primaryColor,
  secondaryColor = '#4f46e5',
}) => {
  const [tab, setTab] = useState<
    'cart' | 'orders' | 'new-order' | 'services' | 'projects' | 'profile'
  >(initialTab);

  const [serviceTitle, setServiceTitle] = useState(
    services[0]?.title || 'Full-Stack Web Development & Custom SaaS Apps'
  );
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [timeline, setTimeline] = useState(TIMELINES[1]);
  const [projectDetails, setProjectDetails] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderPlacedToast, setOrderPlacedToast] = useState(false);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [company, setCompany] = useState(user.company);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  const clientOrders = useMemo(() => {
    const emailClean = (user.email || '').toLowerCase();
    return allOrders.filter(
      (item) =>
        item.clientId === user.id ||
        (emailClean && item.clientEmail.toLowerCase() === emailClean)
    );
  }, [allOrders, user.id, user.email]);

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.basePriceUsd * c.quantity, 0),
    [cart]
  );

  if (!isOpen) return null;

  const handleCheckoutCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      await api.submitInquiry({
        clientId: user.id,
        clientName: user.displayName,
        clientEmail: user.email,
        companyName: user.company || '',
        serviceTitle: `Cart Checkout (${cart.map((c) => `${c.title} x${c.quantity}`).join(', ')})`,
        budgetRange: `$${cartSubtotal.toLocaleString()} USD`,
        timeline,
        projectDetails:
          projectDetails.trim() ||
          `Portal Cart Checkout for ${cart.map((c) => `${c.title} (${c.quantity}x)`).join(', ')}.`,
        cartSummary: cart,
      });
      onClearCart();
      setProjectDetails('');
      setOrderPlacedToast(true);
      setTimeout(() => {
        setOrderPlacedToast(false);
        setTab('orders');
      }, 900);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectDetails.trim()) return;
    setSubmittingOrder(true);
    try {
      await api.submitInquiry({
        clientId: user.id,
        clientName: user.displayName,
        clientEmail: user.email,
        companyName: user.company || '',
        serviceTitle,
        budgetRange,
        timeline,
        projectDetails,
      });
      setProjectDetails('');
      setOrderPlacedToast(true);
      setTimeout(() => {
        setOrderPlacedToast(false);
        setTab('orders');
      }, 1000);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateProfile(user, { displayName, company });
      onUserUpdated(res.user);
      setProfileSavedToast(true);
      setTimeout(() => setProfileSavedToast(false), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  const statusColor = (status: InquiryItem['status']) => {
    switch (status) {
      case 'quoted':
        return 'border-cyan-500/40 bg-cyan-500/15 text-cyan-400';
      case 'in-progress':
        return 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400';
      case 'completed':
        return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400';
      case 'reviewing':
        return 'border-amber-500/40 bg-amber-500/15 text-amber-500';
      default:
        return 'border-slate-400/35 bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="ss-modal-surface relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-400/25 px-6 py-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-10 w-10 rounded-full border border-cyan-500/40 object-cover"
              />
            ) : (
              <div
                className="keep-white-text flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {user.displayName} — SwiftStack Shopping &amp; Client Portal
              </h3>
              <p className="text-xs text-slate-400">
                {user.email} {user.company ? `• ${user.company}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Client Portal"
            className="ss-glass-btn rounded-xl p-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-400/25 px-6 py-3">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'orders' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'orders'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>My Orders ({clientOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('cart')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'cart' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'cart'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Shopping Cart ({cart.reduce((s, c) => s + c.quantity, 0)})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('new-order')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'new-order' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'new-order'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Custom Brief</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('services')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'services' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'services'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Services ({services.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('projects')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'projects' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'projects'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <FolderKanban className="h-3.5 w-3.5" />
            <span>Projects ({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
              tab === 'profile' ? 'keep-white-text shadow' : 'ss-glass-btn text-slate-300'
            }`}
            style={
              tab === 'profile'
                ? { backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }
                : undefined
            }
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Account</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* CART CHECKOUT TAB */}
          {tab === 'cart' && (
            <div className="mx-auto max-w-2xl space-y-5">
              {cart.length === 0 ? (
                <div className="ss-glass-card rounded-2xl p-10 text-center space-y-4">
                  <ShoppingBag className="mx-auto h-10 w-10 text-cyan-400" />
                  <div>
                    <h4 className="font-display text-lg font-bold text-white">
                      Your Portal Cart is Empty
                    </h4>
                    <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-400">
                      Browse SwiftStack service packages and click Add to Cart for instant checkout.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTab('services')}
                    className="keep-white-text ss-cta-btn rounded-xl px-5 py-2.5 text-xs font-bold shadow"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    Browse Services &amp; Add to Cart
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCheckoutCart} className="space-y-4">
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.serviceId}
                        className="ss-glass-card flex items-center justify-between gap-4 rounded-2xl p-4"
                      >
                        <div>
                          <div className="font-display text-sm font-bold text-white">
                            {item.title}
                          </div>
                          <div className="text-xs font-mono text-cyan-400">
                            ${(item.basePriceUsd * item.quantity).toLocaleString()} USD • Est.{' '}
                            {item.turnaround}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, -1)}
                            className="ss-glass-btn rounded-lg p-1.5"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-sm font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCartQty(item.serviceId, 1)}
                            className="ss-glass-btn rounded-lg p-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ss-glass-card flex items-center justify-between rounded-2xl p-4">
                    <span className="font-display text-base font-bold text-white">
                      Estimated Total
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-display text-xl font-extrabold text-cyan-400">
                        ${cartSubtotal.toLocaleString()} USD
                      </span>
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="text-xs text-rose-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Clear</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-300">
                      Optional Project Notes / Domain / Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={projectDetails}
                      onChange={(e) => setProjectDetails(e.target.value)}
                      placeholder="Add any specific notes, brand references, or preferred launch timeline..."
                      className="ss-glass-input w-full rounded-xl p-3.5 text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="keep-white-text ss-cta-btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {submittingOrder
                        ? 'Processing Order...'
                        : `Confirm Order ($${cartSubtotal.toLocaleString()} USD)`}
                    </span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {clientOrders.length === 0 ? (
                <div className="ss-glass-card rounded-2xl p-10 text-center space-y-4">
                  <Briefcase className="mx-auto h-10 w-10 text-cyan-400" />
                  <div>
                    <h4 className="font-display text-lg font-bold text-white">
                      No Active Orders Yet
                    </h4>
                    <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-400">
                      Add services to your cart or submit a custom brief to track live quotes from
                      Muhammad Sarib Randhawa.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTab('services')}
                      className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Browse Services</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('new-order')}
                      className="ss-glass-btn rounded-xl px-5 py-2.5 text-xs font-semibold"
                    >
                      Custom Brief
                    </button>
                  </div>
                </div>
              ) : (
                clientOrders.map((item) => (
                  <div key={item.id} className="ss-glass-card rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-bold text-white">{item.serviceTitle}</span>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span>Budget: {item.budgetRange}</span>
                          <span>•</span>
                          <span>Timeline: {item.timeline}</span>
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${statusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.projectDetails}
                    </p>

                    {(item.quotedAmount || item.adminResponse) && (
                      <div className="ss-glass-card rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400">
                            Executive Response — Muhammad Sarib Randhawa
                          </span>
                          {item.quotedAmount && (
                            <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-400">
                              Quoted: {item.quotedAmount}
                            </span>
                          )}
                        </div>
                        {item.adminResponse && (
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {item.adminResponse}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* CUSTOM BRIEF TAB */}
          {tab === 'new-order' && (
            <form onSubmit={handlePlaceOrder} className="mx-auto max-w-2xl space-y-4">
              {orderPlacedToast && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Order submitted to SwiftStack Cloud! Opening tracker...</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Select SwiftStack Service
                </label>
                <select
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="ss-glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.title}>
                      {s.title} ({s.priceLabel})
                    </option>
                  ))}
                  <option value="Custom Multi-Discipline Package">
                    Custom Multi-Discipline Package
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Estimated Budget
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  >
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Target Delivery Timeline
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-4 py-2.5 text-sm"
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
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Project Scope &amp; Requirements
                </label>
                <textarea
                  rows={5}
                  required
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  placeholder="Describe your product goals, required features, target launch date, or reference links..."
                  className="ss-glass-input w-full rounded-xl p-4 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOrder}
                className="keep-white-text ss-cta-btn inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <Send className="h-4 w-4" />
                <span>{submittingOrder ? 'Submitting Order...' : 'Submit Custom Brief'}</span>
              </button>
            </form>
          )}

          {/* BROWSE SERVICES TAB */}
          {tab === 'services' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="ss-glass-card ss-glass-interactive flex flex-col justify-between rounded-2xl p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        {srv.category}
                      </span>
                      <span className="ss-glass-card rounded-lg px-2.5 py-1 text-xs font-bold text-white">
                        {srv.priceLabel}
                      </span>
                    </div>
                    <h4 className="mt-2 font-display text-base font-bold text-white">
                      {srv.title}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                      {srv.shortDescription}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-400/25 pt-3">
                    <span className="text-[11px] text-slate-400">Delivery: {srv.turnaround}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onAddToCart(srv);
                          setTab('cart');
                        }}
                        className="keep-white-text ss-cta-btn inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold"
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        <ShoppingBag className="h-3 w-3" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceTitle(srv.title);
                          setTab('new-order');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:underline"
                      >
                        <span>Quote</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS TAB */}
          {tab === 'projects' && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="ss-glass-card ss-glass-interactive overflow-hidden rounded-2xl"
                >
                  <div className="keep-dark-surface relative h-44 overflow-hidden">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="h-full w-full object-cover"
                    />
                    <span
                      className="keep-white-text absolute right-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md"
                      style={{ backgroundColor: 'rgba(6, 12, 26, 0.85)' }}
                    >
                      {proj.metricValue}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                      {proj.category} • {proj.year}
                    </div>
                    <h4 className="font-display text-base font-bold text-white">{proj.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProjectDetails(
                            `Interested in an architecture similar to "${proj.title}" (${proj.subtitle}). Key goals: `
                          );
                          setTab('new-order');
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:underline"
                      >
                        <span>Request Similar Project</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="max-w-md space-y-4">
              {profileSavedToast && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Profile saved to SwiftStack Cloud.</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="ss-glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Company / Brand Name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="ss-glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <Save className="h-4 w-4" />
                <span>{savingProfile ? 'Saving...' : 'Save Account Details'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
