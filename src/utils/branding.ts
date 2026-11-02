import { SiteBrandingMeta, ThemeCMS } from '../types/cms';

let faviconRefreshTimer: number | null = null;

export function buildGlowingFaviconDataUrl(
  monogram: string,
  primaryHex: string,
  secondaryHex: string
): string {
  const safeText = (monogram || 'SS').slice(0, 3).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryHex || '#06b6d4'}" />
        <stop offset="100%" stop-color="${secondaryHex || '#6366f1'}" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="58" height="58" rx="16" fill="#050b1a" stroke="url(#g)" stroke-width="4" />
    <rect x="8" y="8" width="48" height="48" rx="12" fill="url(#g)" fill-opacity="0.18" />
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="25" fill="url(#g)">${safeText}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function faviconMimeType(href: string): string {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+)/.exec(href);
  if (match) return match[1];
  const clean = href.split(/[?#]/)[0].toLowerCase();
  if (clean.endsWith('.svg')) return 'image/svg+xml';
  if (clean.endsWith('.ico')) return 'image/x-icon';
  if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
  if (clean.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

/**
 * Replace—not merely mutate—favicon nodes. Chromium, Safari and mobile browsers can retain the
 * first favicon element indefinitely; fresh nodes and all common rel variants reliably invalidate
 * that cache without requiring a page reload.
 */
export function applyDocumentFavicon(href: string): void {
  if (typeof document === 'undefined' || !href) return;

  document
    .querySelectorAll<HTMLLinkElement>(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]'
    )
    .forEach((node) => node.remove());

  const type = faviconMimeType(href);
  const definitions: Array<{ rel: string; sizes?: string }> = [
    { rel: 'icon', sizes: '32x32' },
    { rel: 'shortcut icon' },
    { rel: 'apple-touch-icon', sizes: '180x180' },
  ];

  definitions.forEach(({ rel, sizes }) => {
    const link = document.createElement('link');
    link.rel = rel;
    link.type = type;
    if (sizes) link.sizes = sizes;
    link.href = href;
    link.dataset.swiftstackFavicon = 'true';
    document.head.appendChild(link);
  });
}

export function syncDocumentBranding(branding: SiteBrandingMeta, theme: ThemeCMS): void {
  if (typeof document === 'undefined') return;

  const computedTitle = `${branding.companyName || 'SwiftStack'} (${branding.monogram || 'SS'}) — Digital Engineering & AI Studio | ${branding.founderName || 'Muhammad Sarib Randhawa'}`;
  document.title = computedTitle;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  if (branding.footerTagline) metaDesc.setAttribute('content', branding.footerTagline);

  const nextHref =
    branding.faviconUrl?.trim() ||
    buildGlowingFaviconDataUrl(
      branding.monogram || 'SS',
      theme.primaryColor,
      theme.secondaryColor
    );

  applyDocumentFavicon(nextHref);

  // Safari occasionally restores the favicon parsed from HTML after hydration. Re-apply once after
  // the current render settles. The previous timer is cancelled when branding changes rapidly.
  if (faviconRefreshTimer !== null) window.clearTimeout(faviconRefreshTimer);
  faviconRefreshTimer = window.setTimeout(() => {
    applyDocumentFavicon(nextHref);
    faviconRefreshTimer = null;
  }, 250);
}
