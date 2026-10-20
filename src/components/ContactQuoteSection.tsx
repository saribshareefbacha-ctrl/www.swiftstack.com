import React, { useEffect, useState } from 'react';
import { CheckCircle2, Globe2, Mail, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { HeroCMS, ServiceItem, ThemeCMS, UserProfile } from '../types/cms';
import { api } from '../utils/api';

interface ContactQuoteSectionProps {
  hero: HeroCMS;
  theme: ThemeCMS;
  services: ServiceItem[];
  preselectedService: string;
  currentUser: UserProfile | null;
  onInquiryCreated: () => void;
}

export const ContactQuoteSection: React.FC<ContactQuoteSectionProps> = ({
  hero,
  theme,
  services,
  preselectedService,
  currentUser,
  onInquiryCreated,
}) => {
  const [clientName, setClientName] = useState(currentUser?.displayName || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [companyName, setCompanyName] = useState(currentUser?.company || '');
  const [serviceTitle, setServiceTitle] = useState(
    preselectedService || services[0]?.title || '3D Web Design & Modern Front-End'
  );
  const [budgetRange, setBudgetRange] = useState('$2,500 – $5,000');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await api.submitInquiry({
        clientName,
        clientEmail,
        companyName,
        serviceTitle,
        budgetRange,
        timeline,
        projectDetails,
      });
      setSubmittedSuccess(true);
      setProjectDetails('');
      onInquiryCreated();
      setTimeout(() => setSubmittedSuccess(false), 6000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to send request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section id="contact" className="relative py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Direct Agency Overview */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Initiate Collaboration</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight">
                Ready to Build Something{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                  }}
                >
                  Unforgettable?
                </span>
              </h2>

              <p className="text-slate-300/90 text-base leading-relaxed">
                Share your product roadmap, 3D experience concept, mobile APK build, or AI brand
                vision. Muhammad Sarib Randhawa personally reviews every blueprint and responds with
                a tailored architecture &amp; milestone quote.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/65 border border-white/10 backdrop-blur-md">
                  <Mail className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">Direct Studio Desk</div>
                    <div className="text-sm font-semibold text-white">{hero.contactEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/65 border border-white/10 backdrop-blur-md">
                  <Globe2 className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">
                      Global Delivery &amp; Channels
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {hero.locationLabel} · {hero.socialHandle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-900/65 border border-white/10 backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono text-slate-400">Client Portal Sync</div>
                    <div className="text-sm text-slate-300">
                      Sign in anytime with your email or Google account to track live quote updates.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Quote Form */}
            <form
              onSubmit={handleSubmit}
              style={{
                backgroundColor: `rgba(15, 23, 42, ${theme.glassOpacity})`,
              }}
              className="lg:col-span-7 rounded-3xl border border-white/15 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Request a Custom Project Quote
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Zero obligation · Full technical scope &amp; milestone estimate
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  SwiftStack (SS)
                </span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-400/40 text-xs text-red-200">
                  {errorMsg}
                </div>
              )}

              {submittedSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center gap-3 text-sm text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Project brief received! Muhammad Sarib Randhawa&apos;s desk has logged your
                    inquiry — track real-time updates anytime in your account portal.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Alex Rivera"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Work or Personal Email *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="alex@company.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Company / Brand / Channel
                  </label>
                  <input
                    type="text"
                    placeholder="Optional brand name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Selected SwiftStack Service
                  </label>
                  <select
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    {services.map((srv) => (
                      <option key={srv.id} value={srv.title}>
                        {srv.title}
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
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Estimated Investment Range
                  </label>
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="$500 – $1,500">$500 – $1,500</option>
                    <option value="$1,500 – $2,500">$1,500 – $2,500</option>
                    <option value="$2,500 – $5,000">$2,500 – $5,000</option>
                    <option value="$5,000 – $12,000">$5,000 – $12,000</option>
                    <option value="$12,000+ Enterprise">$12,000+ Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Target Delivery Window
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/90 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ASAP / Rush Sprint">ASAP / Rush Sprint</option>
                    <option value="1 – 2 Weeks">1 – 2 Weeks</option>
                    <option value="2 – 4 Weeks">2 – 4 Weeks</option>
                    <option value="1 – 2 Months">1 – 2 Months</option>
                    <option value="Ongoing Retainer">Ongoing Monthly Retainer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Project Scope, Goals &amp; Inspiration *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tell us about your platform goals, key features, 3D visual ideas, or target audience..."
                  value={projectDetails}
                  onChange={(e) => setProjectDetails(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl font-display font-bold text-sm sm:text-base text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(6,182,212,0.35)] hover:opacity-95 transition-all disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent})`,
                }}
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting ? 'Transmitting Project Brief...' : 'Submit Project Brief to SwiftStack'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Clean Public Footer (Strictly zero visible Admin/CMS links) */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-xs text-white"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryAccent}, ${theme.secondaryAccent}, ${theme.tertiaryAccent})`,
              }}
            >
              {hero.companyAbbreviation}
            </div>
            <div>
              <div className="font-display font-bold text-sm text-white">
                {hero.companyName} ({hero.companyAbbreviation}) · Founded by {hero.founderName}
              </div>
              <div className="text-xs text-slate-400">
                Full-Stack Engineering · 3D Spatial Web · AI Media Studio ({hero.socialHandle})
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#hero" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#avatar-studio" className="hover:text-white transition-colors">
              3D Studio
            </a>
            <a href="#projects" className="hover:text-white transition-colors">
              Projects
            </a>
            <span>© {new Date().getFullYear()} {hero.companyName}. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
};
