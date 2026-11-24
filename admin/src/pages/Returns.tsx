import { useStore } from '../lib/store'
import { fd, money, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { B, Thumb, useUI } from '../components/ui'

export default function Returns() {
  const { m } = useStore()
  const ui = useUI()
  const { O, byH } = m
  const r = O.filter(o => o.ps === 'Refunded' || o.ps === 'Partially refunded')
  const rows = r.map(o => ({ o, st: o.ps === 'Refunded' ? 'Refunded' : 'Partially refunded' }))
  const full = r.filter(o => o.ps === 'Refunded')
  return <>
    <div className="ph"><div><div className="eb">Sales</div><h1>Returns & refunds</h1><p>30-day returns on eligible, unopened items</p></div><div className="acts"><button className="btn pri" onClick={() => ui.toast('To refund an order, open it from Orders and choose Refund')}><Icon n="plus" />Create return</button></div></div>
    <div className="grid g4"><div className="card kpi"><small>Refunded orders</small><b>{full.length}</b></div><div className="card kpi"><small>Refunded amount</small><b>{money(sum(full, o => o.tot), 0)}</b></div><div className="card kpi"><small>Return rate</small><b>{(r.length / (O.length || 1) * 100).toFixed(1)}%</b></div><div className="card kpi"><small>Partially refunded</small><b>{r.length - full.length}</b></div></div>
    <div className="card mt"><div className="hd"><h3>Refunds</h3></div><div className="tw"><table><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Item</th><th>Status</th><th className="num">Order total</th></tr></thead><tbody>
      {rows.length ? rows.map(x => { const p = byH[x.o.items[0]?.h]; return <tr key={x.o.id} className="cl" onClick={() => ui.open({ kind: 'order', id: x.o.id })}><td><b>{x.o.id}</b></td><td>{fd(x.o.dt)}</td><td>{x.o.cu.n}</td><td><div className="pn"><Thumb p={p} /><span>{p?.t}</span></div></td><td><B t={x.st} c={x.st === 'Refunded' ? 'g' : 'i'} /></td><td className="num">{money(x.o.tot)}</td></tr> }) : <tr><td colSpan={6} className="empty">No refunds yet.</td></tr>}
    </tbody></table></div></div>
  </>
}
