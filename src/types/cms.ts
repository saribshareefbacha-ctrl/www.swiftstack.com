export type ThemeMode = 'glass' | 'dark' | 'light' | 'cyber';

export type CharacterPresetStyle = 'executive-polo' | 'midnight-blazer' | 'tech-minimalist';

export interface SiteBrandingMeta {
  pageTitle: string;
  metaDescription: string;
  faviconUrl: string;
  faviconMonogram: string;
  profileIconUrl: string;
}

export interface CharacterConfig {
  presetStyle: CharacterPresetStyle;
  customImageUrl: string;
  greetingBadgeText: string;
  gestureAnimation: 'subtle' | 'dynamic' | 'still';
  auraColor: string;
  voiceRate: number;
  voicePitch: number;
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
  backgroundHex: string;
  primaryAccent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  glassOpacity: number;
  particleDensity: number;
  scrollSpeed: number;
  wireframeOpacity: number;
}

export interface ServiceItem {
  id: string;
  title: string;
  category: string;
  shortDescription: string;
  deliverables: string[];
  priceLabel: string;
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
  theme: ThemeCMS;
  character: CharacterConfig;
  services: ServiceItem[];
  projects: ProjectItem[];
  subAdmins: SubAdminAccount[];
}
