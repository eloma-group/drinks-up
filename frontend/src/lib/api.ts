import type { Product, Recipe, Review } from './data'

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
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

export const getCatalog = () => api<{ products: Product[]; recipes: Record<string, Recipe>; settings?: { freeShip: number; stdRate: number } }>('/catalog')
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
