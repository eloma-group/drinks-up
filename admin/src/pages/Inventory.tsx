import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { usePersist } from '../lib/persist'
import { money, SKU, sum } from '../lib/format'
import { Icon } from '../components/icons'
import { B, Thumb, useUI } from '../components/ui'

/** Stock adjust keeps the mockup's prompt() UX, then persists. */
export function useAdjust() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  return useCallback(async (h: string) => {
    const n = prompt('New on-hand count for ' + m.byH[h].t, m.INV[h].st == null ? '' : String(m.INV[h].st))
    if (n === null || n.trim() === '' || isNaN(+n) || +n < 0) return
    try { await act.patchInv(h, { st: Math.round(+n), reason: 'Manual adjustment' }); ui.toast('Stock updated · reason logged') }
    catch (e) { ui.toast(e instanceof Error ? e.message : 'Update failed') }
  }, [m, ui, act])
}

export function useReorder() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  return useCallback(async (h: string) => {
    const p = m.byH[h], v = m.INV[h]
    try { await act.createPO({ sup: m.supOf(p), items: [{ h, q: Math.max(12, v.rop * 2) }], st: 'Draft' }); ui.toast(`Added ${p.t} to draft PO for ${m.supOf(p)}`) }
    catch (e) { ui.toast(e instanceof Error ? e.message : 'Could not create PO') }
  }, [m, ui, act])
}

export default function Inventory() {
  const { m } = useStore()
  const ui = useUI()
  const adjust = useAdjust()
  const reorder = useReorder()
  const [IF, setIF] = usePersist('IF', '')
  const { P, INV } = m
  const ord = { r: 0, w: 1, n: 2, g: 3 }
  let l = [...P].sort((a, b) => ord[m.stockState(a.h)[1]] - ord[m.stockState(b.h)[1]] || (INV[a.h].st ?? 0) - (INV[b.h].st ?? 0))
  if (IF) l = l.filter(p => m.stockState(p.h)[0] === IF)
  const val = sum(P, p => (INV[p.h].st ?? 0) * INV[p.h].cost), retail = sum(P, p => (INV[p.h].st ?? 0) * p.p)
  return <>
    <div className="ph"><div><div className="eb">Catalogue</div><h1>Inventory</h1><p>Updated live from orders, refunds and receiving</p></div><div className="acts"><button className="btn" onClick={() => ui.toast('Stocktake started — scan or enter counts')}>Start stocktake</button><Link className="btn pri" to="/purchasing"><Icon n="po" />Purchase orders</Link></div></div>
    <div className="grid g4"><div className="card kpi"><small>Stock value (cost)</small><b>{money(val, 0)}</b><span className="note">{money(retail, 0)} at retail</span></div><div className="card kpi"><small>Units on hand</small><b>{sum(P, p => INV[p.h].st ?? 0).toLocaleString()}</b><span className="note">{P.filter(p => m.stockState(p.h)[1] === 'n').length} products not counted yet</span></div>
      <div className="card kpi"><small>Low stock</small><b style={{ color: 'var(--warn)' }}>{P.filter(p => m.stockState(p.h)[1] === 'w').length}</b><span className="note">At or below reorder point</span></div><div className="card kpi"><small>Out of stock</small><b style={{ color: 'var(--bad)' }}>{P.filter(p => m.stockState(p.h)[1] === 'r').length}</b><span className="note">Hidden from “in stock” filter</span></div></div>
    <div className="card mt"><div className="fl"><div className="seg">{[['', 'All'], ['Low stock', 'Low'], ['Out of stock', 'Out'], ['In stock', 'Healthy'], ['Stock not set', 'Not set']].map(([k, t]) => <button key={k} className={IF === k ? 'on' : ''} onClick={() => setIF(k)}>{t}</button>)}</div><span className="note" style={{ marginLeft: 'auto' }}>Days of cover = on hand ÷ average daily sales (30 days)</span></div>
      <div className="tw"><table><thead><tr><th>Product</th><th>Bin</th><th className="num">On hand</th><th>Level</th><th className="num">Reorder at</th><th className="num">Incoming</th><th className="num">Sold · 30d</th><th className="num">Days of cover</th><th>Status</th><th></th></tr></thead><tbody>
        {l.map(p => {
          const v = INV[p.h], s = m.stockState(p.h), cov = v.s30 && v.st != null ? Math.round(v.st / (v.s30 / 30)) : null, lv = Math.min(100, (v.st ?? 0) / (v.rop * 3 || 1) * 100)
          return <tr key={p.h}><td><Link className="pn" to={'/products/' + encodeURIComponent(p.h)}><Thumb p={p} /><div><b>{p.t}</b><span className="sub">{p.b} · {SKU(p)}</span></div></Link></td><td>{v.loc}</td><td className="num"><b>{v.st ?? '—'}</b></td>
            <td><span className="stk"><i style={{ width: lv + '%', background: `var(--${s[1] === 'g' ? 'good' : s[1] === 'w' ? 'warn' : 'bad'})` }} /></span></td><td className="num">{v.rop}</td><td className="num">{v.inc || '—'}</td><td className="num">{v.s30}</td><td className="num">{cov === null ? '—' : cov + ' d'}</td><td><B t={s[0]} c={s[1]} /></td>
            <td>{(s[1] === 'w' || s[1] === 'r') && p.ok ? <button className="btn sm" onClick={() => reorder(p.h)}>Reorder</button> : <button className="btn sm" onClick={() => adjust(p.h)}>{v.st == null ? 'Set stock' : 'Adjust'}</button>}</td></tr>
        })}
      </tbody></table></div></div>
  </>
}
