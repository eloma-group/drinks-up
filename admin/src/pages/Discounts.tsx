import { useState } from 'react'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { CATS } from '../lib/format'
import { Icon } from '../components/icons'
import { B, Sw, useUI } from '../components/ui'

export default function Discounts() {
  const { m } = useStore()
  const ui = useUI()
  return <>
    <div className="ph"><div><div className="eb">Marketing</div><h1>Discounts</h1><p>Codes and automatic offers</p></div><div className="acts"><button className="btn pri" onClick={() => ui.open({ kind: 'discount' })}><Icon n="plus" />Create discount</button></div></div>
    <div className="card"><div className="tw"><table><thead><tr><th>Code</th><th>Offer</th><th>Type</th><th>Status</th><th className="num">Used · 90d</th><th>Ends</th></tr></thead><tbody>
      {m.raw.discounts.map(d => <tr key={d.c}><td><b className="chip" style={{ fontWeight: 700 }}>{d.c}</b></td><td>{d.t}</td><td>{d.ty}</td><td><B t={d.st} c={d.st === 'Active' ? 'g' : d.st === 'Scheduled' ? 'i' : ''} /></td><td className="num">{d.u}</td><td>{d.ends}</td></tr>)}
    </tbody></table></div></div>
  </>
}

export function DiscountDrawer() {
  const ui = useUI()
  const act = useActions()
  const [f, setF] = useState({ c: 'SUMMER15', ty: 'Percentage', value: '15%', applies: 'All products', min: '', limit: '', starts: '', ends: '', once: true })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF(s => ({ ...s, [k]: e.target.value }))
  const title = () => {
    const v = f.value.trim()
    const what = f.applies === 'All products' ? '' : ' ' + f.applies
    if (f.ty === 'Free shipping') return 'Free shipping' + (f.min ? ' over ' + (f.min.startsWith('$') ? f.min : '$' + f.min) : '')
    if (f.ty === 'Fixed amount') return (v.startsWith('$') ? v : '$' + v) + ' off' + what
    if (f.ty === 'Buy X get Y') return 'Buy X get Y' + what
    return (v.endsWith('%') ? v : v + '%') + ' off' + (what || (f.min ? ` orders over $${f.min.replace('$', '')}` : ''))
  }
  const save = async () => {
    const code = f.c.trim().toUpperCase()
    if (!/^[A-Z0-9-]{3,24}$/.test(code)) { ui.toast('Codes are 3–24 letters, numbers or dashes'); return }
    setBusy(true)
    try {
      await act.createDiscount({ c: code, t: title(), ty: f.ty, value: f.value, applies: f.applies, min: parseFloat(f.min.replace('$', '')) || 0, limit: parseInt(f.limit) || undefined, starts: f.starts || undefined, ends: f.ends || undefined, once: f.once })
      ui.toast('Discount created'); ui.close()
    } catch (e) { ui.toast(e instanceof Error ? e.message : 'Could not create discount') } finally { setBusy(false) }
  }
  return <>
    <div className="dh"><h2>Create discount</h2><button className="ib x" aria-label="Close" onClick={ui.close}><Icon n="x" /></button></div>
    <div className="db"><div className="card"><div className="bd grid" style={{ gap: 14 }}>
      <div className="fg"><label>Code</label><input className="in" value={f.c} onChange={set('c')} /></div>
      <div className="fr"><div className="fg"><label>Type</label><select className="in" value={f.ty} onChange={set('ty')}><option>Percentage</option><option>Fixed amount</option><option>Free shipping</option><option>Buy X get Y</option></select></div><div className="fg"><label>Value</label><input className="in" value={f.value} onChange={set('value')} /></div></div>
      <div className="fg"><label>Applies to</label><select className="in" value={f.applies} onChange={set('applies')}><option>All products</option>{Object.values(CATS).map(c => <option key={c}>{c}</option>)}</select></div>
      <div className="fr"><div className="fg"><label>Minimum spend</label><input className="in" placeholder="$0.00" value={f.min} onChange={set('min')} /></div><div className="fg"><label>Usage limit</label><input className="in" placeholder="Unlimited" value={f.limit} onChange={set('limit')} /></div></div>
      <div className="fr"><div className="fg"><label>Starts</label><input className="in" type="date" value={f.starts} onChange={set('starts')} /></div><div className="fg"><label>Ends</label><input className="in" type="date" value={f.ends} onChange={set('ends')} /></div></div>
      <div className="row"><Sw on={f.once} onChange={v => setF(s => ({ ...s, once: v }))} />One use per customer</div>
    </div></div></div>
    <div className="df"><button className="btn" onClick={ui.close}>Cancel</button><button className="btn pri" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save discount'}</button></div>
  </>
}
