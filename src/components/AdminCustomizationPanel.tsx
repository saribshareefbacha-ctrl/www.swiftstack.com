import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
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
  Share2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Volume2,
} from 'lucide-react';
import {
  CustomSocialIconName,
  HeroCMS,
  InquiryItem,
  InquiryStatus,
  ProjectItem,
  RealTimeMetricItem,
  ServiceItem,
  SiteBrandingMeta,
  SiteCMSData,
  SocialLinkItem,
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
import { OFFICIAL_PLATFORM_META, SocialPlatformGlyph } from './SocialPlatformIcons';

export type AdminTab =
  | 'voice'
  | 'social'
  | 'metrics'
  | 'services'
  | 'projects'
  | 'orders'
  | 'branding'
  | 'team';

interface AdminCustomizationPanelProps {
  currentUser: UserProfile;
  cmsData: SiteCMSData;
  inquiries: InquiryItem[];
  initialTab?: string;
  onTabChange?: (tab: AdminTab) => void;
  onBackToSite: () => void;
  onRefreshCMS: () => Promise<void>;
}

const SERVICE_ICON_OPTIONS = [
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

const CUSTOM_SOCIAL_ICONS: CustomSocialIconName[] = [
  'MessageCircle',
  'Send',
  'Globe',
  'Mail',
  'Phone',
  'Github',
  'Briefcase',
  'ExternalLink',
  'Sparkles',
  'Video',
];

export const AdminCustomizationPanel: React.FC<AdminCustomizationPanelProps> = ({
  currentUser,
  cmsData,
  inquiries,
  initialTab = 'voice',
  onTabChange,
  onBackToSite,
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
            canManageSocial: true,
          }
        : {
            canEditHero: true,
            canManageServices: true,
            canManageProjects: true,
            canManageTheme: false,
            canManageOrders: true,
            canManageSocial: true,
            ...(currentUser.permissions || {}),
          },
    [currentUser.permissions, isOwner]
  );

  const allowedTabs = useMemo(() => {
    const list: { id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [];
    if (isOwner || perms.canEditHero) {
      list.push({ id: 'voice', label: 'Voice & Highlight Speed', icon: Volume2 });
    }
    if (isOwner || perms.canManageSocial) {
      list.push({ id: 'social', label: 'Social Links & Navigation', icon: Share2 });
    }
    if (isOwner || perms.canEditHero) {
      list.push({ id: 'metrics', label: 'Real-Time Metrics', icon: Activity });
    }
    if (isOwner || perms.canManageServices) {
      list.push({ id: 'services', label: 'Services & Categories', icon: Briefcase });
    }
    if (isOwner || perms.canManageProjects) {
      list.push({ id: 'projects', label: 'Portfolio Gallery', icon: FolderKanban });
    }
    if (isOwner || perms.canManageOrders) {
      list.push({ id: 'orders', label: `Orders & Quotes (${inquiries.length})`, icon: Inbox });
    }
    if (isOwner || perms.canEditHero || perms.canManageTheme) {
      list.push({ id: 'branding', label: 'Branding, Hero & Theme', icon: Palette });
    }
    if (isOwner) {
      list.push({ id: 'team', label: 'Sub-Admins & Clients', icon: KeyRound });
    }
    return list;
  }, [inquiries.length, isOwner, perms]);

  const resolveValidTab = (candidate?: string): AdminTab => {
    const match = allowedTabs.find((t) => t.id === candidate);
    return match ? match.id : allowedTabs[0]?.id || 'voice';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() => resolveValidTab(initialTab));
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Voice & Word-Highlight Speed State
  const [voiceDraft, setVoiceDraft] = useState<VoiceEngineConfig>(cmsData.voice);
  const [introScriptDraft, setIntroScriptDraft] = useState<string>(cmsData.hero.introSpeechText);
  const [osVoices, setOsVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewWordIdx, setPreviewWordIdx] = useState(-1);
  const previewTimerRef = useRef<number | null>(null);

  // Social Links & Custom Messaging State
  const [socialDraft, setSocialDraft] = useState<SocialLinkItem[]>(cmsData.socialLinks || []);
  const [customSocLabel, setCustomSocLabel] = useState('');
  const [customSocHandle, setCustomSocHandle] = useState('');
  const [customSocUrl, setCustomSocUrl] = useState('');
  const [customSocIcon, setCustomSocIcon] = useState<CustomSocialIconName>('MessageCircle');
  const [customSocIconUrl, setCustomSocIconUrl] = useState('');
  const [customSocColor, setCustomSocColor] = useState('#38bdf8');

  // Real-Time Metrics State
  const [metricsDraft, setMetricsDraft] = useState<RealTimeMetricItem[]>(cmsData.metrics || []);

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
    canManageSocial: true,
  });
  const [visibleSubPwMap, setVisibleSubPwMap] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<UserProfile[]>([]);

  useEffect(() => {
    setVoiceDraft(cmsData.voice);
    setIntroScriptDraft(cmsData.hero.introSpeechText);
    setSocialDraft(cmsData.socialLinks || []);
    setMetricsDraft(cmsData.metrics || []);
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) setOsVoices(v);
      };
      loadVoices();
      window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    }
  }, []);

  useEffect(() => {
    if (isOwner) {
      api.getClients().then((r) => setClients(r.clients)).catch(() => {});
    }
  }, [isOwner]);

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

  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  const existingCategories = Array.from(
    new Set([
      'Engineering',
      'AI & Automation',
      'Mobile & Apps',
      'Creative Studio',
      'Cloud & Security',
      ...cmsData.services.map((s) => s.category),
    ])
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

    const chosen = selectPakistaniEnglishVoice(
      osVoices,
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

    previewTimerRef.current = window.setTimeout(() => stepWord(0), 115);
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
        'Voice Engine & Speed Synced!',
        `Saved ${voiceDraft.voiceGender.toUpperCase()} voice · ${voiceDraft.highlightDelayMs}ms/word (~${wpmValue} WPM).`,
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  // Social Links Handlers
  const handleToggleSocialEnabled = async (id: string) => {
    const updated = socialDraft.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    setSocialDraft(updated);
    setBusyKey(`soc-${id}`);
    try {
      await api.updateSocialLinks(updated);
      await onRefreshCMS();
      const target = updated.find((i) => i.id === id);
      pushToast(
        `${target?.label || 'Channel'} ${target?.enabled ? 'Enabled' : 'Hidden'}`,
        'Footer social navigation updated live.',
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleSocialFieldChange = (
    id: string,
    patch: Partial<SocialLinkItem>
  ) => {
    setSocialDraft((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const handleSaveAllSocialLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-socials');
    try {
      await api.updateSocialLinks(socialDraft);
      await onRefreshCMS();
      pushToast(
        'Social Links & Messaging Saved!',
        'All active social & messaging links published to the glass footer.',
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleAddCustomSocialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSocLabel.trim() || !customSocUrl.trim()) return;
    setBusyKey('add-custom-soc');
    try {
      const newLink: SocialLinkItem = {
        id: `soc-custom-${Date.now().toString(36)}`,
        platform: 'custom',
        label: customSocLabel.trim(),
        handleOrTagline: customSocHandle.trim(),
        url: customSocUrl.trim(),
        enabled: true,
        isOfficial: false,
        customIconName: customSocIcon,
        customIconUrl: customSocIconUrl.trim(),
        accentColor: customSocColor,
      };
      const updated = [...socialDraft, newLink];
      setSocialDraft(updated);
      await api.updateSocialLinks(updated);
      await onRefreshCMS();
      setCustomSocLabel('');
      setCustomSocHandle('');
      setCustomSocUrl('');
      setCustomSocIconUrl('');
      pushToast(
        'Custom Platform Added!',
        `"${newLink.label}" is now live in the footer social bar.`,
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteCustomSocial = async (id: string) => {
    const updated = socialDraft.filter((item) => item.id !== id);
    setSocialDraft(updated);
    await api.updateSocialLinks(updated);
    await onRefreshCMS();
    pushToast('Custom Link Removed', 'Deleted from footer social navigation.', 'info');
  };

  // Real-Time Metrics Handlers
  const handleSaveMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('save-metrics');
    try {
      await api.updateMetrics(metricsDraft);
      await onRefreshCMS();
      pushToast(
        'Real-Time Metrics Published!',
        'Hero stats synced live with Firebase Firestore.',
        'success'
      );
    } finally {
      setBusyKey(null);
    }
  };

  // Services CRUD
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
        pushToast('Service Updated', `"${payload.title}" updated across catalog.`, 'success');
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

  // Projects CRUD
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
      pushToast('Factory Defaults Restored', 'SwiftStack CMS defaults restored.', 'info');
    } finally {
      setBusyKey(null);
    }
  };

  // Sub-Admin Management
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

  const officialSocials = socialDraft.filter((s) => s.isOfficial);
  const customSocials = socialDraft.filter((s) => !s.isOfficial);

  return (
    <section
      aria-label="SwiftStack Owner & Sub-Admin Dashboard"
      className="relative z-20 min-h-screen w-full pt-24 pb-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Command Header Card */}
        <div className="ss-admin-card rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className="keep-white-text w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
              style={{
                backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
              }}
            >
              {isOwner ? <Crown className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                  {isOwner
                    ? 'SwiftStack Master Owner Dashboard'
                    : 'SwiftStack Sub-Admin Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  {isOwner ? 'MASTER OWNER PRIVILEGE' : 'DELEGATED ACCESS'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Authenticated as <strong className="text-white">{currentUser.displayName}</strong> (
                {currentUser.email}) · Real-time Firebase Cloud Sync Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopVoicePreview();
              onBackToSite();
            }}
            className="keep-white-text ss-cta-btn inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg"
            style={{
              backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Live Storefront</span>
          </button>
        </div>

        {/* Executive Overview Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="ss-admin-card rounded-2xl p-4">
            <div className="text-[11px] font-mono uppercase text-slate-400">Active Services</div>
            <div className="font-display text-2xl font-extrabold text-white mt-0.5">
              {cmsData.services.length}
            </div>
          </div>
          <div className="ss-admin-card rounded-2xl p-4">
            <div className="text-[11px] font-mono uppercase text-slate-400">Portfolio Works</div>
            <div className="font-display text-2xl font-extrabold text-cyan-300 mt-0.5">
              {cmsData.projects.length}
            </div>
          </div>
          <div className="ss-admin-card rounded-2xl p-4">
            <div className="text-[11px] font-mono uppercase text-slate-400">Client Orders</div>
            <div className="font-display text-2xl font-extrabold text-indigo-300 mt-0.5">
              {inquiries.length}
            </div>
          </div>
          <div className="ss-admin-card rounded-2xl p-4">
            <div className="text-[11px] font-mono uppercase text-slate-400">Active Social Channels</div>
            <div className="font-display text-2xl font-extrabold text-emerald-300 mt-0.5">
              {socialDraft.filter((s) => s.enabled).length} / {socialDraft.length}
            </div>
          </div>
        </div>

        {/* Navigation Tab Bar */}
        <div className="ss-admin-card rounded-2xl p-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {allowedTabs.map((t) => {
            const Icon = t.icon;
            const selected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTab(t.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selected
                    ? 'keep-white-text text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
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

        {/* ================================================================
            TAB 1: VOICE ENGINE & WORD HIGHLIGHT SPEED CALIBRATION (OWNER ONLY)
           ================================================================ */}
        {activeTab === 'voice' && (
          <form onSubmit={handleSaveVoiceAndSpeed} className="space-y-6">
            <div className="ss-admin-card rounded-3xl p-6 sm:p-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-cyan-400" />
                    <span>Owner Voice Engine &amp; Word-Highlight Speed Calibration</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    All voice controls are hidden from the public landing page and controlled
                    exclusively here. Calibrate voice type, pitch, Pakistani English pronunciation,
                    and word-highlight speed for every visitor.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { label: 'Calm (580ms)', ms: 580 },
                    { label: 'Natural Sync (460ms)', ms: 460 },
                    { label: 'Brisk (360ms)', ms: 360 },
                  ].map((preset) => (
                    <button
                      key={preset.ms}
                      type="button"
                      onClick={() =>
                        setVoiceDraft((prev) => ({ ...prev, highlightDelayMs: preset.ms }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition ${
                        voiceDraft.highlightDelayMs === preset.ms
                          ? 'keep-white-text bg-cyan-500 border-transparent text-white'
                          : 'border-white/20 text-slate-300 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coupled Delay (ms/word) & WPM Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-2.5">
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
                    <span>180ms (Fast)</span>
                    <span>460ms (Balanced)</span>
                    <span>900ms (Deliberate)</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Highlight Speed (Words Per Minute · WPM)
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
                    <span>~67 WPM</span>
                    <span>~130 WPM</span>
                    <span>~330 WPM</span>
                  </div>
                </div>
              </div>

              {/* Voice Gender, Pitch, Rate & OS Voice Pinning */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
                    Voice Gender
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
                    <span>Voice Pitch</span>
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
                    <span>Speech Rate</span>
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

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-200 mb-1.5">
                    Preferred System Voice
                  </label>
                  <select
                    value={voiceDraft.preferredVoiceURI || ''}
                    onChange={(e) =>
                      setVoiceDraft((prev) => ({ ...prev, preferredVoiceURI: e.target.value }))
                    }
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="">Auto (Pakistani / South Asian English)</option>
                    {osVoices
                      .filter((v) => /^en/i.test(v.lang))
                      .map((v) => (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                  </select>
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
                  Enable Pakistani English Phonetics (&ldquo;Muhammad Sarib Randhawa&rdquo; soft
                  dental &lsquo;dh&rsquo; pronunciation)
                </span>
              </label>

              {/* Public Intro Text + Live Calibration Preview */}
              <div className="space-y-3 pt-4 border-t border-white/15">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Public Landing Intro Voice Script
                  </label>
                  <button
                    type="button"
                    onClick={handleTestVoiceCalibration}
                    className="ss-glass-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-cyan-300"
                  >
                    {previewPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-rose-400" />
                        <span>Stop Calibration Preview</span>
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

                <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-mono uppercase text-cyan-400 mb-2">
                    Live Word-Sync Preview ({voiceDraft.highlightDelayMs}ms / word · {wpmValue} WPM)
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
                  <span>Save &amp; Sync Voice Calibration</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================================================================
            TAB 2: SOCIAL LINKS & DIRECT MESSAGING NAVIGATION MANAGER
           ================================================================ */}
        {activeTab === 'social' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Official Social Platforms + Active Custom Channels */}
            <form
              onSubmit={handleSaveAllSocialLinks}
              className="lg:col-span-7 ss-admin-card rounded-3xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Official Social Platforms &amp; Direct Messaging
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Enable or disable WhatsApp, Telegram, Facebook, Instagram, LinkedIn, YouTube, X
                    (Twitter), or edit URLs and handles live in the footer.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={busyKey === 'save-socials'}
                  className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                  }}
                >
                  {busyKey === 'save-socials' ? (
                    <GlassSpinner size="sm" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save All Links</span>
                </button>
              </div>

              {/* Official 7 Platforms */}
              <div className="space-y-3">
                {officialSocials.map((soc) => {
                  const meta =
                    soc.platform !== 'custom' ? OFFICIAL_PLATFORM_META[soc.platform] : null;
                  const accent = soc.accentColor || meta?.defaultColor || '#38bdf8';
                  return (
                    <div
                      key={soc.id}
                      className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${accent}24`,
                              color: accent,
                              border: `1px solid ${accent}55`,
                            }}
                          >
                            <SocialPlatformGlyph item={soc} className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-sm font-bold text-white">
                              {meta?.name || soc.label}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {soc.enabled ? 'Visible in Footer' : 'Hidden from Footer'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={busyKey === `soc-${soc.id}`}
                          onClick={() => handleToggleSocialEnabled(soc.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                            soc.enabled
                              ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                              : 'bg-white/5 border-white/15 text-slate-400'
                          }`}
                        >
                          {soc.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={soc.label}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { label: e.target.value })
                          }
                          placeholder="Display Title"
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={soc.handleOrTagline}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { handleOrTagline: e.target.value })
                          }
                          placeholder="@handle or subtitle"
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="url"
                          value={soc.url}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { url: e.target.value })
                          }
                          placeholder={meta?.placeholder || 'https://...'}
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Links List */}
              {customSocials.length > 0 && (
                <div className="pt-4 border-t border-white/15 space-y-3">
                  <div className="text-xs font-mono font-bold uppercase text-cyan-300">
                    Custom Platforms &amp; Direct Messaging Links ({customSocials.length})
                  </div>
                  {customSocials.map((soc) => (
                    <div
                      key={soc.id}
                      className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-8 w-8 items-center justify-center rounded-xl"
                            style={{
                              backgroundColor: `${soc.accentColor || '#38bdf8'}24`,
                              color: soc.accentColor || '#38bdf8',
                            }}
                          >
                            <SocialPlatformGlyph item={soc} className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-bold text-white">{soc.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSocialEnabled(soc.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                              soc.enabled
                                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                                : 'bg-white/5 border-white/15 text-slate-400'
                            }`}
                          >
                            {soc.enabled ? 'Enabled' : 'Disabled'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomSocial(soc.id)}
                            className="p-2 rounded-xl text-rose-400 hover:bg-rose-500/15"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          value={soc.label}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { label: e.target.value })
                          }
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={soc.handleOrTagline}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { handleOrTagline: e.target.value })
                          }
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                        <input
                          type="text"
                          value={soc.url}
                          onChange={(e) =>
                            handleSocialFieldChange(soc.id, { url: e.target.value })
                          }
                          className="ss-glass-input rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>

            {/* Right Column: Add Custom Messaging / External Link Creator */}
            <form
              onSubmit={handleAddCustomSocialLink}
              className="lg:col-span-5 ss-admin-card rounded-3xl p-6 space-y-4"
            >
              <h3 className="font-display text-base sm:text-lg font-bold text-white border-b border-white/15 pb-3">
                Add Custom Messaging or Platform Link
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Add Discord, Upwork, Fiverr, Behance, GitHub, Calendly, Direct Phone, or any custom
                channel with its own icon and accent color.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Platform / Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={customSocLabel}
                  onChange={(e) => setCustomSocLabel(e.target.value)}
                  placeholder="e.g. Discord Community, Upwork Agency, Book Call"
                  className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Handle / Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={customSocHandle}
                  onChange={(e) => setCustomSocHandle(e.target.value)}
                  placeholder="e.g. @SwiftStackOfficial or 15-Min Discovery"
                  className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Target URL or Direct Link *
                </label>
                <input
                  type="text"
                  required
                  value={customSocUrl}
                  onChange={(e) => setCustomSocUrl(e.target.value)}
                  placeholder="https://discord.gg/... or mailto:... or tel:..."
                  className="ss-glass-input w-full rounded-xl px-3.5 py-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Built-In Vector Icon
                  </label>
                  <select
                    value={customSocIcon}
                    onChange={(e) => setCustomSocIcon(e.target.value as CustomSocialIconName)}
                    className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                  >
                    {CUSTOM_SOCIAL_ICONS.map((iconName) => (
                      <option key={iconName} value={iconName}>
                        {iconName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Badge Accent Color
                  </label>
                  <input
                    type="color"
                    value={customSocColor}
                    onChange={(e) => setCustomSocColor(e.target.value)}
                    className="h-9 w-full rounded-xl bg-transparent cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Custom Image Icon URL (Optional — overrides vector icon)
                </label>
                <input
                  type="text"
                  value={customSocIconUrl}
                  onChange={(e) => setCustomSocIconUrl(e.target.value)}
                  placeholder="https://.../custom-icon.png"
                  className="ss-glass-input w-full rounded-xl px-3.5 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={busyKey === 'add-custom-soc'}
                className="keep-white-text ss-cta-btn w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-lg inline-flex items-center justify-center gap-2"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                }}
              >
                {busyKey === 'add-custom-soc' ? (
                  <GlassSpinner size="sm" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Add Custom Channel to Footer</span>
              </button>
            </form>
          </div>
        )}

        {/* ================================================================
            TAB 3: REAL-TIME DYNAMIC METRICS (FIRESTORE SYNCED)
           ================================================================ */}
        {activeTab === 'metrics' && (
          <form onSubmit={handleSaveMetrics} className="ss-admin-card rounded-3xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <span>Real-Time Dynamic Metrics Manager</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Configure live Hero stats synced via Firebase Firestore, including optional
                  real-time auto-counting from live Portfolio Projects &amp; Client Orders.
                </p>
              </div>
              <button
                type="submit"
                disabled={busyKey === 'save-metrics'}
                className="keep-white-text ss-cta-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${cmsData.theme.primaryColor}, ${cmsData.theme.secondaryColor})`,
                }}
              >
                {busyKey === 'save-metrics' ? (
                  <GlassSpinner size="sm" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Publish Real-Time Metrics</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metricsDraft.map((m, idx) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 space-y-3"
                >
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    Metric Slot #{idx + 1}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Metric Label
                    </label>
                    <input
                      type="text"
                      value={m.label}
                      onChange={(e) =>
                        setMetricsDraft((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item
                          )
                        )
                      }
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Display Value (when Static)
                    </label>
                    <input
                      type="text"
                      value={m.value}
                      onChange={(e) =>
                        setMetricsDraft((prev) =>
                          prev.map((item, i) =>
                            i === idx ? { ...item, value: e.target.value } : item
                          )
                        )
                      }
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Live Firestore Counter Mode
                    </label>
                    <select
                      value={m.liveAutoIncrement || 'none'}
                      onChange={(e) =>
                        setMetricsDraft((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  liveAutoIncrement: e.target.value as
                                    | 'none'
                                    | 'projects_plus_orders'
                                    | 'orders_count',
                                }
                              : item
                          )
                        )
                      }
                      className="ss-glass-input w-full rounded-xl px-3 py-2 text-xs"
                    >
                      <option value="none">Direct Custom Value</option>
                      <option value="projects_plus_orders">
                        Base + Live Projects &amp; Orders Count
                      </option>
                      <option value="orders_count">Base + Live Client Orders Count</option>
                    </select>
                  </div>
                  {m.liveAutoIncrement && m.liveAutoIncrement !== 'none' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Base Number</label>
                        <input
                          type="number"
                          value={m.baseNumber ?? 100}
                          onChange={(e) =>
                            setMetricsDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, baseNumber: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="ss-glass-input w-full rounded-xl px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">Suffix</label>
                        <input
                          type="text"
                          value={m.suffix ?? '+'}
                          onChange={(e) =>
                            setMetricsDraft((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, suffix: e.target.value } : item
                              )
                            )
                          }
                          className="ss-glass-input w-full rounded-xl px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        )}

        {/* ================================================================
            TAB 4: SERVICES, PRICES & CATEGORIES CRUD
           ================================================================ */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleSaveService}
              className="lg:col-span-5 ss-admin-card rounded-3xl p-6 space-y-4"
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
                  Category (Pick Existing or Enter New Category) *
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
                    {SERVICE_ICON_OPTIONS.map((ic) => (
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

            <div className="lg:col-span-7 space-y-3">
              {cmsData.services.map((srv) => (
                <div
                  key={srv.id}
                  className="ss-admin-card rounded-2xl p-4 flex items-center justify-between gap-4"
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

        {/* ================================================================
            TAB 5: PORTFOLIO PROJECT GALLERY CRUD
           ================================================================ */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleSaveProject}
              className="lg:col-span-5 ss-admin-card rounded-3xl p-6 space-y-3.5"
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
                  className="ss-admin-card rounded-2xl p-4 flex items-center justify-between gap-4"
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

        {/* ================================================================
            TAB 6: SHOPPING CART ORDERS & CLIENT QUOTES PIPELINE
           ================================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {inquiries.map((inq) => {
              const draft = orderEdits[inq.id] || {
                status: inq.status,
                quotedAmount: inq.quotedAmount || '',
                adminResponse: inq.adminResponse || '',
              };
              return (
                <div key={inq.id} className="ss-admin-card rounded-2xl p-5 space-y-4">
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

        {/* ================================================================
            TAB 7: SITE METADATA, BRANDING, HERO & GLASS THEME PALETTE
           ================================================================ */}
        {activeTab === 'branding' && (
          <form onSubmit={handleSaveBrandingAndHero} className="space-y-6">
            {isOwner && (
              <div className="ss-admin-card rounded-3xl p-6 space-y-4">
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
              <div className="ss-admin-card rounded-3xl p-6 space-y-4">
                <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Layout className="w-4 h-4 text-cyan-400" />
                  <span>Hero Headlines, Badges &amp; CTAs</span>
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
              <div className="ss-admin-card rounded-3xl p-6 space-y-4">
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
                  <span>Restore Factory Defaults</span>
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

        {/* ================================================================
            TAB 8: SUB-ADMIN ACCESS CONTROL & REGISTERED CLIENTS (OWNER ONLY)
           ================================================================ */}
        {activeTab === 'team' && isOwner && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleCreateSubAdmin}
              className="lg:col-span-5 ss-admin-card rounded-3xl p-6 space-y-4"
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
                    ['canEditHero', 'Voice, Metrics & Hero Copy'],
                    ['canManageSocial', 'Social Links & Footer Navigation'],
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

            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-3">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                  Active Sub-Admin Accounts ({cmsData.subAdmins.length})
                </h4>
                {cmsData.subAdmins.map((sa) => (
                  <div key={sa.id} className="ss-admin-card rounded-2xl p-4 space-y-3">
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
                          ['canManageSocial', 'Social Links'],
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

              <div className="space-y-2.5 pt-2">
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Registered Portal Clients ({clients.length})</span>
                </h4>
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="ss-admin-card rounded-2xl p-3.5 flex items-center justify-between gap-3"
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
    </section>
  );
};
