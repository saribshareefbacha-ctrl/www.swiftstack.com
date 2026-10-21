import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Check,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  FolderKanban,
  Gauge,
  Globe,
  Inbox,
  KeyRound,
  Layout,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  HeroCMS,
  InquiryItem,
  InquiryStatus,
  ProjectItem,
  ServiceItem,
  SiteBrandingMeta,
  SiteCMSData,
  SubAdminAccount,
  SubAdminPermissions,
  ThemeCMS,
  ThemeMode,
  UserProfile,
  VoiceEngineConfig,
  VoiceGender,
} from '../types/cms';
import { api } from '../utils/api';
import {
  buildPakistaniSpeechMap,
  computeCalibratedVoiceParams,
  computeCalibratedWordDelays,
  selectPakistaniEnglishVoice,
} from '../utils/voiceEngine';
import { GlassSpinner, pushToast } from './GlassUI';

interface AdminCustomizationPanelProps {
  isOpen: boolean;
  currentUser: UserProfile;
  cmsData: SiteCMSData;
  inquiries: InquiryItem[];
  onClose: () => void;
  onRefreshCMS: () => Promise<void>;
}

type AdminTab = 'voice' | 'services' | 'projects' | 'orders' | 'branding' | 'team';

const ICON_OPTIONS = [
  'Code2',
  'Box',
  'Bot',
  'Feather',
  'Palette',
  'Cloud',
  'Sparkles',
  'Globe',
  'Cpu',
  'Layers',
  'Shield',
  'Smartphone',
  'Terminal',
  'Zap',
];

export const AdminCustomizationPanel: React.FC<AdminCustomizationPanelProps> = ({
  isOpen,
  currentUser,
  cmsData,
  inquiries,
  onClose,
  onRefreshCMS,
}) => {
  const isOwner = currentUser.role === 'owner';
  const perms: SubAdminPermissions = useMemo(
    () =>
      isOwner
        ? {
            canEditHero: true,
            canManageServices: true,
            canManageProjects: true,
            canManageTheme: true,
            canManageOrders: true,
          }
        : currentUser.permissions || {
            canEditHero: true,
            canManageServices: true,
            canManageProjects: true,
            canManageTheme: false,
            canManageOrders: true,
          },
    [currentUser.permissions, isOwner]
  );

  const allowedTabs = useMemo(() => {
    const list: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];
    if (isOwner || perms.canEditHero) {
      list.push({ id: 'voice', label: 'Voice & Speed Sync', icon: Volume2 });
    }
    if (isOwner || perms.canManageServices) {
      list.push({ id: 'services', label: 'Services & Categories', icon: Briefcase });
    }
    if (isOwner || perms.canManageProjects) {
      list.push({ id: 'projects', label: 'Portfolio Gallery', icon: FolderKanban });
    }
    if (isOwner || perms.canManageOrders) {
      list.push({ id: 'orders', label: `Orders (${inquiries.length})`, icon: Inbox });
    }
    if (isOwner || perms.canEditHero || perms.canManageTheme) {
      list.push({ id: 'branding', label: 'Branding, Hero & Theme', icon: Palette });
    }
    if (isOwner) {
      list.push({ id: 'team', label: 'Sub-Admins & Clients', icon: KeyRound });
    }
    return list;
  }, [inquiries.length, isOwner, perms]);

  const [activeTab, setActiveTab] = useState<AdminTab>(allowedTabs[0]?.id || 'voice');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Voice & Highlight Speed State
  const [voiceDraft, setVoiceDraft] = useState<VoiceEngineConfig>(cmsData.voice);
  const [introScriptDraft, setIntroScriptDraft] = useState<string>(cmsData.hero.introSpeechText);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewWordIdx, setPreviewWordIdx] = useState(-1);
  const previewTimerRef = useRef<number | null>(null);

  // Branding, Hero & Theme State
  const [brandingDraft, setBrandingDraft] = useState<SiteBrandingMeta>(cmsData.branding);
  const [heroDraft, setHeroDraft] = useState<HeroCMS>(cmsData.hero);
  const [themeDraft, setThemeDraft] = useState<ThemeCMS>(cmsData.theme);

  // Services CRUD State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [srvTitle, setSrvTitle] = useState('');
  const [srvCategory, setSrvCategory] = useState('Engineering');
  const [srvPriceLabel, setSrvPriceLabel] = useState('From $1,500');
  const [srvBasePrice, setSrvBasePrice] = useState<number>(1500);
  const [srvTurnaround, setSrvTurnaround] = useState('1 – 3 Weeks');
  const [srvDesc, setSrvDesc] = useState('');
  const [srvDeliverables, setSrvDeliverables] = useState('');
  const [srvIcon, setSrvIcon] = useState('Sparkles');
  const [srvAccent, setSrvAccent] = useState('#38bdf8');
  const [srvFeatured, setSrvFeatured] = useState(true);

  // Projects CRUD State
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projSubtitle, setProjSubtitle] = useState('');
  const [projCategory, setProjCategory] = useState('Web & Full-Stack');
  const [projImageUrl, setProjImageUrl] = useState('./images/project-3d-commerce.jpg');
  const [projDesc, setProjDesc] = useState('');
  const [projTags, setProjTags] = useState('React, TypeScript, Firebase');
  const [projMetricLabel, setProjMetricLabel] = useState('Impact');
  const [projMetricValue, setProjMetricValue] = useState('+65% Growth');
  const [projClient, setProjClient] = useState('SwiftStack Partner');
  const [projYear, setProjYear] = useState('2026');
  const [projLiveUrl, setProjLiveUrl] = useState('');

  // Orders & Quotes State
  const [orderEdits, setOrderEdits] = useState<
    Record<string, { status: InquiryStatus; quotedAmount: string; adminResponse: string }>
  >({});

  // Sub-Admin Creation & Clients List State
  const [subName, setSubName] = useState('');
  const [subUsername, setSubUsername] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPassword, setSubPassword] = useState('');
  const [showSubPassword, setShowSubPassword] = useState(false);
  const [subPerms, setSubPerms] = useState<SubAdminPermissions>({
    canEditHero: true,
    canManageServices: true,
    canManageProjects: true,
    canManageTheme: false,
    canManageOrders: true,
  });
  const [visibleSubPwMap, setVisibleSubPwMap] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<UserProfile[]>([]);

  useEffect(() => {
    setVoiceDraft(cmsData.voice);
    setIntroScriptDraft(cmsData.hero.introSpeechText);
    setBrandingDraft(cmsData.branding);
    setHeroDraft(cmsData.hero);
    setThemeDraft(cmsData.theme);
  }, [cmsData]);

  useEffect(() => {
    const map: Record<
      string,
      { status: InquiryStatus; quotedAmount: string; adminResponse: string }
    > = {};
    inquiries.forEach((inq) => {
      map[inq.id] = {
        status: inq.status,
        quotedAmount: inq.quotedAmount || '',
        adminResponse: inq.adminResponse || '',
      };
    });
    setOrderEdits(map);
  }, [inquiries]);

  useEffect(() => {
    if (isOpen && isOwner) {
      api.getClients().then((r) => setClients(r.clients)).catch(() => {});
    }
  }, [isOpen, isOwner]);

  useEffect(() => {
    return () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const existingCategories = Array.from(
    new Set(['Engineering', 'AI & Automation', 'Creative Studio', ...cmsData.services.map((s) => s.category)])
  );

  const wpmValue = Math.round(60000 / Math.max(180, voiceDraft.highlightDelayMs || 460));

  const stopVoicePreview = () => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPreviewPlaying(false);
    setPreviewWordIdx(-1);
  };

  const handleTestVoiceCalibration = () => {
    if (previewPlaying) {
      stopVoicePreview();
      return;
    }

    const voices =
      typeof window !== 'undefined' && 'speechSynthesis' in window
        ? window.speechSynthesis.getVoices()
        : [];
    const chosen = selectPakistaniEnglishVoice(
      voices,
      voiceDraft.voiceGender,
      voiceDraft.preferredVoiceURI
    );
    const map = buildPakistaniSpeechMap(
      introScriptDraft,
      voiceDraft.pakistaniAccentPhonetics,
      chosen.isNativeSouthAsian
    );
    if (!map.rawWords.length) return;

    const delays = computeCalibratedWordDelays(
      map.rawWords,
      voiceDraft.highlightDelayMs,
      voiceDraft.speechFrequency
    );

    const stepWord = (idx: number) => {
      if (idx >= map.rawWords.length) {
        setPreviewPlaying(false);
        setPreviewWordIdx(-1);
        return;
      }
      setPreviewWordIdx(idx);
      previewTimerRef.current = window.setTimeout(() => {
        stepWord(idx + 1);
      }, delays[idx] ?? voiceDraft.highlightDelayMs);
    };

    setPreviewPlaying(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(map.spokenText);
      const { rate, pitch } = computeCalibratedVoiceParams(voiceDraft, chosen.matchedGender);
      if (chosen.voice) {
        utt.voice = chosen.voice;
        utt.lang = chosen.voice.lang || 'en-PK';
      } else {
        utt.lang = 'en-PK';
      }
      utt.rate = rate;
      utt.pitch = pitch;
      utt.onend = () => stopVoicePreview();
      utt.onerror = () => stopVoicePreview();
      window.speechSynthesis.speak(utt);
    }

    previewTimerRef.current = window.setTimeout(() => stepWord(0), 120);
  };

  const handleSaveVoiceAndSpeed = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-voice');
    try {
      await api.updateVoice(voiceDraft);
      if (introScriptDraft !== cmsData.hero.introSpeechText) {
        await api.updateHero({ ...heroDraft, introSpeechText: introScriptDraft });
      }
      await onRefreshCMS();
      pushToast(
        'Voice & Speed Calibration Saved!',
        `Synced at ${voiceDraft.highlightDelayMs}ms/word (~${wpmValue} WPM).`,
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setSrvTitle('');
    setSrvCategory('Engineering');
    setSrvPriceLabel('From $1,500');
    setSrvBasePrice(1500);
    setSrvTurnaround('1 – 3 Weeks');
    setSrvDesc('');
    setSrvDeliverables('');
    setSrvIcon('Sparkles');
    setSrvAccent('#38bdf8');
    setSrvFeatured(true);
  };

  const loadServiceIntoForm = (s: ServiceItem) => {
    setEditingServiceId(s.id);
    setSrvTitle(s.title);
    setSrvCategory(s.category);
    setSrvPriceLabel(s.priceLabel);
    setSrvBasePrice(s.basePriceUsd);
    setSrvTurnaround(s.turnaround);
    setSrvDesc(s.shortDescription);
    setSrvDeliverables((s.deliverables || []).join('\n'));
    setSrvIcon(s.iconName || 'Sparkles');
    setSrvAccent(s.accentHex || '#38bdf8');
    setSrvFeatured(Boolean(s.featured));
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-service');
    try {
      const payload: Partial<ServiceItem> = {
        title: srvTitle.trim(),
        category: srvCategory.trim() || 'Engineering',
        priceLabel: srvPriceLabel.trim(),
        basePriceUsd: Number(srvBasePrice) || 1000,
        turnaround: srvTurnaround.trim(),
        shortDescription: srvDesc.trim(),
        deliverables: srvDeliverables
          .split('\n')
          .map((d) => d.trim())
          .filter(Boolean),
        iconName: srvIcon,
        accentHex: srvAccent,
        featured: srvFeatured,
      };
      if (editingServiceId) {
        await api.updateService(editingServiceId, payload);
        pushToast('Service Updated', `"${payload.title}" updated across the catalog.`, 'success');
      } else {
        await api.createService(payload);
        pushToast('Service Published', `"${payload.title}" added to catalog.`, 'success');
      }
      resetServiceForm();
      await onRefreshCMS();
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteService = async (s: ServiceItem) => {
    setBusyKey(`del-srv-${s.id}`);
    try {
      await api.deleteService(s.id);
      if (editingServiceId === s.id) resetServiceForm();
      await onRefreshCMS();
      pushToast('Service Removed', `"${s.title}" deleted from catalog.`, 'info');
    } finally {
      setBusyKey(null);
    }
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjTitle('');
    setProjSubtitle('');
    setProjCategory('Web & Full-Stack');
    setProjImageUrl('./images/project-3d-commerce.jpg');
    setProjDesc('');
    setProjTags('React, TypeScript, Firebase');
    setProjMetricLabel('Impact');
    setProjMetricValue('+65% Growth');
    setProjClient('SwiftStack Partner');
    setProjYear('2026');
    setProjLiveUrl('');
  };

  const loadProjectIntoForm = (p: ProjectItem) => {
    setEditingProjectId(p.id);
    setProjTitle(p.title);
    setProjSubtitle(p.subtitle);
    setProjCategory(p.category);
    setProjImageUrl(p.imageUrl);
    setProjDesc(p.description);
    setProjTags((p.tags || []).join(', '));
    setProjMetricLabel(p.metricLabel);
    setProjMetricValue(p.metricValue);
    setProjClient(p.clientName);
    setProjYear(p.year);
    setProjLiveUrl(p.liveUrl);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-project');
    try {
      const payload: Partial<ProjectItem> = {
        title: projTitle.trim(),
        subtitle: projSubtitle.trim(),
        category: projCategory.trim(),
        imageUrl: projImageUrl.trim(),
        description: projDesc.trim(),
        tags: projTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        metricLabel: projMetricLabel.trim(),
        metricValue: projMetricValue.trim(),
        clientName: projClient.trim(),
        year: projYear.trim(),
        liveUrl: projLiveUrl.trim(),
        featured: true,
      };
      if (editingProjectId) {
        await api.updateProject(editingProjectId, payload);
        pushToast('Project Updated', `"${payload.title}" updated in portfolio.`, 'success');
      } else {
        await api.createProject(payload);
        pushToast('Project Published', `"${payload.title}" added to portfolio.`, 'success');
      }
      resetProjectForm();
      await onRefreshCMS();
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteProject = async (p: ProjectItem) => {
    setBusyKey(`del-proj-${p.id}`);
    try {
      await api.deleteProject(p.id);
      if (editingProjectId === p.id) resetProjectForm();
      await onRefreshCMS();
      pushToast('Project Deleted', `"${p.title}" removed from showcase.`, 'info');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveOrderUpdate = async (inq: InquiryItem) => {
    const draft = orderEdits[inq.id];
    if (!draft) return;
    setBusyKey(`order-${inq.id}`);
    try {
      await api.updateInquiry(inq.id, draft);
      pushToast(
        'Order Status Updated',
        `Updated #${inq.id.slice(0, 8)} (${inq.clientName}) to ${draft.status}.`,
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteOrder = async (inq: InquiryItem) => {
    setBusyKey(`del-order-${inq.id}`);
    try {
      await api.deleteInquiry(inq.id);
      pushToast('Order Archived', `Removed inquiry #${inq.id.slice(0, 8)}.`, 'info');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSaveBrandingAndHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-branding');
    try {
      if (isOwner) {
        await api.updateBranding(brandingDraft);
      }
      if (isOwner || perms.canEditHero) {
        await api.updateHero(heroDraft);
      }
      if (isOwner || perms.canManageTheme) {
        await api.updateTheme(themeDraft);
      }
      await onRefreshCMS();
      pushToast(
        'Site Metadata, Hero & Theme Saved!',
        'Changes synced live across Firebase & SwiftStack.',
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleResetFactoryDefaults = async () => {
    setBusyKey('reset-cms');
    try {
      await api.resetCMS();
      await onRefreshCMS();
      pushToast('Factory Defaults Restored', 'SwiftStack V5 CMS defaults restored.', 'info');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setBusyKey('create-sub');
    try {
      await api.createSubAdmin({
        displayName: subName,
        username: subUsername,
        email: subEmail,
        password: subPassword,
        permissions: subPerms,
      });
      setSubName('');
      setSubUsername('');
      setSubEmail('');
      setSubPassword('');
      await onRefreshCMS();
      pushToast('Sub-Admin Created!', `Granted delegated portal access to ${subName}.`, 'success');
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleSubPerm = async (
    sa: SubAdminAccount,
    key: keyof SubAdminPermissions
  ) => {
    if (!isOwner) return;
    const updatedPerms: SubAdminPermissions = {
      ...sa.permissions,
      [key]: !sa.permissions[key],
    };
    await api.updateSubAdmin(sa.id, { permissions: updatedPerms });
    await onRefreshCMS();
    pushToast('Permissions Updated', `Updated ${sa.displayName}'s access boundary.`, 'success');
  };

  const handleToggleSubActive = async (sa: SubAdminAccount) => {
    if (!isOwner) return;
    await api.updateSubAdmin(sa.id, { active: !sa.active });
    await onRefreshCMS();
    pushToast(
      sa.active ? 'Sub-Admin Suspended' : 'Sub-Admin Re-Activated',
      `${sa.displayName} is now ${sa.active ? 'suspended' : 'active'}.`,
      'info'
    );
  };

  const handleDeleteSubAdmin = async (sa: SubAdminAccount) => {
    if (!isOwner) return;
    await api.deleteSubAdmin(sa.id);
    await onRefreshCMS();
    pushToast('Sub-Admin Removed', `Revoked ${sa.displayName}.`, 'info');
  };

  const previewWords = useMemo(
    () => introScriptDraft.trim().split(/\s+/).filter(Boolean),
    [introScriptDraft]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/65 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="SwiftStack Owner & Sub-Admin CMS Dashboard"
    >
      <div className="ss-modal-surface relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden max-h-[93vh] flex flex-col">
        {/* Top Command Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/15 bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="keep-white-text w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
              }}
            >
              {isOwner ? <Crown className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  {isOwner
                    ? 'SwiftStack Master Owner Dashboard'
                    : 'SwiftStack Sub-Admin Portal'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {isOwner ? 'FULL MASTER AUTHORITY' : 'SCOPED PERMISSIONS'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Signed in as <strong className="text-white">{currentUser.displayName}</strong> (
                {currentUser.email})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopVoicePreview();
              onClose();
            }}
            aria-label="Close dashboard"
            className="ss-glass-btn p-2 rounded-xl text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-white/15 bg-white/[0.03] overflow-x-auto shrink-0">
          {allowedTabs.map((t) => {
            const Icon = t.icon;
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selected
                    ? 'keep-white-text text-white shadow-md'
                    : 'ss-glass-btn text-slate-300 hover:text-white'
                }`}
                style={
                  selected
                    ? {
                        backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
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

        {/* Scrollable Content Workspace */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ==============================================================
              TAB 1: VOICE ENGINE & WORD HIGHLIGHT SPEED CALIBRATION
             ============================================================== */}
          {activeTab === 'voice' && (
            <form onSubmit={handleSaveVoiceAndSpeed} className="space-y-6">
              <div className="ss-glass-card rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-cyan-400" />
                      <span>Word Highlighting Speed &amp; Delay Calibration</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Adjust exact word-by-word highlight cadence (in milliseconds per word &amp; WPM)
                      so visual word glowing never rushes ahead of spoken audio.
                    </p>
                  </div>

                  {/* Quick Speed Calibration Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: 'Relaxed (580ms)', ms: 580 },
                      { label: 'Natural Sync (460ms)', ms: 460 },
                      { label: 'Crisp (360ms)', ms: 360 },
                    ].map((preset) => (
                      <button
                        key={preset.ms}
                        type="button"
                        onClick={() =>
                          setVoiceDraft((prev) => ({ ...prev, highlightDelayMs: preset.ms }))
                        }
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold transition ${
                          voiceDraft.highlightDelayMs === preset.ms
                            ? 'keep-white-text bg-cyan-500 text-white'
                            : 'ss-glass-btn text-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dual Coupled Sliders: Delay (ms / word) + Words Per Minute (WPM) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="ss-glass-card rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Word Highlight Delay (ms / word)
                      </label>
                      <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 font-mono text-xs font-extrabold text-cyan-300">
                        {voiceDraft.highlightDelayMs} ms
                      </span>
                    </div>
                    <input
                      type="range"
                      min={180}
                      max={900}
                      step={10}
                      value={voiceDraft.highlightDelayMs}
                      onChange={(e) =>
                        setVoiceDraft((prev) => ({
                          ...prev,
                          highlightDelayMs: Number(e.target.value),
                        }))
                      }
                      className="w-full h-2 cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>180ms (Faster)</span>
                      <span>460ms (Balanced)</span>
                      <span>900ms (Slower / Calm)</span>
                    </div>
                  </div>

                  <div className="ss-glass-card rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Reading Pace (Words Per Minute · WPM)
                      </label>
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 border border-indigo-400/40 font-mono text-xs font-extrabold text-indigo-300">
                        {wpmValue} WPM
                      </span>
                    </div>
                    <input
                      type="range"
                      min={67}
                      max={330}
                      step={2}
                      value={wpmValue}
                      onChange={(e) => {
                        const targetWpm = Math.max(67, Number(e.target.value));
                        const ms = Math.round(60000 / targetWpm / 10) * 10;
                        setVoiceDraft((prev) => ({
                          ...prev,
                          highlightDelayMs: Math.min(900, Math.max(180, ms)),
                        }));
                      }}
                      className="w-full h-2 cursor-pointer accent-indigo-400"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>~67 WPM (Slow)</span>
                      <span>~130 WPM (Natural)</span>
                      <span>~330 WPM (Rapid)</span>
                    </div>
                  </div>
                </div>

                {/* Pakistani English Accent & Default Voice Gender / Pitch / Frequency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
                      Default Voice Gender
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['male', 'female'] as VoiceGender[]).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setVoiceDraft((prev) => ({ ...prev, voiceGender: g }))}
                          className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition ${
                            voiceDraft.voiceGender === g
                              ? 'keep-white-text border-transparent text-white shadow'
                              : 'border-white/20 text-slate-300'
                          }`}
                          style={
                            voiceDraft.voiceGender === g
                              ? {
                                  backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                                }
                              : undefined
                          }
                        >
                          {g} Voice
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex justify-between text-xs font-bold uppercase text-slate-200 mb-1.5">
                      <span>Default Voice Pitch</span>
                      <span className="font-mono text-cyan-300">
                        {voiceDraft.voicePitch.toFixed(2)}x
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.65"
                      max="1.45"
                      step="0.05"
                      value={voiceDraft.voicePitch}
                      onChange={(e) =>
                        setVoiceDraft((prev) => ({
                          ...prev,
                          voicePitch: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full h-2 cursor-pointer accent-cyan-400 mt-2"
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-xs font-bold uppercase text-slate-200 mb-1.5">
                      <span>Speech Frequency / Rate</span>
                      <span className="font-mono text-cyan-300">
                        {voiceDraft.speechFrequency.toFixed(2)}x
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.70"
                      max="1.30"
                      step="0.05"
                      value={voiceDraft.speechFrequency}
                      onChange={(e) =>
                        setVoiceDraft((prev) => ({
                          ...prev,
                          speechFrequency: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full h-2 cursor-pointer accent-cyan-400 mt-2"
                    />
                  </div>
                </div>

                <label className="inline-flex items-center gap-2.5 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voiceDraft.pakistaniAccentPhonetics}
                    onChange={(e) =>
                      setVoiceDraft((prev) => ({
                        ...prev,
                        pakistaniAccentPhonetics: e.target.checked,
                      }))
                    }
                    className="rounded border-slate-400 text-cyan-500"
                  />
                  <span>
                    Enable Pakistani English Phonetic Lexicon (accurate soft dental &lsquo;dh&rsquo;
                    in &ldquo;Muhammad Sarib Randhawa&rdquo;)
                  </span>
                </label>

                {/* Spoken Intro Script + Live Calibration Preview */}
                <div className="space-y-3 pt-2 border-t border-white/15">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Hero Dynamic Voice Script
                    </label>
                    <button
                      type="button"
                      onClick={handleTestVoiceCalibration}
                      className="ss-glass-btn inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-cyan-300"
                    >
                      {previewPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-rose-400" />
                          <span>Stop Live Calibration Test</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Test Voice &amp; Highlight Speed Live</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={introScriptDraft}
                    onChange={(e) => setIntroScriptDraft(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-4 py-3 text-sm"
                  />

                  {/* Live Highlight Sync Preview Box */}
                  <div className="ss-glass-card rounded-2xl p-4">
                    <div className="text-[11px] font-mono uppercase text-cyan-400 mb-2">
                      Live Word-Sync Preview ({voiceDraft.highlightDelayMs}ms / word · {wpmValue}{' '}
                      WPM)
                    </div>
                    <p className="text-sm leading-relaxed text-slate-200">
                      {previewWords.map((word, idx) => (
                        <React.Fragment key={`${word}-${idx}`}>
                          <span
                            className={`inline-block px-1 py-0.5 transition-all ${
                              idx === previewWordIdx
                                ? 'ss-word-highlight font-bold text-cyan-200 scale-105'
                                : 'text-slate-200'
                            }`}
                          >
                            {word}
                          </span>{' '}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={busyKey === 'save-voice'}
                    className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                    }}
                  >
                    {busyKey === 'save-voice' ? (
                      <GlassSpinner size="sm" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Voice &amp; Highlight Speed Settings</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==============================================================
              TAB 2: SERVICES, PRICES & CATEGORIES CRUD
             ============================================================== */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Create / Edit Service Form */}
              <form
                onSubmit={handleSaveService}
                className="lg:col-span-5 ss-glass-card rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <h3 className="font-display text-base font-bold text-white">
                    {editingServiceId ? 'Edit Service & Price' : 'Add New Service / Category'}
                  </h3>
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={resetServiceForm}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      + Create New Instead
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Service Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={srvTitle}
                    onChange={(e) => setSrvTitle(e.target.value)}
                    placeholder="e.g. Custom Enterprise AI Agent"
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Category (Select Existing or Type a New Category!) *
                  </label>
                  <input
                    type="text"
                    required
                    value={srvCategory}
                    onChange={(e) => setSrvCategory(e.target.value)}
                    placeholder="e.g. AI & Automation, Mobile Apps, Cloud..."
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {existingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSrvCategory(cat)}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono bg-white/10 text-cyan-300 border border-white/15 hover:border-cyan-400"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Display Price Label *
                    </label>
                    <input
                      type="text"
                      required
                      value={srvPriceLabel}
                      onChange={(e) => setSrvPriceLabel(e.target.value)}
                      placeholder="From $1,800"
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Cart Price (USD) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={srvBasePrice}
                      onChange={(e) => setSrvBasePrice(Number(e.target.value))}
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Turnaround
                    </label>
                    <input
                      type="text"
                      value={srvTurnaround}
                      onChange={(e) => setSrvTurnaround(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Icon</label>
                    <select
                      value={srvIcon}
                      onChange={(e) => setSrvIcon(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    >
                      {ICON_OPTIONS.map((ic) => (
                        <option key={ic} value={ic}>
                          {ic}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={srvAccent}
                      onChange={(e) => setSrvAccent(e.target.value)}
                      className="h-9 w-full rounded-xl bg-transparent cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Short Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={srvDesc}
                    onChange={(e) => setSrvDesc(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Deliverables (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={srvDeliverables}
                    onChange={(e) => setSrvDeliverables(e.target.value)}
                    placeholder={'Architecture blueprint\nProduction deployment\n24/7 SLA'}
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={srvFeatured}
                    onChange={(e) => setSrvFeatured(e.target.checked)}
                    className="rounded border-slate-500 text-cyan-500"
                  />
                  <span>Highlight with &ldquo;Popular&rdquo; badge</span>
                </label>

                <button
                  type="submit"
                  disabled={busyKey === 'save-service'}
                  className="keep-white-text ss-cta-btn w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  {busyKey === 'save-service' ? (
                    <GlassSpinner size="sm" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{editingServiceId ? 'Update Service' : 'Publish Service'}</span>
                </button>
              </form>

              {/* Existing Services List */}
              <div className="lg:col-span-7 space-y-3">
                {cmsData.services.map((srv) => (
                  <div
                    key={srv.id}
                    className="ss-glass-card rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300">
                          {srv.category}
                        </span>
                        <span className="text-xs font-bold text-emerald-300">
                          {srv.priceLabel} (${srv.basePriceUsd.toLocaleString()})
                        </span>
                      </div>
                      <h4 className="font-display text-sm sm:text-base font-bold text-white mt-1 truncate">
                        {srv.title}
                      </h4>
                      <p className="text-xs text-slate-300 line-clamp-1">{srv.shortDescription}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadServiceIntoForm(srv)}
                        title="Edit Service"
                        className="ss-glass-btn p-2 rounded-xl text-cyan-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteService(srv)}
                        title="Delete Service"
                        className="ss-glass-btn p-2 rounded-xl text-rose-400"
                      >
                        {busyKey === `del-srv-${srv.id}` ? (
                          <GlassSpinner size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 3: PORTFOLIO PROJECT GALLERY CRUD
             ============================================================== */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveProject}
                className="lg:col-span-5 ss-glass-card rounded-2xl p-5 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-white/15 pb-3">
                  <h3 className="font-display text-base font-bold text-white">
                    {editingProjectId ? 'Edit Portfolio Case Study' : 'Add Showcase Project'}
                  </h3>
                  {editingProjectId && (
                    <button
                      type="button"
                      onClick={resetProjectForm}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      + New Project
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. FinFlow Cloud Banking"
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      value={projSubtitle}
                      onChange={(e) => setProjSubtitle(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Cover Image URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={projImageUrl}
                    onChange={(e) => setProjImageUrl(e.target.value)}
                    placeholder="./images/project-3d-commerce.jpg or https://..."
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Metric Label
                    </label>
                    <input
                      type="text"
                      value={projMetricLabel}
                      onChange={(e) => setProjMetricLabel(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Metric Value
                    </label>
                    <input
                      type="text"
                      value={projMetricValue}
                      onChange={(e) => setProjMetricValue(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={projClient}
                      onChange={(e) => setProjClient(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Year</label>
                    <input
                      type="text"
                      value={projYear}
                      onChange={(e) => setProjYear(e.target.value)}
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Live Project URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={projLiveUrl}
                    onChange={(e) => setProjLiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tech Stack Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={projTags}
                    onChange={(e) => setProjTags(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Case Study Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busyKey === 'save-project'}
                  className="keep-white-text ss-cta-btn w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  {busyKey === 'save-project' ? (
                    <GlassSpinner size="sm" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{editingProjectId ? 'Update Project' : 'Publish Project'}</span>
                </button>
              </form>

              <div className="lg:col-span-7 space-y-3">
                {cmsData.projects.map((p) => (
                  <div
                    key={p.id}
                    className="ss-glass-card rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/15"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-cyan-300">
                          {p.category} · {p.metricLabel}: {p.metricValue}
                        </div>
                        <h4 className="font-display text-sm sm:text-base font-bold text-white truncate">
                          {p.title}
                        </h4>
                        <p className="text-xs text-slate-300 line-clamp-1">{p.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => loadProjectIntoForm(p)}
                        className="ss-glass-btn p-2 rounded-xl text-cyan-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p)}
                        className="ss-glass-btn p-2 rounded-xl text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==============================================================
              TAB 4: SHOPPING CART ORDERS & CLIENT QUOTES PIPELINE
             ============================================================== */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {inquiries.map((inq) => {
                const draft = orderEdits[inq.id] || {
                  status: inq.status,
                  quotedAmount: inq.quotedAmount || '',
                  adminResponse: inq.adminResponse || '',
                };
                return (
                  <div key={inq.id} className="ss-glass-card rounded-2xl p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                      <div>
                        <span className="text-xs font-mono text-cyan-400">
                          #{inq.id.slice(0, 8)} · {inq.clientName} ({inq.clientEmail})
                        </span>
                        <h4 className="font-display text-base font-bold text-white">
                          {inq.serviceTitle}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(inq)}
                        className="ss-glass-btn p-2 rounded-xl text-rose-400"
                        title="Delete order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200">{inq.projectDetails}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                          Status
                        </label>
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [inq.id]: {
                                ...draft,
                                status: e.target.value as InquiryStatus,
                              },
                            }))
                          }
                          className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="new">New Inquiry</option>
                          <option value="in_review">In Review</option>
                          <option value="quoted">Quoted</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                          Official Quote Amount
                        </label>
                        <input
                          type="text"
                          value={draft.quotedAmount}
                          onChange={(e) =>
                            setOrderEdits((prev) => ({
                              ...prev,
                              [inq.id]: { ...draft, quotedAmount: e.target.value },
                            }))
                          }
                          placeholder="$2,800 USD"
                          className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => handleSaveOrderUpdate(inq)}
                          disabled={busyKey === `order-${inq.id}`}
                          className="keep-white-text ss-cta-btn w-full py-2 px-4 rounded-xl text-xs font-bold text-white inline-flex items-center justify-center gap-1.5"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                          }}
                        >
                          {busyKey === `order-${inq.id}` ? (
                            <GlassSpinner size="sm" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>Send Quote &amp; Update Status</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-slate-300 mb-1">
                        Official Client Response Message
                      </label>
                      <textarea
                        rows={2}
                        value={draft.adminResponse}
                        onChange={(e) =>
                          setOrderEdits((prev) => ({
                            ...prev,
                            [inq.id]: { ...draft, adminResponse: e.target.value },
                          }))
                        }
                        placeholder="Write milestone breakdown or onboarding instructions visible inside the client's portal..."
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==============================================================
              TAB 5: SITE METADATA, BRANDING, HERO & GLASS THEME PALETTE
             ============================================================== */}
          {activeTab === 'branding' && (
            <form onSubmit={handleSaveBrandingAndHero} className="space-y-6">
              {isOwner && (
                <div className="ss-glass-card rounded-2xl p-5 space-y-4">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>Site Metadata &amp; Agency Branding</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={brandingDraft.companyName}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, companyName: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Monogram Badge
                      </label>
                      <input
                        type="text"
                        value={brandingDraft.monogram}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, monogram: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Founder Name
                      </label>
                      <input
                        type="text"
                        value={brandingDraft.founderName}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, founderName: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={brandingDraft.contactEmail}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, contactEmail: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Location Text
                      </label>
                      <input
                        type="text"
                        value={brandingDraft.locationText}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, locationText: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Custom Logo Icon URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={brandingDraft.profileIconUrl}
                        onChange={(e) =>
                          setBrandingDraft({ ...brandingDraft, profileIconUrl: e.target.value })
                        }
                        placeholder="Leave empty for SS crystal monogram"
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(isOwner || perms.canEditHero) && (
                <div className="ss-glass-card rounded-2xl p-5 space-y-4">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Layout className="w-4 h-4 text-cyan-400" />
                    <span>Hero Headlines, Badges &amp; Metrics</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Headline Prefix
                      </label>
                      <input
                        type="text"
                        value={heroDraft.headlinePrefix}
                        onChange={(e) =>
                          setHeroDraft({ ...heroDraft, headlinePrefix: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Gradient Highlight Text
                      </label>
                      <input
                        type="text"
                        value={heroDraft.headlineGradient}
                        onChange={(e) =>
                          setHeroDraft({ ...heroDraft, headlineGradient: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Headline Suffix
                      </label>
                      <input
                        type="text"
                        value={heroDraft.headlineSuffix}
                        onChange={(e) =>
                          setHeroDraft({ ...heroDraft, headlineSuffix: e.target.value })
                        }
                        className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Subheadline Copy
                    </label>
                    <textarea
                      rows={2}
                      value={heroDraft.subheadline}
                      onChange={(e) => setHeroDraft({ ...heroDraft, subheadline: e.target.value })}
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {(isOwner || perms.canManageTheme) && (
                <div className="ss-glass-card rounded-2xl p-5 space-y-4">
                  <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    <span>Default Sheesha Glass Theme &amp; Brand Colors</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Default Theme Mode
                      </label>
                      <select
                        value={themeDraft.defaultMode}
                        onChange={(e) =>
                          setThemeDraft({
                            ...themeDraft,
                            defaultMode: e.target.value as ThemeMode,
                          })
                        }
                        className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="glass">Sheesha Pure Glass</option>
                        <option value="light">Crystal Light</option>
                        <option value="dark">Obsidian Dark</option>
                        <option value="cyber">Cyber Neon</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        value={themeDraft.primaryColor}
                        onChange={(e) =>
                          setThemeDraft({ ...themeDraft, primaryColor: e.target.value })
                        }
                        className="h-9 w-full rounded-xl bg-transparent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Secondary Color
                      </label>
                      <input
                        type="color"
                        value={themeDraft.secondaryColor}
                        onChange={(e) =>
                          setThemeDraft({ ...themeDraft, secondaryColor: e.target.value })
                        }
                        className="h-9 w-full rounded-xl bg-transparent cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Accent Glow Color
                      </label>
                      <input
                        type="color"
                        value={themeDraft.accentColor}
                        onChange={(e) =>
                          setThemeDraft({ ...themeDraft, accentColor: e.target.value })
                        }
                        className="h-9 w-full rounded-xl bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleResetFactoryDefaults}
                    className="ss-glass-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Factory V5 Defaults</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={busyKey === 'save-branding'}
                  className="keep-white-text ss-cta-btn ml-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  {busyKey === 'save-branding' ? (
                    <GlassSpinner size="sm" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Site Metadata, Hero &amp; Theme</span>
                </button>
              </div>
            </form>
          )}

          {/* ==============================================================
              TAB 6: SUB-ADMIN ACCESS CONTROL & REGISTERED CLIENTS (OWNER ONLY)
             ============================================================== */}
          {activeTab === 'team' && isOwner && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Create Sub-Admin Account */}
              <form
                onSubmit={handleCreateSubAdmin}
                className="lg:col-span-5 ss-glass-card rounded-2xl p-5 space-y-4"
              >
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2 border-b border-white/15 pb-3">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <span>Grant Sub-Admin Portal Access</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    placeholder="e.g. Bilal Chaudhry"
                    className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={subUsername}
                      onChange={(e) => setSubUsername(e.target.value)}
                      placeholder="bilal.admin"
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Email (Google Sync) *
                    </label>
                    <input
                      type="email"
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="bilal@swiftstack.com"
                      className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Sub-Admin Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showSubPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={subPassword}
                      onChange={(e) => setSubPassword(e.target.value)}
                      placeholder="Assign password"
                      className="ss-glass-input w-full rounded-xl pl-3.5 pr-10 py-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSubPassword((p) => !p)}
                      aria-label="Toggle Sub-Admin password visibility"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300"
                    >
                      {showSubPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold uppercase text-slate-300">
                    Permission Boundaries
                  </div>
                  {(
                    [
                      ['canEditHero', 'Voice & Hero Copy'],
                      ['canManageServices', 'Services, Prices & Categories'],
                      ['canManageProjects', 'Portfolio Case Studies'],
                      ['canManageOrders', 'Client Orders & Quotes'],
                      ['canManageTheme', 'Theme & Color Palette'],
                    ] as [keyof SubAdminPermissions, string][]
                  ).map(([permKey, label]) => (
                    <label
                      key={permKey}
                      className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={subPerms[permKey]}
                        onChange={(e) =>
                          setSubPerms((prev) => ({ ...prev, [permKey]: e.target.checked }))
                        }
                        className="rounded border-slate-500 text-cyan-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={busyKey === 'create-sub'}
                  className="keep-white-text ss-cta-btn w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg inline-flex items-center justify-center gap-2"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  {busyKey === 'create-sub' ? (
                    <GlassSpinner size="sm" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Authorize Sub-Admin</span>
                </button>
              </form>

              {/* Sub-Admin Accounts + Registered Clients */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-3">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Active Sub-Admin Accounts ({cmsData.subAdmins.length})
                  </h4>
                  {cmsData.subAdmins.map((sa) => (
                    <div key={sa.id} className="ss-glass-card rounded-2xl p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-sm font-bold text-white">
                              {sa.displayName}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                sa.active
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {sa.active ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-slate-300">
                            @{sa.username} · {sa.email}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 mt-1">
                            <span>
                              Password:{' '}
                              {visibleSubPwMap[sa.id] ? sa.password : '••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setVisibleSubPwMap((m) => ({ ...m, [sa.id]: !m[sa.id] }))
                              }
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              {visibleSubPwMap[sa.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSubActive(sa)}
                            className="ss-glass-btn px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                          >
                            {sa.active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubAdmin(sa)}
                            className="ss-glass-btn p-2 rounded-xl text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/15">
                        {(
                          [
                            ['canEditHero', 'Voice & Hero'],
                            ['canManageServices', 'Services'],
                            ['canManageProjects', 'Projects'],
                            ['canManageOrders', 'Orders'],
                            ['canManageTheme', 'Theme'],
                          ] as [keyof SubAdminPermissions, string][]
                        ).map(([k, label]) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleToggleSubPerm(sa, k)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                              sa.permissions[k]
                                ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                                : 'bg-white/5 border-white/10 text-slate-400 line-through'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Registered Clients Directory */}
                <div className="space-y-2.5 pt-2">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Registered Portal Clients ({clients.length})</span>
                  </h4>
                  {clients.map((c) => (
                    <div
                      key={c.id}
                      className="ss-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">{c.displayName}</div>
                        <div className="text-xs text-slate-300">
                          {c.email} {c.company ? `· ${c.company}` : ''}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-cyan-300">
                        {c.authProvider.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
