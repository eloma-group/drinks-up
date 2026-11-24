import { useMemo } from 'react'
import { api, oid } from './api'
import { useStore } from './store'
import type { AProduct, Bootstrap, Discount, Inv, Note, RawOrder, RawPO, RawReview, Settings } from './types'

/** All server mutations. Each one persists via the API, then patches local state so the UI updates. */
export function useActions() {
  const { setRaw } = useStore()
  return useMemo(() => {
    const reload = async () => { const b = await api<Bootstrap>('/admin/bootstrap'); setRaw(() => b) }
    const putOrder = (o: RawOrder) => setRaw(r => ({ ...r, orders: r.orders.map(x => x.id === o.id ? { ...x, ...o } : x) }))
    return {
      reload,
      async patchOrder(id: string, body: { fs?: string; ps?: string }) {
        const o = await api<RawOrder>(`/admin/orders/${oid(id)}`, { method: 'PATCH', body })
        if (o && o.id) putOrder(o)
        if (body.ps === 'Refunded') await reload() // refunds restock inventory server-side
      },
      async bulk(ids: string[], action: 'fulfil' | 'labels' | 'slips') {
        const r = await api<{ updated: number }>('/admin/orders/bulk', { body: { ids, action } })
        if (action === 'fulfil') await reload()
        return r
      },
      async addNote(id: string, text: string) {
        const n = await api<Note>(`/admin/orders/${oid(id)}/notes`, { body: { text } })
        setRaw(r => ({ ...r, orders: r.orders.map(o => o.id === id ? { ...o, notes: [...(o.notes || []), n] } : o) }))
      },
      async saveProduct(h: string | null, body: Record<string, unknown>) {
        const r = await api<{ product: AProduct; inventory: Inv } | AProduct>(h ? `/admin/products/${encodeURIComponent(h)}` : '/admin/products', { method: h ? 'PUT' : 'POST', body })
        await reload()
        return 'product' in r ? r.product : r
      },
      async patchInv(h: string, body: Partial<Inv> & { reason?: string }) {
        const v = await api<Inv>(`/admin/inventory/${encodeURIComponent(h)}`, { method: 'PATCH', body })
        setRaw(r => ({ ...r, inventory: { ...r.inventory, [h]: { ...r.inventory[h], ...v } } }))
      },
      async modReview(id: number, st: RawReview['st']) {
        const v = await api<RawReview>(`/admin/reviews/${id}`, { method: 'PATCH', body: { st } })
        setRaw(r => ({ ...r, reviews: r.reviews.map(x => x.id === id ? { ...x, ...(v && v.id ? v : { st }) } : x) }))
      },
      async createDiscount(body: Record<string, unknown>) {
        const d = await api<Discount>('/admin/discounts', { body })
        setRaw(r => ({ ...r, discounts: [d, ...r.discounts] }))
      },
      async createPO(body: { sup: string; items: { h: string; q: number }[]; st?: string }) {
        const po = await api<RawPO>('/admin/pos', { body })
        setRaw(r => ({ ...r, pos: r.pos.some(x => x.id === po.id) ? r.pos.map(x => x.id === po.id ? po : x) : [po, ...r.pos] }))
        await reload() // incoming units change
        return po
      },
      async patchPO(id: string, st: RawPO['st']) {
        await api<RawPO>(`/admin/pos/${encodeURIComponent(id)}`, { method: 'PATCH', body: { st } })
        await reload()
      },
      async saveSettings(s: Partial<Settings>) {
        const v = await api<Settings>('/admin/settings', { method: 'PUT', body: s })
        setRaw(r => ({ ...r, settings: { ...r.settings, ...v } }))
      },
      async upload(file: File) {
        const f = new FormData(); f.append('file', file)
        return api<{ url: string }>('/admin/uploads', { form: f })
      },
    }
  }, [setRaw])
}
