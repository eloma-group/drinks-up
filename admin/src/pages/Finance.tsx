import { useStore } from '../lib/store'
import { CATS, TODAY, csv, dAgo, fd, inRange, money, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { HBars } from '../components/Charts'
import { B, useUI } from '../components/ui'
import { live } from './Overview'

export default function Finance() {
  const { m } = useStore()
  const ui = useUI()
  const { O, byH, INV } = m
  const months = [2, 1, 0].map(k => new Date(TODAY.getFullYear(), TODAY.getMonth() - k, 1))
  const mo = (d: Date) => O.filter(o => o.dt.getMonth() === d.getMonth() && o.dt.getFullYear() === d.getFullYear())
  const pay = Array.from({ length: 6 }, (_, i) => { const l = O.filter(o => inRange(o, 3, i * 3) && live(o) && o.ps === 'Paid' && !o.cu.trade); const g = sum(l, o => o.tot), fee = g * .0175 + l.length * .3; return { d: dAgo(i * 3), n: l.length, g, fee, net: g - fee, st: i === 0 ? 'In transit' : 'Paid' } })
  const margins: [string, number][] = (Object.entries(CATS) as [string, string][]).map(([k, n]) => {
    let v = 0, c = 0
    O.filter(o => inRange(o, 30) && live(o)).forEach(o => o.items.forEach(x => { if (byH[x.h].c === k) { v += x.q * x.p / 1.1; c += x.q * INV[x.h].cost } }))
    return [n, v ? (v - c) / v * 100 : 0] as [string, number]
  }).sort((a, b) => b[1] - a[1])
  const exportGST = () => {
    csv('drinksup-gst.csv', [['Order', 'Date', 'Total inc GST', 'GST', 'Ex GST'], ...O.filter(live).map(o => [o.id, o.dt.toISOString().slice(0, 10), o.tot, (o.tot / 11).toFixed(2), (o.tot / 1.1).toFixed(2)])])
    ui.toast('Exported drinksup-gst.csv')
  }
  return <>
    <div className="ph"><div><div className="eb">Insights</div><h1>Finance & GST</h1><p>All prices include 10% GST · figures for BAS preparation</p></div><div className="acts"><button className="btn" onClick={() => ui.toast('Xero isn’t connected yet — connect it in Settings › Integrations')}>Sync to Xero</button><button className="btn pri" onClick={exportGST}><Icon n="dl" />Export GST report</button></div></div>
    <div className="card"><div className="hd"><h3>Monthly summary</h3></div><div className="tw"><table><thead><tr><th>Month</th><th className="num">Gross sales</th><th className="num">Discounts</th><th className="num">Refunds</th><th className="num">Shipping charged</th><th className="num">Net sales (inc. GST)</th><th className="num">GST collected</th><th className="num">Net ex. GST</th></tr></thead><tbody>
      {months.map(d => { const l = mo(d), g = sum(l, o => o.sub), di = sum(l, o => o.disc), rf = sum(l.filter(o => o.ps === 'Refunded'), o => o.tot), sh = sum(l, o => o.ship), n = g - di - rf + sh
        return <tr key={+d}><td><b>{d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</b>{d.getMonth() === TODAY.getMonth() ? <> <B t="Month to date" c="n" /></> : null}</td><td className="num">{money(g)}</td><td className="num">−{money(di)}</td><td className="num">−{money(rf)}</td><td className="num">{money(sh)}</td><td className="num"><b>{money(n)}</b></td><td className="num">{money(n / 11)}</td><td className="num">{money(n / 1.1)}</td></tr> })}
    </tbody></table></div></div>
    <div className="grid g2 mt"><div className="card"><div className="hd"><h3>Payouts</h3><div className="r note">Shopify Payments · estimated fees</div></div><div className="tw"><table><thead><tr><th>Date</th><th className="num">Orders</th><th className="num">Gross</th><th className="num">Fees</th><th className="num">Net</th><th>Status</th></tr></thead><tbody>
      {pay.map(p => <tr key={+p.d}><td>{fd(p.d)}</td><td className="num">{p.n}</td><td className="num">{money(p.g)}</td><td className="num">−{money(p.fee)}</td><td className="num"><b>{money(p.net)}</b></td><td><B t={p.st} c={p.st === 'Paid' ? 'g' : 'i'} /></td></tr>)}</tbody></table></div></div>
      <div className="card"><div className="hd"><h3>Margin by category · 30 days</h3></div><div className="bd"><HBars rows={margins} fmt={v => v.toFixed(1) + '%'} />
        <p className="note" style={{ marginTop: 10 }}>Gross margin = (net sales ex. GST − cost of goods) ÷ net sales ex. GST. Costs are placeholders until real landed costs are loaded.</p></div></div></div>
  </>
}
