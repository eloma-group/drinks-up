import { useEffect } from 'react';
import { SITE } from '../data/site';

interface Seo {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'product' | 'article';
  jsonLd?: object | null;
}

const DEFAULT_DESC =
  'Australian-owned online spirit shelf. Curated spirits, Giffard liqueurs and syrups, and cocktail packs hand-picked by career bartenders.';

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
}

/** Per-route <title>, description, Open Graph, canonical and JSON-LD */
export function useSeo({ title, description = DEFAULT_DESC, image, path, type = 'website', jsonLd = null }: Seo) {
  useEffect(() => {
    const full = title.includes('DrinksUp') ? title : `${title} | DrinksUp`;
    const url = SITE.url + (path ?? window.location.pathname);
    document.title = full;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    if (image) setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const id = 'route-jsonld';
    document.getElementById(id)?.remove();
    if (jsonLd) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = id;
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
  }, [title, description, image, path, type, jsonLd]);
}
