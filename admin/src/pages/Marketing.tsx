import { useStore } from '../lib/store'
import { money } from '../lib/format'
import { Icon } from '../components/icons'
import { B, useUI } from '../components/ui'

export default function Marketing() {
  const { m } = useStore()
  const ui = useUI()
  return <>
    <div className="ph"><div><div className="eb">Marketing</div><h1>Campaigns</h1><p>Email, SMS and automations · responsible-service wording checked before send</p></div><div className="acts"><button className="btn pri" onClick={() => ui.toast('Campaign editor opened')}><Icon n="plus" />New campaign</button></div></div>
    {(() => { const sent = m.raw.campaigns.filter(c => c.sent > 0); const avg = (k: 'open' | 'click') => sent.length ? (sent.reduce((a, c) => a + c[k], 0) / sent.length).toFixed(1) + '%' : '—'; const rev = m.raw.campaigns.reduce((a, c) => a + c.rev, 0); return <div className="grid g4"><div className="card kpi"><small>Subscribers</small><b>{m.C.filter(c => c.news).length.toLocaleString()}</b><span className="note">Customers opted in to email</span></div><div className="card kpi"><small>Avg open rate</small><b>{avg('open')}</b></div><div className="card kpi"><small>Avg click rate</small><b>{avg('click')}</b></div><div className="card kpi"><small>Attributed revenue</small><b>{rev ? money(rev, 0) : '—'}</b></div></div> })()}
    <div className="card mt"><div className="tw"><table><thead><tr><th>Campaign</th><th>Channel</th><th>Audience</th><th>Status</th><th>Date</th><th className="num">Sent</th><th className="num">Open</th><th className="num">Click</th><th className="num">Revenue</th></tr></thead><tbody>
      {m.raw.campaigns.map(c => <tr key={c.n}><td><b>{c.n}</b></td><td>{c.ch}</td><td>{c.aud}</td><td><B t={c.st} c={c.st === 'Sent' ? 'g' : c.st === 'Live' ? 'i' : 'w'} /></td><td>{c.dt}</td><td className="num">{c.sent ? c.sent.toLocaleString() : '—'}</td><td className="num">{c.open ? c.open + '%' : '—'}</td><td className="num">{c.click ? c.click + '%' : '—'}</td><td className="num">{c.rev ? money(c.rev, 0) : '—'}</td></tr>)}
    </tbody></table></div></div>
  </>
}
