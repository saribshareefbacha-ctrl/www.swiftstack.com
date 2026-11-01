import { ViewLayoutMode } from '../types/cms';

export const VIEW_MODE_STORAGE_KEY = 'swiftstack_view_mode_v6';
const LEGACY_VIEW_MODE_KEY = 'swiftstack_view_mode_v5';

export function detectNaturalDeviceMode(): ViewLayoutMode {
  if (typeof window === 'undefined') return 'desktop';
  const physicalWidth = Math.min(
    window.screen?.width || window.innerWidth,
    window.innerWidth || 1280
  );
  return physicalWidth < 768 ? 'mobile' : 'desktop';
}

export function hasSavedViewMode(): boolean {
  try {
    const val =
      localStorage.getItem(VIEW_MODE_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_VIEW_MODE_KEY);
    return val === 'desktop' || val === 'mobile';
  } catch {
    return false;
  }
}

export function getSavedViewMode(): ViewLayoutMode | null {
  try {
    const val =
      localStorage.getItem(VIEW_MODE_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_VIEW_MODE_KEY);
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
    localStorage.setItem(LEGACY_VIEW_MODE_KEY, mode);
  } catch {
    // ignore
  }
  applyViewModeToDocument(mode);
}

/**
 * Pixel-Perfect Desktop & Mobile Viewport Scaling:
 * - On physical mobile screens (< 1024px) when Desktop View is selected, calculates the exact
 *   device ratio (screenWidth / 1280) so the entire 1280px desktop canvas fits 100% centered
 *   from edge to edge with ZERO horizontal overflow, ZERO right-side clipping, and ZERO UI distortion!
 * - On native desktop monitors (>= 1024px) or when Mobile View is selected, keeps native crisp 1.0 scale!
 */
export function applyViewModeToDocument(mode: ViewLayoutMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-view-mode', mode);

  let meta = document.getElementById('dynamic-viewport-meta') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.querySelector('meta[name="viewport"]');
  }
  if (!meta) return;

  const screenW =
    typeof window !== 'undefined' && window.screen && window.screen.width
      ? Math.min(window.screen.width, window.screen.availWidth || window.screen.width)
      : 1280;

  if (mode === 'desktop' && screenW > 0 && screenW < 1024) {
    const exactScale = Math.max(0.24, Math.min(1, Number((screenW / 1280).toFixed(4))));
    meta.setAttribute(
      'content',
      `width=1280, initial-scale=${exactScale}, minimum-scale=${exactScale}, maximum-scale=3.0, user-scalable=yes`
    );
  } else {
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes'
    );
  }
}
