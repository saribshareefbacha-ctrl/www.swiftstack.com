import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
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
  SiteCMSData,
  ThemeCMS,
  UserProfile,
} from '../types/cms';

const TOKEN_STORAGE_KEY = 'swiftstack_session_token_v2';
const OWNER_SESSION_KEY = 'swiftstack_owner_session_v2';
const LOCAL_CMS_KEY = 'swiftstack_cms_cache_v2';
const LOCAL_INQUIRIES_KEY = 'swiftstack_orders_cache_v2';
const LOCAL_CLIENTS_KEY = 'swiftstack_clients_cache_v2';

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

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function getCachedCMS(): SiteCMSData {
  try {
    const raw = localStorage.getItem(LOCAL_CMS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteCMSData>;
      return {
        ...structuredClone(DEFAULT_CMS_DATA),
        ...parsed,
        hero: { ...DEFAULT_CMS_DATA.hero, ...(parsed.hero || {}) },
        theme: { ...DEFAULT_CMS_DATA.theme, ...(parsed.theme || {}) },
        character: { ...DEFAULT_CMS_DATA.character, ...(parsed.character || {}) },
      };
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

function mapFirebaseUser(fbUser: FirebaseUser, company = ''): UserProfile {
  return {
    id: fbUser.uid,
    username: (fbUser.email || 'user').split('@')[0],
    email: fbUser.email || '',
    displayName: fbUser.displayName || (fbUser.email || 'Client').split('@')[0],
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
  // Best-effort sync to optional local Express server if active
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
    // Immediately hydrate from cache/seed in 0ms
    onUpdate(getCachedCMS());

    // Fetch server state if Express backend is active
    fetch('./api/cms')
      .then(async (res) => {
        if (res.ok && (res.headers.get('content-type') || '').includes('application/json')) {
          const remote = (await res.json()) as SiteCMSData;
          if (remote?.hero) {
            saveCachedCMS(remote);
            onUpdate(remote);
          }
        }
      })
      .catch(() => {});

    // Attach real-time Firebase Firestore listener
    const unsubscribe = onSnapshot(
      CMS_DOC_REF,
      (snap) => {
        setSyncState('live');
        if (snap.exists()) {
          const cloud = snap.data() as SiteCMSData;
          const merged: SiteCMSData = {
            ...getCachedCMS(),
            ...cloud,
            hero: { ...DEFAULT_CMS_DATA.hero, ...(cloud.hero || {}) },
            theme: { ...DEFAULT_CMS_DATA.theme, ...(cloud.theme || {}) },
            character: { ...DEFAULT_CMS_DATA.character, ...(cloud.character || {}) },
            services: Array.isArray(cloud.services) ? cloud.services : DEFAULT_CMS_DATA.services,
            projects: Array.isArray(cloud.projects) ? cloud.projects : DEFAULT_CMS_DATA.projects,
          };
          saveCachedCMS(merged);
          onUpdate(merged);
        } else {
          // Initialize Firestore document cleanly on first visit
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
          // Seed initial orders cleanly if empty
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

  // Auth Session Observer (Firebase Auth + Hidden Owner Elevation)
  subscribeAuth: (onUser: (user: UserProfile | null) => void): (() => void) => {
    // Check if hidden owner session is active
    try {
      const savedOwner = localStorage.getItem(OWNER_SESSION_KEY);
      if (savedOwner) {
        onUser(JSON.parse(savedOwner) as UserProfile);
      }
    } catch {
      // ignore
    }

    // Complete any mobile Google redirect login seamlessly
    getRedirectResult(firebaseAuth)
      .then((res) => {
        if (res?.user) {
          const profile = mapFirebaseUser(res.user);
          setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
            () => {}
          );
          onUser(profile);
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      try {
        if (localStorage.getItem(OWNER_SESSION_KEY)) return;
      } catch {
        // ignore
      }
      if (fbUser) {
        const profile = mapFirebaseUser(fbUser);
        onUser(profile);
      } else {
        onUser(null);
      }
    });

    return unsub;
  },

  // CMS Section Updates
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

  // Unified Sign-In: Supports Hidden Admin ('admin' / 'admin') + Firebase Auth
  login: async (identifier: string, password: string): Promise<{ user: UserProfile }> => {
    const clean = identifier.trim().toLowerCase();

    // Hidden Owner Elevation ('admin' / 'admin')
    if (clean === 'admin' && password === 'admin') {
      const ownerProfile: UserProfile = {
        id: 'owner-sarib-randhawa',
        username: 'admin',
        email: 'sarib@swiftstack.com',
        displayName: 'Muhammad Sarib Randhawa',
        company: 'SwiftStack (SS)',
        avatarUrl: './images/ceo-3d-polo.png',
        authProvider: 'credentials',
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(ownerProfile));
      } catch {
        // ignore
      }
      return { user: ownerProfile };
    }

    // Standard Client Email/Password Sign-In via Firebase Auth
    const credential = await signInWithEmailAndPassword(firebaseAuth, clean, password);
    const profile = mapFirebaseUser(credential.user);
    return { user: profile };
  },

  // Client Registration via Firebase Auth
  register: async (payload: {
    displayName: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<{ user: UserProfile }> => {
    const email = payload.email.trim().toLowerCase();
    if (email === 'admin') {
      throw new Error('This identifier is reserved.');
    }
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, payload.password);
    await updateFirebaseProfile(credential.user, {
      displayName: payload.displayName.trim(),
    });
    const profile = mapFirebaseUser(credential.user, (payload.company || '').trim());
    const existing = getCachedClients();
    saveCachedClients([profile, ...existing.filter((c) => c.email !== profile.email)]);
    await setDoc(doc(firestoreDb, 'swiftstack_users', profile.id), profile, { merge: true }).catch(
      () => {}
    );
    return { user: profile };
  },

  // Google Sign-In via Firebase Authentication
  signInWithGoogle: async (): Promise<{ user: UserProfile | null; redirecting?: boolean }> => {
    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      const profile = mapFirebaseUser(result.user);
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

  // Guest / Instant Email Fallback for Unlisted Preview Domains
  quickClientSession: async (payload: {
    email: string;
    displayName: string;
    company?: string;
  }): Promise<{ user: UserProfile }> => {
    const profile: UserProfile = {
      id: `client-${Date.now().toString(36)}`,
      username: payload.email.split('@')[0],
      email: payload.email.trim().toLowerCase(),
      displayName: payload.displayName.trim(),
      company: (payload.company || '').trim(),
      authProvider: 'google',
      role: 'client',
      createdAt: new Date().toISOString(),
    };
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
    await setDoc(doc(firestoreDb, 'swiftstack_users', updated.id), updated, { merge: true }).catch(
      () => {}
    );
    return { user: updated };
  },

  logout: async (): Promise<void> => {
    try {
      localStorage.removeItem(OWNER_SESSION_KEY);
    } catch {
      // ignore
    }
    await signOut(firebaseAuth).catch(() => {});
  },

  // Orders & Inquiries CRUD (Real-time Firestore + Local Mirror)
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

  deleteClient: async (id: string): Promise<{ deleted: string }> => {
    saveCachedClients(getCachedClients().filter((c) => c.id !== id));
    await deleteDoc(doc(firestoreDb, 'swiftstack_users', id)).catch(() => {});
    return { deleted: id };
  },
};
