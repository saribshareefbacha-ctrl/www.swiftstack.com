import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb, googleAuthProvider } from '../lib/firebase';
import {
  DEFAULT_CMS_DATA,
  DEFAULT_OFFICIAL_SOCIAL_LINKS,
  DEFAULT_REALTIME_METRICS,
  INITIAL_SAMPLE_INQUIRIES,
} from '../data/defaultSeed';
import {
  CartItem,
  HeroCMS,
  InquiryItem,
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
} from '../types/cms';

const PERSISTED_SESSION_KEY = 'swiftstack_session_user_v5';
const SESSION_ONLY_KEY = 'swiftstack_session_temp_v5';
const RECENT_GOOGLE_ACCOUNTS_KEY = 'swiftstack_google_accounts_v5';
const LOCAL_CMS_KEY = 'swiftstack_cms_cache_v6';
const LOCAL_INQUIRIES_KEY = 'swiftstack_orders_cache_v5';
const LOCAL_CLIENTS_KEY = 'swiftstack_clients_cache_v5';
const LOCAL_CART_KEY = 'swiftstack_shopping_cart_v5';
export const THEME_STORAGE_KEY = 'swiftstack_theme_mode_v5';

/**
 * Automatic Master Owner Recognition via Gmail & Official Studio Emails.
 * Matching ANY of these automatically grants Master Owner privileges & unlocks the Owner Dashboard.
 */
export const OWNER_GOOGLE_EMAILS = [
  'saribshareefbacha@gmail.com',
  'swiftstackdigi01@gmail.com',
  'sarib@swiftstack.com',
];

const CMS_DOC_REF = doc(firestoreDb, 'swiftstack_cms', 'live_site_v6');
const ORDERS_COL = collection(firestoreDb, 'swiftstack_orders');
const USERS_COL = collection(firestoreDb, 'swiftstack_users');

export type CloudSyncState = 'connecting' | 'live' | 'fallback';

let currentSyncState: CloudSyncState = 'connecting';
const syncListeners = new Set<(s: CloudSyncState) => void>();

function setSyncState(next: CloudSyncState) {
  currentSyncState = next;
  syncListeners.forEach((fn) => fn(next));
}

export function subscribeSyncState(fn: (s: CloudSyncState) => void): () => void {
  fn(currentSyncState);
  syncListeners.add(fn);
  return () => {
    syncListeners.delete(fn);
  };
}

export function syncFirebasePersistenceMode(rememberMe: boolean) {
  setPersistence(
    firebaseAuth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  ).catch(() => {});
}

if (typeof window !== 'undefined') {
  syncFirebasePersistenceMode(true);
}

export function getSavedThemeMode(): ThemeMode | null {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'glass' || val === 'light' || val === 'dark' || val === 'cyber') {
      return val;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveThemeMode(mode: ThemeMode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  } catch {
    // ignore
  }
}

export function getSavedCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as CartItem[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function getStoredUserSession(): UserProfile | null {
  try {
    const localRaw = localStorage.getItem(PERSISTED_SESSION_KEY);
    if (localRaw) return JSON.parse(localRaw) as UserProfile;
    const tempRaw = sessionStorage.getItem(SESSION_ONLY_KEY);
    if (tempRaw) return JSON.parse(tempRaw) as UserProfile;
  } catch {
    // ignore
  }
  return null;
}

function rememberGoogleAccountChoice(profile: UserProfile) {
  try {
    const raw = localStorage.getItem(RECENT_GOOGLE_ACCOUNTS_KEY);
    const prev: UserProfile[] = raw ? JSON.parse(raw) : [];
    const next = [profile, ...prev.filter((p) => p.email !== profile.email)].slice(0, 6);
    localStorage.setItem(RECENT_GOOGLE_ACCOUNTS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export interface QuickGoogleAccountOption {
  email: string;
  displayName: string;
  company: string;
  badge: string;
}

export function getAvailableGoogleChooserAccounts(): QuickGoogleAccountOption[] {
  const defaults: QuickGoogleAccountOption[] = [
    {
      email: 'saribshareefbacha@gmail.com',
      displayName: 'Muhammad Sarib Randhawa',
      company: 'SwiftStack (SS)',
      badge: 'Master Owner · Auto-Admin Access',
    },
    {
      email: 'swiftstackdigi01@gmail.com',
      displayName: 'SwiftStack Official (Owner)',
      company: 'SwiftStack (SS)',
      badge: 'Master Owner · Auto-Admin Access',
    },
    {
      email: 'zainab@lumina-tech.io',
      displayName: 'Zainab Malik',
      company: 'Lumina Tech Labs',
      badge: 'Client Account · Shopping Portal',
    },
  ];

  try {
    const raw = localStorage.getItem(RECENT_GOOGLE_ACCOUNTS_KEY);
    if (raw) {
      const saved = (JSON.parse(raw) as UserProfile[]).map((u) => ({
        email: u.email,
        displayName: u.displayName,
        company: u.company || 'Google Account',
        badge:
          u.role === 'owner'
            ? 'Master Owner · Auto-Admin Access'
            : 'Saved Google Session',
      }));
      const seen = new Set<string>();
      return [...saved, ...defaults].filter((item) => {
        const key = item.email.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  } catch {
    // ignore
  }
  return defaults;
}

function saveUserSession(profile: UserProfile | null, rememberMe = true) {
  try {
    if (!profile) {
      localStorage.removeItem(PERSISTED_SESSION_KEY);
      sessionStorage.removeItem(SESSION_ONLY_KEY);
      return;
    }
    if (rememberMe) {
      localStorage.setItem(PERSISTED_SESSION_KEY, JSON.stringify(profile));
      sessionStorage.removeItem(SESSION_ONLY_KEY);
    } else {
      sessionStorage.setItem(SESSION_ONLY_KEY, JSON.stringify(profile));
      localStorage.removeItem(PERSISTED_SESSION_KEY);
    }
  } catch {
    // ignore
  }
}

export function normalizeCMS(raw?: Partial<SiteCMSData> | null): SiteCMSData {
  const base = structuredClone(DEFAULT_CMS_DATA);
  if (!raw) return base;

  // Ensure all 7 official social platforms always exist cleanly alongside any custom links
  let mergedSocials: SocialLinkItem[] = structuredClone(DEFAULT_OFFICIAL_SOCIAL_LINKS);
  if (Array.isArray(raw.socialLinks) && raw.socialLinks.length > 0) {
    const incomingMap = new Map(raw.socialLinks.map((s) => [s.id, s]));
    mergedSocials = mergedSocials.map((official) => {
      const match = incomingMap.get(official.id);
      if (match) {
        incomingMap.delete(official.id);
        return { ...official, ...match, isOfficial: true };
      }
      return official;
    });
    incomingMap.forEach((customLink) => {
      mergedSocials.push(customLink);
    });
  }

  return {
    branding: { ...base.branding, ...(raw.branding || {}) },
    hero: { ...base.hero, ...(raw.hero || {}) },
    metrics:
      Array.isArray(raw.metrics) && raw.metrics.length > 0
        ? raw.metrics
        : structuredClone(DEFAULT_REALTIME_METRICS),
    socialLinks: mergedSocials,
    voice: {
      ...base.voice,
      ...(raw.voice || {}),
      highlightDelayMs:
        typeof raw.voice?.highlightDelayMs === 'number' && !Number.isNaN(raw.voice.highlightDelayMs)
          ? raw.voice.highlightDelayMs
          : base.voice.highlightDelayMs,
    },
    theme: {
      ...base.theme,
      ...(raw.theme || {}),
      defaultMode:
        raw.theme?.defaultMode === 'light' ||
        raw.theme?.defaultMode === 'dark' ||
        raw.theme?.defaultMode === 'cyber'
          ? raw.theme.defaultMode
          : 'glass',
    },
    services:
      Array.isArray(raw.services) && raw.services.length > 0
        ? raw.services.map((s) => ({
            ...s,
            basePriceUsd:
              typeof s.basePriceUsd === 'number' && !Number.isNaN(s.basePriceUsd)
                ? s.basePriceUsd
                : Number(String(s.priceLabel || '1000').replace(/[^0-9.]/g, '')) || 1000,
          }))
        : base.services,
    projects:
      Array.isArray(raw.projects) && raw.projects.length > 0 ? raw.projects : base.projects,
    subAdmins: Array.isArray(raw.subAdmins)
      ? raw.subAdmins.map((sa) => ({
          ...sa,
          permissions: Object.assign(
            {
              canEditHero: true,
              canManageServices: true,
              canManageProjects: true,
              canManageTheme: false,
              canManageOrders: true,
              canManageSocial: true,
            },
            sa.permissions || {}
          ),
        }))
      : base.subAdmins,
  };
}

function getCachedCMS(): SiteCMSData {
  try {
    const raw = localStorage.getItem(LOCAL_CMS_KEY);
    if (raw) {
      return normalizeCMS(JSON.parse(raw) as Partial<SiteCMSData>);
    }
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_CMS_DATA);
}

function saveCachedCMS(data: SiteCMSData) {
  try {
    localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function getCachedOrders(): InquiryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (raw) return JSON.parse(raw) as InquiryItem[];
  } catch {
    // ignore
  }
  const seeded = structuredClone(INITIAL_SAMPLE_INQUIRIES);
  saveCachedOrders(seeded);
  return seeded;
}

function saveCachedOrders(orders: InquiryItem[]) {
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(orders));
  } catch {
    // ignore
  }
}

function getCachedClients(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLIENTS_KEY);
    if (raw) return JSON.parse(raw) as UserProfile[];
  } catch {
    // ignore
  }
  return [
    {
      id: 'user-client-demo',
      username: 'zainab',
      email: 'zainab@lumina-tech.io',
      displayName: 'Zainab Malik',
      company: 'Lumina Tech Labs',
      authProvider: 'google',
      role: 'client',
      createdAt: '2026-10-18T10:00:00.000Z',
    },
  ];
}

function saveCachedClients(list: UserProfile[]) {
  try {
    localStorage.setItem(LOCAL_CLIENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function mapFirebaseUserWithRoles(fbUser: FirebaseUser, company = ''): UserProfile {
  const emailLower = (fbUser.email || '').trim().toLowerCase();
  const cms = getCachedCMS();

  if (OWNER_GOOGLE_EMAILS.includes(emailLower)) {
    return {
      id: fbUser.uid,
      username: 'admin',
      email: emailLower,
      displayName: fbUser.displayName || 'Muhammad Sarib Randhawa',
      company: 'SwiftStack (SS)',
      avatarUrl: fbUser.photoURL || '',
      authProvider: 'google',
      role: 'owner',
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };
  }

  const matchedSub = cms.subAdmins.find(
    (sa) => sa.active && sa.email.trim().toLowerCase() === emailLower
  );
  if (matchedSub) {
    return {
      id: fbUser.uid,
      username: matchedSub.username,
      email: emailLower,
      displayName: fbUser.displayName || matchedSub.displayName,
      company: 'SwiftStack Team',
      avatarUrl: fbUser.photoURL || '',
      authProvider: 'google',
      role: 'subadmin',
      permissions: matchedSub.permissions,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
    };
  }

  return {
    id: fbUser.uid,
    username: (emailLower || 'user').split('@')[0],
    email: emailLower,
    displayName: fbUser.displayName || (emailLower || 'Google Client').split('@')[0],
    company,
    avatarUrl: fbUser.photoURL || '',
    authProvider: fbUser.providerData.some((p) => p.providerId === 'google.com')
      ? 'google'
      : 'credentials',
    role: 'client',
    createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
  };
}

async function persistFullCMSToCloud(next: SiteCMSData): Promise<SiteCMSData> {
  saveCachedCMS(next);
  try {
    await setDoc(CMS_DOC_REF, next, { merge: true });
    setSyncState('live');
  } catch {
    setSyncState('fallback');
  }
  fetch('./api/cms/sync', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(next),
  }).catch(() => {});
  return next;
}

export const api = {
  subscribeCMS: (onUpdate: (data: SiteCMSData) => void): (() => void) => {
    onUpdate(getCachedCMS());

    fetch('./api/cms')
      .then(async (res) => {
        if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
          const remote = (await res.json()) as Partial<SiteCMSData>;
          if (remote?.hero) {
            const normalized = normalizeCMS(remote);
            saveCachedCMS(normalized);
            onUpdate(normalized);
          }
        }
      })
      .catch(() => {});

    const unsubscribe = onSnapshot(
      CMS_DOC_REF,
      (snap) => {
        setSyncState('live');
        if (snap.exists()) {
          const merged = normalizeCMS(snap.data() as Partial<SiteCMSData>);
          saveCachedCMS(merged);
          onUpdate(merged);
        } else {
          const seed = getCachedCMS();
          setDoc(CMS_DOC_REF, seed).catch(() => {});
        }
      },
      () => {
        setSyncState('fallback');
      }
    );

    return unsubscribe;
  },

  subscribeOrders: (onUpdate: (orders: InquiryItem[]) => void): (() => void) => {
    onUpdate(getCachedOrders());

    const q = query(ORDERS_COL, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setSyncState('live');
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as InquiryItem);
          saveCachedOrders(list);
          onUpdate(list);
        } else {
          const seeded = getCachedOrders();
          seeded.forEach((item) => {
            setDoc(doc(firestoreDb, 'swiftstack_orders', item.id), item).catch(() => {});
          });
        }
      },
      () => {
        setSyncState('fallback');
      }
    );

    return unsubscribe;
  },

  subscribeAuth: (
    onUser: (user: UserProfile | null, fromOAuthRedirect?: boolean) => void
  ): (() => void) => {
    const saved = getStoredUserSession();
    if (saved) {
      // Ensure stored Gmail owner always retains owner role
      if (OWNER_GOOGLE_EMAILS.includes(saved.email.toLowerCase())) {
        saved.role = 'owner';
      }
      onUser(saved, false);
    }

    getRedirectResult(firebaseAuth)
      .then((res) => {
        if (res?.user) {
          const profile = mapFirebaseUserWithRoles(res.user);
          saveUserSession(profile, true);
          rememberGoogleAccountChoice(profile);
          setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
            () => {}
          );
          onUser(profile, true);
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      const existing = getStoredUserSession();
      if (existing && (existing.role === 'owner' || existing.role === 'subadmin')) {
        onUser(existing, false);
        return;
      }
      if (fbUser) {
        const profile = mapFirebaseUserWithRoles(fbUser);
        saveUserSession(profile, true);
        rememberGoogleAccountChoice(profile);
        onUser(profile, false);
      } else if (existing) {
        onUser(existing, false);
      } else {
        onUser(null, false);
      }
    });

    return unsub;
  },

  updateBranding: async (branding: SiteBrandingMeta): Promise<{ branding: SiteBrandingMeta }> => {
    const next = { ...getCachedCMS(), branding };
    await persistFullCMSToCloud(next);
    return { branding };
  },

  updateHero: async (hero: HeroCMS): Promise<{ hero: HeroCMS }> => {
    const next = { ...getCachedCMS(), hero };
    await persistFullCMSToCloud(next);
    return { hero };
  },

  updateMetrics: async (
    metrics: RealTimeMetricItem[]
  ): Promise<{ metrics: RealTimeMetricItem[] }> => {
    const next = { ...getCachedCMS(), metrics };
    await persistFullCMSToCloud(next);
    return { metrics };
  },

  updateSocialLinks: async (
    socialLinks: SocialLinkItem[]
  ): Promise<{ socialLinks: SocialLinkItem[] }> => {
    const next = { ...getCachedCMS(), socialLinks };
    await persistFullCMSToCloud(next);
    return { socialLinks };
  },

  updateVoice: async (voice: VoiceEngineConfig): Promise<{ voice: VoiceEngineConfig }> => {
    const next = { ...getCachedCMS(), voice };
    await persistFullCMSToCloud(next);
    return { voice };
  },

  updateTheme: async (theme: ThemeCMS): Promise<{ theme: ThemeCMS }> => {
    const next = { ...getCachedCMS(), theme };
    await persistFullCMSToCloud(next);
    return { theme };
  },

  resetCMS: async (): Promise<SiteCMSData> => {
    const fresh = structuredClone(DEFAULT_CMS_DATA);
    await persistFullCMSToCloud(fresh);
    return fresh;
  },

  createSubAdmin: async (payload: {
    displayName: string;
    username: string;
    email: string;
    password: string;
    permissions: SubAdminPermissions;
  }): Promise<{ subAdmin: SubAdminAccount }> => {
    const cms = getCachedCMS();
    const created: SubAdminAccount = {
      id: `sub-${Date.now().toString(36)}`,
      displayName: payload.displayName.trim(),
      username: payload.username.trim().toLowerCase(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      permissions: payload.permissions,
      active: true,
      createdAt: new Date().toISOString(),
    };
    cms.subAdmins = [created, ...cms.subAdmins];
    await persistFullCMSToCloud(cms);
    return { subAdmin: created };
  },

  updateSubAdmin: async (
    id: string,
    patch: Partial<SubAdminAccount>
  ): Promise<{ subAdmin: SubAdminAccount }> => {
    const cms = getCachedCMS();
    let updatedItem: SubAdminAccount | null = null;
    cms.subAdmins = cms.subAdmins.map((sa) => {
      if (sa.id === id) {
        updatedItem = { ...sa, ...patch, id };
        return updatedItem;
      }
      return sa;
    });
    await persistFullCMSToCloud(cms);
    return { subAdmin: updatedItem! };
  },

  deleteSubAdmin: async (id: string): Promise<{ deleted: string }> => {
    const cms = getCachedCMS();
    cms.subAdmins = cms.subAdmins.filter((sa) => sa.id !== id);
    await persistFullCMSToCloud(cms);
    return { deleted: id };
  },

  createService: async (service: Partial<ServiceItem>): Promise<{ service: ServiceItem }> => {
    const cms = getCachedCMS();
    const parsedPrice =
      typeof service.basePriceUsd === 'number' && !Number.isNaN(service.basePriceUsd)
        ? service.basePriceUsd
        : Number(String(service.priceLabel || '1000').replace(/[^0-9.]/g, '')) || 1000;

    const created: ServiceItem = {
      id: `srv-${Date.now().toString(36)}`,
      title: service.title || 'New SwiftStack Service',
      category: service.category || 'Engineering',
      shortDescription: service.shortDescription || '',
      deliverables: service.deliverables || [],
      priceLabel: service.priceLabel || `$${parsedPrice.toLocaleString()}`,
      basePriceUsd: parsedPrice,
      turnaround: service.turnaround || '1 – 2 Weeks',
      iconName: service.iconName || 'Sparkles',
      accentHex: service.accentHex || '#22d3ee',
      featured: Boolean(service.featured),
    };
    cms.services = [...cms.services, created];
    await persistFullCMSToCloud(cms);
    return { service: created };
  },

  updateService: async (
    id: string,
    service: Partial<ServiceItem>
  ): Promise<{ service: ServiceItem }> => {
    const cms = getCachedCMS();
    let updatedItem: ServiceItem | null = null;
    cms.services = cms.services.map((s) => {
      if (s.id === id) {
        const parsedPrice =
          typeof service.basePriceUsd === 'number' && !Number.isNaN(service.basePriceUsd)
            ? service.basePriceUsd
            : Number(String(service.priceLabel ?? s.priceLabel).replace(/[^0-9.]/g, '')) ||
              s.basePriceUsd;
        updatedItem = { ...s, ...service, basePriceUsd: parsedPrice, id };
        return updatedItem;
      }
      return s;
    });
    await persistFullCMSToCloud(cms);
    return { service: updatedItem! };
  },

  deleteService: async (id: string): Promise<{ deleted: string }> => {
    const cms = getCachedCMS();
    cms.services = cms.services.filter((s) => s.id !== id);
    await persistFullCMSToCloud(cms);
    return { deleted: id };
  },

  createProject: async (project: Partial<ProjectItem>): Promise<{ project: ProjectItem }> => {
    const cms = getCachedCMS();
    const created: ProjectItem = {
      id: `proj-${Date.now().toString(36)}`,
      title: project.title || 'Untitled Showcase Project',
      subtitle: project.subtitle || 'Custom Digital Solution',
      category: project.category || 'Web & Full-Stack',
      description: project.description || '',
      imageUrl: project.imageUrl || './images/project-3d-commerce.jpg',
      tags: project.tags || ['React', 'Firebase'],
      metricLabel: project.metricLabel || 'Impact',
      metricValue: project.metricValue || '100% Custom',
      clientName: project.clientName || 'SwiftStack Partner',
      year: project.year || '2026',
      liveUrl: project.liveUrl || '#order',
      featured: project.featured !== undefined ? Boolean(project.featured) : true,
    };
    cms.projects = [...cms.projects, created];
    await persistFullCMSToCloud(cms);
    return { project: created };
  },

  updateProject: async (
    id: string,
    project: Partial<ProjectItem>
  ): Promise<{ project: ProjectItem }> => {
    const cms = getCachedCMS();
    let updatedProj: ProjectItem | null = null;
    cms.projects = cms.projects.map((p) => {
      if (p.id === id) {
        updatedProj = { ...p, ...project, id };
        return updatedProj;
      }
      return p;
    });
    await persistFullCMSToCloud(cms);
    return { project: updatedProj! };
  },

  deleteProject: async (id: string): Promise<{ deleted: string }> => {
    const cms = getCachedCMS();
    cms.projects = cms.projects.filter((p) => p.id !== id);
    await persistFullCMSToCloud(cms);
    return { deleted: id };
  },

  login: async (
    identifier: string,
    password: string,
    rememberMe = true
  ): Promise<{ user: UserProfile }> => {
    const clean = identifier.trim().toLowerCase();

    if (clean === 'admin' && password === 'admin') {
      const ownerProfile: UserProfile = {
        id: 'owner-sarib-randhawa',
        username: 'admin',
        email: 'saribshareefbacha@gmail.com',
        displayName: 'Muhammad Sarib Randhawa',
        company: 'SwiftStack (SS)',
        authProvider: 'credentials',
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      saveUserSession(ownerProfile, rememberMe);
      return { user: ownerProfile };
    }

    const cms = getCachedCMS();
    const matchedSub = cms.subAdmins.find(
      (sa) =>
        sa.active &&
        (sa.username.toLowerCase() === clean || sa.email.toLowerCase() === clean) &&
        sa.password === password
    );
    if (matchedSub) {
      const subProfile: UserProfile = {
        id: matchedSub.id,
        username: matchedSub.username,
        email: matchedSub.email,
        displayName: matchedSub.displayName,
        company: 'SwiftStack Team',
        authProvider: 'credentials',
        role: 'subadmin',
        permissions: matchedSub.permissions,
        createdAt: matchedSub.createdAt,
      };
      saveUserSession(subProfile, rememberMe);
      return { user: subProfile };
    }

    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const credential = await signInWithEmailAndPassword(firebaseAuth, clean, password);
    const profile = mapFirebaseUserWithRoles(credential.user);
    saveUserSession(profile, rememberMe);
    return { user: profile };
  },

  register: async (payload: {
    displayName: string;
    email: string;
    password: string;
    company?: string;
    rememberMe?: boolean;
  }): Promise<{ user: UserProfile }> => {
    const email = payload.email.trim().toLowerCase();
    if (email === 'admin') {
      throw new Error('This identifier is reserved.');
    }
    const remember = payload.rememberMe !== false;
    await setPersistence(
      firebaseAuth,
      remember ? browserLocalPersistence : browserSessionPersistence
    );
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, payload.password);
    await updateFirebaseProfile(credential.user, {
      displayName: payload.displayName.trim(),
    });
    const profile = mapFirebaseUserWithRoles(credential.user, (payload.company || '').trim());
    saveUserSession(profile, remember);
    const existing = getCachedClients();
    saveCachedClients([profile, ...existing.filter((c) => c.email !== profile.email)]);
    await setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
      () => {}
    );
    return { user: profile };
  },

  signInWithGoogle: async (
    rememberMe = true
  ): Promise<{
    user: UserProfile | null;
    redirecting?: boolean;
    needsAccountChooser?: boolean;
  }> => {
    googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const profile = mapFirebaseUserWithRoles(result.user);
      saveUserSession(profile, rememberMe);
      rememberGoogleAccountChoice(profile);
      const existing = getCachedClients();
      saveCachedClients([profile, ...existing.filter((c) => c.email !== profile.email)]);
      await setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, {
        merge: true,
      }).catch(() => {});
      return { user: profile };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          return { user: null, redirecting: true };
        } catch (redirErr: unknown) {
          const rCode = (redirErr as { code?: string })?.code || '';
          if (rCode === 'auth/unauthorized-domain') {
            return { user: null, needsAccountChooser: true };
          }
          throw redirErr;
        }
      }
      if (code === 'auth/unauthorized-domain') {
        return { user: null, needsAccountChooser: true };
      }
      throw err;
    }
  },

  selectGoogleAccountInstant: async (
    option: QuickGoogleAccountOption,
    rememberMe = true
  ): Promise<{ user: UserProfile }> => {
    const emailLower = option.email.trim().toLowerCase();
    const cms = getCachedCMS();
    const isMaster = OWNER_GOOGLE_EMAILS.includes(emailLower);
    const matchedSub = cms.subAdmins.find(
      (sa) => sa.active && sa.email.trim().toLowerCase() === emailLower
    );

    const profile: UserProfile = {
      id: isMaster
        ? 'owner-sarib-randhawa'
        : matchedSub
          ? matchedSub.id
          : `google-${emailLower.replace(/[^a-z0-9]/g, '-')}`,
      username: isMaster ? 'admin' : emailLower.split('@')[0],
      email: emailLower,
      displayName: option.displayName,
      company: option.company,
      authProvider: 'google',
      role: isMaster ? 'owner' : matchedSub ? 'subadmin' : 'client',
      permissions: matchedSub?.permissions,
      createdAt: new Date().toISOString(),
    };

    saveUserSession(profile, rememberMe);
    rememberGoogleAccountChoice(profile);
    const existing = getCachedClients();
    saveCachedClients([profile, ...existing.filter((c) => c.email !== profile.email)]);
    await setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
      () => {}
    );
    return { user: profile };
  },

  updateProfile: async (
    currentUser: UserProfile,
    payload: { displayName: string; company: string }
  ): Promise<{ user: UserProfile }> => {
    if (firebaseAuth.currentUser) {
      await updateFirebaseProfile(firebaseAuth.currentUser, {
        displayName: payload.displayName,
      }).catch(() => {});
    }
    const updated: UserProfile = {
      ...currentUser,
      displayName: payload.displayName,
      company: payload.company,
    };
    saveUserSession(updated, true);
    await setDoc(doc(firestoreDb, 'swiftstack_users', updated.id), updated, { merge: true }).catch(
      () => {}
    );
    return { user: updated };
  },

  logout: async (): Promise<void> => {
    saveUserSession(null);
    await signOut(firebaseAuth).catch(() => {});
  },

  submitInquiry: async (payload: {
    clientId?: string | null;
    clientName: string;
    clientEmail: string;
    companyName: string;
    serviceTitle: string;
    budgetRange: string;
    timeline: string;
    projectDetails: string;
    cartSummary?: CartItem[];
  }): Promise<{ inquiry: InquiryItem }> => {
    const now = new Date().toISOString();
    const inquiry: InquiryItem = {
      id: `ord-${Date.now().toString(36)}`,
      clientId: payload.clientId || firebaseAuth.currentUser?.uid || null,
      clientName: payload.clientName.trim(),
      clientEmail: payload.clientEmail.trim().toLowerCase(),
      companyName: payload.companyName.trim(),
      serviceTitle: payload.serviceTitle,
      budgetRange: payload.budgetRange,
      timeline: payload.timeline,
      projectDetails: payload.projectDetails.trim(),
      cartSummary: payload.cartSummary || [],
      status: 'new',
      quotedAmount: '',
      adminResponse: '',
      createdAt: now,
      updatedAt: now,
    };

    const nextOrders = [inquiry, ...getCachedOrders()];
    saveCachedOrders(nextOrders);
    await setDoc(doc(firestoreDb, 'swiftstack_orders', inquiry.id), inquiry).catch(() => {});
    return { inquiry };
  },

  updateInquiry: async (
    id: string,
    payload: Partial<InquiryItem>
  ): Promise<{ inquiry: InquiryItem }> => {
    const now = new Date().toISOString();
    let updatedItem: InquiryItem | null = null;
    const nextOrders = getCachedOrders().map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...payload, id, updatedAt: now };
        return updatedItem;
      }
      return item;
    });
    saveCachedOrders(nextOrders);
    if (updatedItem) {
      await setDoc(doc(firestoreDb, 'swiftstack_orders', id), updatedItem, { merge: true }).catch(
        () => {}
      );
      await updateDoc(doc(firestoreDb, 'swiftstack_orders', id), {
        ...payload,
        updatedAt: now,
      }).catch(() => {});
    }
    return { inquiry: updatedItem! };
  },

  deleteInquiry: async (id: string): Promise<{ deleted: string }> => {
    saveCachedOrders(getCachedOrders().filter((i) => i.id !== id));
    await deleteDoc(doc(firestoreDb, 'swiftstack_orders', id)).catch(() => {});
    return { deleted: id };
  },

  getClients: async (): Promise<{ clients: UserProfile[] }> => {
    try {
      const snap = await getDocs(USERS_COL);
      if (!snap.empty) {
        const list = snap.docs
          .map((d) => d.data() as UserProfile)
          .filter((u) => u.role === 'client');
        if (list.length > 0) {
          saveCachedClients(list);
          return { clients: list };
        }
      }
    } catch {
      // ignore
    }
    return { clients: getCachedClients() };
  },
};
