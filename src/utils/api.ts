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
import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from '../data/defaultSeed';
import {
  CharacterConfig,
  HeroCMS,
  InquiryItem,
  ProjectItem,
  ServiceItem,
  SiteBrandingMeta,
  SiteCMSData,
  SubAdminAccount,
  SubAdminPermissions,
  ThemeCMS,
  ThemeMode,
  UserProfile,
} from '../types/cms';

const PERSISTED_SESSION_KEY = 'swiftstack_session_user_v3';
const SESSION_ONLY_KEY = 'swiftstack_session_temp_v3';
const LOCAL_CMS_KEY = 'swiftstack_cms_cache_v3';
const LOCAL_INQUIRIES_KEY = 'swiftstack_orders_cache_v3';
const LOCAL_CLIENTS_KEY = 'swiftstack_clients_cache_v3';
export const THEME_STORAGE_KEY = 'swiftstack_theme_mode_v3';

const OWNER_GOOGLE_EMAILS = ['sarib@swiftstack.com', 'saribshareefbacha@gmail.com'];

const CMS_DOC_REF = doc(firestoreDb, 'swiftstack_cms', 'live_site');
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

export function getSavedThemeMode(): ThemeMode | null {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'glass' || val === 'dark' || val === 'light' || val === 'cyber') {
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

function normalizeCMS(raw?: Partial<SiteCMSData> | null): SiteCMSData {
  const base = structuredClone(DEFAULT_CMS_DATA);
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    branding: { ...base.branding, ...(raw.branding || {}) },
    hero: { ...base.hero, ...(raw.hero || {}) },
    theme: { ...base.theme, ...(raw.theme || {}) },
    character: { ...base.character, ...(raw.character || {}) },
    services: Array.isArray(raw.services) ? raw.services : base.services,
    projects: Array.isArray(raw.projects) ? raw.projects : base.projects,
    subAdmins: Array.isArray(raw.subAdmins) ? raw.subAdmins : base.subAdmins,
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
      avatarUrl: '',
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
      avatarUrl: fbUser.photoURL || './images/ceo-3d-polo.webp',
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
    displayName: fbUser.displayName || (emailLower || 'Client').split('@')[0],
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
  // Real-time Firestore listener for CMS Site Data
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

  // Real-time Firestore listener for Orders / Inquiries
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

  // Auth Session Observer with LocalStorage Persistence
  subscribeAuth: (onUser: (user: UserProfile | null) => void): (() => void) => {
    const saved = getStoredUserSession();
    if (saved) {
      onUser(saved);
    }

    getRedirectResult(firebaseAuth)
      .then((res) => {
        if (res?.user) {
          const profile = mapFirebaseUserWithRoles(res.user);
          saveUserSession(profile, true);
          setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
            () => {}
          );
          onUser(profile);
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      const existing = getStoredUserSession();
      if (existing && (existing.role === 'owner' || existing.role === 'subadmin')) {
        onUser(existing);
        return;
      }
      if (fbUser) {
        const profile = mapFirebaseUserWithRoles(fbUser);
        saveUserSession(profile, true);
        onUser(profile);
      } else if (existing) {
        onUser(existing);
      } else {
        onUser(null);
      }
    });

    return unsub;
  },

  // Master Branding & Meta Updates
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

  updateTheme: async (theme: ThemeCMS): Promise<{ theme: ThemeCMS }> => {
    const next = { ...getCachedCMS(), theme };
    await persistFullCMSToCloud(next);
    return { theme };
  },

  updateCharacter: async (character: CharacterConfig): Promise<{ character: CharacterConfig }> => {
    const next = { ...getCachedCMS(), character };
    await persistFullCMSToCloud(next);
    return { character };
  },

  resetCMS: async (): Promise<SiteCMSData> => {
    const fresh = structuredClone(DEFAULT_CMS_DATA);
    await persistFullCMSToCloud(fresh);
    return fresh;
  },

  // Sub-Admin Authorization & Management (Master Owner Only)
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

  // Services CRUD
  createService: async (service: Partial<ServiceItem>): Promise<{ service: ServiceItem }> => {
    const cms = getCachedCMS();
    const created: ServiceItem = {
      id: `srv-${Date.now().toString(36)}`,
      title: service.title || 'New SwiftStack Service',
      category: service.category || 'Engineering',
      shortDescription: service.shortDescription || '',
      deliverables: service.deliverables || [],
      priceLabel: service.priceLabel || 'Custom Quote',
      turnaround: service.turnaround || '1 – 2 Weeks',
      iconName: service.iconName || 'Sparkles',
      accentHex: service.accentHex || '#06b6d4',
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
        updatedItem = { ...s, ...service, id };
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

  // Projects CRUD
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

  // Unified Sign-In: Supports Master Owner ('admin'/'admin'), Sub-Admins, & Firebase Auth + Remember Me
  login: async (
    identifier: string,
    password: string,
    rememberMe = true
  ): Promise<{ user: UserProfile }> => {
    const clean = identifier.trim().toLowerCase();

    // 1. Master Owner Elevation ('admin' / 'admin')
    if (clean === 'admin' && password === 'admin') {
      const ownerProfile: UserProfile = {
        id: 'owner-sarib-randhawa',
        username: 'admin',
        email: 'sarib@swiftstack.com',
        displayName: 'Muhammad Sarib Randhawa',
        company: 'SwiftStack (SS)',
        avatarUrl: './images/ceo-3d-polo.webp',
        authProvider: 'credentials',
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      saveUserSession(ownerProfile, rememberMe);
      return { user: ownerProfile };
    }

    // 2. Authorized Sub-Admin Login
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

    // 3. Standard Client Sign-In via Firebase Auth with Persistence Mode
    await setPersistence(
      firebaseAuth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );
    const credential = await signInWithEmailAndPassword(firebaseAuth, clean, password);
    const profile = mapFirebaseUserWithRoles(credential.user);
    saveUserSession(profile, rememberMe);
    return { user: profile };
  },

  // Client Registration via Firebase Auth
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

  // Google Sign-In via Firebase Authentication (Popup + Redirect Fallback + Persistence)
  signInWithGoogle: async (): Promise<{ user: UserProfile | null; redirecting?: boolean }> => {
    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const profile = mapFirebaseUserWithRoles(result.user);
      saveUserSession(profile, true);
      const existing = getCachedClients();
      saveCachedClients([profile, ...existing.filter((c) => c.email !== profile.email)]);
      await setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, {
        merge: true,
      }).catch(() => {});
      return { user: profile };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(firebaseAuth, googleAuthProvider);
        return { user: null, redirecting: true };
      }
      throw err;
    }
  },

  // Instant Google Identity Bridge for Unlisted Preview Domains
  quickClientSession: async (payload: {
    email: string;
    displayName: string;
    company?: string;
  }): Promise<{ user: UserProfile }> => {
    const emailLower = payload.email.trim().toLowerCase();
    const isMaster = OWNER_GOOGLE_EMAILS.includes(emailLower);
    const profile: UserProfile = {
      id: `google-${Date.now().toString(36)}`,
      username: emailLower.split('@')[0],
      email: emailLower,
      displayName: payload.displayName.trim(),
      company: (payload.company || '').trim(),
      avatarUrl: isMaster ? './images/ceo-3d-polo.webp' : '',
      authProvider: 'google',
      role: isMaster ? 'owner' : 'client',
      createdAt: new Date().toISOString(),
    };
    saveUserSession(profile, true);
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

  // Orders & Inquiries CRUD
  submitInquiry: async (payload: {
    clientId?: string | null;
    clientName: string;
    clientEmail: string;
    companyName: string;
    serviceTitle: string;
    budgetRange: string;
    timeline: string;
    projectDetails: string;
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
