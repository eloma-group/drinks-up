import { useState } from 'react'
import { useStore } from '../lib/store'
import { fdt } from '../lib/format'
import { B } from '../components/ui'

/** Contact-form messages and back-in-stock requests sent from the storefront. */
export default function Messages() {
  const { m } = useStore()
  const all = m.raw.messages || []
  const topics = [...new Set(all.map(x => x.topic).filter(Boolean))]
  const [tab, setTab] = useState('')
  const l = all.filter(x => !tab || x.topic === tab)
  return <>
    <div className="ph"><div><div className="eb">Customers</div><h1>Messages</h1><p>Contact form messages and back-in-stock requests from the storefront</p></div></div>
    <div className="card">
      <div className="tabs">{['', ...topics].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t || 'All'}<sup>{t ? all.filter(x => x.topic === t).length : all.length}</sup></button>)}</div>
      {l.length ? l.map(x => <div className="li" key={x.id} style={{ alignItems: 'flex-start', padding: '16px 18px' }}>
        <span className="av">{(x.n || x.em).split(/[\s@.]/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>
        <div className="m" style={{ whiteSpace: 'normal' }}>
          <b style={{ display: 'inline' }}>{x.n}</b> {x.topic ? <B t={x.topic} c="n" /> : null}
          <p style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{x.msg}</p>
          <small><a className="lk" href={`mailto:${x.em}`}>{x.em}</a>{x.ph ? <> · <a className="lk" href={`tel:${x.ph}`}>{x.ph}</a></> : null} · {fdt(new Date(x.dt))}</small>
        </div>
        <div className="e"><a className="btn sm" href={`mailto:${x.em}?subject=${encodeURIComponent('Re: ' + (x.topic || 'Your message to Drinks Up'))}`}>Reply</a></div>
      </div>) : <p className="empty">No messages yet.</p>}
    </div>
  </>
}
