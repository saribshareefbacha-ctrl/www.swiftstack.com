import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes,
  Check,
  Edit3,
  FolderKanban,
  Inbox,
  LayoutTemplate,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  UserCog,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  AvatarConfig,
  HeroCMS,
  InquiryItem,
  InquiryStatus,
  ProjectItem,
  ServiceItem,
  SiteCMSData,
  ThemeCMS,
  UserProfile,
} from '../types/cms';
import { api } from '../utils/api';
import { speechEngine } from '../utils/speechEngine';

export type AdminTabId = 'hero' | 'services' | 'projects' | 'theme' | 'avatar' | 'inquiries';

interface AdminCustomizationPanelProps {
  open: boolean;
  initialTab: AdminTabId;
  cmsData: SiteCMSData;
  inquiries: InquiryItem[];
  onClose: () => void;
  onCMSChange: (next: SiteCMSData) => void;
  onInquiriesChange: (next: InquiryItem[]) => void;
}

const THEME_PRESETS: Array<{ name: string; patch: Partial<ThemeCMS> }> = [
  {
    name: 'SwiftStack Cyan-Blue (Signature)',
    patch: {
      canvasBg: '#020617',
      primaryAccent: '#06b6d4',
      secondaryAccent: '#3b82f6',
      tertiaryAccent: '#6366f1',
    },
  },
  {
    name: 'Aurora Violet-Indigo',
    patch: {
      canvasBg: '#030712',
      primaryAccent: '#38bdf8',
      secondaryAccent: '#818cf8',
      tertiaryAccent: '#c084fc',
    },
  },
  {
    name: 'Cyber Emerald Matrix',
    patch: {
      canvasBg: '#020813',
      primaryAccent: '#10b981',
      secondaryAccent: '#06b6d4',
      tertiaryAccent: '#3b82f6',
    },
  },
  {
    name: 'Solar Cobalt Gold',
    patch: {
      canvasBg: '#040816',
      primaryAccent: '#f59e0b',
      secondaryAccent: '#06b6d4',
      tertiaryAccent: '#3b82f6',
    },
  },
];

export const AdminCustomizationPanel: React.FC<AdminCustomizationPanelProps> = ({
  open,
  initialTab,
  cmsData,
  inquiries,
  onClose,
  onCMSChange,
  onInquiriesChange,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Service Form State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deliverablesInput, setDeliverablesInput] = useState<string>('');

  // Project Form State
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [tagsInput, setTagsInput] = useState<string>('');

  // Clients Management State
  const [crmSubTab, setCrmSubTab] = useState<'leads' | 'clients'>('leads');
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (open && activeTab === 'inquiries') {
      api
        .getAllInquiries()
        .then((r) => onInquiriesChange(r.inquiries))
        .catch(() => {});
      api
        .getClients()
        .then((r) => setClients(r.clients))
        .catch(() => {});
    }
  }, [open, activeTab]);

  const flashToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 2800);
  };

  // =========================================================================
  // HERO SAVE & LIVE UPDATE
  // =========================================================================
  const updateHeroField = <K extends keyof HeroCMS>(key: K, value: HeroCMS[K]) => {
    onCMSChange({
      ...cmsData,
      hero: { ...cmsData.hero, [key]: value },
    });
  };

  const handleSaveHero = async () => {
    const res = await api.updateHero(cmsData.hero);
    onCMSChange({ ...cmsData, hero: res.hero });
    flashToast('Hero, CEO Bio & Greeting saved permanently!');
  };

  // =========================================================================
  // THEME SAVE & LIVE UPDATE
  // =========================================================================
  const updateThemeField = <K extends keyof ThemeCMS>(key: K, value: ThemeCMS[K]) => {
    onCMSChange({
      ...cmsData,
      theme: { ...cmsData.theme, [key]: value },
    });
  };

  const handleSaveTheme = async () => {
    const res = await api.updateTheme(cmsData.theme);
    onCMSChange({ ...cmsData, theme: res.theme });
    flashToast('Site Colors, Lighting Gradients & 3D Scene saved!');
  };

  // =========================================================================
  // AVATAR SAVE
  // =========================================================================
  const updateAvatarField = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    onCMSChange({
      ...cmsData,
      avatar: { ...cmsData.avatar, [key]: value },
    });
  };

  const handleSaveAvatar = async () => {
    const res = await api.updateAvatar(cmsData.avatar);
    onCMSChange({ ...cmsData, avatar: res.avatar });
    flashToast('Global 3D Avatar configuration saved!');
  };

  // =========================================================================
  // SERVICES CRUD
  // =========================================================================
  const startNewService = () => {
    const fresh: ServiceItem = {
      id: '',
      title: '',
      category: 'Frontend & 3D',
      shortDescription: '',
      deliverables: ['Custom Architecture', 'Cloud Deployment & SSL'],
      priceLabel: 'From $1,200',
      turnaround: '1 – 3 Weeks',
      iconName: 'Sparkles',
      accentHex: cmsData.theme.primaryAccent,
      featured: true,
    };
    setEditingService(fresh);
    setDeliverablesInput(fresh.deliverables.join('\n'));
  };

  const startEditService = (srv: ServiceItem) => {
    setEditingService({ ...srv });
    setDeliverablesInput(srv.deliverables.join('\n'));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const deliverables = deliverablesInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = { ...editingService, deliverables };

    if (!editingService.id) {
      const res = await api.createService(payload);
      onCMSChange({
        ...cmsData,
        services: [...cmsData.services, res.service],
      });
      flashToast('New service added to catalog!');
    } else {
      const res = await api.updateService(editingService.id, payload);
      onCMSChange({
        ...cmsData,
        services: cmsData.services.map((s) => (s.id === res.service.id ? res.service : s)),
      });
      flashToast('Service updated!');
    }
    setEditingService(null);
  };

  const handleDeleteService = async (id: string) => {
    await api.deleteService(id);
    onCMSChange({
      ...cmsData,
      services: cmsData.services.filter((s) => s.id !== id),
    });
    flashToast('Service removed.');
  };

  // =========================================================================
  // PROJECTS CRUD
  // =========================================================================
  const startNewProject = () => {
    const fresh: ProjectItem = {
      id: '',
      title: '',
      subtitle: '',
      category: '3D Web & Frontend',
      description: '',
      imageUrl: '/images/project-3d-commerce.jpg',
      tags: ['React', 'Three.js', 'Full-Stack'],
      metricLabel: 'Impact',
      metricValue: '+200% Growth',
      clientName: 'Global Client',
      year: '2026',
      liveUrl: '#contact',
      featured: true,
    };
    setEditingProject(fresh);
    setTagsInput(fresh.tags.join(', '));
  };

  const startEditProject = (proj: ProjectItem) => {
    setEditingProject({ ...proj });
    setTagsInput(proj.tags.join(', '));
  };

  const handleProjectImageUpload = (file?: File | null) => {
    if (!file || !editingProject) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingProject({ ...editingProject, imageUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    const tags = tagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = { ...editingProject, tags };

    if (!editingProject.id) {
      const res = await api.createProject(payload);
      onCMSChange({
        ...cmsData,
        projects: [...cmsData.projects, res.project],
      });
      flashToast('New project added to gallery!');
    } else {
      const res = await api.updateProject(editingProject.id, payload);
      onCMSChange({
        ...cmsData,
        projects: cmsData.projects.map((p) => (p.id === res.project.id ? res.project : p)),
      });
      flashToast('Showcase project updated!');
    }
    setEditingProject(null);
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    onCMSChange({
      ...cmsData,
      projects: cmsData.projects.filter((p) => p.id !== id),
    });
    flashToast('Project deleted.');
  };

  // =========================================================================
  // INQUIRIES & CLIENTS CRUD
  // =========================================================================
  const handleUpdateInquiry = async (inq: InquiryItem) => {
    const res = await api.updateInquiry(inq.id, inq);
    onInquiriesChange(inquiries.map((item) => (item.id === inq.id ? res.inquiry : item)));
    flashToast('Client quote & status updated!');
  };

  const handleDeleteInquiry = async (id: string) => {
    await api.deleteInquiry(id);
    onInquiriesChange(inquiries.filter((item) => item.id !== id));
    flashToast('Inquiry removed.');
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.createClient({
      displayName: newClientName,
      email: newClientEmail,
      company: newClientCompany,
    });
    setClients([res.client, ...clients]);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    flashToast('Client account registered!');
  };

  const handleDeleteClient = async (id: string) => {
    await api.deleteClient(id);
    setClients(clients.filter((c) => c.id !== id));
    flashToast('Client account deleted.');
  };

  const handleResetAll = async () => {
    const fresh = await api.resetCMS();
    onCMSChange(fresh);
    flashToast('Platform restored to factory SwiftStack defaults!');
  };

  const navTabs: Array<{
    id: AdminTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'hero', label: 'Hero & CEO Bio', icon: LayoutTemplate },
    { id: 'services', label: `Services (${cmsData.services.length})`, icon: Boxes },
    { id: 'projects', label: `Projects (${cmsData.projects.length})`, icon: FolderKanban },
    { id: 'theme', label: 'Theme & 3D FX', icon: Palette },
    { id: 'avatar', label: '3D Avatar Default', icon: UserCog },
    { id: 'inquiries', label: 'Leads & Clients', icon: Inbox, badge: inquiries.length },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex justify-end"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl h-full bg-slate-950 border-l border-white/15 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Top Command Header */}
            <div className="px-6 py-4 bg-slate-900/95 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h2 className="font-display font-bold text-lg text-white">
                    SwiftStack Owner Customization Studio
                  </h2>
                </div>
                <p className="text-xs text-slate-400">
                  Authenticated as {cmsData.hero.founderName} · Live Dynamic Full-Stack Control
                </p>
              </div>

              <div className="flex items-center gap-2">
                {statusMessage && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-xs font-medium text-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{statusMessage}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResetAll}
                  title="Restore Factory Defaults"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="px-6 py-3 bg-slate-900/60 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {navTabs.map((t) => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-cyan-400 text-slate-950 shadow'
                        : 'bg-slate-950/80 text-slate-300 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                    {t.badge !== undefined && t.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950 text-cyan-300">
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ============================================================
                  TAB 1: LIVE HERO, BRANDING, CEO BIO & GREETING SCRIPT
              ============================================================ */}
              {activeTab === 'hero' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.companyName}
                        onChange={(e) => updateHeroField('companyName', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Abbreviation
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.companyAbbreviation}
                        onChange={(e) => updateHeroField('companyAbbreviation', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Social / Channel Handle
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.socialHandle}
                        onChange={(e) => updateHeroField('socialHandle', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Owner &amp; CEO Name
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.founderName}
                        onChange={(e) => updateHeroField('founderName', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Top Status Badge Text
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.statusBadge}
                        onChange={(e) => updateHeroField('statusBadge', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Headline Prefix
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.heroHeadlinePrefix}
                        onChange={(e) => updateHeroField('heroHeadlinePrefix', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-cyan-400 mb-1">
                        Gradient Highlight Text
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.heroHeadlineHighlight}
                        onChange={(e) => updateHeroField('heroHeadlineHighlight', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-cyan-400/40 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">
                        Headline Suffix
                      </label>
                      <input
                        type="text"
                        value={cmsData.hero.heroHeadlineSuffix}
                        onChange={(e) => updateHeroField('heroHeadlineSuffix', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      Hero Subheading Overview
                    </label>
                    <textarea
                      rows={2}
                      value={cmsData.hero.heroSubheading}
                      onChange={(e) => updateHeroField('heroSubheading', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
                    <label className="block text-xs font-mono text-cyan-300 uppercase">
                      CEO Bio Card Heading &amp; Biography
                    </label>
                    <input
                      type="text"
                      value={cmsData.hero.ceoBioTitle}
                      onChange={(e) => updateHeroField('ceoBioTitle', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                    <textarea
                      rows={3}
                      value={cmsData.hero.ceoBioText}
                      onChange={(e) => updateHeroField('ceoBioText', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-400/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-cyan-300 uppercase">
                        3D Avatar Interactive Voice Greeting Script
                      </label>
                      <button
                        type="button"
                        onClick={() => speechEngine.toggleSpeak(cmsData.hero.voiceGreetingScript)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-xs font-semibold"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Preview Voice</span>
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={cmsData.hero.voiceGreetingScript}
                      onChange={(e) => updateHeroField('voiceGreetingScript', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>

                  {/* Hero Metrics CRUD */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-slate-400 uppercase">
                        Hero Key Metrics ({cmsData.hero.stats.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateHeroField('stats', [
                            ...cmsData.hero.stats,
                            { id: `stat-${Date.now()}`, value: '100%', label: 'Client Satisfaction' },
                          ])
                        }
                        className="text-xs font-semibold text-cyan-300 hover:underline"
                      >
                        + Add Metric
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cmsData.hero.stats.map((st, idx) => (
                        <div
                          key={st.id}
                          className="p-3 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={st.value}
                            onChange={(e) => {
                              const next = [...cmsData.hero.stats];
                              next[idx] = { ...st, value: e.target.value };
                              updateHeroField('stats', next);
                            }}
                            className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs font-bold text-cyan-300"
                          />
                          <input
                            type="text"
                            value={st.label}
                            onChange={(e) => {
                              const next = [...cmsData.hero.stats];
                              next[idx] = { ...st, label: e.target.value };
                              updateHeroField('stats', next);
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-white/15 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateHeroField(
                                'stats',
                                cmsData.hero.stats.filter((item) => item.id !== st.id)
                              )
                            }
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveHero}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-sm shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Hero &amp; Bio Changes</span>
                  </button>
                </div>
              )}

              {/* ============================================================
                  TAB 2: SERVICES CATALOG FULL CRUD
              ============================================================ */}
              {activeTab === 'services' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-white">
                      SwiftStack Services Catalog CRUD
                    </h3>
                    <button
                      type="button"
                      onClick={startNewService}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Service</span>
                    </button>
                  </div>

                  {editingService && (
                    <form
                      onSubmit={handleSaveService}
                      className="rounded-2xl bg-slate-900 border border-cyan-400/50 p-5 space-y-4"
                    >
                      <div className="font-display font-bold text-sm text-cyan-300">
                        {editingService.id ? 'Edit Service Offering' : 'Create New Service Offering'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          required
                          placeholder="Service Title"
                          value={editingService.title}
                          onChange={(e) =>
                            setEditingService({ ...editingService, title: e.target.value })
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                        />
                        <input
                          required
                          placeholder="Category (e.g. Frontend & 3D)"
                          value={editingService.category}
                          onChange={(e) =>
                            setEditingService({ ...editingService, category: e.target.value })
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <input
                          placeholder="Price (e.g. From $1,400)"
                          value={editingService.priceLabel}
                          onChange={(e) =>
                            setEditingService({ ...editingService, priceLabel: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          placeholder="Turnaround"
                          value={editingService.turnaround}
                          onChange={(e) =>
                            setEditingService({ ...editingService, turnaround: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <select
                          value={editingService.iconName}
                          onChange={(e) =>
                            setEditingService({ ...editingService, iconName: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        >
                          {[
                            'Boxes',
                            'Code2',
                            'Smartphone',
                            'CloudCog',
                            'Sparkles',
                            'Video',
                            'Megaphone',
                            'Cpu',
                            'Layers',
                          ].map((ic) => (
                            <option key={ic} value={ic}>
                              Icon: {ic}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-white/15">
                          <input
                            type="color"
                            value={editingService.accentHex}
                            onChange={(e) =>
                              setEditingService({ ...editingService, accentHex: e.target.value })
                            }
                            className="w-6 h-6 bg-transparent cursor-pointer"
                          />
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingService.featured}
                              onChange={(e) =>
                                setEditingService({
                                  ...editingService,
                                  featured: e.target.checked,
                                })
                              }
                            />
                            <span>Flagship</span>
                          </label>
                        </div>
                      </div>

                      <textarea
                        required
                        rows={3}
                        placeholder="Service Description"
                        value={editingService.shortDescription}
                        onChange={(e) =>
                          setEditingService({
                            ...editingService,
                            shortDescription: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                      />

                      <div>
                        <label className="block text-xs font-mono text-slate-400 mb-1">
                          Key Deliverables (One per line)
                        </label>
                        <textarea
                          rows={3}
                          value={deliverablesInput}
                          onChange={(e) => setDeliverablesInput(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingService(null)}
                          className="px-4 py-2 rounded-xl text-xs text-slate-300 border border-white/15"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950"
                        >
                          Save Service
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {cmsData.services.map((srv) => (
                      <div
                        key={srv.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: srv.accentHex }}
                            />
                            <h4 className="font-semibold text-sm text-white truncate">
                              {srv.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {srv.category} · {srv.priceLabel} · {srv.turnaround}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditService(srv)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 3: PROJECTS SHOWCASE FULL CRUD
              ============================================================ */}
              {activeTab === 'projects' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-base text-white">
                      Featured Projects Gallery CRUD
                    </h3>
                    <button
                      type="button"
                      onClick={startNewProject}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Showcase Project</span>
                    </button>
                  </div>

                  {editingProject && (
                    <form
                      onSubmit={handleSaveProject}
                      className="rounded-2xl bg-slate-900 border border-cyan-400/50 p-5 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          required
                          placeholder="Project Title"
                          value={editingProject.title}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, title: e.target.value })
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                        />
                        <input
                          required
                          placeholder="Subtitle"
                          value={editingProject.subtitle}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, subtitle: e.target.value })
                          }
                          className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <input
                          placeholder="Category"
                          value={editingProject.category}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, category: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          placeholder="Client / Channel"
                          value={editingProject.clientName}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, clientName: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          placeholder="Metric Value (e.g. +285%)"
                          value={editingProject.metricValue}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, metricValue: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          placeholder="Metric Label"
                          value={editingProject.metricLabel}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, metricLabel: e.target.value })
                          }
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <input
                          placeholder="Image URL (/images/... or https://...)"
                          value={editingProject.imageUrl}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, imageUrl: e.target.value })
                          }
                          className="sm:col-span-8 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <label className="sm:col-span-4 cursor-pointer px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Artwork</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleProjectImageUpload(e.target.files?.[0])}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <textarea
                        required
                        rows={3}
                        placeholder="Project Case Study Description"
                        value={editingProject.description}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, description: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                      />

                      <input
                        placeholder="Tech Tags (comma separated: React, Three.js, Node.js)"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="px-4 py-2 rounded-xl text-xs text-slate-300 border border-white/15"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-400 text-slate-950"
                        >
                          Save Project
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-3">
                    {cmsData.projects.map((proj) => (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={proj.imageUrl}
                            alt={proj.title}
                            className="w-16 h-12 rounded-xl object-cover shrink-0 border border-white/10"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-white truncate">
                              {proj.title}
                            </h4>
                            <p className="text-xs text-slate-400 truncate">
                              {proj.category} · {proj.metricValue} {proj.metricLabel}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEditProject(proj)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-300"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================
                  TAB 4: SITE THEME, LIGHTING GRADIENTS & 3D ENGINE
              ============================================================ */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-2.5">
                      One-Click Lighting &amp; Palette Presets
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            onCMSChange({
                              ...cmsData,
                              theme: { ...cmsData.theme, ...preset.patch },
                            })
                          }
                          className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center justify-between text-xs font-semibold text-white"
                        >
                          <span>{preset.name}</span>
                          <span className="flex items-center gap-1">
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: preset.patch.primaryAccent }}
                            />
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: preset.patch.secondaryAccent }}
                            />
                            <span
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: preset.patch.tertiaryAccent }}
                            />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Pickers */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(
                      [
                        ['canvasBg', 'Canvas Base'],
                        ['primaryAccent', 'Primary Glow'],
                        ['secondaryAccent', 'Secondary Glow'],
                        ['tertiaryAccent', 'Tertiary Glow'],
                      ] as Array<[keyof ThemeCMS, string]>
                    ).map(([key, label]) => (
                      <label
                        key={key}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 flex flex-col gap-2 cursor-pointer"
                      >
                        <span className="text-xs font-mono text-slate-400">{label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={String(cmsData.theme[key])}
                            onChange={(e) => updateThemeField(key, e.target.value)}
                            className="w-8 h-8 rounded bg-transparent cursor-pointer"
                          />
                          <span className="text-xs font-mono text-white">
                            {String(cmsData.theme[key])}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Sliders for 3D Floating Elements & Scroll Morph */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-slate-900/80 border border-white/10">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-300">Floating 3D Shapes Count</span>
                        <span className="text-cyan-300">{cmsData.theme.floatingShapeCount}</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="36"
                        step="1"
                        value={cmsData.theme.floatingShapeCount}
                        onChange={(e) =>
                          updateThemeField('floatingShapeCount', Number(e.target.value))
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-300">Starfield Particle Density</span>
                        <span className="text-cyan-300">{cmsData.theme.particleCount}</span>
                      </div>
                      <input
                        type="range"
                        min="40"
                        max="380"
                        step="10"
                        value={cmsData.theme.particleCount}
                        onChange={(e) => updateThemeField('particleCount', Number(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-300">3D Mesh Distortion</span>
                        <span className="text-cyan-300">
                          {cmsData.theme.meshDistortion.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.85"
                        step="0.02"
                        value={cmsData.theme.meshDistortion}
                        onChange={(e) =>
                          updateThemeField('meshDistortion', parseFloat(e.target.value))
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-300">Scroll Morph Velocity</span>
                        <span className="text-cyan-300">
                          {cmsData.theme.scrollMorphIntensity.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="1.8"
                        step="0.05"
                        value={cmsData.theme.scrollMorphIntensity}
                        onChange={(e) =>
                          updateThemeField('scrollMorphIntensity', parseFloat(e.target.value))
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span className="text-slate-300">Glassmorphism Panel Opacity</span>
                        <span className="text-cyan-300">
                          {Math.round(cmsData.theme.glassOpacity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.35"
                        max="0.9"
                        step="0.03"
                        value={cmsData.theme.glassOpacity}
                        onChange={(e) =>
                          updateThemeField('glassOpacity', parseFloat(e.target.value))
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        3D Floating Geometry Style
                      </label>
                      <select
                        value={cmsData.theme.floatingShapesVariant}
                        onChange={(e) =>
                          updateThemeField(
                            'floatingShapesVariant',
                            e.target.value as ThemeCMS['floatingShapesVariant']
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                      >
                        <option value="mixed-polyhedra">Mixed Polyhedra &amp; Torus</option>
                        <option value="torus-rings">Orbital Gyro Rings</option>
                        <option value="icosahedrons">Crystal Icosahedrons</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTheme}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Site Theme &amp; 3D Lighting</span>
                  </button>
                </div>
              )}

              {/* ============================================================
                  TAB 5: GLOBAL 3D AVATAR DEFAULT CONFIG
              ============================================================ */}
              {activeTab === 'avatar' && (
                <div className="space-y-5">
                  <p className="text-sm text-slate-300">
                    Configure the default 3D Avatar presentation shown to all visitors across both
                    the Hero Stage and the 3D Avatar Studio.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Default Hairstyle
                      </label>
                      <select
                        value={cmsData.avatar.hairStyle}
                        onChange={(e) =>
                          updateAvatarField(
                            'hairStyle',
                            e.target.value as AvatarConfig['hairStyle']
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      >
                        <option value="modern-quiff">Modern Textured Short Quiff</option>
                        <option value="slick-side">Executive Side-Part Pompadour</option>
                        <option value="curly-crop">Textured Curly Crop</option>
                        <option value="wavy-flow">Medium Layered Flow</option>
                        <option value="buzz-fade">Clean Taper Buzz</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Default Beard Style
                      </label>
                      <select
                        value={cmsData.avatar.beardStyle}
                        onChange={(e) =>
                          updateAvatarField(
                            'beardStyle',
                            e.target.value as AvatarConfig['beardStyle']
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      >
                        <option value="full-groomed">Groomed Full Beard &amp; Mustache</option>
                        <option value="royal-boxed">Sharp Boxed Corporate Beard</option>
                        <option value="heavy-stubble">Designer Heavy Stubble</option>
                        <option value="goatee-trim">Precision Goatee &amp; Mustache</option>
                        <option value="clean-shaven">Clean Shaven</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Default Outfit Architecture
                      </label>
                      <select
                        value={cmsData.avatar.outfitStyle}
                        onChange={(e) =>
                          updateAvatarField(
                            'outfitStyle',
                            e.target.value as AvatarConfig['outfitStyle']
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      >
                        <option value="white-polo">White Collared Polo (Red &amp; Blue Trims)</option>
                        <option value="executive-blazer">Midnight Executive Blazer</option>
                        <option value="cyber-hoodie">SwiftStack Cyber Hoodie</option>
                        <option value="henley-casual">Studio Ribbed Henley</option>
                        <option value="waistcoat-modern">Tailored Waistcoat &amp; Sleeves</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Default Eyewear
                      </label>
                      <select
                        value={cmsData.avatar.glasses}
                        onChange={(e) =>
                          updateAvatarField('glasses', e.target.value as AvatarConfig['glasses'])
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-sm text-white"
                      >
                        <option value="none">No Eyewear</option>
                        <option value="clear-tech">Clear Architect Frames</option>
                        <option value="aviator">Gold Titanium Aviators</option>
                        <option value="round-studio">Round Studio Optics</option>
                        <option value="cyber-shades">Glowing Visor Shades</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAvatar}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Global Default 3D Avatar</span>
                  </button>
                </div>
              )}

              {/* ============================================================
                  TAB 6: CLIENT LEADS, QUOTES & CLIENT MANAGEMENT
              ============================================================ */}
              {activeTab === 'inquiries' && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCrmSubTab('leads')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                        crmSubTab === 'leads'
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900 text-slate-300 border border-white/10'
                      }`}
                    >
                      Quote Inquiries ({inquiries.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCrmSubTab('clients')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                        crmSubTab === 'clients'
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900 text-slate-300 border border-white/10'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Client Accounts ({clients.length})</span>
                    </button>
                  </div>

                  {crmSubTab === 'leads' ? (
                    <div className="space-y-4">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-5 rounded-2xl bg-slate-900 border border-white/10 space-y-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="font-display font-bold text-base text-white">
                                {inq.clientName}{' '}
                                <span className="text-xs font-normal text-slate-400">
                                  ({inq.clientEmail})
                                </span>
                              </h4>
                              <p className="text-xs font-mono text-cyan-300 mt-0.5">
                                {inq.serviceTitle} · Budget: {inq.budgetRange} · {inq.timeline}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={inq.status}
                                onChange={(e) => {
                                  const updated = {
                                    ...inq,
                                    status: e.target.value as InquiryStatus,
                                  };
                                  onInquiriesChange(
                                    inquiries.map((i) => (i.id === inq.id ? updated : i))
                                  );
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs font-mono text-cyan-200"
                              >
                                <option value="new">Status: NEW</option>
                                <option value="reviewing">Status: REVIEWING</option>
                                <option value="quoted">Status: QUOTED</option>
                                <option value="in-progress">Status: IN PROGRESS</option>
                                <option value="completed">Status: COMPLETED</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-slate-300 bg-slate-950/70 p-3.5 rounded-xl border border-white/5">
                            {inq.projectDetails}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <input
                              type="text"
                              placeholder="Official Quote (e.g. $3,200 USD)"
                              value={inq.quotedAmount}
                              onChange={(e) => {
                                const updated = { ...inq, quotedAmount: e.target.value };
                                onInquiriesChange(
                                  inquiries.map((i) => (i.id === inq.id ? updated : i))
                                );
                              }}
                              className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                            />
                            <input
                              type="text"
                              placeholder="Direct response message visible in Client Portal..."
                              value={inq.adminResponse}
                              onChange={(e) => {
                                const updated = { ...inq, adminResponse: e.target.value };
                                onInquiriesChange(
                                  inquiries.map((i) => (i.id === inq.id ? updated : i))
                                );
                              }}
                              className="sm:col-span-6 px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateInquiry(inq)}
                              className="sm:col-span-2 py-2 px-3 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
                            >
                              Save Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <form
                        onSubmit={handleCreateClient}
                        className="p-4 rounded-2xl bg-slate-900 border border-white/10 grid grid-cols-1 sm:grid-cols-4 gap-3"
                      >
                        <input
                          required
                          placeholder="Client Full Name"
                          value={newClientName}
                          onChange={(e) => setNewClientName(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          required
                          type="email"
                          placeholder="Client Email"
                          value={newClientEmail}
                          onChange={(e) => setNewClientEmail(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <input
                          placeholder="Company Name"
                          value={newClientCompany}
                          onChange={(e) => setNewClientCompany(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                        />
                        <button
                          type="submit"
                          className="py-2 px-4 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs"
                        >
                          + Add Client
                        </button>
                      </form>

                      <div className="space-y-2.5">
                        {clients.map((cl) => (
                          <div
                            key={cl.id}
                            className="p-4 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between"
                          >
                            <div>
                              <div className="font-semibold text-sm text-white">
                                {cl.displayName}
                              </div>
                              <div className="text-xs text-slate-400">
                                {cl.email} · {cl.company || 'Independent'} · Auth:{' '}
                                {cl.authProvider.toUpperCase()}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(cl.id)}
                              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
