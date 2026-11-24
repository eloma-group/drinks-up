import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { getPersist, usePersist } from '../lib/persist'
import { csv, fdt, full, money, SKU, sum } from '../lib/format'
import { Icon, SearchIcon } from '../components/icons'
import { B, FsB, PsB, Thumb, useUI } from '../components/ui'

type OFT = { tab: string; q: string; ch: string; page: number }
const OF0: OFT = { tab: 'All', q: '', ch: '', page: 0 }

export default function Orders() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const loc = useLocation()
  const [OF, setOF] = usePersist<OFT>('OF', OF0)
  const [sel, setSel] = usePersist<string[]>('OFsel', [])
  useEffect(() => { const v = getPersist<OFT>('OF'); if (v) setOF(v) }, [loc.state, setOF])
  const { O, byH } = m
  const tabs = ['All', 'Unfulfilled', 'Packing', 'Ready to ship', 'Shipped', 'Delivered', 'Returned']
  let l = O.filter(o => OF.tab === 'All' || o.fs === OF.tab)
  if (OF.ch) l = l.filter(o => o.ch === OF.ch)
  if (OF.q) { const q = OF.q.toLowerCase(); l = l.filter(o => (o.id + ' ' + o.cu.n + ' ' + o.cu.em + ' ' + o.items.map(x => byH[x.h].t).join(' ')).toLowerCase().includes(q)) }
  const per = 25, pages = Math.ceil(l.length / per) || 1, page = Math.min(OF.page, pages - 1)
  const rows = l.slice(page * per, page * per + per)
  const of = (k: keyof OFT, v: string | number) => setOF(p => ({ ...p, [k]: v, ...(k !== 'page' ? { page: 0 } : {}) }))
  const toggle = (id: string, on: boolean) => setSel(s => on ? [...new Set([...s, id])] : s.filter(x => x !== id))
  const bulk = async (msg: string, action: 'fulfil' | 'labels' | 'slips') => {
    try { await act.bulk(sel, action); ui.toast(msg + (sel.length ? ` · ${sel.length} orders` : '')); setSel([]) }
    catch (e) { ui.toast(e instanceof Error ? e.message : 'Action failed') }
  }
  const exportOrders = () => {
    csv('drinksup-orders.csv', [['Order', 'Date', 'Customer', 'Channel', 'Subtotal', 'Discount', 'Shipping', 'Total', 'GST', 'Payment', 'Fulfilment'], ...O.map(o => [o.id, o.dt.toISOString(), o.cu.n, o.ch, o.sub, o.disc, o.ship, o.tot, (o.tot / 11).toFixed(2), o.ps, o.fs])])
    ui.toast('Exported drinksup-orders.csv')
  }
  return <>
    <div className="ph"><div><div className="eb">Sales</div><h1>Orders</h1><p>{O.length} orders in the last 90 days</p></div><div className="acts"><button className="btn" onClick={exportOrders}><Icon n="dl" />Export</button><button className="btn pri" onClick={() => ui.toast('Draft orders aren’t set up yet — orders come in from the storefront checkout')}><Icon n="plus" />Create order</button></div></div>
    <div className="card"><div className="tabs">{tabs.map(t => <button key={t} className={OF.tab === t ? 'on' : ''} onClick={() => of('tab', t)}>{t}<sup>{t === 'All' ? O.length : O.filter(o => o.fs === t).length}</sup></button>)}</div>
      <div className="fl"><label className="gs"><SearchIcon /><input placeholder="Search order #, customer or product" value={OF.q} onChange={e => of('q', e.target.value)} /></label>
        <select className="sel" value={OF.ch} onChange={e => of('ch', e.target.value)}><option value="">All channels</option>{['Online store', 'Shop app', 'Instagram', 'Trade portal'].map(c => <option key={c}>{c}</option>)}</select>
        <span className="note" style={{ marginLeft: 'auto' }}>{l.length} result{l.length === 1 ? '' : 's'}</span></div>
      <div className={'bulk' + (sel.length ? ' on' : '')} id="bulk"><b>{sel.length} selected</b><button className="btn" onClick={() => window.print()}><Icon n="print" />Print packing slips</button><button className="btn" onClick={() => ui.toast('Australia Post / StarTrack isn’t connected yet — connect it in Settings › Integrations to create labels')}><Icon n="truck" />Create labels</button><button className="btn" onClick={() => bulk('Marked as fulfilled', 'fulfil')}>Mark fulfilled</button></div>
      <div className="tw"><table><thead><tr><th><input type="checkbox" className="cb" aria-label="Select all" checked={rows.length > 0 && rows.every(o => sel.includes(o.id))} onChange={e => { const on = e.target.checked; setSel(s => on ? [...new Set([...s, ...rows.map(o => o.id)])] : s.filter(x => !rows.some(o => o.id === x))) }} /></th><th>Order</th><th>Date</th><th>Customer</th><th>Channel</th><th className="num">Total</th><th>Payment</th><th>Fulfilment</th><th>Items</th><th>Delivery</th></tr></thead>
        <tbody>{rows.length ? rows.map(o => <tr key={o.id} className="cl" onClick={e => { if ((e.target as HTMLInputElement).type !== 'checkbox') ui.open({ kind: 'order', id: o.id }) }}>
          <td><input type="checkbox" className="cb" aria-label={'Select ' + o.id} checked={sel.includes(o.id)} onChange={e => toggle(o.id, e.target.checked)} /></td><td><b>{o.id}</b></td><td>{fdt(o.dt)}</td><td>{o.cu.n}<span className="sub">{o.cu.city} {o.cu.st}</span></td><td>{o.ch}</td><td className="num"><b>{money(o.tot)}</b></td><td><PsB s={o.ps} /></td><td><FsB s={o.fs} /></td><td>{sum(o.items, x => x.q)}</td><td>{o.ship ? 'Standard' : 'Free · Express'}</td></tr>)
          : <tr><td colSpan={10} className="empty">No orders match.</td></tr>}</tbody></table></div>
      <div className="pg"><span>Page {page + 1} of {pages}</span><span style={{ display: 'flex', gap: 6 }}><button className="btn sm" disabled={!page} onClick={() => of('page', page - 1)}>‹ Prev</button><button className="btn sm" disabled={page >= pages - 1} onClick={() => of('page', page + 1)}>Next ›</button></span></div></div>
  </>
}

export function OrderDrawer({ id }: { id: string }) {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const o = m.O.find(x => x.id === id)
  if (!o) return null
  const gst = o.tot / 11
  const steps: [string, Date, string][] = [['Order placed', o.dt, `${o.ch} · paid by ${o.ch === 'Trade portal' ? 'invoice' : o.ps === 'Pending payment' ? 'Shopify checkout (awaiting payment)' : 'card (Shopify Payments)'}`], ['Age confirmed', o.dt, 'Customer confirmed 18+ at checkout; ID may be checked on delivery']]
  const run = async (fn: () => Promise<unknown>, msg: string, closeAfter = true) => {
    setBusy(true)
    try { await fn(); ui.toast(msg); if (closeAfter) ui.close() } catch (e) { ui.toast(e instanceof Error ? e.message : 'Action failed') } finally { setBusy(false) }
  }
  const refund = () => { if (confirm(`Refund ${money(o.tot)} for ${o.id}?`)) run(() => act.patchOrder(o.id, { ps: 'Refunded', fs: 'Returned' }), 'Refund issued to original payment method') }
  const fulfil = () => run(() => act.patchOrder(o.id, { fs: 'Shipped' }), 'Marked as shipped')
  const paid = () => run(() => act.patchOrder(o.id, { ps: 'Paid' }), `${o.id} marked as paid`, false)
  const post = () => { const t = note.trim(); if (!t) return; run(async () => { await act.addNote(o.id, t); setNote('') }, 'Note added to ' + o.id, false) }
  const a = o.addr
  return <>
    <div className="dh"><h2>Order {o.id}</h2><PsB s={o.ps} /><FsB s={o.fs} /><button className="ib x" aria-label="Close" onClick={ui.close}><Icon n="x" /></button></div>
    <div className="db">
      <div className="card"><div className="hd"><h3>Items</h3><div className="r note">{sum(o.items, x => x.q)} bottles</div></div>
        {o.items.map(x => { const p = m.byH[x.h]; return <div className="li" key={x.h}><Thumb p={p} /><div className="m"><b>{full(p)}</b><small>SKU {SKU(p)} · {p.size || '—'} · Bin {m.INV[p.h].loc}</small></div><div className="e">{x.q} × {money(x.p)}<br /><b>{money(x.q * x.p)}</b></div></div> })}
        <div className="bd" style={{ borderTop: '1px solid var(--line2)' }}><dl className="kv"><dt>Subtotal</dt><dd>{money(o.sub)}</dd>{o.disc ? <><dt>Discount</dt><dd>−{money(o.disc)} · <span className="chip">{o.code}</span></dd></> : null}<dt>Shipping</dt><dd>{o.ship ? money(o.ship) + ' · Standard' : 'Free (over $150)'}</dd><dt><b>Total</b></dt><dd><b>{money(o.tot)} AUD</b></dd><dt>Includes GST</dt><dd>{money(gst)}</dd></dl></div></div>
      <div className="grid g2"><div className="card"><div className="hd"><h3>Customer</h3></div><div className="bd"><b>{o.cu.n}</b>{o.cu.trade ? <> <B t="Trade" c="i" /></> : null}<p className="note" style={{ margin: '4px 0 10px' }}>{o.cu.orders.length} orders · {money(o.cu.spent, 0)} lifetime</p><p>{o.cu.em}</p><p style={{ marginTop: 6 }}><Link className="lk" style={{ color: 'var(--info)', fontWeight: 600 }} to="/customers" onClick={() => setTimeout(() => ui.open({ kind: 'customer', id: o.cu.id }), 50)}>View profile →</Link></p></div></div>
        <div className="card"><div className="hd"><h3>Ship to</h3></div><div className="bd">
          {a ? <>{a.first} {a.last}<br />{a.line1}{a.line2 ? <><br />{a.line2}</> : null}<br />{a.city} {a.st} {a.pc}<br />Australia{a.phone ? <><br />{a.phone}</> : null}{a.note ? <p className="note" style={{ marginTop: 6 }}>“{a.note}”</p> : null}</>
            : <>{o.cu.contact}<br />{[o.cu.city, o.cu.st, o.cu.pc].filter(Boolean).join(' ') || 'Address not recorded'}<br />Australia</>}
          <p className="note" style={{ marginTop: 8 }}>{o.carrier} · Signature required (alcohol)</p></div></div></div>
      <div className="card"><div className="hd"><h3>Timeline</h3></div><div className="bd"><div className="tl">
        {steps.map((s, i) => <div key={i}><b>{s[0]}</b><small>{fdt(s[1])} · {s[2]}</small></div>)}
        {(o.notes || []).map((n, i) => <div key={'n' + i}><b>Note · {n.by}</b><small>{fdt(new Date(n.at))} · {n.text}</small></div>)}
      </div>
        <div className="row" style={{ marginTop: 6 }}><input className="in" placeholder="Add an internal note…" value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') post() }} /><button className="btn" disabled={busy} onClick={post}>Post</button></div></div></div>
    </div>
    <div className="df">
      {o.ps === 'Pending payment' && <button className="btn" disabled={busy} onClick={paid}><Icon n="check" />Mark as paid</button>}
      <button className="btn dng" disabled={busy || o.ps === 'Refunded'} onClick={refund}><Icon n="ret" />Refund</button>
      <button className="btn" onClick={() => window.print()}><Icon n="print" />Packing slip</button>
      {o.fs === 'Unfulfilled' || o.fs === 'Packing' || o.fs === 'Ready to ship'
        ? <button className="btn pri" disabled={busy} onClick={fulfil}><Icon n="truck" />Mark as shipped</button>
        : <button className="btn" onClick={() => ui.toast('Tracking: ' + o.track)}>Track parcel</button>}
    </div>
  </>
}
