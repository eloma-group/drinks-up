import { useState } from 'react'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { fd, full, money, SKU, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { B, Thumb, useUI } from '../components/ui'

const POC: Record<string, string> = { 'In transit': 'i', 'At customs': 'w', Received: 'g', Draft: '' }

export default function Purchasing() {
  const { m } = useStore()
  const ui = useUI()
  const { POS, INV, P, raw } = m
  const SUP = raw.suppliers
  const cost = (h: string) => INV[h]?.cost || 0
  return <>
    <div className="ph"><div><div className="eb">Supply</div><h1>Purchase orders</h1><p>Stock coming in from producers and importers</p></div><div className="acts"><button className="btn pri" onClick={() => ui.toast('New purchase order — choose a supplier')}><Icon n="plus" />New purchase order</button></div></div>
    <div className="card"><div className="tw"><table><thead><tr><th>PO</th><th>Supplier</th><th>Created</th><th>ETA</th><th className="num">Units</th><th className="num">Cost (ex. GST)</th><th>Status</th></tr></thead><tbody>
      {POS.map(po => <tr key={po.id} className="cl" onClick={() => ui.open({ kind: 'po', id: po.id })}><td><b>{po.id}</b></td><td>{po.sup}</td><td>{fd(po.dt)}</td><td>{fd(po.eta)}</td><td className="num">{sum(po.items, x => x.q)}</td><td className="num">{money(sum(po.items, x => x.q * cost(x.h)), 0)}</td><td><B t={po.st} c={POC[po.st]} /></td></tr>)}
    </tbody></table></div></div>
    <div className="card mt"><div className="hd"><h3>Suppliers</h3></div><div className="tw"><table><thead><tr><th>Supplier</th><th>Brands</th><th>Lead time</th><th>Terms</th><th>Minimum order</th><th className="num">Products</th></tr></thead><tbody>
      {[...new Set(Object.values(SUP).map(s => s.n))].map(n => { const bs = Object.keys(SUP).filter(b => SUP[b].n === n); const s = SUP[bs[0]]; return <tr key={n}><td><b>{n}</b></td><td>{bs.join(', ')}</td><td>{s.lead}</td><td>{s.terms}</td><td>{s.moq}</td><td className="num">{P.filter(p => bs.includes(p.b)).length}</td></tr> })}
    </tbody></table></div></div>
  </>
}

export function PODrawer({ id }: { id: string }) {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const [busy, setBusy] = useState(false)
  const po = m.POS.find(p => p.id === id)
  if (!po) return null
  const receive = async () => {
    setBusy(true)
    try { await act.patchPO(po.id, 'Received'); ui.toast('Received — stock levels updated'); ui.close() }
    catch (e) { ui.toast(e instanceof Error ? e.message : 'Could not receive') } finally { setBusy(false) }
  }
  return <>
    <div className="dh"><h2>{po.id}</h2><B t={po.st} c={POC[po.st] || 'i'} /><button className="ib x" aria-label="Close" onClick={ui.close}><Icon n="x" /></button></div>
    <div className="db">
      <div className="card"><div className="bd"><dl className="kv"><dt>Supplier</dt><dd>{po.sup}</dd><dt>Created</dt><dd>{fd(po.dt)}</dd><dt>Expected</dt><dd>{fd(po.eta)}</dd><dt>Ship to</dt><dd>Warehouse</dd></dl></div></div>
      <div className="card"><div className="hd"><h3>Lines</h3></div>{po.items.filter(x => m.byH[x.h]).map(x => { const p = m.byH[x.h], c = m.INV[x.h]?.cost || 0; return <div className="li" key={x.h}><Thumb p={p} /><div className="m"><b>{full(p)}</b><small>{SKU(p)} · cost {money(c)}</small></div><div className="e"><b>{x.q}</b> units<br />{money(x.q * c, 0)}</div></div> })}</div>
    </div>
    <div className="df"><button className="btn" onClick={() => window.print()}>Email PO</button>{po.st !== 'Received' && <button className="btn pri" disabled={busy} onClick={receive}><Icon n="check" />Receive stock</button>}</div>
  </>
}
