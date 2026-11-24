import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { usePersist } from '../lib/persist'
import { CATS, TODAY, dAgo, fd, fdt, inRange, initials, k$, money, sum } from '../lib/format'
import type { Order } from '../lib/types'
import { Icon } from '../components/icons'
import { HBars, LineChart, Spark } from '../components/Charts'
import { FsB, Thumb, useUI } from '../components/ui'

export const live = (o: Order) => o.ps !== 'Refunded'
export const daily = (O: Order[], days: number, off: number, f: (o: Order) => number) =>
  Array.from({ length: days }, (_, i) => { const d = days - 1 - i + off; return O.filter(o => Math.floor((+TODAY - +o.dt) / 864e5) === d && o.ps !== 'Refunded').reduce((a, o) => a + f(o), 0) })

export function greeting() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening' }

export default function Overview() {
  const { m } = useStore()
  const ui = useUI()
  const [RANGE, setRange] = usePersist('RANGE', 30)
  const { O, P, INV, byH, RV } = m
  const cur = O.filter(o => inRange(o, RANGE) && live(o)), prev = O.filter(o => inRange(o, RANGE, RANGE) && live(o))
  const rv = sum(cur, o => o.tot), rp = sum(prev, o => o.tot), aov = rv / (cur.length || 1), aovp = rp / (prev.length || 1)
  const units = sum(cur, o => sum(o.items, x => x.q)), unitsp = sum(prev, o => sum(o.items, x => x.q))
  const dd = (a: number, b: number) => { const d = b ? (a - b) / b * 100 : 0; return <span className={'dl ' + (d >= 0 ? 'up' : 'dn')}>{d >= 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)}% <span>vs previous {RANGE} days</span></span> }
  const labels = Array.from({ length: RANGE }, (_, i) => fd(dAgo(RANGE - 1 - i)))
  const dRev = daily(O, RANGE, 0, o => o.tot), dPrev = daily(O, RANGE, RANGE, o => o.tot), dOrd = daily(O, RANGE, 0, () => 1), dU = daily(O, RANGE, 0, o => sum(o.items, x => x.q))
  const unf = O.filter(o => o.fs === 'Unfulfilled'), pk = O.filter(o => o.fs === 'Packing' || o.fs === 'Ready to ship')
  const low = P.filter(p => ['w', 'r'].includes(m.stockState(p.h)[1])).sort((a, b) => (INV[a.h].st ?? 0) - (INV[b.h].st ?? 0))
  const prodRev: Record<string, number> = {}; cur.forEach(o => o.items.forEach(x => { prodRev[x.h] = (prodRev[x.h] || 0) + x.p * x.q }))
  const top = Object.entries(prodRev).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const catRev: Record<string, number> = {}; cur.forEach(o => o.items.forEach(x => { const c = CATS[byH[x.h].c]; catRev[c] = (catRev[c] || 0) + x.p * x.q }))
  const chRev = cur.reduce<Record<string, number>>((a, o) => (a[o.ch] = (a[o.ch] || 0) + o.tot, a), {})

  return <>
    <div className="ph"><div><div className="eb">Drinks Up back office</div><h1>Good <em>{greeting()}</em></h1><p>Here’s how Drinks Up is tracking — {fd(dAgo(RANGE - 1))} to {fd(TODAY)}.</p></div>
      <div className="acts"><div className="seg">{[7, 30, 90].map(d => <button key={d} className={RANGE === d ? 'on' : ''} onClick={() => setRange(d)}>{d} days</button>)}</div><Link className="btn" to="/reports"><Icon n="rep" />Full reports</Link></div></div>
    <div className="grid g4">
      <div className="card kpi"><small>Net sales</small><b>{money(rv, 0)}</b>{dd(rv, rp)}<Spark v={dRev} /></div>
      <div className="card kpi"><small>Orders</small><b>{cur.length}</b>{dd(cur.length, prev.length)}<Spark v={dOrd} /></div>
      <div className="card kpi"><small>Average order value</small><b>{money(aov)}</b>{dd(aov, aovp)}<Spark v={dRev.map((v, i) => dOrd[i] ? v / dOrd[i] : 0)} /></div>
      <div className="card kpi"><small>Bottles sold</small><b>{units}</b>{dd(units, unitsp)}<Spark v={dU} /></div>
    </div>
    <div className="grid g21 mt">
      <div className="card"><div className="hd"><h3>Net sales</h3><div className="r legend"><span><i style={{ background: 'var(--s1)' }} />Last {RANGE} days</span><span><i style={{ background: 'var(--s0)' }} />Previous {RANGE} days</span></div></div>
        <div className="bd"><LineChart labels={labels} series={[{ n: 'This period', v: dRev, c: '#E8446F' }, { n: 'Previous period', v: dPrev, c: '#B8ACB0', dash: true }]} h={330} /></div></div>
      <div className="card"><div className="hd"><h3>To do today</h3></div>
        <div className="task"><span className="ic" style={{ background: 'var(--warnb)', color: 'var(--warn)' }}><Icon n="orders" /></span><div><b>{unf.length} orders to fulfil</b><small>Oldest placed {unf.length ? fdt(unf[unf.length - 1].dt) : '—'}</small></div><Link className="btn sm" to="/fulfil">Start picking</Link></div>
        <div className="task"><span className="ic" style={{ background: 'var(--infob)', color: 'var(--info)' }}><Icon n="truck" /></span><div><b>{pk.length} being packed</b><small>Packing or ready for the courier</small></div><Link className="btn sm" to="/fulfil">View</Link></div>
        <div className="task"><span className="ic" style={{ background: 'var(--badb)', color: 'var(--bad)' }}><Icon n="alert" /></span><div><b>{low.length} products low or out</b><small>{low.slice(0, 2).map(p => p.t).join(', ')}</small></div><Link className="btn sm" to="/inventory">Reorder</Link></div>
        <div className="task"><span className="ic" style={{ background: '#F1EFEB' }}><Icon n="rev" /></span><div><b>{RV.filter(r => r.st === 'Pending').length} reviews to moderate</b><small>Verified buyers only</small></div><Link className="btn sm" to="/reviews">Review</Link></div>
        <div className="task"><span className="ic" style={{ background: '#F1EFEB' }}><Icon n="trade" /></span><div><b>{O.filter(o => o.ps === 'Due in 14 days').length} trade invoices due</b><small>On 14-day terms</small></div><Link className="btn sm" to="/trade">Open</Link></div>
      </div>
    </div>
    <div className="grid g3 mt">
      <div className="card"><div className="hd"><h3>Top products</h3><div className="r"><Link className="lk" to="/reports">See all</Link></div></div>
        {!top.length && <p className="empty">No sales in this period yet.</p>}{top.map(([h, v]) => { const p = byH[h]; return <Link key={h} className="li" to={'/products/' + encodeURIComponent(h)}><Thumb p={p} /><div className="m"><b>{p.t}</b><small>{p.b}</small></div><div className="e"><b>{k$(v)}</b></div></Link> })}</div>
      <div className="card"><div className="hd"><h3>Sales by category</h3></div><div className="bd"><HBars rows={Object.entries(catRev).sort((a, b) => b[1] - a[1])} /></div>
        <div className="hd" style={{ borderTop: '1px solid var(--line2)' }}><h3>Sales by channel</h3></div><div className="bd"><HBars rows={Object.entries(chRev).sort((a, b) => b[1] - a[1])} /></div></div>
      <div className="card"><div className="hd"><h3>Latest orders</h3><div className="r"><Link className="lk" to="/orders">All orders</Link></div></div>
        {!O.length && <p className="empty">No orders yet — they appear here as soon as customers check out.</p>}{O.slice(0, 7).map(o => <div key={o.id} className="li" style={{ cursor: 'pointer' }} onClick={() => ui.open({ kind: 'order', id: o.id })}><span className="av">{initials(o.cu.n)}</span><div className="m"><b>{o.id} · {o.cu.n}</b><small>{fdt(o.dt)} · {o.ch}</small></div><div className="e"><b>{money(o.tot)}</b><br /><FsB s={o.fs} /></div></div>)}</div>
    </div>
  </>
}
