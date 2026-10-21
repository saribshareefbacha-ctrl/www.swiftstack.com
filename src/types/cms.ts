export type ThemeMode = 'glass' | 'light' | 'dark' | 'cyber';

export type ViewLayoutMode = 'desktop' | 'mobile';

export type VoiceGender = 'male' | 'female';

export type SocialPlatformType =
  | 'whatsapp'
  | 'telegram'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'x'
  | 'custom';

export type CustomSocialIconName =
  | 'MessageCircle'
  | 'Send'
  | 'Globe'
  | 'Mail'
  | 'Phone'
  | 'Github'
  | 'Briefcase'
  | 'ExternalLink'
  | 'Sparkles'
  | 'Video';

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatformType;
  label: string;
  handleOrTagline: string;
  url: string;
  enabled: boolean;
  isOfficial: boolean;
  customIconName?: CustomSocialIconName;
  customIconUrl?: string;
  accentColor?: string;
}

export interface RealTimeMetricItem {
  id: string;
  value: string;
  label: string;
  liveAutoIncrement?: 'none' | 'projects_plus_orders' | 'orders_count';
  baseNumber?: number;
  suffix?: string;
}

export interface SiteBrandingMeta {
  companyName: string;
  monogram: string;
  founderName: string;
  founderTitle: string;
  contactEmail: string;
  locationText: string;
  footerTagline: string;
  copyrightText: string;
  profileIconUrl: string;
}

export interface HeroCMS {
  badgeText: string;
  headlinePrefix: string;
  headlineGradient: string;
  headlineSuffix: string;
  subheadline: string;
  introSpeechText: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface VoiceEngineConfig {
  voiceGender: VoiceGender;
  voicePitch: number;
  speechFrequency: number;
  highlightDelayMs: number;
  pakistaniAccentPhonetics: boolean;
  preferredVoiceURI: string;
}

export interface ThemeCMS {
  defaultMode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  deliverables: string[];
  priceLabel: string;
  basePriceUsd: number;
  turnaround: string;
  iconName: string;
  accentHex: string;
  featured: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  imageUrl: string;
  tags: string[];
  metricLabel: string;
  metricValue: string;
  clientName: string;
  year: string;
  liveUrl: string;
  featured: boolean;
}

export interface SubAdminPermissions {
  canEditHero: boolean;
  canManageServices: boolean;
  canManageProjects: boolean;
  canManageTheme: boolean;
  canManageOrders: boolean;
  canManageSocial: boolean;
}

export interface SubAdminAccount {
  id: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  permissions: SubAdminPermissions;
  active: boolean;
  createdAt: string;
}

export interface SiteCMSData {
  branding: SiteBrandingMeta;
  hero: HeroCMS;
  metrics: RealTimeMetricItem[];
  socialLinks: SocialLinkItem[];
  voice: VoiceEngineConfig;
  theme: ThemeCMS;
  services: ServiceItem[];
  projects: ProjectItem[];
  subAdmins: SubAdminAccount[];
}

export interface CartItem {
  serviceId: string;
  title: string;
  category: string;
  priceLabel: string;
  basePriceUsd: number;
  quantity: number;
  turnaround?: string;
}

export type InquiryStatus = 'new' | 'in_review' | 'quoted' | 'in_progress' | 'completed';

export interface InquiryItem {
  id: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string;
  companyName: string;
  serviceTitle: string;
  budgetRange: string;
  timeline: string;
  projectDetails: string;
  cartSummary?: CartItem[];
  status: InquiryStatus;
  quotedAmount: string;
  adminResponse: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  company: string;
  avatarUrl?: string;
  authProvider: 'google' | 'credentials';
  role: 'owner' | 'subadmin' | 'client';
  permissions?: SubAdminPermissions;
  createdAt: string;
}

export type AppPageView = 'home' | 'owner-dashboard';
