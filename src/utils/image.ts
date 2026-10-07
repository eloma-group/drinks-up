/**
 * Shopify's CDN resizes on the fly (`width=`) and negotiates WebP/AVIF
 * automatically, so every image gets a responsive srcset for free.
 */
const WIDTHS = [240, 360, 480, 640, 800, 1080, 1440, 1920, 2560];

export const sized = (src: string, width: number) => {
  const url = src.startsWith('//') ? `https:${src}` : src;
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
};

export const srcSet = (src: string, max = 1920) =>
  WIDTHS.filter((w) => w <= max)
    .map((w) => `${sized(src, w)} ${w}w`)
    .join(', ');
