import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PREVIEW, SOON, getCatalog } from './api'
import { setFree } from './data'
import { full, type Product, type Recipe } from './data'
import { fly } from './motion'

export type Filters = { cat: string; brand: string; price: string; sort: string; stock: boolean; q: string; rate: string }
export type ModalState = { type: 'recipe'; id: string } | { type: 'qv'; h: string } | null

type Store = {
  loaded: boolean; failed: boolean
  products: Product[]; recipes: Record<string, Recipe>; byH: Record<string, Product>
  cart: Record<string, number>; wish: string[]; recent: string[]
  count: number; sub: number
  add: (h: string, el?: Element | null, q?: number) => void
  addMany: (hs: string[], el?: Element | null) => void
  qty: (h: string, d: number) => void
  setCart: (c: Record<string, number>) => void
  wl: (h: string) => void
  toWish: (h: string) => void
  pushRecent: (h: string) => void
  drawer: boolean; openCart: () => void; closeCart: () => void
  toast: (m: string) => void; toastMsg: string; toastOn: boolean
  modal: ModalState; setModal: (m: ModalState) => void
  searchOpen: boolean; setSearchOpen: (b: boolean) => void
  F: Filters; setF: (f: Filters | ((f: Filters) => Filters)) => void
  fKey: number; bumpF: () => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

const load = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }
const keep = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* ignore */ } }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({})
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [cart, setCartS] = useState<Record<string, number>>(() => load('du_cart', {}))
  const [wish, setWish] = useState<string[]>(() => load('du_wish', []))
  const [recent, setRecent] = useState<string[]>(() => load('du_recent', []))
  const [drawer, setDrawer] = useState(false)
  const [toastMsg, setToastMsg] = useState('')
  const [toastOn, setToastOn] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [F, setF] = useState<Filters>({ cat: '', brand: '', price: '', sort: 'feat', stock: false, q: '', rate: '' })
  const [fKey, setFKey] = useState(0)
  const tt = useRef<number>(0)

  useEffect(() => {
    let alive = true, timer = 0, last = 0
    const go = () => getCatalog().then(d => {
      if (!alive) return
      last = Date.now()
      if (d.settings) setFree(d.settings.freeShip)
      setProducts(d.products); setRecipes(d.recipes); setLoaded(true); setFailed(false)
    }).catch(() => { if (!alive) return; setFailed(true); timer = window.setTimeout(go, 4000) })
    go()
    if (PREVIEW) return () => { alive = false; clearTimeout(timer) } // bundled catalogue: nothing to refresh
    // keep prices, stock and drafts in sync with admin edits: refresh when the tab regains focus, and every 2 minutes
    const onVis = () => { if (document.visibilityState === 'visible' && Date.now() - last > 30_000) go() }
    document.addEventListener('visibilitychange', onVis)
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') go() }, 120_000)
    return () => { alive = false; clearTimeout(timer); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const byH = useMemo(() => Object.fromEntries(products.map(p => [p.h, p])), [products])

  // drop cart lines for products that no longer exist
  useEffect(() => {
    if (!loaded) return
    setCartS(c => { const n = Object.fromEntries(Object.entries(c).filter(([h]) => byH[h])); return Object.keys(n).length === Object.keys(c).length ? c : n })
  }, [loaded, byH])
  useEffect(() => keep('du_cart', cart), [cart])
  useEffect(() => keep('du_wish', wish), [wish])
  useEffect(() => keep('du_recent', recent), [recent])

  const toast = useCallback((m: string) => {
    setToastMsg(m); setToastOn(true); clearTimeout(tt.current); tt.current = window.setTimeout(() => setToastOn(false), 2200)
  }, [])

  const count = Object.values(cart).reduce((a, b) => a + b, 0)
  const sub = Object.entries(cart).reduce((a, [h, q]) => a + (byH[h]?.p || 0) * q, 0)

  // design preview: only the homepage is open — cart, wishlist, search and quick views show "coming soon"
  const soon = useCallback(() => toast(SOON), [toast])

  const add = useCallback((h: string, el?: Element | null, q = 1) => {
    if (PREVIEW) { soon(); return }
    const p = byH[h]; if (!p || !p.ok) return
    setCartS(c => ({ ...c, [h]: (c[h] || 0) + q }))
    toast(full(p) + ' added to cart'); fly(p, el || null)
  }, [byH, toast, soon])
  const addMany = useCallback((hs: string[], el?: Element | null) => {
    if (PREVIEW) { soon(); return }
    setCartS(c => { const n = { ...c }; hs.forEach(h => (n[h] = (n[h] || 0) + 1)); return n })
    toast(hs.length + ' items added to cart'); if (hs[0] && byH[hs[0]]) fly(byH[hs[0]], el || null)
  }, [byH, toast, soon])
  const qty = useCallback((h: string, d: number) => setCartS(c => { const n = { ...c }; n[h] = (n[h] || 0) + d; if (n[h] <= 0) delete n[h]; return n }), [])
  const wl = useCallback((h: string) => {
    if (PREVIEW) { soon(); return }
    if (wish.includes(h)) { toast('Removed from wishlist'); setWish(w => w.filter(x => x !== h)) }
    else { toast(full(byH[h]) + ' saved to wishlist'); setWish(w => (w.includes(h) ? w : [...w, h])) }
  }, [byH, toast, wish, soon])
  const toWish = useCallback((h: string) => {
    setWish(w => (w.includes(h) ? w : [...w, h])); setCartS(c => { const n = { ...c }; delete n[h]; return n }); toast('Saved for later')
  }, [toast])
  const pushRecent = useCallback((h: string) => setRecent(r => [h, ...r.filter(x => x !== h)].slice(0, 8)), [])

  const v: Store = {
    loaded, failed, products, recipes, byH, cart, wish, recent, count, sub, add, addMany, qty, setCart: setCartS, wl, toWish, pushRecent,
    drawer, openCart: () => (PREVIEW ? soon() : setDrawer(true)), closeCart: () => setDrawer(false),
    toast, toastMsg, toastOn, modal, setModal: m => (PREVIEW && m ? soon() : setModal(m)),
    searchOpen, setSearchOpen: b => (PREVIEW && b ? soon() : setSearchOpen(b)), F, setF, fKey, bumpF: () => setFKey(k => k + 1),
  }
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>
}
