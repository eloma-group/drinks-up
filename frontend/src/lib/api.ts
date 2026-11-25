import type { Product, Recipe, Review } from './data'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

/**
 * Design preview: a production build made without VITE_API_URL (e.g. the storefront deployed on its own before the
 * backend exists). The catalogue is read from the bundled seed data and every feature that needs the backend
 * (checkout, accounts, reviews, contact, discounts) shows a "coming soon" message instead of calling the API.
 * Set VITE_PREVIEW=true to try it locally with `npm run dev`.
 */
export const PREVIEW = import.meta.env.VITE_PREVIEW === 'true' || (import.meta.env.PROD && !BASE)
export const SOON = 'Coming soon — this will be available once our online store setup is complete.'

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  if (PREVIEW) throw new Error(SOON)
  const res = await fetch(BASE + '/api' + path, {
    method: init?.method || (init?.body ? 'POST' : 'GET'),
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  let data: unknown = null
  try { data = await res.json() } catch { /* empty */ }
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error || `Request failed (${res.status})`)
  return data as T
}

type Catalog = { products: Product[]; recipes: Record<string, Recipe>; settings?: { freeShip: number; stdRate: number } }

/** Bundled catalogue for the design preview — the same files the database is seeded from. */
async function previewCatalog(): Promise<Catalog> {
  const [p, r] = await Promise.all([import('../../../database/seed/data/products.json'), import('../../../database/seed/data/recipes.json')])
  const products = (p.default as unknown as Omit<Product, 'rating'>[]).map(x => ({ ...x, rating: { avg: 0, n: 0 } }) as Product)
  return { products, recipes: r.default as unknown as Record<string, Recipe> }
}

export const getCatalog = () => (PREVIEW ? previewCatalog() : api<Catalog>('/catalog'))
export const getReviews = (h: string) => api<Review[]>(`/products/${encodeURIComponent(h)}/reviews`)
export const postReview = (h: string, body: { n: string; city: string; r: number; t: string; b: string }) =>
  api<{ review: Review }>(`/products/${encodeURIComponent(h)}/reviews`, { body })
export type FeaturedReview = { id: number; t: string; b: string; n: string; city: string; r: number; v: boolean; brand: string; product: string }
export const getFeaturedReviews = () => api<FeaturedReview[]>('/reviews/featured')
export const postHelpful = (id: number) => api<{ help: number }>(`/reviews/${id}/helpful`, { method: 'POST' })
export const validateDiscount = (code: string) => api<{ valid: boolean; code: string; title?: string; reason?: string }>('/discounts/validate', { body: { code } })
export const createOrder = (body: Record<string, unknown>) => api<{ id: string; total: number; checkoutUrl: string }>('/orders', { body })
export const sendContact = (body: Record<string, unknown>) => api<{ ok: true }>('/contact', { body })
export type Customer = { id: string; n: string; em: string }
export const login = (body: { email: string; password: string }) => api<{ token: string; customer: Customer }>('/account/login', { body })
export const register = (body: Record<string, unknown>) => api<{ token: string; customer: Customer }>('/account/register', { body })
