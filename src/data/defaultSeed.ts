import {
  CharacterConfig,
  CharacterPresetStyle,
  InquiryItem,
  SiteBrandingMeta,
  SiteCMSData,
  SubAdminAccount,
} from '../types/cms';

export interface CharacterFrameSet {
  idle: string;
  open: string;
  wave?: string;
}

export const CHARACTER_PRESET_FRAMES: Record<CharacterPresetStyle, CharacterFrameSet> = {
  'executive-polo': {
    idle: './images/ceo-3d-polo.webp',
    open: './images/ceo-3d-polo-open.webp',
    wave: './images/ceo-3d-polo-wave.webp',
  },
  'midnight-blazer': {
    idle: './images/ceo-3d-blazer.webp',
    open: './images/ceo-3d-blazer-open.webp',
  },
  'tech-minimalist': {
    idle: './images/ceo-3d-tech.webp',
    open: './images/ceo-3d-tech-open.webp',
  },
};

export const CHARACTER_PRESET_IMAGES: Record<CharacterPresetStyle, string> = {
  'executive-polo': './images/ceo-3d-polo.webp',
  'midnight-blazer': './images/ceo-3d-blazer.webp',
  'tech-minimalist': './images/ceo-3d-tech.webp',
};

export const DEFAULT_BRANDING_META: SiteBrandingMeta = {
  pageTitle: 'SwiftStack (SS) — Muhammad Sarib Randhawa | Digital Agency & Full-Stack Studio',
  metaDescription:
    'SwiftStack (SS), founded and owned by Muhammad Sarib Randhawa — full-stack web & SaaS engineering, mobile apps, cloud security, and AI media creation.',
  faviconUrl: '',
  faviconMonogram: 'SS',
  profileIconUrl: '',
};

export const DEFAULT_CHARACTER_CONFIG: CharacterConfig = {
  presetStyle: 'executive-polo',
  customImageUrl: '',
  greetingBadgeText: 'Founder & CEO · Live Studio',
  gestureAnimation: 'subtle',
  auraColor: '#06b6d4',
  voiceRate: 1.0,
  voicePitch: 1.02,
};

export const DEFAULT_SUB_ADMINS: SubAdminAccount[] = [
  {
    id: 'subadmin-ops-1',
    displayName: 'SwiftStack Operations Lead',
    username: 'subadmin',
    email: 'ops@swiftstack.com',
    password: 'password123',
    permissions: {
      canManageServices: true,
      canManageProjects: true,
      canManageOrders: true,
    },
    active: true,
    createdAt: '2026-10-21T08:00:00.000Z',
  },
];

export const DEFAULT_CMS_DATA: SiteCMSData = {
  branding: DEFAULT_BRANDING_META,
  hero: {
    companyName: 'SwiftStack',
    companyAbbreviation: 'SS',
    badgeText: 'SWIFTSTACK (SS) · FULL-STACK, CLOUD & AI DIGITAL STUDIO',
    headlinePrefix: 'Engineering High-Impact',
    headlineHighlight: 'Web, Full-Stack & AI Solutions',
    subheadline:
      'Founded and owned by Muhammad Sarib Randhawa, SwiftStack (SS) partners with ambitious brands and founders to ship fast full-stack web platforms, custom mobile apps, cloud infrastructure, and iconic AI-powered brand experiences.',
    founderName: 'Muhammad Sarib Randhawa',
    founderTitle: 'Founder & CEO — SwiftStack (SS)',
    founderBio:
      'At SwiftStack (SS), every product is engineered for conversion, speed, and unmistakable polish — spanning full-stack web & mobile apps, automated cloud & SSL deployments, minimalist brand systems, and flagship content channels like @SoulSyllables.',
    voiceGreeting:
      'Hi there! I am Muhammad Sarib Randhawa, Founder & CEO of SwiftStack. Welcome to our digital studio! Explore our full-stack web, mobile, cloud, and AI media services, check out our featured client projects, or submit your project brief right here to get started.',
    primaryCtaLabel: 'Start Your Order',
    secondaryCtaLabel: 'Explore Featured Work',
    servicesHeadingPrefix: 'Full-Spectrum Engineering,',
    servicesHeadingHighlight: 'Cloud Architecture & AI Media',
    servicesSubheading:
      'Every engagement combines precision software engineering with clean visual direction — architected end-to-end under Muhammad Sarib Randhawa.',
    projectsHeadingPrefix: 'Engineered by',
    projectsHeadingHighlight: 'SwiftStack (SS)',
    projectsSubheading:
      'Featured client builds across full-stack SaaS platforms, interactive web interfaces, signed mobile APKs, and flagship AI content ecosystems like @SoulSyllables.',
    orderHeadingPrefix: 'Ready to Launch Something',
    orderHeadingHighlight: 'Extraordinary?',
    orderSubheading:
      'Submit your project requirements, SaaS roadmap, mobile app scope, or AI media package. Muhammad Sarib Randhawa reviews every inquiry directly and responds with a tailored architecture and milestone quote.',
    contactEmail: 'hello@swiftstack.com',
    locationLabel: 'Global Digital Studio · Cloud-First Delivery',
    socialHandle: '@SoulSyllables',
  },
  theme: {
    defaultMode: 'glass',
    backgroundHex: '#050c1d',
    primaryAccent: '#06b6d4',
    secondaryAccent: '#6366f1',
    tertiaryAccent: '#22d3ee',
    glassOpacity: 0.62,
    particleDensity: 150,
    scrollSpeed: 1.0,
    wireframeOpacity: 0.18,
  },
  character: DEFAULT_CHARACTER_CONFIG,
  subAdmins: DEFAULT_SUB_ADMINS,
  services: [
    {
      id: 'srv-3d-web',
      title: 'Modern Front-End & Interactive Web Design',
      category: 'Frontend & UI',
      shortDescription:
        'Bespoke high-speed web interfaces built with HTML5, CSS3, TypeScript, React, and smooth motion graphics — engineered for crisp mobile responsiveness and conversion.',
      deliverables: [
        'React + TypeScript Architecture',
        'Multi-Theme Glass & Light UI',
        'Interactive Product Showcases',
        'Sub-Second Mobile Performance',
      ],
      priceLabel: 'From $1,400',
      turnaround: '1 – 3 Weeks',
      iconName: 'Boxes',
      accentHex: '#06b6d4',
      featured: true,
    },
    {
      id: 'srv-fullstack',
      title: 'Full-Stack Web Development & Custom SaaS Apps',
      category: 'Engineering',
      shortDescription:
        'Production-grade web platforms, SaaS applications, Firebase & SQL backends, and high-concurrency APIs engineered on Node.js, Python, and modern cloud databases.',
      deliverables: [
        'Node.js, Python & Firebase Backends',
        'Firestore / PostgreSQL / SQLite',
        'Google OAuth & Multi-Role Auth',
        'Real-Time Client & Order Portals',
      ],
      priceLabel: 'From $2,200',
      turnaround: '2 – 5 Weeks',
      iconName: 'Code2',
      accentHex: '#3b82f6',
      featured: true,
    },
    {
      id: 'srv-mobile-apk',
      title: 'Mobile App Development, APK Packaging & Publishing',
      category: 'Mobile & Apps',
      shortDescription:
        'End-to-end Android & cross-platform mobile apps, signed production APK/AAB packaging, PWA ecosystems, and store-ready publishing workflows.',
      deliverables: [
        'Cross-Platform Mobile Apps',
        'Signed Release APK & AAB Builds',
        'Push Notifications & Cloud Sync',
        'Play Store & Web Publishing',
      ],
      priceLabel: 'From $1,600',
      turnaround: '2 – 4 Weeks',
      iconName: 'Smartphone',
      accentHex: '#6366f1',
      featured: false,
    },
    {
      id: 'srv-cloud-ssl',
      title: 'Web Hosting, SSL Configuration & Cloud Deployment',
      category: 'Cloud & DevOps',
      shortDescription:
        'Bulletproof cloud deployment, custom DNS routing, zero-downtime CI/CD pipelines, automated SSL/TLS security hardening, and global CDN acceleration.',
      deliverables: [
        'Cloud Server & Firebase Hosting',
        'Automated Wildcard SSL / HTTPS',
        'Global Edge CDN Caching',
        'Uptime Monitoring & Backups',
      ],
      priceLabel: 'From $450',
      turnaround: '24 – 72 Hours',
      iconName: 'CloudCog',
      accentHex: '#0ea5e9',
      featured: false,
    },
    {
      id: 'srv-uiux-brand',
      title: 'UI/UX Prototyping, Minimalist Logos & Brand Design',
      category: 'Design & Identity',
      shortDescription:
        'Iconic minimalist brandmarks, complete typography & color systems, interactive Figma prototypes, and conversion-engineered product design.',
      deliverables: [
        'Minimalist Vector Logo Suite',
        'Complete Brand Identity Guidelines',
        'Interactive UI/UX Prototypes',
        'Reusable Design Component System',
      ],
      priceLabel: 'From $750',
      turnaround: '5 – 10 Days',
      iconName: 'Sparkles',
      accentHex: '#8b5cf6',
      featured: false,
    },
    {
      id: 'srv-ai-media',
      title: 'AI Photo/Video Creation, Automated Editing & Voiceovers',
      category: 'AI Media Studio',
      shortDescription:
        'High-retention AI commercial imagery, automated video editing pipelines, click-magnet YouTube thumbnails, and lifelike studio voiceovers.',
      deliverables: [
        'AI Commercial Photo & Video Assets',
        'Automated Short/Long-Form Editing',
        'High-CTR YouTube Thumbnail Packs',
        'Studio Voiceovers & Audio Mastering',
      ],
      priceLabel: 'From $550',
      turnaround: '2 – 5 Days',
      iconName: 'Video',
      accentHex: '#22d3ee',
      featured: true,
    },
    {
      id: 'srv-marketing-social',
      title: 'Digital Marketing, Social Strategy & Channels (@SoulSyllables)',
      category: 'Growth & Channels',
      shortDescription:
        'Data-backed social growth architecture, multi-platform content systems, audience retention storytelling, and flagship channel direction inspired by @SoulSyllables.',
      deliverables: [
        'Multi-Platform Social Growth Strategy',
        'Viral Reels/Shorts Content Systems',
        'Channel Direction (@SoulSyllables Model)',
        'Audience Analytics & Campaign Scaling',
      ],
      priceLabel: 'From $900 / mo',
      turnaround: 'Ongoing Retainer',
      iconName: 'Megaphone',
      accentHex: '#38bdf8',
      featured: true,
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Pivotix Interactive Product Configurator',
      subtitle: 'Real-Time Shader & Enterprise E-Commerce Platform',
      category: 'Web & Interactive UI',
      description:
        'Engineered a high-conversion interactive product configurator enabling enterprise buyers to inspect precision hardware, configure custom specs in real time, and submit instant orders.',
      imageUrl: './images/project-3d-commerce.jpg',
      tags: ['React', 'Three.js', 'TypeScript', 'Tailwind CSS'],
      metricLabel: 'Conversion Lift',
      metricValue: '+285%',
      clientName: 'Pivotix Precision Systems',
      year: '2026',
      liveUrl: '#order',
      featured: true,
    },
    {
      id: 'proj-2',
      title: '@SoulSyllables — AI Media & Digital Content Ecosystem',
      subtitle: 'Flagship Creative Channel, Automated Video Pipeline & Sonic Branding',
      category: 'AI Media & Branding',
      description:
        'Conceived, branded, and scaled @SoulSyllables with custom AI visual synthesis, automated cinema-grade audio mastering workflows, high-CTR thumbnail systems, and cross-platform storytelling.',
      imageUrl: './images/project-soulsyllables.jpg',
      tags: ['AI Video Synthesis', 'Studio Voiceover', 'Brand Strategy', '@SoulSyllables'],
      metricLabel: 'Audience Reach',
      metricValue: '1.4M+ Views',
      clientName: 'SwiftStack Media Originals',
      year: '2026',
      liveUrl: '#order',
      featured: true,
    },
    {
      id: 'proj-3',
      title: 'NexusCloud Full-Stack Orchestrator & SSL Matrix',
      subtitle: 'Enterprise Multi-Region Cloud Deployment & Telemetry Platform',
      category: 'Full-Stack & Cloud',
      description:
        'Full-stack cloud control plane featuring automated SSL provisioning, real-time server health telemetry, Firebase & SQL synchronization, and sub-50ms global API latency.',
      imageUrl: './images/project-fullstack-cloud.jpg',
      tags: ['Node.js', 'Firebase', 'Cloud SSL', 'React', 'Real-Time Sync'],
      metricLabel: 'Platform Uptime',
      metricValue: '99.99%',
      clientName: 'NexusCloud Infrastructure',
      year: '2026',
      liveUrl: '#order',
      featured: true,
    },
    {
      id: 'proj-4',
      title: 'NovaPay Cross-Platform Mobile App & Signed APK Suite',
      subtitle: 'High-Speed Fintech Mobile Experience, Custom APK & Web Portal',
      category: 'Mobile & APK',
      description:
        'Designed and shipped a sleek dark-mode mobile application packaged with automated signed Android APK distribution, biometric UX, instant ledger sync, and matching web portal.',
      imageUrl: './images/project-mobile-apk.jpg',
      tags: ['Mobile UI/UX', 'Signed APK Build', 'Firebase Auth', 'Cloud Sync'],
      metricLabel: 'Active Installs',
      metricValue: '65K+ Downloads',
      clientName: 'NovaPay FinTech',
      year: '2025',
      liveUrl: '#order',
      featured: true,
    },
  ],
};

export const INITIAL_SAMPLE_INQUIRIES: InquiryItem[] = [
  {
    id: 'inq-seed-1',
    clientId: 'user-client-demo',
    clientName: 'Zainab Malik',
    clientEmail: 'zainab@lumina-tech.io',
    companyName: 'Lumina Tech Labs',
    serviceTitle: 'Full-Stack Web Development & Custom SaaS Apps',
    budgetRange: '$3,000 – $7,500',
    timeline: '2 – 4 Weeks',
    projectDetails:
      'Looking for a modern SaaS web platform with Google login, real-time order tracking, and clean dark glassmorphic UI.',
    status: 'quoted',
    quotedAmount: '$3,400 USD',
    adminResponse:
      'Architecture blueprint ready — includes React frontend, Firebase Auth + Firestore backend, and SSL deployment.',
    createdAt: '2026-10-18T10:30:00.000Z',
    updatedAt: '2026-10-19T14:15:00.000Z',
  },
  {
    id: 'inq-seed-2',
    clientId: null,
    clientName: 'Daniel Vance',
    clientEmail: 'daniel@vancemedia.co',
    companyName: 'Vance Creative Group',
    serviceTitle: 'AI Photo/Video Creation, Automated Editing & Voiceovers',
    budgetRange: '$1,500 – $3,000',
    timeline: 'Urgent (< 2 Weeks)',
    projectDetails:
      'We loved the @SoulSyllables visual aesthetic and want a monthly package of 12 AI-enhanced YouTube thumbnails, short-form edits, and studio voiceovers.',
    status: 'new',
    quotedAmount: '',
    adminResponse: '',
    createdAt: '2026-10-20T06:45:00.000Z',
    updatedAt: '2026-10-20T06:45:00.000Z',
  },
];
