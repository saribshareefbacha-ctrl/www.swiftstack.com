export type ThemeMode = 'glass' | 'light' | 'dark' | 'cyber';

export type ViewLayoutMode = 'desktop' | 'mobile';

export type VoiceGender = 'male' | 'female';

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
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
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
