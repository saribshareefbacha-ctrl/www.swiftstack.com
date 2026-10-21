import { SiteBrandingMeta, ThemeCMS } from '../types/cms';

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

export function syncDocumentBranding(branding: SiteBrandingMeta, theme: ThemeCMS): void {
  if (typeof document === 'undefined') return;

  if (branding.pageTitle) {
    document.title = branding.pageTitle;
  }

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  if (branding.metaDescription) {
    metaDesc.setAttribute('content', branding.metaDescription);
  }

  let linkIcon = document.querySelector<HTMLLinkElement>('link[rel*="icon"]');
  if (!linkIcon) {
    linkIcon = document.createElement('link');
    linkIcon.rel = 'icon';
    document.head.appendChild(linkIcon);
  }

  if (branding.faviconUrl && branding.faviconUrl.trim().length > 0) {
    linkIcon.type = 'image/png';
    linkIcon.href = branding.faviconUrl.trim();
  } else {
    linkIcon.type = 'image/svg+xml';
    linkIcon.href = buildGlowingFaviconDataUrl(
      branding.faviconMonogram || 'SS',
      theme.primaryAccent,
      theme.secondaryAccent
    );
  }
}
