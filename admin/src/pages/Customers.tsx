import { useStore } from '../lib/store'
import { usePersist } from '../lib/persist'
import { csv, fd, fdt, full, initials, money, sum } from '../lib/format'
import { Icon, SearchIcon } from '../components/icons'
import { B, FsB, Thumb, useUI } from '../components/ui'

type CFT = { q: string; seg: string }

export default function Customers() {
  const { m } = useStore()
  const ui = useUI()
  const [CF, setCF] = usePersist<CFT>('CF', { q: '', seg: '' })
  const { C } = m
  let l = C.filter(c => !c.trade || CF.seg === 'Trade').filter(c => !CF.seg || c.seg === CF.seg)
  if (CF.q) { const q = CF.q.toLowerCase(); l = l.filter(c => (c.n + ' ' + c.em + ' ' + c.city).toLowerCase().includes(q)) }
  l = [...l].sort((a, b) => b.spent - a.spent)
  const segs = ['VIP', 'Returning', 'New', 'Subscriber']
  const exportCustomers = () => {
    csv('drinksup-customers.csv', [['ID', 'Name', 'Email', 'Suburb', 'State', 'Segment', 'Orders', 'Spent'], ...C.map(c => [c.id, c.n, c.em, c.city, c.st, c.seg, c.orders.length, c.spent.toFixed(2)])])
    ui.toast('Exported drinksup-customers.csv')
  }
  return <>
    <div className="ph"><div><div className="eb">Customers</div><h1>Customers</h1><p>{C.filter(c => !c.trade).length} retail customers · {C.filter(c => c.news).length} subscribed to email</p></div><div className="acts"><button className="btn" onClick={exportCustomers}><Icon n="dl" />Export</button><button className="btn pri" onClick={() => ui.toast('Add customer form opened')}><Icon n="plus" />Add customer</button></div></div>
    <div className="grid g4">{segs.map(s => { const g = C.filter(c => c.seg === s); return <button key={s} className="card kpi" style={{ textAlign: 'left', ...(CF.seg === s ? { borderColor: '#111' } : {}) }} onClick={() => setCF(p => ({ ...p, seg: p.seg === s ? '' : s }))}><small>{s}</small><b>{g.length}</b><span className="note">{money(sum(g, c => c.spent), 0)} lifetime</span></button> })}</div>
    <div className="card mt"><div className="fl"><label className="gs"><SearchIcon /><input placeholder="Search name, email or suburb" value={CF.q} onChange={e => setCF(p => ({ ...p, q: e.target.value }))} /></label>{CF.seg ? <span className="chip">{CF.seg} <button aria-label="Clear" onClick={() => setCF(p => ({ ...p, seg: '' }))}>×</button></span> : null}<span className="note" style={{ marginLeft: 'auto' }}>{l.length} customers</span></div>
      <div className="tw"><table><thead><tr><th>Customer</th><th>Location</th><th>Segment</th><th>Email</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th></tr></thead><tbody>
        {l.map(c => <tr key={c.id} className="cl" onClick={() => ui.open({ kind: 'customer', id: c.id })}><td><div className="pn"><span className="av">{initials(c.n)}</span><div><b>{c.n}</b><span className="sub">{c.em}</span></div></div></td><td>{c.city}, {c.st}</td><td><B t={c.seg} c={c.seg === 'VIP' ? 'i' : c.seg === 'New' ? 'g' : 'n'} /></td><td>{c.news ? <B t="Subscribed" c="g" /> : <B t="Not subscribed" c="n" />}</td><td className="num">{c.orders.length}</td><td className="num"><b>{money(c.spent)}</b></td><td>{c.last ? fd(c.last) : '—'}</td></tr>)}
      </tbody></table></div></div>
  </>
}

export function CustomerDrawer({ id }: { id: string }) {
  const { m } = useStore()
  const ui = useUI()
  const c = m.C.find(x => x.id === id)
  if (!c) return null
  const fav: Record<string, number> = {}; c.orders.forEach(o => o.items.forEach(x => { fav[x.h] = (fav[x.h] || 0) + x.q }))
  const favs = Object.entries(fav).sort((a, b) => b[1] - a[1]).slice(0, 3)
  return <>
    <div className="dh"><span className="av">{initials(c.n)}</span><h2>{c.n}</h2><B t={c.seg} c="i" /><button className="ib x" aria-label="Close" onClick={ui.close}><Icon n="x" /></button></div>
    <div className="db">
      <div className="grid g4" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}><div className="card kpi"><small>Lifetime spend</small><b style={{ fontSize: '1.3rem' }}>{money(c.spent, 0)}</b></div><div className="card kpi"><small>Orders</small><b style={{ fontSize: '1.3rem' }}>{c.orders.length}</b></div><div className="card kpi"><small>Avg order</small><b style={{ fontSize: '1.3rem' }}>{money(c.spent / (c.orders.length || 1), 0)}</b></div></div>
      <div className="card"><div className="bd"><dl className="kv"><dt>Email</dt><dd>{c.em}</dd><dt>Location</dt><dd>{c.city} {c.st} {c.pc}</dd><dt>Customer since</dt><dd>{fd(c.since)}</dd><dt>Marketing</dt><dd>{c.news ? 'Email subscribed' : 'Not subscribed'}</dd><dt>Age verified</dt><dd><B t="18+ confirmed" c="g" /></dd></dl></div></div>
      <div className="card"><div className="hd"><h3>Favourite products</h3></div>{favs.length ? favs.map(([h, q]) => <div className="li" key={h}><Thumb p={m.byH[h]} /><div className="m"><b>{full(m.byH[h])}</b></div><div className="e">{q} bought</div></div>) : <p className="empty">No orders yet</p>}</div>
      <div className="card"><div className="hd"><h3>Orders</h3></div>{c.orders.slice(0, 8).map(o => <div className="li" key={o.id} style={{ cursor: 'pointer' }} onClick={() => ui.open({ kind: 'order', id: o.id })}><div className="m"><b>{o.id}</b><small>{fdt(o.dt)}</small></div><div className="e"><b>{money(o.tot)}</b><br /><FsB s={o.fs} /></div></div>)}</div>
    </div>
    <div className="df"><button className="btn" onClick={() => ui.toast('Email isn’t connected yet — share a code from Discounts with ' + c.contact)}><Icon n="disc" />Send discount</button><button className="btn pri" onClick={() => ui.toast('Draft orders aren’t set up yet — orders come in from the storefront checkout')}><Icon n="plus" />Create order</button></div>
  </>
}
