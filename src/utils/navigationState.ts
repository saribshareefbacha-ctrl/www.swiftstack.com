import { AppPageView } from '../types/cms';

const NAV_STATE_KEY = 'swiftstack_nav_state_v6';

export interface PersistedNavState {
  page: AppPageView;
  sectionId: string;
  adminTab: string;
  scrollY: number;
  portalOpen?: boolean;
  portalTab?: 'cart' | 'orders' | 'new' | 'profile';
}

const DEFAULT_NAV_STATE: PersistedNavState = {
  page: 'home',
  sectionId: 'hero',
  adminTab: 'voice',
  scrollY: 0,
  portalOpen: false,
  portalTab: 'cart',
};

export function readInitialNavState(): PersistedNavState {
  let saved: Partial<PersistedNavState> = {};
  try {
    const raw = localStorage.getItem(NAV_STATE_KEY);
    if (raw) {
      saved = JSON.parse(raw) as Partial<PersistedNavState>;
    }
  } catch {
    // ignore
  }

  const hash = (typeof window !== 'undefined' ? window.location.hash : '').trim();

  if (hash.startsWith('#/owner-dashboard')) {
    const parts = hash.replace('#/owner-dashboard', '').split('/').filter(Boolean);
    return {
      ...DEFAULT_NAV_STATE,
      ...saved,
      page: 'owner-dashboard',
      adminTab: parts[0] || saved.adminTab || 'voice',
    };
  }

  if (hash === '#/cart' || hash === '#/portal') {
    return {
      ...DEFAULT_NAV_STATE,
      ...saved,
      page: 'home',
      portalOpen: true,
      portalTab: hash === '#/cart' ? 'cart' : saved.portalTab || 'orders',
    };
  }

  if (hash && /^#(hero|services|projects|order|footer)$/.test(hash)) {
    return {
      ...DEFAULT_NAV_STATE,
      ...saved,
      page: 'home',
      sectionId: hash.slice(1),
    };
  }

  return {
    ...DEFAULT_NAV_STATE,
    ...saved,
  };
}

export function saveNavState(patch: Partial<PersistedNavState>): PersistedNavState {
  const prev = readStoredOnly();
  const next: PersistedNavState = {
    ...DEFAULT_NAV_STATE,
    ...prev,
    ...patch,
  };
  try {
    localStorage.setItem(NAV_STATE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

function readStoredOnly(): Partial<PersistedNavState> {
  try {
    const raw = localStorage.getItem(NAV_STATE_KEY);
    if (raw) return JSON.parse(raw) as Partial<PersistedNavState>;
  } catch {
    // ignore
  }
  return {};
}

export function updateUrlHashSilently(nextHash: string): void {
  if (typeof window === 'undefined') return;
  const formatted = nextHash.startsWith('#') ? nextHash : `#${nextHash}`;
  if (window.location.hash === formatted) return;
  try {
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${formatted}`
    );
  } catch {
    window.location.hash = formatted;
  }
}
