export type ThemeMode = 'glass' | 'dark' | 'cyber';

export type VoiceGender = 'male' | 'female';

export interface SiteBrandingMeta {
  pageTitle: string;
  metaDescription: string;
  faviconUrl: string;
  faviconMonogram: string;
  profileIconUrl: string;
}

export interface VoiceEngineConfig {
  voiceGender: VoiceGender;
  speechFrequency: number; // Speech rate/cadence (0.65 - 1.40)
  voicePitch: number; // Pitch tuning (0.65 - 1.35)
  pakistaniAccentPhonetics: boolean;
  preferredVoiceURI: string;
}

export interface HeroCMS {
  companyName: string;
  companyAbbreviation: string;
  badgeText: string;
  headlinePrefix: string;
  headlineHighlight: string;
  subheadline: string;
  founderName: string;
  founderTitle: string;
  founderBio: string;
  voiceStageLabel: string;
  voiceGreeting: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  servicesHeadingPrefix: string;
  servicesHeadingHighlight: string;
  servicesSubheading: string;
  projectsHeadingPrefix: string;
  projectsHeadingHighlight: string;
  projectsSubheading: string;
  orderHeadingPrefix: string;
  orderHeadingHighlight: string;
  orderSubheading: string;
  contactEmail: string;
  locationLabel: string;
  socialHandle: string;
}

export interface ThemeCMS {
  defaultMode: ThemeMode;
  primaryAccent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  robotDensity: number;
  rippleIntensity: number;
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

export interface CartItem {
  serviceId: string;
  title: string;
  category: string;
  priceLabel: string;
  basePriceUsd: number;
  turnaround: string;
  quantity: number;
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

export type InquiryStatus = 'new' | 'reviewing' | 'quoted' | 'in-progress' | 'completed';

export interface InquiryItem {
  id: string;
  clientId?: string | null;
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

export interface SubAdminPermissions {
  canManageServices: boolean;
  canManageProjects: boolean;
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

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  company: string;
  avatarUrl?: string;
  authProvider: 'credentials' | 'google';
  role: 'owner' | 'subadmin' | 'client';
  permissions?: SubAdminPermissions;
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
