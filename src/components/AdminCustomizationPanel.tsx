import React, { useEffect, useState } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Edit3,
  Palette,
  FileText,
  Layers,
  FolderKanban,
  MessageSquare,
  UserCheck,
  Sparkles,
  Upload,
  RotateCcw,
  Cloud,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { CHARACTER_PRESET_IMAGES } from '../data/defaultSeed';
import {
  CharacterConfig,
  CharacterPresetStyle,
  HeroCMS,
  InquiryItem,
  ProjectItem,
  ServiceItem,
  SiteCMSData,
  ThemeCMS,
  UserProfile,
} from '../types/cms';
import { api, CloudSyncState, subscribeSyncState } from '../utils/api';

export type AdminTab =
  | 'hero'
  | 'character'
  | 'services'
  | 'projects'
  | 'orders'
  | 'theme'
  | 'clients';

interface AdminCustomizationPanelProps {
  isOpen: boolean;
  initialTab?: AdminTab;
  onClose: () => void;
  cmsData: SiteCMSData;
  orders: InquiryItem[];
  onCMSUpdated: (data: SiteCMSData) => void;
}

export const AdminCustomizationPanel: React.FC<AdminCustomizationPanelProps> = ({
  isOpen,
  initialTab = 'hero',
  onClose,
  cmsData,
  orders,
  onCMSUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [heroForm, setHeroForm] = useState<HeroCMS>(cmsData.hero);
  const [charForm, setCharForm] = useState<CharacterConfig>(cmsData.character);
  const [themeForm, setThemeForm] = useState<ThemeCMS>(cmsData.theme);
  const [syncStatus, setSyncStatus] = useState<CloudSyncState>('live');
  const [toast, setToast] = useState('');
  const [clients, setClients] = useState<UserProfile[]>([]);

  // Inline Service Editing + New Service state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCat, setSrvCat] = useState('Engineering');
  const [srvPrice, setSrvPrice] = useState('From $1,800');
  const [srvTurnaround, setSrvTurnaround] = useState('1 – 3 Weeks');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvDeliverables, setSrvDeliverables] = useState(
    'Custom UI & Full-Stack Build, Cloud Deployment, Post-Launch Support'
  );
  const [srvFeatured, setSrvFeatured] = useState(true);

  // Inline Project Editing + New Project state
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projSubtitle, setProjSubtitle] = useState('');
  const [projCategory, setProjCategory] = useState('Full-Stack & Cloud');
  const [projClient, setProjClient] = useState('SwiftStack Partner');
  const [projYear, setProjYear] = useState('2026');
  const [projMetricLabel, setProjMetricLabel] = useState('Impact');
  const [projMetric, setProjMetric] = useState('+180% Conversion');
  const [projImage, setProjImage] = useState('./images/project-3d-commerce.jpg');
  const [projDesc, setProjDesc] = useState('');
  const [projTags, setProjTags] = useState('React, TypeScript, Firebase');

  // Order response drafts
  const [quoteDrafts, setQuoteDrafts] = useState<
    Record<string, { status: InquiryItem['status']; quotedAmount: string; adminResponse: string }>
  >({});

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    setHeroForm(cmsData.hero);
    setCharForm(cmsData.character);
    setThemeForm(cmsData.theme);
  }, [cmsData]);

  useEffect(() => {
    const unsub = subscribeSyncState(setSyncStatus);
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'clients') {
      api.getClients().then((r) => setClients(r.clients));
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitle('');
    setSrvCat('Engineering');
    setSrvPrice('From $1,800');
    setSrvTurnaround('1 – 3 Weeks');
    setSrvDesc('');
    setSrvDeliverables('Custom UI & Full-Stack Build, Cloud Deployment, Post-Launch Support');
    setSrvFeatured(true);
  };

  const startEditService = (srv: ServiceItem) => {
    setEditingServiceId(srv.id);
    setSrvTitle(srv.title);
    setSrvCat(srv.category);
    setSrvPrice(srv.priceLabel);
    setSrvTurnaround(srv.turnaround);
    setSrvDesc(srv.shortDescription);
    setSrvDeliverables(srv.deliverables.join(', '));
    setSrvFeatured(srv.featured);
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjTitle('');
    setProjSubtitle('');
    setProjCategory('Full-Stack & Cloud');
    setProjClient('SwiftStack Partner');
    setProjYear('2026');
    setProjMetricLabel('Impact');
    setProjMetric('+180% Conversion');
    setProjImage('./images/project-3d-commerce.jpg');
    setProjDesc('');
    setProjTags('React, TypeScript, Firebase');
  };

  const startEditProject = (p: ProjectItem) => {
    setEditingProjectId(p.id);
    setProjTitle(p.title);
    setProjSubtitle(p.subtitle);
    setProjCategory(p.category);
    setProjClient(p.clientName);
    setProjYear(p.year);
    setProjMetricLabel(p.metricLabel);
    setProjMetric(p.metricValue);
    setProjImage(p.imageUrl);
    setProjDesc(p.description);
    setProjTags(p.tags.join(', '));
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateHero(heroForm);
    onCMSUpdated({ ...cmsData, hero: heroForm });
    notify('All site texts & section headings published live!');
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateCharacter(charForm);
    onCMSUpdated({ ...cmsData, character: charForm });
    notify('CEO Character & Voice config published live!');
  };

  const handleCharacterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCharForm((prev) => ({ ...prev, customImageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProjImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTestVoice = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(heroForm.voiceGreeting.replace(/\s*&\s*/g, ' and '));
    u.rate = charForm.voiceRate || 1.0;
    u.pitch = charForm.voicePitch || 1.02;
    window.speechSynthesis.speak(u);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;
    const payload = {
      title: srvTitle.trim(),
      category: srvCat,
      priceLabel: srvPrice,
      turnaround: srvTurnaround,
      shortDescription: srvDesc,
      deliverables: srvDeliverables
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      featured: srvFeatured,
    };

    if (editingServiceId) {
      const res = await api.updateService(editingServiceId, payload);
      onCMSUpdated({
        ...cmsData,
        services: cmsData.services.map((s) => (s.id === editingServiceId ? res.service : s)),
      });
      resetServiceForm();
      notify('Service updated live across site & portals!');
    } else {
      const res = await api.createService(payload);
      onCMSUpdated({ ...cmsData, services: [...cmsData.services, res.service] });
      resetServiceForm();
      notify('New service published live!');
    }
  };

  const handleDeleteService = async (id: string) => {
    await api.deleteService(id);
    onCMSUpdated({ ...cmsData, services: cmsData.services.filter((s) => s.id !== id) });
    if (editingServiceId === id) resetServiceForm();
    notify('Service removed.');
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    const payload = {
      title: projTitle.trim(),
      subtitle: projSubtitle || 'Custom SwiftStack Solution',
      category: projCategory,
      clientName: projClient,
      year: projYear,
      metricLabel: projMetricLabel,
      metricValue: projMetric,
      imageUrl: projImage,
      description: projDesc,
      tags: projTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    if (editingProjectId) {
      const res = await api.updateProject(editingProjectId, payload);
      onCMSUpdated({
        ...cmsData,
        projects: cmsData.projects.map((p) => (p.id === editingProjectId ? res.project : p)),
      });
      resetProjectForm();
      notify('Project updated live!');
    } else {
      const res = await api.createProject(payload);
      onCMSUpdated({ ...cmsData, projects: [...cmsData.projects, res.project] });
      resetProjectForm();
      notify('Project published to showcase!');
    }
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    onCMSUpdated({ ...cmsData, projects: cmsData.projects.filter((p) => p.id !== id) });
    if (editingProjectId === id) resetProjectForm();
    notify('Project removed.');
  };

  const handleSaveOrderResponse = async (item: InquiryItem) => {
    const draft = quoteDrafts[item.id] || {
      status: item.status,
      quotedAmount: item.quotedAmount,
      adminResponse: item.adminResponse,
    };
    await api.updateInquiry(item.id, draft);
    notify(`Order updated & synced live to ${item.clientName}'s Portal!`);
  };

  const handleDeleteOrder = async (id: string) => {
    await api.deleteInquiry(id);
    notify('Order removed.');
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.updateTheme(themeForm);
    onCMSUpdated({ ...cmsData, theme: themeForm });
    notify('Global colors & atmosphere synced live!');
  };

  const handleResetDefaults = async () => {
    const fresh = await api.resetCMS();
    onCMSUpdated(fresh);
    notify('Site reset to SwiftStack signature defaults.');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'hero', label: 'All Site Texts', icon: <FileText className="h-4 w-4" /> },
    { id: 'character', label: 'CEO Character & Voice', icon: <Sparkles className="h-4 w-4" /> },
    {
      id: 'services',
      label: 'Services CRUD',
      icon: <Layers className="h-4 w-4" />,
      badge: cmsData.services.length,
    },
    {
      id: 'projects',
      label: 'Projects CRUD',
      icon: <FolderKanban className="h-4 w-4" />,
      badge: cmsData.projects.length,
    },
    {
      id: 'orders',
      label: 'Leads & Orders',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: orders.length,
    },
    { id: 'theme', label: 'Theme & Colors', icon: <Palette className="h-4 w-4" /> },
    { id: 'clients', label: 'Client Accounts', icon: <UserCheck className="h-4 w-4" /> },
  ];

  const presetOptions: { id: CharacterPresetStyle; label: string; desc: string }[] = [
    {
      id: 'executive-polo',
      label: 'Signature White Polo',
      desc: 'Crisp white collared polo with red & blue executive trim',
    },
    {
      id: 'midnight-blazer',
      label: 'Midnight Navy Blazer',
      desc: 'Tailored dark executive blazer over clean collar',
    },
    {
      id: 'tech-minimalist',
      label: 'Modern Tech Jacket',
      desc: 'Minimalist slate jacket with subtle cyan accents',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl">
        {/* Top Owner Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 font-display text-sm font-bold text-slate-950">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg font-bold text-white">
                  SwiftStack Real-Time CMS Dashboard
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                  <Cloud className="h-3 w-3" />
                  <span>
                    {syncStatus === 'live'
                      ? 'Firebase Cloud Live (swiftstack-a75b2)'
                      : 'Cloud + Local Mirror Active'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Owner Session: Muhammad Sarib Randhawa • Live Firestore real-time synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {toast && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                {toast}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400"
            >
              Done / View Live Site
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Studio"
              className="rounded-xl border border-slate-800 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Sidebar Navigation */}
          <aside className="flex lg:w-64 shrink-0 overflow-x-auto lg:flex-col gap-1.5 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/60 p-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  activeTab === item.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="mt-auto hidden lg:block pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 py-2.5 text-xs text-slate-400 hover:border-amber-500/40 hover:text-amber-300"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Restore Factory Seed</span>
              </button>
            </div>
          </aside>

          {/* Main Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. ALL SITE TEXTS & SECTION HEADINGS */}
            {activeTab === 'hero' && (
              <form onSubmit={handleSaveHero} className="max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-white">
                    Hero Copy, CEO Bio, Voice Script &amp; Section Headings
                  </h3>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                  >
                    <Save className="h-4 w-4" />
                    <span>Publish All Site Copy</span>
                  </button>
                </div>

                {/* Brand & Hero Section */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    1. Brand Identity &amp; Hero Intro
                  </h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Brand Name</label>
                      <input
                        type="text"
                        value={heroForm.companyName}
                        onChange={(e) => setHeroForm({ ...heroForm, companyName: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Monogram</label>
                      <input
                        type="text"
                        value={heroForm.companyAbbreviation}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, companyAbbreviation: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Top Badge Text</label>
                      <input
                        type="text"
                        value={heroForm.badgeText}
                        onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Headline Prefix</label>
                      <input
                        type="text"
                        value={heroForm.headlinePrefix}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, headlinePrefix: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Gradient Highlight Phrase
                      </label>
                      <input
                        type="text"
                        value={heroForm.headlineHighlight}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, headlineHighlight: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Hero Subheadline</label>
                    <textarea
                      rows={2}
                      value={heroForm.subheadline}
                      onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Founder Name</label>
                      <input
                        type="text"
                        value={heroForm.founderName}
                        onChange={(e) => setHeroForm({ ...heroForm, founderName: e.target.value })}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Founder Title</label>
                      <input
                        type="text"
                        value={heroForm.founderTitle}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, founderTitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Founder Bio</label>
                    <textarea
                      rows={2}
                      value={heroForm.founderBio}
                      onChange={(e) => setHeroForm({ ...heroForm, founderBio: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-cyan-300">
                      CEO Web Speech API Greeting Script
                    </label>
                    <textarea
                      rows={2}
                      value={heroForm.voiceGreeting}
                      onChange={(e) => setHeroForm({ ...heroForm, voiceGreeting: e.target.value })}
                      className="w-full rounded-xl border border-cyan-500/40 bg-slate-950 p-3 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Primary CTA Label</label>
                      <input
                        type="text"
                        value={heroForm.primaryCtaLabel}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, primaryCtaLabel: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Secondary CTA Label
                      </label>
                      <input
                        type="text"
                        value={heroForm.secondaryCtaLabel}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, secondaryCtaLabel: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Page Section Headings */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                    2. Services, Projects &amp; Order Section Copy
                  </h4>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Services Heading Prefix
                      </label>
                      <input
                        type="text"
                        value={heroForm.servicesHeadingPrefix || ''}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, servicesHeadingPrefix: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Services Heading Highlight
                      </label>
                      <input
                        type="text"
                        value={heroForm.servicesHeadingHighlight || ''}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, servicesHeadingHighlight: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Services section subtitle"
                    value={heroForm.servicesSubheading || ''}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, servicesSubheading: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Projects Heading Prefix
                      </label>
                      <input
                        type="text"
                        value={heroForm.projectsHeadingPrefix || ''}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, projectsHeadingPrefix: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">
                        Projects Heading Highlight
                      </label>
                      <input
                        type="text"
                        value={heroForm.projectsHeadingHighlight || ''}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, projectsHeadingHighlight: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Projects section subtitle"
                    value={heroForm.projectsSubheading || ''}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, projectsSubheading: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Contact Email</label>
                      <input
                        type="email"
                        value={heroForm.contactEmail}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, contactEmail: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Location Label</label>
                      <input
                        type="text"
                        value={heroForm.locationLabel}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, locationLabel: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Social Handle</label>
                      <input
                        type="text"
                        value={heroForm.socialHandle}
                        onChange={(e) =>
                          setHeroForm({ ...heroForm, socialHandle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Save className="h-4 w-4" />
                  <span>Publish All Site Copy Live</span>
                </button>
              </form>
            )}

            {/* 2. CEO CHARACTER & VOICE STUDIO (STRICTLY OWNER ONLY) */}
            {activeTab === 'character' && (
              <form onSubmit={handleSaveCharacter} className="max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Hero CEO Character &amp; Voice Studio
                    </h3>
                    <p className="text-xs text-slate-400">
                      Exclusively controlled by Owner — regular visitors &amp; clients cannot modify
                      character settings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/50 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-300"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Preview Voice Intro</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {presetOptions.map((opt) => {
                    const active =
                      charForm.presetStyle === opt.id && !charForm.customImageUrl.trim();
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setCharForm({
                            ...charForm,
                            presetStyle: opt.id,
                            customImageUrl: '',
                          })
                        }
                        className={`flex flex-col overflow-hidden rounded-2xl border p-3 text-left transition ${
                          active
                            ? 'border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/15'
                            : 'border-slate-800 bg-slate-950/75 hover:border-slate-600'
                        }`}
                      >
                        <img
                          src={CHARACTER_PRESET_IMAGES[opt.id]}
                          alt={opt.label}
                          className="mx-auto h-44 w-auto object-contain"
                        />
                        <div className="mt-3">
                          <div className="text-xs font-bold text-white">{opt.label}</div>
                          <p className="mt-0.5 text-[11px] text-slate-400">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        Upload Custom 2D / 3D CEO Portrait (Optional)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Upload any studio PNG/JPG to replace the preset character render.
                      </p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-400">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Portrait Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCharacterImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {charForm.customImageUrl && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-900 p-2.5 text-xs text-emerald-300">
                      <span>Custom CEO image active</span>
                      <button
                        type="button"
                        onClick={() => setCharForm({ ...charForm, customImageUrl: '' })}
                        className="text-rose-400 underline"
                      >
                        Revert to 3D Preset
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Studio Aura Glow</label>
                    <input
                      type="color"
                      value={charForm.auraColor}
                      onChange={(e) => setCharForm({ ...charForm, auraColor: e.target.value })}
                      className="h-10 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Idle Animation</label>
                    <select
                      value={charForm.gestureAnimation}
                      onChange={(e) =>
                        setCharForm({
                          ...charForm,
                          gestureAnimation: e.target.value as CharacterConfig['gestureAnimation'],
                        })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white"
                    >
                      <option value="subtle">Subtle Executive Float</option>
                      <option value="dynamic">Dynamic Gesture</option>
                      <option value="still">Minimal / Still</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">
                      Speech Rate ({charForm.voiceRate.toFixed(2)}x)
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.25"
                      step="0.05"
                      value={charForm.voiceRate}
                      onChange={(e) =>
                        setCharForm({ ...charForm, voiceRate: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 mt-2.5"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">
                      Voice Pitch ({charForm.voicePitch.toFixed(2)})
                    </label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.25"
                      step="0.02"
                      value={charForm.voicePitch}
                      onChange={(e) =>
                        setCharForm({ ...charForm, voicePitch: parseFloat(e.target.value) })
                      }
                      className="w-full accent-cyan-400 mt-2.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-300">Card Status Badge</label>
                  <input
                    type="text"
                    value={charForm.greetingBadgeText}
                    onChange={(e) =>
                      setCharForm({ ...charForm, greetingBadgeText: e.target.value })
                    }
                    className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Character &amp; Voice Live</span>
                </button>
              </form>
            )}

            {/* 3. SERVICES FULL CRUD (CREATE + INLINE EDIT + DELETE) */}
            {activeTab === 'services' && (
              <div className="space-y-8">
                <form
                  onSubmit={handleSubmitService}
                  className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-white">
                      {editingServiceId ? 'Edit Existing Service' : 'Add New Service'}
                    </h4>
                    {editingServiceId && (
                      <button
                        type="button"
                        onClick={resetServiceForm}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <input
                      type="text"
                      required
                      placeholder="Service Title"
                      value={srvTitle}
                      onChange={(e) => setSrvTitle(e.target.value)}
                      className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={srvCat}
                      onChange={(e) => setSrvCat(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Price (e.g. From $1,800)"
                      value={srvPrice}
                      onChange={(e) => setSrvPrice(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Turnaround (e.g. 1 – 3 Weeks)"
                      value={srvTurnaround}
                      onChange={(e) => setSrvTurnaround(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Comma-separated deliverables"
                      value={srvDeliverables}
                      onChange={(e) => setSrvDeliverables(e.target.value)}
                      className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <textarea
                    rows={2}
                    required
                    placeholder="Service description..."
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-white"
                  />

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={srvFeatured}
                        onChange={(e) => setSrvFeatured(e.target.checked)}
                        className="accent-cyan-400"
                      />
                      <span>Mark as Flagship Featured Service</span>
                    </label>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950"
                    >
                      {editingServiceId ? (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Service Changes</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Add Service</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {cmsData.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div>
                        <span className="text-[11px] font-semibold uppercase text-cyan-400">
                          {s.category} • {s.priceLabel}
                        </span>
                        <h5 className="font-display text-sm font-bold text-white mt-0.5">
                          {s.title}
                        </h5>
                        <p className="mt-1 text-xs text-slate-400">{s.shortDescription}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditService(s)}
                          title="Edit Service"
                          className="rounded-lg p-2 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s.id)}
                          title="Delete Service"
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PROJECTS FULL CRUD (CREATE + INLINE EDIT + DELETE) */}
            {activeTab === 'projects' && (
              <div className="space-y-8">
                <form
                  onSubmit={handleSubmitProject}
                  className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-white">
                      {editingProjectId ? 'Edit Showcase Project' : 'Add Showcase Project'}
                    </h4>
                    {editingProjectId && (
                      <button
                        type="button"
                        onClick={resetProjectForm}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      required
                      placeholder="Project Title"
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={projSubtitle}
                      onChange={(e) => setProjSubtitle(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={projClient}
                      onChange={(e) => setProjClient(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={projYear}
                      onChange={(e) => setProjYear(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Metric Label (e.g. Conversion Lift)"
                      value={projMetricLabel}
                      onChange={(e) => setProjMetricLabel(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                    <input
                      type="text"
                      placeholder="Metric Value (e.g. +240%)"
                      value={projMetric}
                      onChange={(e) => setProjMetric(e.target.value)}
                      className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>

                  <textarea
                    rows={2}
                    required
                    placeholder="Project summary..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3.5 text-sm text-white"
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-cyan-300">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Project Cover</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Tech tags (comma-separated)"
                      value={projTags}
                      onChange={(e) => setProjTags(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950"
                    >
                      {editingProjectId ? (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Project Changes</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>Publish Project</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {cmsData.projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-16 w-24 rounded-xl object-cover"
                        />
                        <div>
                          <span className="text-[11px] font-semibold text-cyan-400">
                            {p.category} • {p.metricValue}
                          </span>
                          <h5 className="font-display text-sm font-bold text-white">{p.title}</h5>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProject(p)}
                          title="Edit Project"
                          className="rounded-lg p-2 text-slate-400 hover:bg-cyan-500/15 hover:text-cyan-300"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          title="Delete Project"
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-500/15 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. REAL-TIME LEADS & ORDERS MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-white">
                  Live Client Orders &amp; Project Inquiries ({orders.length})
                </h3>

                {orders.map((ord) => {
                  const draft = quoteDrafts[ord.id] || {
                    status: ord.status,
                    quotedAmount: ord.quotedAmount,
                    adminResponse: ord.adminResponse,
                  };
                  return (
                    <div
                      key={ord.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/75 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-display text-base font-bold text-white">
                            {ord.clientName}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              ({ord.clientEmail})
                            </span>
                          </h4>
                          <p className="text-xs text-cyan-400 font-medium mt-0.5">
                            {ord.serviceTitle} • {ord.budgetRange} • {ord.timeline}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="rounded-xl bg-slate-900 p-3.5 text-xs text-slate-300">
                        {ord.projectDetails}
                      </p>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setQuoteDrafts({
                              ...quoteDrafts,
                              [ord.id]: {
                                ...draft,
                                status: e.target.value as InquiryItem['status'],
                              },
                            })
                          }
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                        >
                          <option value="new">New Inquiry</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="quoted">Quoted</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Quoted Price (e.g. $4,500)"
                          value={draft.quotedAmount}
                          onChange={(e) =>
                            setQuoteDrafts({
                              ...quoteDrafts,
                              [ord.id]: { ...draft, quotedAmount: e.target.value },
                            })
                          }
                          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                        />

                        <button
                          type="button"
                          onClick={() => handleSaveOrderResponse(ord)}
                          className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
                        >
                          Send Quote to Client Portal
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Write executive response visible in the client's portal..."
                        value={draft.adminResponse}
                        onChange={(e) =>
                          setQuoteDrafts({
                            ...quoteDrafts,
                            [ord.id]: { ...draft, adminResponse: e.target.value },
                          })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 6. GLOBAL THEME & ATMOSPHERE */}
            {activeTab === 'theme' && (
              <form onSubmit={handleSaveTheme} className="max-w-xl space-y-5">
                <h3 className="font-display text-xl font-bold text-white">
                  Brand Palette &amp; Background Atmosphere
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Primary Accent</label>
                    <input
                      type="color"
                      value={themeForm.primaryAccent}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, primaryAccent: e.target.value })
                      }
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Secondary Accent</label>
                    <input
                      type="color"
                      value={themeForm.secondaryAccent}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, secondaryAccent: e.target.value })
                      }
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Tertiary Glow</label>
                    <input
                      type="color"
                      value={themeForm.tertiaryAccent}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, tertiaryAccent: e.target.value })
                      }
                      className="h-11 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-slate-300">
                    Starfield Particle Count ({themeForm.particleDensity})
                  </label>
                  <input
                    type="range"
                    min="80"
                    max="280"
                    value={themeForm.particleDensity}
                    onChange={(e) =>
                      setThemeForm({ ...themeForm, particleDensity: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-bold text-slate-950"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Theme Settings</span>
                </button>
              </form>
            )}

            {/* 7. REGISTERED CLIENTS */}
            {activeTab === 'clients' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-white">
                  Registered Client Accounts ({clients.length})
                </h3>
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/75 p-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{c.displayName}</p>
                      <p className="text-xs text-slate-400">
                        {c.email} • Provider: {c.authProvider}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
