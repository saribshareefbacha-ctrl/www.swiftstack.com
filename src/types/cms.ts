export type HairStyle = 'modern-quiff' | 'slick-side' | 'curly-crop' | 'wavy-flow' | 'buzz-fade';
export type BeardStyle = 'full-groomed' | 'royal-boxed' | 'heavy-stubble' | 'goatee-trim' | 'clean-shaven';
export type OutfitStyle = 'white-polo' | 'executive-blazer' | 'cyber-hoodie' | 'henley-casual' | 'waistcoat-modern';
export type GlassesStyle = 'none' | 'clear-tech' | 'aviator' | 'round-studio' | 'cyber-shades';
export type AvatarExpression = 'confident-smile' | 'friendly-grin' | 'focused-architect' | 'visionary';

export interface AvatarConfig {
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  beardStyle: BeardStyle;
  beardColor: string;
  eyeColor: string;
  eyebrowArch: number;
  expression: AvatarExpression;
  outfitStyle: OutfitStyle;
  shirtPrimaryColor: string;
  shirtTrimColor1: string;
  shirtTrimColor2: string;
  pantsColor: string;
  glasses: GlassesStyle;
  watch: boolean;
  headset: boolean;
  holoAura: boolean;
}

export interface HeroStat {
  id: string;
  value: string;
  label: string;
}

export interface HeroCMS {
  companyName: string;
  companyAbbreviation: string;
  founderName: string;
  founderRole: string;
  statusBadge: string;
  heroHeadlinePrefix: string;
  heroHeadlineHighlight: string;
  heroHeadlineSuffix: string;
  heroSubheading: string;
  ceoBioTitle: string;
  ceoBioText: string;
  voiceGreetingScript: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  contactEmail: string;
  locationLabel: string;
  socialHandle: string;
  stats: HeroStat[];
}

export interface ThemeCMS {
  canvasBg: string;
  primaryAccent: string;
  secondaryAccent: string;
  tertiaryAccent: string;
  glassOpacity: number;
  floatingShapeCount: number;
  particleCount: number;
  meshDistortion: number;
  scrollMorphIntensity: number;
  ambientGlowIntensity: number;
  floatingShapesVariant: 'mixed-polyhedra' | 'torus-rings' | 'icosahedrons';
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

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  company: string;
  avatarUrl?: string;
  authProvider: 'credentials' | 'google';
  role: 'owner' | 'client';
  createdAt: string;
}

export interface SiteCMSData {
  hero: HeroCMS;
  theme: ThemeCMS;
  avatar: AvatarConfig;
  services: ServiceItem[];
  projects: ProjectItem[];
}
