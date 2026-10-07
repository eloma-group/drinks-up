/**
 * Shopify's CDN resizes on the fly (`width=`) and negotiates WebP/AVIF
 * automatically, so every image gets a responsive srcset for free.
 * Images we host ourselves (under /brand) are pre-resized into fixed variants.
 */
const WIDTHS = [240, 360, 480, 640, 800, 1080, 1440, 1920, 2560];

/** Self-hosted images and their pre-built widths (smallest first) */
const LOCAL_VARIANTS: Record<string, { w: number; src: string }[]> = {
  '/brand/burnt-ends-feature-1254.webp': [
    { w: 800, src: '/brand/burnt-ends-feature-800.webp' },
    { w: 1254, src: '/brand/burnt-ends-feature-1254.webp' },
  ],
};

export const isLocal = (src: string) => src.startsWith('/') && !src.startsWith('//');

export const sized = (src: string, width: number) => {
  if (isLocal(src)) {
    const v = LOCAL_VARIANTS[src];
    return v ? (v.find((x) => x.w >= width) ?? v[v.length - 1]).src : src;
  }
  const url = src.startsWith('//') ? `https:${src}` : src;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
};

export const srcSet = (src: string, max = 1920) => {
  if (isLocal(src)) return (LOCAL_VARIANTS[src] ?? []).map((v) => `${v.src} ${v.w}w`).join(', ') || undefined;
  return WIDTHS.filter((w) => w <= max)
    .map((w) => `${sized(src, w)} ${w}w`)
    .join(', ');
};
