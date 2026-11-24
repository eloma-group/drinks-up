import { useState } from 'react'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { Icon } from '../components/icons'
import { B, Sw, useUI } from '../components/ui'

export default function SettingsPage() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const s0 = m.raw.settings
  const [s, setS] = useState({ ...s0, freeShipT: '$' + s0.freeShip.toFixed(2), stdRateT: '$' + s0.stdRate.toFixed(2) })
  const [busy, setBusy] = useState(false)
  const tog = (k: 'signature' | 'sameDay' | 'ageGate' | 'rsMessage' | 'gstInclusive') => (v: boolean) => setS(p => ({ ...p, [k]: v }))
  const save = async () => {
    const freeShip = parseFloat(s.freeShipT.replace(/[$,]/g, '')), stdRate = parseFloat(s.stdRateT.replace(/[$,]/g, ''))
    if (!(freeShip >= 0) || !(stdRate >= 0)) { ui.toast('Enter valid shipping amounts'); return }
    setBusy(true)
    try {
      await act.saveSettings({ freeShip, stdRate, signature: s.signature, sameDay: s.sameDay, licence: s.licence.trim(), ageGate: s.ageGate, rsMessage: s.rsMessage, gstInclusive: s.gstInclusive })
      ui.toast('Settings saved')
    } catch (e) { ui.toast(e instanceof Error ? e.message : 'Could not save settings') } finally { setBusy(false) }
  }
  return <>
    <div className="ph"><div><div className="eb">Store</div><h1>Settings</h1><p>Store rules, shipping, tax, staff and integrations</p></div><div className="acts"><button className="btn pri" disabled={busy} onClick={save}><Icon n="check" />{busy ? 'Saving…' : 'Save'}</button></div></div>
    <div className="grid g2"><div className="card"><div className="hd"><h3>Shipping</h3></div><div className="bd grid" style={{ gap: 12 }}><div className="fr"><div className="fg"><label>Free shipping threshold</label><input className="in" value={s.freeShipT} onChange={e => setS(p => ({ ...p, freeShipT: e.target.value }))} /></div><div className="fg"><label>Standard rate</label><input className="in" value={s.stdRateT} onChange={e => setS(p => ({ ...p, stdRateT: e.target.value }))} /></div></div>
      <div className="row"><Sw on={s.signature} onChange={tog('signature')} />Signature on delivery for all alcohol orders</div><div className="row"><Sw on={s.sameDay} onChange={tog('sameDay')} />Same-day dispatch for orders before 1:00 pm</div><p className="note">Zones: Metro (2–4 business days) · Regional (4–7) · WA/NT/TAS (5–9)</p></div></div>
      <div className="card"><div className="hd"><h3>Compliance</h3></div><div className="bd grid" style={{ gap: 12 }}><div className="fg"><label>Liquor licence number</label><input className="in" placeholder="Enter licence number" value={s.licence} onChange={e => setS(p => ({ ...p, licence: e.target.value }))} /></div><div className="row"><Sw on={s.ageGate} onChange={tog('ageGate')} />Age gate on storefront (18+)</div><div className="row"><Sw on={s.rsMessage} onChange={tog('rsMessage')} />Responsible service message in emails</div><div className="row"><Sw on={s.gstInclusive} onChange={tog('gstInclusive')} />Prices displayed including GST</div></div></div>
      <div className="card"><div className="hd"><h3>Staff & permissions</h3><div className="r"><button className="btn sm" onClick={() => ui.toast('Staff invites aren’t set up yet — ask your developer to add the account')}><Icon n="plus" />Invite</button></div></div>{m.raw.staff.map(x => <div className="li" key={x.n}><span className="av">{x.r.slice(0, 2).toUpperCase()}</span><div className="m"><b>{x.n}</b><small>{x.a}</small></div><div className="e"><B t={x.r} c="n" /></div></div>)}</div>
      <div className="card"><div className="hd"><h3>Integrations</h3></div>{[['Shopify', 'Checkout & payments (cart hand-off)', 'Connected'], ['Australia Post / StarTrack', 'Labels & tracking', 'Not connected'], ['Xero', 'Accounting & GST', 'Not connected'], ['Klaviyo', 'Email & SMS', 'Not connected'], ['Google Analytics 4', 'Traffic & conversion', 'Not connected']].map(i => <div className="li" key={i[0]}><div className="m"><b>{i[0]}</b><small>{i[1]}</small></div><div className="e">{i[2] === 'Connected' ? <B t="Connected" c="g" /> : <button className="btn sm" onClick={() => ui.toast('Connect ' + i[0])}>Connect</button>}</div></div>)}</div></div>
  </>
}
