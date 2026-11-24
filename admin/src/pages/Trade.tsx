import { useStore } from '../lib/store'
import { inRange, money, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { B, useUI } from '../components/ui'

export default function Trade() {
  const { m } = useStore()
  const ui = useUI()
  const { C, O } = m
  const T = C.filter(c => c.trade)
  return <>
    <div className="ph"><div><div className="eb">Trade</div><h1>Trade accounts</h1><p>Bars, restaurants and venues buying at trade pricing</p></div><div className="acts"><button className="btn pri" onClick={() => ui.toast('Trade applications aren’t set up yet')}><Icon n="plus" />Invite venue</button></div></div>
    <div className="grid g4"><div className="card kpi"><small>Active venues</small><b>{T.length}</b></div><div className="card kpi"><small>Trade sales · 30d</small><b>{money(sum(O.filter(o => o.cu.trade && inRange(o, 30)), o => o.tot), 0)}</b></div><div className="card kpi"><small>Outstanding invoices</small><b>{money(sum(O.filter(o => o.ps === 'Due in 14 days'), o => o.tot), 0)}</b></div><div className="card kpi"><small>Trade orders · 30d</small><b>{O.filter(o => o.cu.trade && inRange(o, 30)).length}</b></div></div>
    <div className="card mt"><div className="tw"><table><thead><tr><th>Venue</th><th>Location</th><th>Tier</th><th>Terms</th><th className="num">Credit limit</th><th className="num">Owing</th><th className="num">Orders</th><th className="num">Spent</th></tr></thead><tbody>
      {T.map(c => { const ow = sum(c.orders.filter(o => o.ps === 'Due in 14 days'), o => o.tot); return <tr key={c.id} className="cl" onClick={() => ui.open({ kind: 'customer', id: c.id })}><td><b>{c.n}</b><span className="sub">Contact: {c.contact}</span></td><td>{c.city}, {c.st}</td><td><B t="Trade pricing" c="i" /></td><td>14 days</td><td className="num">—</td><td className="num">{ow ? <b style={{ color: 'var(--warn)' }}>{money(ow)}</b> : '—'}</td><td className="num">{c.orders.length}</td><td className="num"><b>{money(c.spent, 0)}</b></td></tr> })}
    </tbody></table></div></div>
  </>
}
