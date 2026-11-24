import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { usePersist } from '../lib/persist'
import { fd, full } from '../lib/format'
import type { RawReview } from '../lib/types'
import { B, Stars, Thumb, useUI } from '../components/ui'

export default function Reviews() {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const [RF, setRF] = usePersist('RF', 'Pending')
  const { RV } = m
  const l = RV.filter(r => !RF || r.st === RF)
  const mod = async (id: number, st: RawReview['st']) => {
    try { await act.modReview(id, st); ui.toast('Review ' + st.toLowerCase()) } catch (e) { ui.toast(e instanceof Error ? e.message : 'Update failed') }
  }
  return <>
    <div className="ph"><div><div className="eb">Customers</div><h1>Reviews</h1><p>Only verified buyers can review · moderate before publishing</p></div></div>
    <div className="card"><div className="tabs">{['Pending', 'Published', 'Hidden', ''].map(t => <button key={t} className={RF === t ? 'on' : ''} onClick={() => setRF(t)}>{t || 'All'}<sup>{t ? RV.filter(r => r.st === t).length : RV.length}</sup></button>)}</div>
      {l.length ? l.map(r => <div key={r.id} className="li" style={{ alignItems: 'flex-start', padding: '16px 18px' }}><Thumb p={r.p} />
        <div className="m" style={{ whiteSpace: 'normal' }}><Stars r={r.r} /> <b style={{ display: 'inline' }}>{r.t}</b><p style={{ margin: '4px 0' }}>{r.b}</p><small>{r.cu ? r.cu.contact : r.name} · {full(r.p)} · {fd(r.dt)} · {r.ver ? <B t="Verified buyer" c="g" /> : <B t="Unverified" />}</small></div>
        <div className="e" style={{ display: 'flex', gap: 6 }}>{r.st === 'Pending'
          ? <><button className="btn sm" onClick={() => mod(r.id, 'Hidden')}>Hide</button><button className="btn sm pri" onClick={() => mod(r.id, 'Published')}>Publish</button></>
          : <><B t={r.st} c={r.st === 'Published' ? 'g' : ''} /><button className="btn sm" onClick={() => mod(r.id, r.st === 'Published' ? 'Hidden' : 'Published')}>{r.st === 'Published' ? 'Hide' : 'Publish'}</button></>}
          <button className="btn sm" onClick={() => ui.toast('Reply drafted')}>Reply</button></div></div>)
        : <p className="empty">All caught up.</p>}</div>
  </>
}
