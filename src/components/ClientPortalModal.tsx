import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  FileText,
  PlusCircle,
  Save,
  User,
  X,
} from 'lucide-react';
import { InquiryItem, ServiceItem, ThemeCMS, UserProfile } from '../types/cms';
import { api } from '../utils/api';

interface ClientPortalModalProps {
  open: boolean;
  user: UserProfile | null;
  services: ServiceItem[];
  theme: ThemeCMS;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
  reviewing: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
  quoted: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50',
  'in-progress': 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50',
  completed: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50',
};

export const ClientPortalModal: React.FC<ClientPortalModalProps> = ({
  open,
  user,
  services,
  theme,
  onClose,
  onUserUpdated,
}) => {
  const [tab, setTab] = useState<'requests' | 'new-request' | 'profile'>('requests');
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [company, setCompany] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Quick request fields
  const [serviceTitle, setServiceTitle] = useState(services[0]?.title || '');
  const [budgetRange, setBudgetRange] = useState('$2,500 – $5,000');
  const [timeline, setTimeline] = useState('2 – 4 Weeks');
  const [projectDetails, setProjectDetails] = useState('');

  const loadMyInquiries = async () => {
    setLoading(true);
    try {
      const res = await api.getMyInquiries();
      setInquiries(res.inquiries);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName);
      setCompany(user.company);
      loadMyInquiries();
    }
  }, [open, user]);

  if (!user) return null;

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.submitInquiry({
      clientName: user.displayName,
      clientEmail: user.email,
      companyName: user.company,
      serviceTitle: serviceTitle || services[0]?.title || 'Full-Stack Web Development',
      budgetRange,
      timeline,
      projectDetails,
    });
    setProjectDetails('');
    await loadMyInquiries();
    setTab('requests');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.updateProfile({ displayName, company });
    onUserUpdated(res.user);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div>
                <h2 className="font-display font-bold text-xl text-white">
                  Welcome, {user.displayName}
                </h2>
                <p className="text-xs text-slate-400">
                  {user.email} {user.company ? `· ${user.company}` : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation */}
            <div className="px-6 pt-4 flex items-center gap-2 border-b border-white/10 pb-3">
              {[
                { id: 'requests' as const, label: `My Project Requests (${inquiries.length})`, icon: FileText },
                { id: 'new-request' as const, label: 'New Quote Request', icon: PlusCircle },
                { id: 'profile' as const, label: 'Account Profile', icon: User },
              ].map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'text-slate-950'
                        : 'text-slate-300 bg-slate-950/60 hover:bg-white/10'
                    }`}
                    style={
                      active
                        ? {
                            background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                          }
                        : undefined
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {tab === 'requests' && (
                <>
                  {loading ? (
                    <div className="text-sm text-slate-400 py-8 text-center">
                      Loading your project requests...
                    </div>
                  ) : inquiries.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Clock className="w-10 h-10 text-cyan-400 mx-auto" />
                      <div className="text-base font-semibold text-white">
                        No project requests submitted yet
                      </div>
                      <button
                        onClick={() => setTab('new-request')}
                        className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 text-xs font-bold"
                      >
                        Submit Your First Project Brief
                      </button>
                    </div>
                  ) : (
                    inquiries.map((inq) => (
                      <div
                        key={inq.id}
                        className="rounded-2xl bg-slate-950/75 border border-white/10 p-5 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="font-display font-bold text-base text-white">
                              {inq.serviceTitle}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              Budget: {inq.budgetRange} · Timeline: {inq.timeline}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-mono uppercase border ${
                              STATUS_BADGE[inq.status] || STATUS_BADGE.new
                            }`}
                          >
                            {inq.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed">
                          {inq.projectDetails}
                        </p>

                        {(inq.quotedAmount || inq.adminResponse) && (
                          <div className="rounded-xl bg-cyan-500/10 border border-cyan-400/35 p-3.5 space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                              <span>OFFICIAL SWIFTSTACK RESPONSE</span>
                              {inq.quotedAmount && (
                                <span className="font-bold text-white">
                                  Quote: {inq.quotedAmount}
                                </span>
                              )}
                            </div>
                            {inq.adminResponse && (
                              <p className="text-xs text-slate-200">{inq.adminResponse}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}

              {tab === 'new-request' && (
                <form onSubmit={handleCreateRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Service Package
                    </label>
                    <select
                      value={serviceTitle}
                      onChange={(e) => setServiceTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        Target Budget
                      </label>
                      <input
                        type="text"
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        Desired Timeline
                      </label>
                      <input
                        type="text"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Project Requirements *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={projectDetails}
                      onChange={(e) => setProjectDetails(e.target.value)}
                      placeholder="Describe the features, 3D visuals, or deliverables you need..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl font-display font-bold text-sm text-slate-950"
                    style={{
                      background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                    }}
                  >
                    Submit Request to Muhammad Sarib Randhawa
                  </button>
                </form>
              )}

              {tab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Display Name
                    </label>
                    <input
                      required
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300"
                  >
                    {profileSaved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Profile Updated!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
