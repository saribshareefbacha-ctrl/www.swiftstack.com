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

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  getCMS: () => apiRequest<SiteCMSData>('/api/cms'),
  updateHero: (hero: HeroCMS) =>
    apiRequest<{ hero: HeroCMS }>('/api/cms/hero', {
      method: 'PUT',
      body: JSON.stringify(hero),
    }),
  updateTheme: (theme: ThemeCMS) =>
    apiRequest<{ theme: ThemeCMS }>('/api/cms/theme', {
      method: 'PUT',
      body: JSON.stringify(theme),
    }),
  updateAvatar: (avatar: AvatarConfig) =>
    apiRequest<{ avatar: AvatarConfig }>('/api/cms/avatar', {
      method: 'PUT',
      body: JSON.stringify(avatar),
    }),
  resetCMS: () =>
    apiRequest<SiteCMSData>('/api/cms/reset', {
      method: 'POST',
    }),

  createService: (service: Partial<ServiceItem>) =>
    apiRequest<{ service: ServiceItem }>('/api/cms/services', {
      method: 'POST',
      body: JSON.stringify(service),
    }),
  updateService: (id: string, service: Partial<ServiceItem>) =>
    apiRequest<{ service: ServiceItem }>(`/api/cms/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    }),
  deleteService: (id: string) =>
    apiRequest<{ deleted: string }>(`/api/cms/services/${id}`, {
      method: 'DELETE',
    }),

  createProject: (project: Partial<ProjectItem>) =>
    apiRequest<{ project: ProjectItem }>('/api/cms/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    }),
  updateProject: (id: string, project: Partial<ProjectItem>) =>
    apiRequest<{ project: ProjectItem }>(`/api/cms/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(project),
    }),
  deleteProject: (id: string) =>
    apiRequest<{ deleted: string }>(`/api/cms/projects/${id}`, {
      method: 'DELETE',
    }),

  login: (identifier: string, password: string) =>
    apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  register: (payload: {
    displayName: string;
    email: string;
    password: string;
    company?: string;
  }) =>
    apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  googleAuth: (payload: {
    email: string;
    displayName: string;
    company?: string;
    avatarUrl?: string;
  }) =>
    apiRequest<{ token: string; user: UserProfile }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => apiRequest<{ user: UserProfile | null }>('/api/auth/me'),
  updateProfile: (payload: { displayName: string; company: string }) =>
    apiRequest<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiRequest<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  submitInquiry: (payload: {
    clientName: string;
    clientEmail: string;
    companyName: string;
    serviceTitle: string;
    budgetRange: string;
    timeline: string;
    projectDetails: string;
  }) =>
    apiRequest<{ inquiry: InquiryItem }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyInquiries: () => apiRequest<{ inquiries: InquiryItem[] }>('/api/inquiries/mine'),
  getAllInquiries: () => apiRequest<{ inquiries: InquiryItem[] }>('/api/inquiries'),
  updateInquiry: (id: string, payload: Partial<InquiryItem>) =>
    apiRequest<{ inquiry: InquiryItem }>(`/api/inquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteInquiry: (id: string) =>
    apiRequest<{ deleted: string }>(`/api/inquiries/${id}`, {
      method: 'DELETE',
    }),

  getClients: () => apiRequest<{ clients: UserProfile[] }>('/api/clients'),
  createClient: (payload: {
    displayName: string;
    email: string;
    company: string;
    password?: string;
  }) =>
    apiRequest<{ client: UserProfile }>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteClient: (id: string) =>
    apiRequest<{ deleted: string }>(`/api/clients/${id}`, {
      method: 'DELETE',
    }),
};
