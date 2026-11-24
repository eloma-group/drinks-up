import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { TODAY, full, money, SKU } from '../lib/format'
import type { FS } from '../lib/types'
import { Icon } from '../components/icons'
import { Thumb, useUI } from '../components/ui'

export default function Fulfil() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const { O, INV, byH } = m
  const cols: [FS, string][] = [['Unfulfilled', 'To pick'], ['Packing', 'Packing'], ['Ready to ship', 'Ready for courier'], ['Shipped', 'Shipped today']]
  const q = O.filter(o => o.fs === 'Unfulfilled' || o.fs === 'Packing')
  const pickl: Record<string, number> = {}; q.forEach(o => o.items.forEach(x => { pickl[x.h] = (pickl[x.h] || 0) + x.q }))
  const NEXT: Partial<Record<FS, FS>> = { Unfulfilled: 'Packing', Packing: 'Ready to ship', 'Ready to ship': 'Shipped' }
  const advance = async (id: string, fs: FS) => {
    const n = NEXT[fs]; if (!n) return
    try { await act.patchOrder(id, { fs: n }); ui.toast(`${id} → ${n}`) } catch (e) { ui.toast(e instanceof Error ? e.message : 'Action failed') }
  }
  const allLabels = async () => {
    const ids = O.filter(o => o.fs === 'Ready to ship').map(o => o.id)
    if (!ids.length) return ui.toast('No orders are ready to ship'); ui.toast('Australia Post / StarTrack isn’t connected yet — connect it in Settings › Integrations to create labels')
  }
  return <>
    <div className="ph"><div><div className="eb">Warehouse</div><h1>Fulfilment</h1><p>Pick, pack and hand orders to the courier</p></div><div className="acts"><button className="btn" onClick={() => window.print()}><Icon n="print" />Print pick list</button><button className="btn pri" onClick={allLabels}><Icon n="truck" />Create all labels</button></div></div>
    <div className="kb">{cols.map(([s, t]) => {
      const l = O.filter(o => o.fs === s && (s !== 'Shipped' || (+TODAY - +o.dt) / 864e5 < 3))
      return <div className="col" key={s}><h4>{t}<em>{l.length}</em></h4>
        {l.length ? l.slice(0, 8).map(o => <div className="kc" key={o.id} onClick={() => ui.open({ kind: 'order', id: o.id })}>
          <div className="t"><span>{o.id}</span><span>{money(o.tot)}</span></div><small>{o.cu.n} · {o.cu.st} · {o.ship ? 'Standard' : 'Express'}</small>
          <div className="ths">{o.items.slice(0, 5).map(x => <Thumb key={x.h} p={byH[x.h]} />)}</div>
          {s !== 'Shipped' && <button className="btn sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); advance(o.id, s) }}>{s === 'Unfulfilled' ? 'Start packing' : s === 'Packing' ? 'Mark ready' : 'Hand to courier'} →</button>}
        </div>) : <p className="note" style={{ padding: 8 }}>Nothing here.</p>}</div>
    })}</div>
    <div className="card mt"><div className="hd"><h3>Pick list</h3><div className="r note">{Object.keys(pickl).length} SKUs · {Object.values(pickl).reduce((a, b) => a + b, 0)} bottles across {q.length} orders</div></div>
      <div className="tw"><table><thead><tr><th>Bin</th><th>Product</th><th>SKU</th><th className="num">Qty to pick</th><th className="num">On hand</th></tr></thead><tbody>
        {Object.entries(pickl).sort((a, b) => INV[a[0]].loc.localeCompare(INV[b[0]].loc)).map(([h, n]) => { const p = byH[h]; return <tr key={h}><td><b>{INV[h].loc}</b></td><td><div className="pn"><Thumb p={p} /><b>{full(p)}</b></div></td><td>{SKU(p)}</td><td className="num"><b>{n}</b></td><td className="num">{INV[h].st ?? '—'}</td></tr> })}
      </tbody></table></div></div>
  </>
}
