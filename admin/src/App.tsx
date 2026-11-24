import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { api, setUnauthorizedHandler, token } from './lib/api'
import { StoreProvider, useStore } from './lib/store'
import type { Bootstrap, Me } from './lib/types'
import { Icon, Logo, SearchIcon, type IconName } from './components/icons'
import { DrawerShell, UIProvider, useUI } from './components/ui'
import { STORE_URL } from './lib/format'
import { setPersist } from './lib/persist'
import Overview from './pages/Overview'
import Orders, { OrderDrawer } from './pages/Orders'
import Fulfil from './pages/Fulfil'
import Returns from './pages/Returns'
import Products, { ProductEdit } from './pages/Products'
import Inventory from './pages/Inventory'
import Purchasing, { PODrawer } from './pages/Purchasing'
import Customers, { CustomerDrawer } from './pages/Customers'
import Trade from './pages/Trade'
import Reviews from './pages/Reviews'
import Messages from './pages/Messages'
import Discounts, { DiscountDrawer } from './pages/Discounts'
import Marketing from './pages/Marketing'
import Reports from './pages/Reports'
import Finance from './pages/Finance'
import SettingsPage from './pages/Settings'

/* ---------------- login ---------------- */
function Login({ onIn }: { onIn: (me: Me) => void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const r = await api<{ token: string; me: Me }>('/admin/login', { body: { email: email.trim(), password: pw }, auth: false })
      token.set(r.token); onIn(r.me)
    } catch (x) { setErr(x instanceof Error ? x.message : 'Sign-in failed') } finally { setBusy(false) }
  }
  return (
    <div className="login" id="login"><div className="lf">
      <div className="brand" style={{ padding: 0 }}><Logo /><div className="bt"><b>Drinks Up Admin</b><small>Back office</small></div></div>
      <div className="eb" style={{ marginTop: 34 }}>Staff sign-in</div>
      <h1 style={{ marginTop: 8 }}>Every order, bottle<br />and venue — <span><em>in one place.</em></span></h1>
      <p>Manage Drinks Up orders, stock, customers and trade accounts.</p>
      <form onSubmit={submit}>
        <div className="fg"><label htmlFor="le">Work email</label><input id="le" className="in" type="email" required placeholder="you@drinksup.com.au" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="fg"><label htmlFor="lp">Password</label><input id="lp" className="in" type="password" required placeholder="••••••••" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} /></div>
        <p className="lerr" role="alert">{err}</p>
        <button className="btn pri" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="note">Staff accounts only. Contact the store owner for access.</p>
      </form>
    </div>
      <div className="lim" style={{ backgroundImage: 'url(/login.webp)' }}><p><small>Happy Hour at Home</small>Great company.<br />Greater relationships.</p></div>
    </div>
  )
}

/* ---------------- shell ---------------- */
type NavRow = [string, string, IconName?]
export const NAV: NavRow[] = [['', 'Overview', 'home'], ['g', 'Sales'], ['orders', 'Orders', 'orders'], ['fulfil', 'Fulfilment', 'ful'], ['returns', 'Returns & refunds', 'ret'],
  ['g', 'Catalogue'], ['products', 'Products', 'prod'], ['inventory', 'Inventory', 'inv'], ['purchasing', 'Purchase orders', 'po'],
  ['g', 'Customers'], ['customers', 'Customers', 'cust'], ['trade', 'Trade accounts', 'trade'], ['reviews', 'Reviews', 'rev'], ['messages', 'Messages', 'mail'], ['discounts', 'Discounts', 'disc'], ['marketing', 'Campaigns', 'mail'],
  ['g', 'Insights'], ['reports', 'Reports', 'rep'], ['finance', 'Finance & GST', 'fin'], ['g', ''], ['settings', 'Settings', 'set']]

function Side({ open, onSignOut }: { open: boolean; onSignOut: () => void }) {
  const { m } = useStore()
  const me = m.raw.me
  const badge: Record<string, number> = {
    orders: m.O.filter(o => o.fs === 'Unfulfilled').length,
    inventory: m.P.filter(p => ['w', 'r'].includes(m.stockState(p.h)[1])).length,
    reviews: m.RV.filter(r => r.st === 'Pending').length,
  }
  return (
    <aside className={'side' + (open ? ' on' : '')} id="side">
      <div className="brand"><Logo /><div className="bt"><b>Drinks Up Admin</b><small>Back office</small></div></div>
      <div className="store"><i>DU</i><div><span>drinksup.com.au</span><small>Drinks Up · AUD</small></div></div>
      {NAV.map((n, i) => n[0] === 'g'
        ? <div className="navg" key={i}>{n[1]}</div>
        : <NavLink key={i} end className={({ isActive }) => 'nl' + (isActive ? ' on' : '')} to={'/' + n[0]}>
          {n[2] && <Icon n={n[2]} />}{n[1]}{badge[n[0]] ? <em className={n[0] === 'orders' ? 'hot' : ''}>{badge[n[0]]}</em> : null}
        </NavLink>)}
      <div className="sfoot"><span className="av">{me.initials}</span><div><span>{me.name}</span><small>{me.role}</small></div><button className="so" onClick={onSignOut} title="Sign out">Sign out</button></div>
    </aside>
  )
}

function DrawerHost() {
  const { drawer, close } = useUI()
  let body: React.ReactNode = null
  if (drawer?.kind === 'order' && drawer.id) body = <OrderDrawer id={drawer.id} />
  else if (drawer?.kind === 'customer' && drawer.id) body = <CustomerDrawer id={drawer.id} />
  else if (drawer?.kind === 'po' && drawer.id) body = <PODrawer id={drawer.id} />
  else if (drawer?.kind === 'discount') body = <DiscountDrawer />
  return <DrawerShell on={!!drawer} onClose={close}>{body}</DrawerShell>
}

function Shell({ onSignOut }: { onSignOut: () => void }) {
  const { m } = useStore()
  const ui = useUI()
  const nav = useNavigate()
  const loc = useLocation()
  const [sideOn, setSideOn] = useState(false)
  const gsq = useRef<HTMLInputElement>(null)
  const seg = loc.pathname.replace(/^\//, '').split('/')[0]

  useEffect(() => {
    setSideOn(false); ui.close(); window.scrollTo(0, 0)
    document.title = (NAV.find(n => n[0] === seg && n[0] !== 'g') || ['', 'Overview'])[1] + ' · Drinks Up Admin'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc.pathname])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '')
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(tag)) { e.preventDefault(); gsq.current?.focus() }
      if (e.key === 'Escape') ui.close()
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [ui])

  const gsearch = (q: string) => {
    q = q.trim(); if (!q) return
    const o = m.O.find(o => o.id.replace('#', '') === q.replace('#', ''))
    if (o) { ui.open({ kind: 'order', id: o.id }); return }
    const p = m.P.find(p => (p.t + ' ' + p.b).toLowerCase().includes(q.toLowerCase()))
    if (p) { nav('/products/' + encodeURIComponent(p.h)); return }
    const c = m.C.find(c => c.n.toLowerCase().includes(q.toLowerCase()))
    if (c) { ui.open({ kind: 'customer', id: c.id }); return }
    setPersist<{ tab: string; q: string; ch: string; page: number }>('OF', p => ({ tab: 'All', ch: '', page: 0, ...(p || {}), q }))
    nav('/orders', { state: { t: Date.now() } })
  }

  const notif = () => {
    const unf = m.O.filter(o => o.fs === 'Unfulfilled').length
    const low = m.P.filter(p => m.stockState(p.h)[1] === 'w').length
    const pend = m.RV.filter(r => r.st === 'Pending').length
    ui.toast(`${unf} new orders · ${low} low-stock alerts · ${pend} reviews to moderate`)
  }

  return (
    <div className="app">
      <Side open={sideOn} onSignOut={onSignOut} />
      <div className="main">
        <header className="top">
          <button className="burger ib" aria-label="Menu" onClick={() => setSideOn(s => !s)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
          <label className="gs"><SearchIcon s={16} /><input ref={gsq} id="gsq" placeholder="Search orders, products, customers" onKeyDown={e => { if (e.key === 'Enter') gsearch((e.target as HTMLInputElement).value) }} /><kbd>/</kbd></label>
          <span className="sp" />
          <a className="btn vs" href={STORE_URL} target="_blank" rel="noopener">View store ↗</a>
          <button className="ib" aria-label="Notifications" onClick={notif}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg><b /></button>
        </header>
        <main className="view" id="view">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/fulfil" element={<Fulfil />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:h" element={<ProductEdit />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/purchasing" element={<Purchasing />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/discounts" element={<Discounts />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <DrawerHost />
    </div>
  )
}

export default function App() {
  const [data, setData] = useState<Bootstrap | null>(null)
  const [state, setState] = useState<'boot' | 'login' | 'in' | 'error'>(token.get() ? 'boot' : 'login')
  const [err, setErr] = useState('')

  const signOut = useCallback(() => { token.clear(); setData(null); setState('login') }, [])
  useEffect(() => { setUnauthorizedHandler(signOut) }, [signOut])

  const load = useCallback(async () => {
    setState('boot')
    try { const b = await api<Bootstrap>('/admin/bootstrap'); setData(b); setState('in') }
    catch (e) { if (token.get()) { setErr(e instanceof Error ? e.message : 'Could not load data'); setState('error') } }
  }, [])

  useEffect(() => { if (state === 'boot' && !data) load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  return (
    <BrowserRouter>
      <UIProvider>
        {state === 'login' && <Login onIn={() => load()} />}
        {state === 'boot' && <div className="boot">Loading Drinks Up admin…</div>}
        {state === 'error' && <div className="boot"><div style={{ textAlign: 'center' }}><p>{err}</p><p style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}><button className="btn" onClick={load}>Retry</button><button className="btn" onClick={signOut}>Sign out</button></p></div></div>}
        {state === 'in' && data && <StoreProvider initial={data}><Shell onSignOut={signOut} /></StoreProvider>}
      </UIProvider>
    </BrowserRouter>
  )
}
