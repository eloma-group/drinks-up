import { useStore } from '../lib/store'
import { usePersist } from '../lib/persist'
import { TODAY, csv, dAgo, fd, inRange, money, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { HBars, LineChart } from '../components/Charts'
import { Thumb, useUI } from '../components/ui'
import { daily, live } from './Overview'

export default function Reports() {
  const { m } = useStore()
  const ui = useUI()
  const [RR, setRR] = usePersist('RR', 30)
  const { O, byH, INV } = m
  const cur = O.filter(o => inRange(o, RR) && live(o))
  const labels = Array.from({ length: RR }, (_, i) => fd(dAgo(RR - 1 - i)))
  const pr: Record<string, { q: number; v: number }> = {}, br: Record<string, number> = {}, st: Record<string, number> = {}
  cur.forEach(o => { st[o.cu.st] = (st[o.cu.st] || 0) + o.tot; o.items.forEach(x => { const p = byH[x.h]; pr[x.h] = pr[x.h] || { q: 0, v: 0 }; pr[x.h].q += x.q; pr[x.h].v += x.q * x.p; br[p.b] = (br[p.b] || 0) + x.q * x.p }) })
  const rows = Object.entries(pr).sort((a, b) => b[1].v - a[1].v)
  const tot = sum(rows, r => r[1].v)
  const exportReport = () => {
    csv('drinksup-sales-' + RR + 'd.csv', [['Date', 'Orders', 'Net sales'], ...Array.from({ length: RR }, (_, i) => { const day = RR - 1 - i; const l = O.filter(o => Math.floor((+TODAY - +o.dt) / 864e5) === day && live(o)); return [dAgo(day).toISOString().slice(0, 10), l.length, sum(l, o => o.tot).toFixed(2)] })])
    ui.toast('Exported drinksup-sales-' + RR + 'd.csv')
  }
  return <>
    <div className="ph"><div><div className="eb">Insights</div><h1>Reports</h1><p>{fd(dAgo(RR - 1))} – {fd(TODAY)}</p></div><div className="acts"><div className="seg">{[7, 30, 90].map(d => <button key={d} className={RR === d ? 'on' : ''} onClick={() => setRR(d)}>{d} days</button>)}</div><button className="btn" onClick={exportReport}><Icon n="dl" />Export CSV</button></div></div>
    <div className="card"><div className="hd"><h3>Orders per day</h3><div className="r note">{cur.length} orders</div></div><div className="bd"><LineChart labels={labels} series={[{ n: 'Orders', v: daily(O, RR, 0, () => 1), c: '#E8446F' }]} h={200} fmt={v => Math.round(v)} /></div></div>
    <div className="grid g3 mt"><div className="card"><div className="hd"><h3>Sales by brand</h3></div><div className="bd"><HBars rows={Object.entries(br).sort((a, b) => b[1] - a[1]).slice(0, 8)} /></div></div>
      <div className="card"><div className="hd"><h3>Sales by state</h3></div><div className="bd"><HBars rows={Object.entries(st).sort((a, b) => b[1] - a[1])} /></div></div>
      <div className="card"><div className="hd"><h3>Customers</h3></div><div className="bd"><HBars rows={[['New', cur.filter(o => o.cu.orders.length === 1).length], ['Returning', cur.filter(o => o.cu.orders.length > 1 && !o.cu.trade).length], ['Trade', cur.filter(o => o.cu.trade).length]]} fmt={v => v + ' orders'} /></div></div></div>
    <div className="card mt"><div className="hd"><h3>Product performance</h3></div><div className="tw"><table><thead><tr><th>#</th><th>Product</th><th className="num">Units</th><th className="num">Net sales</th><th className="num">Gross margin</th><th className="num">Share</th></tr></thead><tbody>
      {rows.slice(0, 15).map(([h, x], i) => { const p = byH[h]; const mm = (x.v / 1.1 - x.q * INV[h].cost); return <tr key={h}><td>{i + 1}</td><td><div className="pn"><Thumb p={p} /><div><b>{p.t}</b><span className="sub">{p.b}</span></div></div></td><td className="num">{x.q}</td><td className="num"><b>{money(x.v)}</b></td><td className="num">{(mm / (x.v / 1.1) * 100).toFixed(0)}%</td><td className="num">{(x.v / (tot || 1) * 100).toFixed(1)}%</td></tr> })}
    </tbody></table></div></div>
  </>
}
