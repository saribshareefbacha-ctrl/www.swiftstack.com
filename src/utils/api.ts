import { DEFAULT_CMS_DATA, INITIAL_SAMPLE_INQUIRIES } from '../data/defaultSeed';
import {
  AvatarConfig,
  HeroCMS,
  InquiryItem,
  ProjectItem,
  ServiceItem,
  SiteCMSData,
  ThemeCMS,
  UserProfile,
} from '../types/cms';

const TOKEN_STORAGE_KEY = 'swiftstack_session_token';
const LOCAL_CMS_KEY = 'swiftstack_cms_state_v1';
const LOCAL_USERS_KEY = 'swiftstack_users_state_v1';
const LOCAL_INQUIRIES_KEY = 'swiftstack_inquiries_state_v1';

interface LocalUserRecord extends UserProfile {
  password: string;
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
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

// ============================================================================
// Seamless Client-Side Persistence Fallback (Powers Static GitHub Pages Builds!)
// ============================================================================
function getLocalCMS(): SiteCMSData {
  try {
    const raw = localStorage.getItem(LOCAL_CMS_KEY);
    if (raw) return JSON.parse(raw) as SiteCMSData;
  } catch {
    // ignore
  }
  return structuredClone(DEFAULT_CMS_DATA);
}

function saveLocalCMS(next: SiteCMSData): SiteCMSData {
  try {
    localStorage.setItem(LOCAL_CMS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

function getLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) return JSON.parse(raw) as LocalUserRecord[];
  } catch {
    // ignore
  }
  const now = new Date().toISOString();
  const seeded: LocalUserRecord[] = [
    {
      id: 'user-owner-admin',
      username: 'admin',
      email: 'sarib@swiftstack.com',
      displayName: 'Muhammad Sarib Randhawa',
      company: 'SwiftStack (SS)',
      avatarUrl: './images/scan-sample-sarib.jpg',
      authProvider: 'credentials',
      role: 'owner',
      createdAt: now,
      password: 'admin',
    },
    {
      id: 'user-client-demo',
      username: 'zainab',
      email: 'zainab@lumina-tech.io',
      displayName: 'Zainab Malik',
      company: 'Lumina Tech Labs',
      avatarUrl: '',
      authProvider: 'google',
      role: 'client',
      createdAt: now,
      password: 'client123',
    },
  ];
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalUsers(users: LocalUserRecord[]) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getLocalInquiries(): InquiryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_INQUIRIES_KEY);
    if (raw) return JSON.parse(raw) as InquiryItem[];
  } catch {
    // ignore
  }
  const seeded = structuredClone(INITIAL_SAMPLE_INQUIRIES);
  localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveLocalInquiries(list: InquiryItem[]) {
  try {
    localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function stripPassword(u: LocalUserRecord): UserProfile {
  const { password: _pw, ...profile } = u;
  return profile;
}

function getCurrentLocalUser(): LocalUserRecord | null {
  const token = getStoredToken();
  if (!token || !token.startsWith('local:')) return null;
  const userId = token.slice(6);
  return getLocalUsers().find((u) => u.id === userId) || null;
}

async function tryServerApi<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const token = getStoredToken();
    if (token && token.startsWith('local:')) {
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';

    // If static host returns HTML or 404/405 for /api/*, seamlessly use local engine
    if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
      return null;
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  } catch (err) {
    if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    return null;
  }
}

export const api = {
  getCMS: async (): Promise<SiteCMSData> => {
    const remote = await tryServerApi<SiteCMSData>('./api/cms');
    if (remote) return remote;
    return getLocalCMS();
  },

  updateHero: async (hero: HeroCMS): Promise<{ hero: HeroCMS }> => {
    const remote = await tryServerApi<{ hero: HeroCMS }>('./api/cms/hero', {
      method: 'PUT',
      body: JSON.stringify(hero),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    cms.hero = hero;
    saveLocalCMS(cms);
    return { hero };
  },

  updateTheme: async (theme: ThemeCMS): Promise<{ theme: ThemeCMS }> => {
    const remote = await tryServerApi<{ theme: ThemeCMS }>('./api/cms/theme', {
      method: 'PUT',
      body: JSON.stringify(theme),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    cms.theme = theme;
    saveLocalCMS(cms);
    return { theme };
  },

  updateAvatar: async (avatar: AvatarConfig): Promise<{ avatar: AvatarConfig }> => {
    const remote = await tryServerApi<{ avatar: AvatarConfig }>('./api/cms/avatar', {
      method: 'PUT',
      body: JSON.stringify(avatar),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    cms.avatar = avatar;
    saveLocalCMS(cms);
    return { avatar };
  },

  resetCMS: async (): Promise<SiteCMSData> => {
    const remote = await tryServerApi<SiteCMSData>('./api/cms/reset', {
      method: 'POST',
    });
    if (remote) return remote;
    return saveLocalCMS(structuredClone(DEFAULT_CMS_DATA));
  },

  createService: async (service: Partial<ServiceItem>): Promise<{ service: ServiceItem }> => {
    const remote = await tryServerApi<{ service: ServiceItem }>('./api/cms/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
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
    cms.services.push(created);
    saveLocalCMS(cms);
    return { service: created };
  },

  updateService: async (
    id: string,
    service: Partial<ServiceItem>
  ): Promise<{ service: ServiceItem }> => {
    const remote = await tryServerApi<{ service: ServiceItem }>(`./api/cms/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    let updatedItem: ServiceItem | null = null;
    cms.services = cms.services.map((s) => {
      if (s.id === id) {
        updatedItem = { ...s, ...service, id };
        return updatedItem;
      }
      return s;
    });
    saveLocalCMS(cms);
    return { service: updatedItem! };
  },

  deleteService: async (id: string): Promise<{ deleted: string }> => {
    const remote = await tryServerApi<{ deleted: string }>(`./api/cms/services/${id}`, {
      method: 'DELETE',
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    cms.services = cms.services.filter((s) => s.id !== id);
    saveLocalCMS(cms);
    return { deleted: id };
  },

  createProject: async (project: Partial<ProjectItem>): Promise<{ project: ProjectItem }> => {
    const remote = await tryServerApi<{ project: ProjectItem }>('./api/cms/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    const created: ProjectItem = {
      id: `proj-${Date.now().toString(36)}`,
      title: project.title || 'Untitled Showcase Project',
      subtitle: project.subtitle || 'Custom Digital Solution',
      category: project.category || '3D Web & Full-Stack',
      description: project.description || '',
      imageUrl: project.imageUrl || './images/project-3d-commerce.jpg',
      tags: project.tags || ['React', 'Three.js'],
      metricLabel: project.metricLabel || 'Impact',
      metricValue: project.metricValue || '100% Custom',
      clientName: project.clientName || 'SwiftStack Partner',
      year: project.year || '2026',
      liveUrl: project.liveUrl || '#contact',
      featured: project.featured !== undefined ? Boolean(project.featured) : true,
    };
    cms.projects.push(created);
    saveLocalCMS(cms);
    return { project: created };
  },

  updateProject: async (
    id: string,
    project: Partial<ProjectItem>
  ): Promise<{ project: ProjectItem }> => {
    const remote = await tryServerApi<{ project: ProjectItem }>(`./api/cms/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    let updatedProj: ProjectItem | null = null;
    cms.projects = cms.projects.map((p) => {
      if (p.id === id) {
        updatedProj = { ...p, ...project, id };
        return updatedProj;
      }
      return p;
    });
    saveLocalCMS(cms);
    return { project: updatedProj! };
  },

  deleteProject: async (id: string): Promise<{ deleted: string }> => {
    const remote = await tryServerApi<{ deleted: string }>(`./api/cms/projects/${id}`, {
      method: 'DELETE',
    });
    if (remote) return remote;
    const cms = getLocalCMS();
    cms.projects = cms.projects.filter((p) => p.id !== id);
    saveLocalCMS(cms);
    return { deleted: id };
  },

  login: async (identifier: string, password: string): Promise<{ token: string; user: UserProfile }> => {
    const remote = await tryServerApi<{ token: string; user: UserProfile }>('./api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (remote) return remote;

    const clean = identifier.trim().toLowerCase();
    const users = getLocalUsers();
    const match = users.find(
      (u) =>
        (u.username.toLowerCase() === clean || u.email.toLowerCase() === clean) &&
        u.password === password
    );
    if (!match) {
      throw new Error('Invalid credentials. Please verify your login details.');
    }
    return {
      token: `local:${match.id}`,
      user: stripPassword(match),
    };
  },

  register: async (payload: {
    displayName: string;
    email: string;
    password: string;
    company?: string;
  }): Promise<{ token: string; user: UserProfile }> => {
    const remote = await tryServerApi<{ token: string; user: UserProfile }>('./api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;

    const users = getLocalUsers();
    const email = payload.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists. Please sign in.');
    }
    const created: LocalUserRecord = {
      id: `user-${Date.now().toString(36)}`,
      username: email.split('@')[0],
      email,
      displayName: payload.displayName.trim(),
      company: (payload.company || '').trim(),
      avatarUrl: '',
      authProvider: 'credentials',
      role: 'client',
      createdAt: new Date().toISOString(),
      password: payload.password,
    };
    users.push(created);
    saveLocalUsers(users);
    return { token: `local:${created.id}`, user: stripPassword(created) };
  },

  googleAuth: async (payload: {
    email: string;
    displayName: string;
    company?: string;
    avatarUrl?: string;
  }): Promise<{ token: string; user: UserProfile }> => {
    const remote = await tryServerApi<{ token: string; user: UserProfile }>('./api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;

    const users = getLocalUsers();
    const email = payload.email.trim().toLowerCase();
    let match = users.find((u) => u.email.toLowerCase() === email);
    if (!match) {
      match = {
        id: `user-google-${Date.now().toString(36)}`,
        username: `g_${email.split('@')[0]}`,
        email,
        displayName: payload.displayName.trim() || 'Google Client',
        company: (payload.company || '').trim(),
        avatarUrl: payload.avatarUrl || '',
        authProvider: 'google',
        role: 'client',
        createdAt: new Date().toISOString(),
        password: '',
      };
      users.push(match);
      saveLocalUsers(users);
    }
    return { token: `local:${match.id}`, user: stripPassword(match) };
  },

  getMe: async (): Promise<{ user: UserProfile | null }> => {
    const remote = await tryServerApi<{ user: UserProfile | null }>('./api/auth/me');
    if (remote) return remote;
    const local = getCurrentLocalUser();
    return { user: local ? stripPassword(local) : null };
  },

  updateProfile: async (payload: {
    displayName: string;
    company: string;
  }): Promise<{ user: UserProfile }> => {
    const remote = await tryServerApi<{ user: UserProfile }>('./api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;
    const users = getLocalUsers();
    const cur = getCurrentLocalUser();
    if (!cur) throw new Error('Not signed in');
    let updated: LocalUserRecord = cur;
    const next = users.map((u) => {
      if (u.id === cur.id) {
        updated = { ...u, displayName: payload.displayName, company: payload.company };
        return updated;
      }
      return u;
    });
    saveLocalUsers(next);
    return { user: stripPassword(updated) };
  },

  logout: async (): Promise<{ ok: boolean }> => {
    await tryServerApi<{ ok: boolean }>('./api/auth/logout', { method: 'POST' });
    return { ok: true };
  },

  submitInquiry: async (payload: {
    clientName: string;
    clientEmail: string;
    companyName: string;
    serviceTitle: string;
    budgetRange: string;
    timeline: string;
    projectDetails: string;
  }): Promise<{ inquiry: InquiryItem }> => {
    const remote = await tryServerApi<{ inquiry: InquiryItem }>('./api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;

    const list = getLocalInquiries();
    const cur = getCurrentLocalUser();
    const now = new Date().toISOString();
    const inquiry: InquiryItem = {
      id: `inq-${Date.now().toString(36)}`,
      clientId: cur?.id || null,
      clientName: payload.clientName,
      clientEmail: payload.clientEmail.trim().toLowerCase(),
      companyName: payload.companyName,
      serviceTitle: payload.serviceTitle,
      budgetRange: payload.budgetRange,
      timeline: payload.timeline,
      projectDetails: payload.projectDetails,
      status: 'new',
      quotedAmount: '',
      adminResponse: '',
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(inquiry);
    saveLocalInquiries(list);
    return { inquiry };
  },

  getMyInquiries: async (): Promise<{ inquiries: InquiryItem[] }> => {
    const remote = await tryServerApi<{ inquiries: InquiryItem[] }>('./api/inquiries/mine');
    if (remote) return remote;
    const cur = getCurrentLocalUser();
    if (!cur) return { inquiries: [] };
    const list = getLocalInquiries().filter(
      (i) => i.clientId === cur.id || i.clientEmail.toLowerCase() === cur.email.toLowerCase()
    );
    return { inquiries: list };
  },

  getAllInquiries: async (): Promise<{ inquiries: InquiryItem[] }> => {
    const remote = await tryServerApi<{ inquiries: InquiryItem[] }>('./api/inquiries');
    if (remote) return remote;
    return { inquiries: getLocalInquiries() };
  },

  updateInquiry: async (
    id: string,
    payload: Partial<InquiryItem>
  ): Promise<{ inquiry: InquiryItem }> => {
    const remote = await tryServerApi<{ inquiry: InquiryItem }>(`./api/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;
    const list = getLocalInquiries();
    let updated: InquiryItem | null = null;
    const next = list.map((item) => {
      if (item.id === id) {
        updated = { ...item, ...payload, id, updatedAt: new Date().toISOString() };
        return updated;
      }
      return item;
    });
    saveLocalInquiries(next);
    return { inquiry: updated! };
  },

  deleteInquiry: async (id: string): Promise<{ deleted: string }> => {
    const remote = await tryServerApi<{ deleted: string }>(`./api/inquiries/${id}`, {
      method: 'DELETE',
    });
    if (remote) return remote;
    saveLocalInquiries(getLocalInquiries().filter((i) => i.id !== id));
    return { deleted: id };
  },

  getClients: async (): Promise<{ clients: UserProfile[] }> => {
    const remote = await tryServerApi<{ clients: UserProfile[] }>('./api/clients');
    if (remote) return remote;
    return {
      clients: getLocalUsers()
        .filter((u) => u.role === 'client')
        .map(stripPassword),
    };
  },

  createClient: async (payload: {
    displayName: string;
    email: string;
    company: string;
    password?: string;
  }): Promise<{ client: UserProfile }> => {
    const remote = await tryServerApi<{ client: UserProfile }>('./api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (remote) return remote;
    const users = getLocalUsers();
    const created: LocalUserRecord = {
      id: `user-${Date.now().toString(36)}`,
      username: `client_${Date.now().toString(36)}`,
      email: payload.email.trim().toLowerCase(),
      displayName: payload.displayName.trim(),
      company: payload.company.trim(),
      avatarUrl: '',
      authProvider: 'credentials',
      role: 'client',
      createdAt: new Date().toISOString(),
      password: payload.password || 'client123',
    };
    users.unshift(created);
    saveLocalUsers(users);
    return { client: stripPassword(created) };
  },

  deleteClient: async (id: string): Promise<{ deleted: string }> => {
    const remote = await tryServerApi<{ deleted: string }>(`./api/clients/${id}`, {
      method: 'DELETE',
    });
    if (remote) return remote;
    saveLocalUsers(getLocalUsers().filter((u) => u.id !== id));
    return { deleted: id };
  },
};
