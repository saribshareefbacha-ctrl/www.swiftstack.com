import { ViewLayoutMode } from '../types/cms';

export const VIEW_MODE_STORAGE_KEY = 'swiftstack_view_mode_v5';

export function detectNaturalDeviceMode(): ViewLayoutMode {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 768 ? 'mobile' : 'desktop';
}

export function hasSavedViewMode(): boolean {
  try {
    const val = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return val === 'desktop' || val === 'mobile';
  } catch {
    return false;
  }
}

export function getSavedViewMode(): ViewLayoutMode | null {
  try {
    const val = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (val === 'desktop' || val === 'mobile') {
      return val;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveViewMode(mode: ViewLayoutMode): void {
  try {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  applyViewModeToDocument(mode);
}

export function applyViewModeToDocument(mode: ViewLayoutMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-view-mode', mode);

  let meta = document.getElementById('dynamic-viewport-meta') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.querySelector('meta[name="viewport"]');
  }
  if (meta) {
    if (mode === 'desktop') {
      meta.setAttribute('content', 'width=1280, initial-scale=0.32, minimum-scale=0.25, maximum-scale=3.0, user-scalable=yes');
      // On real desktop monitors (>= 1024px wide), keep crisp 1.0 scale
      if (typeof window !== 'undefined' && window.screen && window.screen.width >= 1024) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    } else {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0');
    }
  }
}
