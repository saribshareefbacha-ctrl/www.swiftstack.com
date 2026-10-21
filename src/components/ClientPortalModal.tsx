import React, { useMemo, useState } from 'react';
import {
  X,
  Briefcase,
  CheckCircle2,
  User as UserIcon,
  Save,
  PlusCircle,
  Layers,
  FolderKanban,
  Send,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import { InquiryItem, ProjectItem, ServiceItem, UserProfile } from '../types/cms';
import { api } from '../utils/api';

interface ClientPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  services: ServiceItem[];
  projects: ProjectItem[];
  allOrders: InquiryItem[];
  onUserUpdated: (user: UserProfile) => void;
  primaryColor: string;
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
  onClose,
  user,
  services,
  projects,
  allOrders,
  onUserUpdated,
  primaryColor,
}) => {
  const [tab, setTab] = useState<'orders' | 'new-order' | 'services' | 'projects' | 'profile'>(
    'orders'
  );

  // Order submission state inside Client Portal
  const [serviceTitle, setServiceTitle] = useState(
    services[0]?.title || 'Full-Stack Web & SaaS Engineering'
  );
  const [budgetRange, setBudgetRange] = useState(BUDGET_RANGES[1]);
  const [timeline, setTimeline] = useState(TIMELINES[1]);
  const [projectDetails, setProjectDetails] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderPlacedToast, setOrderPlacedToast] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState(user.displayName);
  const [company, setCompany] = useState(user.company);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  const clientOrders = useMemo(() => {
    const emailClean = (user.email || '').toLowerCase();
    return allOrders.filter(
      (item) =>
        item.clientId === user.id ||
        (emailClean && item.clientEmail.toLowerCase() === emailClean)
    );
  }, [allOrders, user.id, user.email]);

  if (!isOpen) return null;

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
      }, 1200);
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
        return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300';
      case 'in-progress':
        return 'border-indigo-400/40 bg-indigo-500/15 text-indigo-300';
      case 'completed':
        return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300';
      case 'reviewing':
        return 'border-amber-400/40 bg-amber-500/15 text-amber-300';
      default:
        return 'border-slate-600 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-10 w-10 rounded-full border border-cyan-500/40 object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {user.displayName} — SwiftStack Client Portal
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
            className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sleek Conversion Navigation Tabs (Strictly Services, Projects, Orders & Account) */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 bg-slate-950/40 px-6 py-3">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === 'orders'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            My Orders & Quotes ({clientOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('new-order')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === 'new-order'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Place New Order
          </button>

          <button
            type="button"
            onClick={() => setTab('services')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === 'services'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Browse Services ({services.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('projects')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === 'projects'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="h-3.5 w-3.5" />
            View Projects ({projects.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('profile')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              tab === 'profile'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Account Settings
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: MY ORDERS & INQUIRIES */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {clientOrders.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-10 text-center space-y-4">
                  <Briefcase className="mx-auto h-10 w-10 text-cyan-400/70" />
                  <div>
                    <h4 className="font-display text-lg font-semibold text-white">
                      No Active Orders Yet
                    </h4>
                    <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-slate-400">
                      Browse SwiftStack services or submit a custom project scope directly inside
                      your client workspace to receive a real-time executive quote.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setTab('new-order')}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-lg"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primaryColor}, #38bdf8)`,
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Place Your First Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('services')}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50"
                    >
                      Explore Services
                    </button>
                  </div>
                </div>
              ) : (
                clientOrders.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5 space-y-3"
                  >
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
                      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-cyan-300">
                            Executive Response — Muhammad Sarib Randhawa
                          </span>
                          {item.quotedAmount && (
                            <span className="rounded-lg bg-slate-950/90 px-2.5 py-1 text-xs font-bold text-emerald-300">
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

          {/* TAB 2: PLACE NEW ORDER */}
          {tab === 'new-order' && (
            <form onSubmit={handlePlaceOrder} className="mx-auto max-w-2xl space-y-4">
              {orderPlacedToast && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Order submitted to SwiftStack! Redirecting to your live order tracker...</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-300">
                  Select SwiftStack Service
                </label>
                <select
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                  Project Scope & Requirements
                </label>
                <textarea
                  rows={5}
                  required
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  placeholder="Describe your product goals, required features, target launch date, or reference links..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOrder}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-60"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, #38bdf8)`,
                }}
              >
                <Send className="h-4 w-4" />
                <span>{submittingOrder ? 'Submitting Order...' : 'Submit Order & Request Quote'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: BROWSE SERVICES */}
          {tab === 'services' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                        {srv.category}
                      </span>
                      <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
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

                  <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                    <span className="text-[11px] text-slate-400">Delivery: {srv.turnaround}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setServiceTitle(srv.title);
                        setTab('new-order');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      <span>Order Service</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: VIEW SHOWCASE PROJECTS */}
          {tab === 'projects' && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute right-3 top-3 rounded-lg bg-slate-950/85 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 backdrop-blur-md">
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
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
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

          {/* TAB 5: ACCOUNT SETTINGS */}
          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="max-w-md space-y-4">
              {profileSavedToast && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300">
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-lg"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, #38bdf8)`,
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
