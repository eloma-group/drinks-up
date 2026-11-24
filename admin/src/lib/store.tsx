import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import { useUI } from '../components/ui'
import type { AProduct, Bootstrap, Customer, Inv, Order, PO, Review } from './types'

export type Model = {
  raw: Bootstrap
  P: AProduct[]
  byH: Record<string, AProduct>
  INV: Record<string, Inv>
  C: Customer[]
  O: Order[]
  POS: PO[]
  RV: Review[]
  stockState: (h: string) => [string, 'g' | 'w' | 'r' | 'n']
  supOf: (p: AProduct) => string
}

const EMPTY_INV: Inv = { st: 0, rop: 0, cost: 0, inc: 0, loc: '—', s30: 0 }

export function buildModel(raw: Bootstrap): Model {
  const P = raw.products
  const byH: Record<string, AProduct> = {}
  P.forEach(p => { byH[p.h] = p })
  const INV: Record<string, Inv> = {}
  P.forEach(p => { INV[p.h] = raw.inventory[p.h] || EMPTY_INV })
  const C: Customer[] = raw.customers.map(c => ({ ...c, since: new Date(c.since), orders: [], spent: 0, seg: 'Subscriber' }))
  const byC: Record<string, Customer> = {}
  C.forEach(c => { byC[c.id] = c })
  const unknown = (id: string): Customer => {
    const c: Customer = { id, n: 'Guest', contact: 'Guest', em: '', city: '', st: '', pc: '', trade: false, since: new Date(), news: false, orders: [], spent: 0, seg: 'New' }
    byC[id] = c; C.push(c); return c
  }
  const O: Order[] = raw.orders
    .map(o => ({ ...o, dt: new Date(o.dt), cu: byC[o.cu] || unknown(o.cu), items: o.items.filter(x => byH[x.h]) }))
    .sort((a, b) => +b.dt - +a.dt)
  O.forEach(o => o.cu.orders.push(o))
  C.forEach(c => {
    c.spent = c.orders.filter(o => o.ps !== 'Refunded').reduce((a, o) => a + o.tot, 0)
    c.last = c.orders[0]?.dt
    c.seg = c.trade ? 'Trade' : c.orders.length >= 4 || c.spent > 900 ? 'VIP' : c.orders.length >= 2 ? 'Returning' : c.orders.length ? 'New' : 'Subscriber'
  })
  const POS: PO[] = raw.pos.map(p => ({ ...p, dt: new Date(p.dt), eta: new Date(p.eta) }))
  const RV: Review[] = raw.reviews.filter(r => byH[r.h]).map(r => ({ ...r, dt: new Date(r.dt), p: byH[r.h], cu: r.cu ? byC[r.cu] || null : null }))
  const stockState = (h: string): [string, 'g' | 'w' | 'r' | 'n'] => {
    const v = INV[h]
    if (!byH[h]?.ok || !v || v.st === 0) return ['Out of stock', 'r']
    if (v.st === null) return ['Stock not set', 'n']
    if (v.st <= v.rop) return ['Low stock', 'w']
    return ['In stock', 'g']
  }
  const supOf = (p: AProduct) => raw.suppliers[p.b] ? raw.suppliers[p.b].n : 'Assembled in-house'
  return { raw, P, byH, INV, C, O, POS, RV, stockState, supOf }
}

type Ctx = { m: Model; setRaw: (fn: (r: Bootstrap) => Bootstrap) => void }
const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ initial, children }: { initial: Bootstrap; children: ReactNode }) {
  const [raw, setRawState] = useState(initial)
  const m = useMemo(() => buildModel(raw), [raw])
  const setRaw = useCallback((fn: (r: Bootstrap) => Bootstrap) => setRawState(r => fn(r)), [])
  const ui = useUI()
  const toastRef = useRef(ui.toast); toastRef.current = ui.toast
  const ids = useRef(new Set(initial.orders.map(o => o.id)))

  // live sync with the storefront: new orders, reviews, messages and stock changes appear without signing in again
  useEffect(() => {
    let busy = false, last = Date.now()
    const pull = async () => {
      if (busy || document.visibilityState !== 'visible') return
      busy = true
      try {
        const b = await api<Bootstrap>('/admin/bootstrap')
        last = Date.now()
        const fresh = b.orders.filter(o => !ids.current.has(o.id))
        ids.current = new Set(b.orders.map(o => o.id))
        setRawState(b)
        if (fresh.length) toastRef.current(fresh.length === 1 ? `New order ${fresh[0].id}` : `${fresh.length} new orders`)
      } catch { /* offline or signed out — next tick retries */ } finally { busy = false }
    }
    const t = window.setInterval(pull, 60_000)
    const onVis = () => { if (document.visibilityState === 'visible' && Date.now() - last > 15_000) pull() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  return <StoreCtx.Provider value={{ m, setRaw }}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const c = useContext(StoreCtx)
  if (!c) throw new Error('useStore outside provider')
  return c
}
