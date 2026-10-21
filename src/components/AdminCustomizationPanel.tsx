import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  Globe,
  Layers,
  MessageSquare,
  Palette,
  Plus,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  HeroCMS,
  InquiryItem,
  ProjectItem,
  ServiceItem,
  SiteBrandingMeta,
  SiteCMSData,
  SubAdminPermissions,
  ThemeCMS,
  ThemeMode,
  UserProfile,
  VoiceEngineConfig,
  VoiceGender,
} from '../types/cms';
import { api, CloudSyncState, saveThemeMode, subscribeSyncState } from '../utils/api';
import { buildGlowingFaviconDataUrl, syncDocumentBranding } from '../utils/branding';
import {
  buildPakistaniSpeechMap,
  computeCalibratedVoiceParams,
  selectPakistaniEnglishVoice,
} from '../utils/voiceEngine';

export type AdminTab =
  | 'branding'
  | 'hero'
  | 'voice'
  | 'services'
  | 'projects'
  | 'orders'
  | 'subadmins'
  | 'theme';

interface AdminCustomizationPanelProps {
  isOpen: boolean;
  initialTab?: AdminTab;
  currentUser: UserProfile;
  onClose: () => void;
  cmsData: SiteCMSData;
  orders: InquiryItem[];
  onCMSUpdated: (data: SiteCMSData) => void;
  onChangeThemeMode: (mode: ThemeMode) => void;
}

export const AdminCustomizationPanel: React.FC<AdminCustomizationPanelProps> = ({
  isOpen,
  initialTab = 'services',
  currentUser,
  onClose,
  cmsData,
  orders,
  onCMSUpdated,
  onChangeThemeMode,
}) => {
  const isMasterOwner = currentUser.role === 'owner';

  const allowedTabs = useMemo<AdminTab[]>(() => {
    if (isMasterOwner) {
      return [
        'branding',
        'hero',
        'voice',
        'services',
        'projects',
        'orders',
        'subadmins',
        'theme',
      ];
    }
    const perms = currentUser.permissions || {
      canManageServices: true,
      canManageProjects: false,
      canManageOrders: false,
    };
    const list: AdminTab[] = [];
    if (perms.canManageServices) list.push('services');
    if (perms.canManageProjects) list.push('projects');
    if (perms.canManageOrders) list.push('orders');
    return list.length > 0 ? list : ['services'];
  }, [isMasterOwner, currentUser.permissions]);

  const [activeTab, setActiveTab] = useState<AdminTab>(
    allowedTabs.includes(initialTab) ? initialTab : allowedTabs[0]
  );
  const [brandingForm, setBrandingForm] = useState<SiteBrandingMeta>(cmsData.branding);
  const [heroForm, setHeroForm] = useState<HeroCMS>(cmsData.hero);
  const [voiceForm, setVoiceForm] = useState<VoiceEngineConfig>(cmsData.voice);
  const [themeForm, setThemeForm] = useState<ThemeCMS>(cmsData.theme);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [syncStatus, setSyncStatus] = useState<CloudSyncState>('live');
  const [toast, setToast] = useState('');

  // Service Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCat, setSrvCat] = useState('Engineering');
  const [srvPrice, setSrvPrice] = useState('$1,800');
  const [srvTurnaround, setSrvTurnaround] = useState('1 – 3 Weeks');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvDeliverables, setSrvDeliverables] = useState(
    'Custom UI & Full-Stack Build, Cloud Deployment, Post-Launch Support'
  );
  const [srvFeatured, setSrvFeatured] = useState(true);

  // Project Form State
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

  // Sub-Admin Form State
  const [subName, setSubName] = useState('');
  const [subUsername, setSubUsername] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPassword, setSubPassword] = useState('');
  const [showSubPw, setShowSubPw] = useState(false);
  const [subPerms, setSubPerms] = useState<SubAdminPermissions>({
    canManageServices: true,
    canManageProjects: true,
    canManageOrders: true,
  });

  // Order Response Drafts
  const [quoteDrafts, setQuoteDrafts] = useState<
    Record<string, { status: InquiryItem['status']; quotedAmount: string; adminResponse: string }>
  >({});

  useEffect(() => {
    setActiveTab(allowedTabs.includes(initialTab) ? initialTab : allowedTabs[0]);
  }, [initialTab, isOpen, allowedTabs]);

  useEffect(() => {
    setBrandingForm(cmsData.branding);
    setHeroForm(cmsData.hero);
    setVoiceForm(cmsData.voice);
    setThemeForm(cmsData.theme);
  }, [cmsData]);

  useEffect(() => {
    const unsub = subscribeSyncState(setSyncStatus);
    return unsub;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setSystemVoices(v);
    };
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  const handleUploadDataUrl = (
    e: React.ChangeEvent<HTMLInputElement>,
    cb: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') cb(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 1. Branding & Meta Save
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner) return;
    await api.updateBranding(brandingForm);
    onCMSUpdated({ ...cmsData, branding: brandingForm });
    syncDocumentBranding(brandingForm, cmsData.theme);
    notify('Favicon, Profile Emblem & Display Meta published live!');
  };

  // 2. Site Copy & Intro Script Save
  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner) return;
    await api.updateHero(heroForm);
    onCMSUpdated({ ...cmsData, hero: heroForm });
    notify('Site texts & Executive Intro script published live!');
  };

  // 3. Pakistani English Voice Engine Save & Test
  const handleSaveVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner) return;
    await api.updateVoice(voiceForm);
    onCMSUpdated({ ...cmsData, voice: voiceForm });
    notify('Pakistani English Voice Engine settings saved live!');
  };

  const handleTestVoice = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const chosen = selectPakistaniEnglishVoice(
      systemVoices.length > 0 ? systemVoices : window.speechSynthesis.getVoices(),
      voiceForm.voiceGender,
      voiceForm.preferredVoiceURI
    );
    const map = buildPakistaniSpeechMap(
      heroForm.voiceGreeting,
      voiceForm.pakistaniAccentPhonetics,
      chosen.isNativeSouthAsian
    );
    const u = new SpeechSynthesisUtterance(map.spokenText);
    if (chosen.voice) {
      u.voice = chosen.voice;
      u.lang = chosen.voice.lang;
    } else {
      u.lang = 'en-PK';
    }
    const { rate, pitch } = computeCalibratedVoiceParams(voiceForm, chosen.matchedGender);
    u.rate = rate;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
  };

  // Services CRUD
  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitle('');
    setSrvCat('Engineering');
    setSrvPrice('$1,800');
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

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!srvTitle.trim()) return;
    const numericPrice = Number(srvPrice.replace(/[^0-9.]/g, '')) || 1000;
    const payload: Partial<ServiceItem> = {
      title: srvTitle.trim(),
      category: srvCat.trim() || 'Engineering',
      priceLabel: srvPrice.trim() || `$${numericPrice.toLocaleString()}`,
      basePriceUsd: numericPrice,
      turnaround: srvTurnaround.trim() || '1 – 2 Weeks',
      shortDescription: srvDesc.trim(),
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
      notify('Service & cart price updated live!');
    } else {
      const res = await api.createService(payload);
      onCMSUpdated({ ...cmsData, services: [...cmsData.services, res.service] });
      resetServiceForm();
      notify('New service package added to storefront!');
    }
  };

  const handleDeleteService = async (id: string) => {
    await api.deleteService(id);
    onCMSUpdated({ ...cmsData, services: cmsData.services.filter((s) => s.id !== id) });
    if (editingServiceId === id) resetServiceForm();
    notify('Service deleted.');
  };

  // Projects CRUD
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

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    const payload: Partial<ProjectItem> = {
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
      notify('Project published to gallery!');
    }
  };

  const handleDeleteProject = async (id: string) => {
    await api.deleteProject(id);
    onCMSUpdated({ ...cmsData, projects: cmsData.projects.filter((p) => p.id !== id) });
    if (editingProjectId === id) resetProjectForm();
    notify('Project deleted.');
  };

  // Sub-Admin CRUD
  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner || !subUsername.trim() || !subPassword) return;
    const res = await api.createSubAdmin({
      displayName: subName.trim() || subUsername.trim(),
      username: subUsername.trim(),
      email: subEmail.trim() || `${subUsername.trim().toLowerCase()}@swiftstack.com`,
      password: subPassword,
      permissions: subPerms,
    });
    onCMSUpdated({ ...cmsData, subAdmins: [res.subAdmin, ...cmsData.subAdmins] });
    setSubName('');
    setSubUsername('');
    setSubEmail('');
    setSubPassword('');
    notify(`Sub-Admin "${res.subAdmin.displayName}" authorized!`);
  };

  const handleToggleSubPermission = async (id: string, key: keyof SubAdminPermissions) => {
    if (!isMasterOwner) return;
    const target = cmsData.subAdmins.find((s) => s.id === id);
    if (!target) return;
    const updatedPerms: SubAdminPermissions = {
      ...target.permissions,
      [key]: !target.permissions[key],
    };
    const res = await api.updateSubAdmin(id, { permissions: updatedPerms });
    onCMSUpdated({
      ...cmsData,
      subAdmins: cmsData.subAdmins.map((s) => (s.id === id ? res.subAdmin : s)),
    });
    notify('Sub-Admin permissions updated live.');
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!isMasterOwner) return;
    await api.deleteSubAdmin(id);
    onCMSUpdated({
      ...cmsData,
      subAdmins: cmsData.subAdmins.filter((s) => s.id !== id),
    });
    notify('Sub-Admin access revoked.');
  };

  const handleSaveOrderResponse = async (item: InquiryItem) => {
    const draft = quoteDrafts[item.id] || {
      status: item.status,
      quotedAmount: item.quotedAmount,
      adminResponse: item.adminResponse,
    };
    await api.updateInquiry(item.id, draft);
    notify(`Quote & status synced live to ${item.clientName}'s Portal!`);
  };

  const handleSaveTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMasterOwner) return;
    await api.updateTheme(themeForm);
    saveThemeMode(themeForm.defaultMode);
    onChangeThemeMode(themeForm.defaultMode);
    onCMSUpdated({ ...cmsData, theme: themeForm });
    syncDocumentBranding(cmsData.branding, themeForm);
    notify('Glass Theme, Colors & Robot Canvas settings saved live!');
  };

  const handleResetDefaults = async () => {
    if (!isMasterOwner) return;
    const fresh = await api.resetCMS();
    onCMSUpdated(fresh);
    onChangeThemeMode(fresh.theme.defaultMode);
    syncDocumentBranding(fresh.branding, fresh.theme);
    notify('Restored SwiftStack V4 factory defaults.');
  };

  const allNavItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { id: 'branding', label: 'Branding, Favicon & Meta', icon: <Globe className="h-4 w-4" /> },
    { id: 'hero', label: 'Site Copy & Intro Script', icon: <FileText className="h-4 w-4" /> },
    { id: 'voice', label: 'Voice Engine (PK English)', icon: <Volume2 className="h-4 w-4" /> },
    {
      id: 'services',
      label: 'Services & Storefront',
      icon: <Layers className="h-4 w-4" />,
      badge: cmsData.services.length,
    },
    {
      id: 'projects',
      label: 'Project Galleries',
      icon: <FolderKanban className="h-4 w-4" />,
      badge: cmsData.projects.length,
    },
    {
      id: 'orders',
      label: 'Orders & Cart Leads',
      icon: <MessageSquare className="h-4 w-4" />,
      badge: orders.length,
    },
    {
      id: 'subadmins',
      label: 'Sub-Admin Portal',
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: cmsData.subAdmins.length,
    },
    { id: 'theme', label: 'Glass Theme & Robots', icon: <Palette className="h-4 w-4" /> },
  ];

  const visibleNavItems = allNavItems.filter((item) => allowedTabs.includes(item.id));

  const previewFaviconSrc =
    brandingForm.faviconUrl && brandingForm.faviconUrl.trim().length > 0
      ? brandingForm.faviconUrl
      : buildGlowingFaviconDataUrl(
          brandingForm.faviconMonogram || 'SS',
          themeForm.primaryAccent,
          themeForm.secondaryAccent
        );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 sm:p-6 backdrop-blur-md">
      <div className="ss-modal-surface relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl shadow-2xl">
        {/* Top Multi-Tier Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-400/25 px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={previewFaviconSrc}
              alt="Favicon Preview"
              className="h-10 w-10 rounded-xl object-contain shadow-sm"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold text-white">
                  {isMasterOwner
                    ? 'SwiftStack Master Owner CMS'
                    : `SwiftStack Sub-Admin Portal (${currentUser.displayName})`}
                </h2>
                <span className="keep-white-text rounded-full bg-gradient-to-r from-cyan-600 to-indigo-600 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  {isMasterOwner ? 'Master Owner' : 'Sub-Admin'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <Cloud className="h-3 w-3" />
                  <span>
                    {syncStatus === 'live'
                      ? 'Firebase Live (swiftstack-a75b2)'
                      : 'Cloud + Local Mirror'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isMasterOwner
                  ? 'Full authority over site meta, Pakistani English voice engine, services, gallery & sub-admins'
                  : 'Authorized role workspace — master branding & voice studio restricted to Owner'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {toast && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>{toast}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ss-glass-btn rounded-xl px-3.5 py-2 text-xs font-semibold"
            >
              Done / Live Site
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CMS"
              className="ss-glass-btn rounded-xl p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
          {/* Sidebar Navigation */}
          <aside className="flex lg:w-64 shrink-0 overflow-x-auto lg:flex-col gap-1.5 border-b lg:border-b-0 lg:border-r border-slate-400/25 p-3">
            {visibleNavItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active ? 'keep-white-text shadow' : 'text-slate-400 hover:bg-cyan-500/10 hover:text-white'
                  }`}
                  style={
                    active
                      ? {
                          backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryAccent}, ${cmsData.theme.secondaryAccent})`,
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {isMasterOwner && (
              <div className="mt-auto hidden lg:block pt-4 border-t border-slate-400/25">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="ss-glass-btn flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Factory Seed</span>
                </button>
              </div>
            )}
          </aside>

          {/* Main Tab Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. BRANDING, FAVICON & META */}
            {isMasterOwner && activeTab === 'branding' && (
              <form onSubmit={handleSaveBranding} className="max-w-3xl space-y-6">
                <h3 className="font-display text-xl font-bold text-white">
                  Favicon, Profile Emblem &amp; Dynamic Browser Display Meta
                </h3>

                <div className="ss-glass-card flex items-center gap-3 rounded-2xl p-4">
                  <img
                    src={previewFaviconSrc}
                    alt="Tab Icon"
                    className="h-9 w-9 shrink-0 rounded-lg object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {brandingForm.pageTitle}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {brandingForm.metaDescription}
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
                    Live Tab Preview
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      Browser Tab Display Title (`&lt;title&gt;`)
                    </label>
                    <input
                      type="text"
                      required
                      value={brandingForm.pageTitle}
                      onChange={(e) =>
                        setBrandingForm({ ...brandingForm, pageTitle: e.target.value })
                      }
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-300">
                      SEO Meta Description (`&lt;meta name="description"&gt;`)
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={brandingForm.metaDescription}
                      onChange={(e) =>
                        setBrandingForm({ ...brandingForm, metaDescription: e.target.value })
                      }
                      className="ss-glass-input w-full rounded-xl p-3.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Glowing Monogram (Default `SS`)
                      </label>
                      <input
                        type="text"
                        maxLength={3}
                        value={brandingForm.faviconMonogram}
                        onChange={(e) =>
                          setBrandingForm({ ...brandingForm, faviconMonogram: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Custom Favicon Upload
                      </label>
                      <label className="ss-glass-btn flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-cyan-400">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Favicon</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadDataUrl(e, (url) =>
                              setBrandingForm({ ...brandingForm, faviconUrl: url })
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">
                        Header Profile Emblem Upload
                      </label>
                      <label className="ss-glass-btn flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-cyan-400">
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Icon</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleUploadDataUrl(e, (url) =>
                              setBrandingForm({ ...brandingForm, profileIconUrl: url })
                            )
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span>Publish Favicon &amp; Meta Live</span>
                </button>
              </form>
            )}

            {/* 2. SITE COPY & EXECUTIVE INTRO SCRIPT */}
            {isMasterOwner && activeTab === 'hero' && (
              <form onSubmit={handleSaveHero} className="max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-white">
                    Site Copy, Founder Bio &amp; Dynamic Voice Introduction Script
                  </h3>
                  <button
                    type="submit"
                    className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                    }}
                  >
                    <Save className="h-4 w-4" />
                    <span>Publish All Copy</span>
                  </button>
                </div>

                <div className="ss-glass-card rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Brand Name</label>
                      <input
                        type="text"
                        value={heroForm.companyName}
                        onChange={(e) => setHeroForm({ ...heroForm, companyName: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
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
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Top Badge Text</label>
                      <input
                        type="text"
                        value={heroForm.badgeText}
                        onChange={(e) => setHeroForm({ ...heroForm, badgeText: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
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
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
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
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Hero Subheadline</label>
                    <textarea
                      rows={2}
                      value={heroForm.subheadline}
                      onChange={(e) => setHeroForm({ ...heroForm, subheadline: e.target.value })}
                      className="ss-glass-input w-full rounded-xl p-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Founder Name</label>
                      <input
                        type="text"
                        value={heroForm.founderName}
                        onChange={(e) => setHeroForm({ ...heroForm, founderName: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Founder Title</label>
                      <input
                        type="text"
                        value={heroForm.founderTitle}
                        onChange={(e) => setHeroForm({ ...heroForm, founderTitle: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-cyan-400">
                      Executive Voice Introduction Text (Real-Time Word Highlighting &amp; Pakistani
                      English Phonetics)
                    </label>
                    <textarea
                      rows={4}
                      value={heroForm.voiceGreeting}
                      onChange={(e) => setHeroForm({ ...heroForm, voiceGreeting: e.target.value })}
                      className="ss-glass-input w-full rounded-xl p-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Contact Email</label>
                      <input
                        type="email"
                        value={heroForm.contactEmail}
                        onChange={(e) => setHeroForm({ ...heroForm, contactEmail: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
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
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-300">Social Handle</label>
                      <input
                        type="text"
                        value={heroForm.socialHandle}
                        onChange={(e) => setHeroForm({ ...heroForm, socialHandle: e.target.value })}
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* 3. PAKISTANI ENGLISH VOICE ENGINE STUDIO */}
            {isMasterOwner && activeTab === 'voice' && (
              <form onSubmit={handleSaveVoice} className="max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Pakistani English Voice Engine &amp; Acoustic Controls
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configures default Male/Female voice selection, speech frequency, pitch, and
                      South Asian phonetic rules (e.g. soft dental &lsquo;dh&rsquo; in{' '}
                      <strong>Randhawa → Run-dhaa-waa</strong>).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestVoice}
                    className="ss-glass-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-cyan-400"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Test Voice Live</span>
                  </button>
                </div>

                <div className="ss-glass-card rounded-2xl p-6 space-y-6">
                  {/* Voice Gender Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-slate-300">
                      Voice Type (Male / Female)
                    </label>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      {(['male', 'female'] as VoiceGender[]).map((g) => {
                        const active = voiceForm.voiceGender === g;
                        return (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setVoiceForm({
                                ...voiceForm,
                                voiceGender: g,
                                preferredVoiceURI: '',
                              })
                            }
                            className={`rounded-xl py-3 text-sm font-bold capitalize transition ${
                              active ? 'keep-white-text shadow-md' : 'ss-glass-btn text-slate-300'
                            }`}
                            style={
                              active
                                ? {
                                    backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                                  }
                                : undefined
                            }
                          >
                            {g} Studio Voice
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Speech Frequency & Pitch Sliders */}
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                        <span>Speech Frequency (Rate / Cadence)</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {voiceForm.speechFrequency.toFixed(2)}x
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.65"
                        max="1.40"
                        step="0.05"
                        value={voiceForm.speechFrequency}
                        onChange={(e) =>
                          setVoiceForm({
                            ...voiceForm,
                            speechFrequency: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-300">
                        <span>Voice Pitch Fine-Tune</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {voiceForm.voicePitch.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.65"
                        max="1.35"
                        step="0.02"
                        value={voiceForm.voicePitch}
                        onChange={(e) =>
                          setVoiceForm({
                            ...voiceForm,
                            voicePitch: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Optional Specific System Voice Override */}
                  {systemVoices.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-slate-300">
                        System Voice Engine Override (Auto-selects Pakistani / South Asian English by
                        default)
                      </label>
                      <select
                        value={voiceForm.preferredVoiceURI}
                        onChange={(e) =>
                          setVoiceForm({ ...voiceForm, preferredVoiceURI: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-xs"
                      >
                        <option value="">
                          Auto — Best Pakistani / South Asian English ({voiceForm.voiceGender})
                        </option>
                        {systemVoices
                          .filter((v) => /^en/i.test(v.lang))
                          .map((v) => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                              {v.name} ({v.lang})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Phonetic Lexicon Toggle */}
                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-300">
                    <input
                      type="checkbox"
                      checked={voiceForm.pakistaniAccentPhonetics}
                      onChange={(e) =>
                        setVoiceForm({
                          ...voiceForm,
                          pakistaniAccentPhonetics: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded accent-cyan-500"
                    />
                    <span>
                      Enable Pakistani English Phonetic Pronunciation Rules (Soft dental &lsquo;dh&rsquo;
                      for Randhawa, Sarib, Muhammad)
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Global Voice Settings</span>
                </button>
              </form>
            )}

            {/* 4. SERVICES & SHOPPING PORTAL CRUD */}
            {activeTab === 'services' && (
              <div className="space-y-8">
                <form
                  onSubmit={handleSubmitService}
                  className="ss-glass-card rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-white">
                      {editingServiceId
                        ? 'Edit Storefront Service Package'
                        : 'Add Service Package & Cart Price'}
                    </h4>
                    {editingServiceId && (
                      <button
                        type="button"
                        onClick={resetServiceForm}
                        className="text-xs text-slate-400 hover:underline"
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
                      className="ss-glass-input sm:col-span-2 rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Category (e.g. Engineering)"
                      value={srvCat}
                      onChange={(e) => setSrvCat(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Price (e.g. $1,800)"
                      value={srvPrice}
                      onChange={(e) => setSrvPrice(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Turnaround (e.g. 1 – 3 Weeks)"
                      value={srvTurnaround}
                      onChange={(e) => setSrvTurnaround(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Comma-separated deliverables"
                      value={srvDeliverables}
                      onChange={(e) => setSrvDeliverables(e.target.value)}
                      className="ss-glass-input sm:col-span-2 rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <textarea
                    rows={2}
                    required
                    placeholder="Service description..."
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    className="ss-glass-input w-full rounded-xl p-3.5 text-sm"
                  />

                  <div className="flex items-center justify-between">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={srvFeatured}
                        onChange={(e) => setSrvFeatured(e.target.checked)}
                        className="accent-cyan-500"
                      />
                      <span>Mark as Flagship Featured Service</span>
                    </label>

                    <button
                      type="submit"
                      className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                      }}
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
                      className="ss-glass-card flex items-start justify-between gap-4 rounded-2xl p-4"
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
                          className="ss-glass-btn rounded-lg p-2"
                        >
                          <Edit3 className="h-4 w-4 text-cyan-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(s.id)}
                          title="Delete Service"
                          className="ss-glass-btn rounded-lg p-2"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. PROJECT GALLERIES CRUD */}
            {activeTab === 'projects' && (
              <div className="space-y-8">
                <form
                  onSubmit={handleSubmitProject}
                  className="ss-glass-card rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-display text-base font-bold text-white">
                      {editingProjectId ? 'Edit Gallery Project' : 'Add Gallery Project'}
                    </h4>
                    {editingProjectId && (
                      <button
                        type="button"
                        onClick={resetProjectForm}
                        className="text-xs text-slate-400 hover:underline"
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
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Subtitle"
                      value={projSubtitle}
                      onChange={(e) => setProjSubtitle(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <input
                      type="text"
                      placeholder="Client Name"
                      value={projClient}
                      onChange={(e) => setProjClient(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Year"
                      value={projYear}
                      onChange={(e) => setProjYear(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Metric Label"
                      value={projMetricLabel}
                      onChange={(e) => setProjMetricLabel(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Metric Value (e.g. +240%)"
                      value={projMetric}
                      onChange={(e) => setProjMetric(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <textarea
                    rows={2}
                    required
                    placeholder="Project summary..."
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="ss-glass-input w-full rounded-xl p-3.5 text-sm"
                  />

                  <div className="flex flex-wrap items-center gap-4">
                    <label className="ss-glass-btn inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-cyan-400">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload Project Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadDataUrl(e, setProjImage)}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Tech tags (comma-separated)"
                      value={projTags}
                      onChange={(e) => setProjTags(e.target.value)}
                      className="ss-glass-input flex-1 rounded-xl px-3.5 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                      }}
                    >
                      {editingProjectId ? (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Project</span>
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
                      className="ss-glass-card flex items-center justify-between gap-4 rounded-2xl p-4"
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
                          className="ss-glass-btn rounded-lg p-2"
                        >
                          <Edit3 className="h-4 w-4 text-cyan-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(p.id)}
                          title="Delete Project"
                          className="ss-glass-btn rounded-lg p-2"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. ORDERS & CART LEADS */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <h3 className="font-display text-xl font-bold text-white">
                  Live Client Orders &amp; Cart Checkouts ({orders.length})
                </h3>

                {orders.map((ord) => {
                  const draft = quoteDrafts[ord.id] || {
                    status: ord.status,
                    quotedAmount: ord.quotedAmount,
                    adminResponse: ord.adminResponse,
                  };
                  return (
                    <div key={ord.id} className="ss-glass-card rounded-2xl p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className="font-display text-base font-bold text-white">
                            {ord.clientName}{' '}
                            <span className="text-xs font-normal text-slate-400">
                              ({ord.clientEmail})
                            </span>
                          </h4>
                          <p className="text-xs text-cyan-400 font-semibold mt-0.5">
                            {ord.serviceTitle} • {ord.budgetRange} • {ord.timeline}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => api.deleteInquiry(ord.id)}
                          className="ss-glass-btn rounded-lg p-1.5"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </button>
                      </div>

                      <p className="ss-glass-card rounded-xl p-3.5 text-xs text-slate-300">
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
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="new">New Order / Lead</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="quoted">Quoted</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Quoted Price (e.g. $3,500)"
                          value={draft.quotedAmount}
                          onChange={(e) =>
                            setQuoteDrafts({
                              ...quoteDrafts,
                              [ord.id]: { ...draft, quotedAmount: e.target.value },
                            })
                          }
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />

                        <button
                          type="button"
                          onClick={() => handleSaveOrderResponse(ord)}
                          className="keep-white-text ss-cta-btn rounded-xl px-4 py-2 text-xs font-bold"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                          }}
                        >
                          Sync Quote to Client Portal
                        </button>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Write executive response synced live to client portal..."
                        value={draft.adminResponse}
                        onChange={(e) =>
                          setQuoteDrafts({
                            ...quoteDrafts,
                            [ord.id]: { ...draft, adminResponse: e.target.value },
                          })
                        }
                        className="ss-glass-input w-full rounded-xl p-3 text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* 7. SUB-ADMIN AUTHORIZATION PORTAL (MASTER OWNER ONLY) */}
            {isMasterOwner && activeTab === 'subadmins' && (
              <div className="max-w-4xl space-y-6">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Sub-Admin Role Authorization Portal
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Assign granular permissions for team members while keeping Master Branding,
                    Voice Engine, and Theme settings strictly exclusive to Muhammad Sarib Randhawa.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateSubAdmin}
                  className="ss-glass-card rounded-2xl p-5 space-y-4"
                >
                  <h4 className="font-display text-sm font-bold text-white">
                    Create Sub-Admin Account
                  </h4>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="text"
                      required
                      placeholder="Display Name"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-xs"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={subUsername}
                      onChange={(e) => setSubUsername(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-xs"
                    />
                    <input
                      type="email"
                      placeholder="Google / Work Email"
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      className="ss-glass-input rounded-xl px-3.5 py-2.5 text-xs"
                    />
                    <div className="relative">
                      <input
                        type={showSubPw ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={subPassword}
                        onChange={(e) => setSubPassword(e.target.value)}
                        className="ss-glass-input w-full rounded-xl py-2.5 pl-3.5 pr-9 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSubPw((prev) => !prev)}
                        aria-label="Toggle Sub-Admin Password"
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-cyan-400"
                      >
                        {showSubPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subPerms.canManageServices}
                          onChange={(e) =>
                            setSubPerms({ ...subPerms, canManageServices: e.target.checked })
                          }
                          className="accent-cyan-500"
                        />
                        <span>Manage Services &amp; Prices</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subPerms.canManageProjects}
                          onChange={(e) =>
                            setSubPerms({ ...subPerms, canManageProjects: e.target.checked })
                          }
                          className="accent-cyan-500"
                        />
                        <span>Manage Project Gallery</span>
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subPerms.canManageOrders}
                          onChange={(e) =>
                            setSubPerms({ ...subPerms, canManageOrders: e.target.checked })
                          }
                          className="accent-cyan-500"
                        />
                        <span>Manage Orders &amp; Leads</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Authorize Sub-Admin</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {cmsData.subAdmins.map((sa) => (
                    <div
                      key={sa.id}
                      className="ss-glass-card flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4"
                    >
                      <div>
                        <p className="text-sm font-bold text-white">{sa.displayName}</p>
                        <p className="text-xs text-slate-400">
                          Username: <strong className="text-cyan-400">{sa.username}</strong> • Email:{' '}
                          {sa.email}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleSubPermission(sa.id, 'canManageServices')}
                          className={`rounded-lg border px-2.5 py-1 font-semibold ${
                            sa.permissions.canManageServices
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              : 'border-slate-400/30 text-slate-400'
                          }`}
                        >
                          Services
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSubPermission(sa.id, 'canManageProjects')}
                          className={`rounded-lg border px-2.5 py-1 font-semibold ${
                            sa.permissions.canManageProjects
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              : 'border-slate-400/30 text-slate-400'
                          }`}
                        >
                          Projects
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSubPermission(sa.id, 'canManageOrders')}
                          className={`rounded-lg border px-2.5 py-1 font-semibold ${
                            sa.permissions.canManageOrders
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                              : 'border-slate-400/30 text-slate-400'
                          }`}
                        >
                          Orders
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubAdmin(sa.id)}
                          className="ss-glass-btn rounded-lg p-2"
                        >
                          <Trash2 className="h-4 w-4 text-rose-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. PURE GLASS THEME & BACKGROUND ROBOT ANIMATION CONTROLS */}
            {isMasterOwner && activeTab === 'theme' && (
              <form onSubmit={handleSaveTheme} className="max-w-2xl space-y-6">
                <h3 className="font-display text-xl font-bold text-white">
                  True Glass Theme, Brand Colors &amp; Background Robot Canvas
                </h3>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-300">
                    Default Theme Mode for Visitors
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { id: 'glass', label: 'Pure Frosted Glass (Default)' },
                        { id: 'dark', label: 'Dark Obsidian Glass' },
                        { id: 'cyber', label: 'Cyber Neon Glass' },
                      ] as { id: ThemeMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setThemeForm({ ...themeForm, defaultMode: m.id });
                          onChangeThemeMode(m.id);
                        }}
                        className={`rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                          themeForm.defaultMode === m.id
                            ? 'keep-white-text shadow'
                            : 'ss-glass-btn text-slate-300'
                        }`}
                        style={
                          themeForm.defaultMode === m.id
                            ? {
                                backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                              }
                            : undefined
                        }
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Primary Accent</label>
                    <input
                      type="color"
                      value={themeForm.primaryAccent}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, primaryAccent: e.target.value })
                      }
                      className="h-11 w-full cursor-pointer rounded-xl ss-glass-input p-1"
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
                      className="h-11 w-full cursor-pointer rounded-xl ss-glass-input p-1"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-300">Ripple Glow</label>
                    <input
                      type="color"
                      value={themeForm.tertiaryAccent}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, tertiaryAccent: e.target.value })
                      }
                      className="h-11 w-full cursor-pointer rounded-xl ss-glass-input p-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>Autonomous Micro-Robot Count</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {themeForm.robotDensity}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="16"
                      step="1"
                      value={themeForm.robotDensity}
                      onChange={(e) =>
                        setThemeForm({ ...themeForm, robotDensity: parseInt(e.target.value, 10) })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-300">
                      <span>Finger-Touch Ripple Radius</span>
                      <span className="font-mono font-bold text-cyan-400">
                        {themeForm.rippleIntensity.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.5"
                      step="0.05"
                      value={themeForm.rippleIntensity}
                      onChange={(e) =>
                        setThemeForm({
                          ...themeForm,
                          rippleIntensity: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${themeForm.primaryAccent}, ${themeForm.secondaryAccent})`,
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span>Save Theme &amp; Robot Canvas Settings</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
