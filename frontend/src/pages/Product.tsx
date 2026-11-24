import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CATS, SAMPLE_REVIEWS, STORE, delivery, fmtD, full, money, save, src, typeOf, type Product, type Review } from '../lib/data'
import { getReviews, postHelpful, postReview, sendContact } from '../lib/api'
import Card, { RecCard } from '../components/Card'
import { ArrowSvg, Cta, HeartSvg, PlusSvg, ShipBar, Split, Stars, Thumb } from '../components/ui'

function fbtFor(P: Product[], p: Product) {
  const pool = P.filter(x => x.ok && x.h !== p.h)
  const pick = (c: string) => pool.filter(x => x.c === c)
  let a: Product[]
  if (p.c === 'spirits') a = [...pick('syrups').slice(0, 1), ...pick('purees').slice(0, 1)]
  else if (p.c === 'syrups' || p.c === 'purees') a = [...pick('spirits').slice(0, 1), ...pick(p.c === 'syrups' ? 'purees' : 'syrups').slice(0, 1)]
  else if (p.c === 'liqueurs') a = [...pick('spirits').slice(1, 2), ...pick('syrups').slice(1, 2)]
  else a = [...pick('syrups').slice(2, 3), ...pick('purees').slice(1, 2)]
  return p.ok ? [p, ...a] : []
}

const galImg = (k: string, p: Product) => k.endsWith('_cut') ? <img key={k} className="c" src={src(k)} alt={full(p)} /> : <img key={k} className="f" src={src(k)} alt={full(p)} />

export default function ProductPage() {
  const { h = '' } = useParams()
  const { byH, products, recipes, recent, pushRecent, wish, wl, add, addMany, cart, setCart, toast } = useStore()
  const p = byH[h]
  const nav = useNavigate()
  const [pq, setPq] = useState(1)
  const [pic, setPic] = useState(0)
  const [tab, setTab] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [rvSort, setRvSort] = useState('new')
  const [rvStar, setRvStar] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [pickN, setPickN] = useState(5)
  const [picked, setPicked] = useState(false)
  const [helped, setHelped] = useState<Record<number, boolean>>({})
  const [notified, setNotified] = useState(false)
  const notify = async () => {
    let saved = ''
    try { saved = JSON.parse(localStorage.getItem('du_customer') || 'null')?.em || '' } catch { /* ignore */ }
    const email = (prompt('Your email — we’ll let you know when it’s back in stock', saved) || '').trim()
    if (!email) return
    if (!/^\S+@\S+\.\S+$/.test(email)) { toast('Please enter a valid email'); return }
    try { await sendContact({ name: email, email, topic: 'Back in stock request', message: `Please email me when ${full(p)} (${p.h}) is back in stock.` }); setNotified(true) }
    catch (e) { toast(e instanceof Error ? e.message : 'Something went wrong') }
  }
  const [copied, setCopied] = useState('')
  const [fbtOff, setFbtOff] = useState<Record<string, boolean>>({})
  const [satc, setSatc] = useState(false)
  const [prevRecent] = useState(recent)
  const mainbuy = useRef<HTMLDivElement>(null)

  useEffect(() => { if (p) pushRecent(h) }, [h, !!p]) // eslint-disable-line
  useEffect(() => {
    let alive = true
    getReviews(h).then(r => { if (alive) setReviews(r) }).catch(() => { /* keep empty */ })
    return () => { alive = false }
  }, [h])
  useEffect(() => {
    const mb = mainbuy.current; if (!mb) return
    const io = new IntersectionObserver(es => setSatc(!es[0].isIntersecting && es[0].boundingClientRect.top < 0))
    io.observe(mb); return () => io.disconnect()
  }, [p?.h])

  const rt = useMemo(() => {
    if (!reviews.length) return p?.rating || { avg: 0, n: 0 }
    return { avg: reviews.reduce((a, x) => a + x.r, 0) / reviews.length, n: reviews.length }
  }, [reviews, p])

  if (!p) return <section className="phead"><div className="wrap"><h1>Not found</h1><Cta to="/shop">Back to shop</Cta></div></section>

  const recs = Object.keys(recipes).filter(id => recipes[id].shop === h)
  const rel = products.filter(x => x.h !== h && x.ok && (x.c === p.c || x.b === p.b)).slice(0, 4)
  const fbt = fbtFor(products, p)
  const tag = !p.ok ? 'Sold out' : p.cp ? 'Save ' + save(p) + '%' : p.best ? 'Best Seller' : ''
  const rv = prevRecent.filter(x => x !== h).map(x => byH[x]).filter(Boolean).slice(0, 4)
  const specs = ([['Brand', p.b], ['Product type', typeOf(p)], ['Category', CATS[p.c]], p.origin && ['Origin', p.origin], p.abv && ['Alcohol (ABV)', p.abv], p.size && ['Volume', p.size], ['Availability', p.ok ? 'In stock' : 'Sold out'], ['Dispatch', 'Packed within 24 hours'], ['Product code', 'DU-' + p.v.slice(-6)]].filter(Boolean)) as [string, string][]
  const isWish = wish.includes(h)

  const dist = [5, 4, 3, 2, 1].map(s => [s, reviews.filter(x => x.r === s).length])
  const shown = reviews.filter(x => !rvStar || x.r === rvStar).slice()
  shown.sort(rvSort === 'new' ? (a, b) => +new Date(b.d) - +new Date(a.d) : rvSort === 'hi' ? (a, b) => b.r - a.r : rvSort === 'lo' ? (a, b) => a.r - b.r : (a, b) => b.help - a.help)

  const fbtSel = fbt.filter(x => !fbtOff[x.h])
  const shareUrl = STORE + '/products/' + p.h

  const submitReview = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const body = { n: String(d.get('n') || ''), city: String(d.get('city') || ''), r: picked ? pickN : 5, t: String(d.get('t') || ''), b: String(d.get('b') || '') }
    const local: Review = { id: -Date.now(), ...body, d: new Date().toISOString(), v: false, help: 0 }
    setReviews(r => [local, ...r]); setRvSort('new'); setRvStar(0)
    e.currentTarget.reset(); setPicked(false); setPickN(5)
    toast('Thanks — your review has been added')
    postReview(h, body).then(({ review }) => setReviews(r => r.map(x => (x.id === local.id ? { ...review, n: local.n, t: local.t, b: local.b } : x)))).catch(() => { /* stays local */ })
  }
  const helpful = (x: Review) => {
    if (helped[x.id]) return
    setHelped(s => ({ ...s, [x.id]: true }))
    setReviews(r => r.map(y => (y.id === x.id ? { ...y, help: y.help + 1 } : y)))
    if (x.id > 0) postHelpful(x.id).catch(() => { /* ignore */ })
  }
  const buyNow = () => { if (!cart[h]) setCart({ ...cart, [h]: pq }); nav('/checkout') }
  const copy = () => {
    (navigator.clipboard ? navigator.clipboard.writeText(shareUrl) : Promise.reject()).then(() => setCopied('Copied ✓'), () => setCopied(shareUrl))
  }

  return (
    <>
      <section className="pdp"><div className="wrap">
        <div className="crumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><Link to={`/shop/${p.c}`}>{CATS[p.c]}</Link><span>/</span>{p.t}</div>
        <div className="pdp-g">
          <div className="gal">
            <div className={`main ${p.img[pic]?.endsWith('_cut') ? 'cutbg' : ''}`} id="gmain">
              {tag ? <span className={`tag ${p.cp ? 'sale' : ''} ${p.ok ? '' : 'out'}`}>{tag}</span> : null}
              {galImg(p.img[pic] || p.img[0], p)}
              <button className={`ic wl gwl ${isWish ? 'on' : ''}`} data-wl={h} aria-label="Save to wishlist" onClick={() => wl(h)}><HeartSvg /></button>
            </div>
            <div className="thumbs">{p.img.map((k, i) => <button key={k + i} className={i === pic ? 'on' : ''} onClick={() => setPic(i)} aria-label={`Image ${i + 1}`}>{k.endsWith('_cut') ? <img className="c" src={src(k)} alt="" /> : <img src={src(k)} alt="" />}</button>)}</div>
          </div>
          <div className="info">
            <div className="eyebrow">{p.b}{p.origin ? ' · ' + p.origin : ''}</div>
            <Split as="h1" text={p.t} />
            <a className="rating" href="#reviews-sec" onClick={e => { e.preventDefault(); document.getElementById('reviews-sec')?.scrollIntoView({ behavior: 'smooth' }) }}>{rt.n ? <><Stars v={rt.avg} /><b>{rt.avg.toFixed(1)}</b><span>{rt.n} reviews</span></> : <span>No reviews yet — write the first</span>}</a>
            <div className="price">{money(p.p)} AUD{p.cp ? <><s>{money(p.cp)}</s><span className="save">Save {money(p.cp - p.p)}</span></> : null}</div>
            <p className="taxnote">Tax included. Shipping calculated at checkout.</p>
            {p.tag ? <p className="quote">“{p.tag}”</p> : null}
            <p className="desc">{p.d || ''}</p>
            {p.size ? <div className="opt"><span className="ol">Size: <b>{p.size}</b></span><div className="ov"><button className="on">{p.size}</button></div></div> : null}
            <div className={`stockline ${p.ok ? 'ok' : 'no'}`}>{p.ok ? '● In stock — ready to ship' : '● Sold out — check back soon'}</div>
            <div className="buy" id="mainbuy" ref={mainbuy}>
              <div className="q big"><button onClick={() => setPq(q => Math.max(1, q - 1))} aria-label="Decrease">−</button><span id="pq">{pq}</span><button onClick={() => setPq(q => q + 1)} aria-label="Increase">+</button></div>
              <button className="cta lg" disabled={!p.ok} onClick={e => add(p.h, e.currentTarget, pq)}><i><PlusSvg /></i><span>{p.ok ? 'Add to cart' : 'Sold out'}</span></button>
              <button className={`ic wl big ${isWish ? 'on' : ''}`} data-wl={h} aria-label="Save to wishlist" onClick={() => wl(h)}><HeartSvg /></button>
            </div>
            {p.ok ? <button className="buynow" onClick={buyNow}>Buy it now</button> : <button className="notify" disabled={notified} onClick={notify}>{notified ? 'We’ll email you when it’s back ✓' : 'Email me when it’s back'}</button>}
            <div className="shipbox" data-ship=""><ShipBar /></div>
            <ul className="perks-list">
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg><div><b>Estimated delivery</b><span>{delivery()} · metro areas</span></div></li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg><div><b>Packed within 24 hours</b><span>Tracked dispatch in 1–2 business days</span></div></li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><div><b>Secure checkout</b><span>Powered by Shopify</span></div></li>
              <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M9 9h.01M15 9h.01M8 15h8" /></svg><div><b>18+ only</b><span>ID may be required on delivery</span></div></li>
            </ul>
            <div className="pay">{['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'APPLE PAY', 'G PAY', 'SHOP PAY'].map(x => <span key={x}>{x}</span>)}</div>
            <div className="share">Share: <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener">Facebook</a> · <a href={`mailto:?subject=${encodeURIComponent(full(p))}&body=${encodeURIComponent(shareUrl)}`}>Email</a> · <button onClick={copy}>{copied || 'Copy link'}</button></div>
          </div>
        </div>
      </div></section>

      <section className="band tabsec"><div className="wrap">
        <div className="tabs" role="tablist">
          <button className={tab === 0 ? 'on' : ''} onClick={() => setTab(0)}>Description</button>
          <button className={tab === 1 ? 'on' : ''} onClick={() => setTab(1)}>Specifications</button>
          {p.notes ? <button className={tab === 2 ? 'on' : ''} onClick={() => setTab(2)}>Tasting notes</button> : null}
          <button className={tab === 3 ? 'on' : ''} onClick={() => setTab(3)}>Shipping &amp; returns</button>
        </div>
        <div className={`tabp ${tab === 0 ? 'on' : ''}`}><div className="tdesc"><div><h3>About {full(p)}</h3><p>{p.d || ''}</p>{p.serve ? <p><b>How to serve:</b> {p.serve}</p> : null}</div><img src={src(p.img[p.img.length > 2 ? 2 : p.img.length - 1])} alt="" /></div></div>
        <div className={`tabp ${tab === 1 ? 'on' : ''}`}><table className="spec"><tbody>{specs.map(([a, b]) => <tr key={a}><th>{a}</th><td>{b}</td></tr>)}</tbody></table></div>
        {p.notes ? <div className={`tabp ${tab === 2 ? 'on' : ''}`}><div className="notes big">{p.notes.map(([a, b]) => <div key={a}><b>{a}</b><span>{b}</span></div>)}</div>{p.serve ? <div className="serve"><b>How to serve</b>{p.serve}</div> : null}</div> : <div className="tabp" />}
        <div className={`tabp ${tab === 3 ? 'on' : ''}`}><div className="ship-g"><div><h4>Shipping</h4><p>Orders are packed within 24 hours and dispatched within 1–2 business days with tracking. Free shipping on Australian orders over $150; otherwise shipping is calculated at checkout.</p></div><div><h4>Returns</h4><p>If your order arrives damaged or incorrect, contact us and we’ll make it right. See our <Link to="/policy/returns">returns policy</Link>.</p></div><div><h4>Responsible service</h4><p>Alcohol is only sold to customers aged 18+. Proof of age may be required on delivery.</p></div></div></div>
      </div></section>

      {fbt.length > 1 ? <section className="band fbtsec"><div className="wrap"><div className="head"><Split text="Frequently bought together" /></div>
        <div className="fbt">
          {fbt.map((x, i) => <FbtItem key={x.h} x={x} last={i === fbt.length - 1} checked={!fbtOff[x.h]} onChange={c => setFbtOff(o => ({ ...o, [x.h]: !c }))} />)}
          <div className="fbtt"><small>Total</small><b id="fbtTotal">{money(fbtSel.reduce((a, x) => a + x.p, 0))}</b><button className="cta" onClick={e => addMany(fbtSel.map(x => x.h), e.currentTarget)}><i><PlusSvg /></i><span>Add selected to cart</span></button></div>
        </div></div></section> : null}

      <section className="band rvsec" id="reviews-sec"><div className="wrap">
        <div className="head"><h2>Customer reviews</h2>{SAMPLE_REVIEWS ? <span className="sample">Sample reviews — design preview</span> : null}</div>
        <div className="rv-g">
          <aside className="rv-sum"><div className="big">{rt.avg.toFixed(1)}</div><Stars v={rt.avg} cls="lg" /><p>{rt.n ? <>Based on {rt.n} review{rt.n === 1 ? '' : 's'}</> : 'No reviews yet'}</p>
            <div className="dist">{dist.map(([s, c]) => <button key={s} className={rvStar === s ? 'on' : ''} onClick={() => setRvStar(s)}><span>{s}★</span><i><b style={{ width: (rt.n ? c / rt.n * 100 : 0) + '%' }} /></i><em>{c}</em></button>)}</div>
            <button className="cta" onClick={() => setFormOpen(o => !o)}><i><ArrowSvg /></i><span>Write a review</span></button></aside>
          <div className="rv-main">
            <form className={`rvform${formOpen ? ' open' : ''}`} id="rvform" onSubmit={submitReview}>
              <h3>Write a review</h3>
              <div className="pick" id="rvpick">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} data-n={n} className={picked && n <= pickN ? 'on' : ''} onClick={() => { setPickN(n); setPicked(true) }} aria-label={`${n} stars`}>★</button>)}</div>
              <label>Title<input name="t" required maxLength={60} /></label>
              <label>Review<textarea name="b" rows={4} required /></label>
              <div className="two"><label>Name<input name="n" required maxLength={30} /></label><label>Location<input name="city" placeholder="e.g. Sydney NSW" /></label></div>
              <button className="cta" type="submit"><i><ArrowSvg /></i><span>Submit review</span></button>
            </form>
            <div className="rv-bar"><span>{rvStar ? <>Showing {rvStar}★ reviews · <button onClick={() => setRvStar(0)}>Show all</button></> : `${rt.n} reviews`}</span>
              <select onChange={e => setRvSort(e.target.value)} value={rvSort} aria-label="Sort reviews">{[['new', 'Most recent'], ['help', 'Most helpful'], ['hi', 'Highest rating'], ['lo', 'Lowest rating']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            <div className="rv-list">{shown.length ? shown.map(x => <article className="rvi" key={x.id}><div className="rvh"><Stars v={x.r} /><span className="dt">{fmtD(x.d)}</span></div><h4>{x.t}</h4><p>{x.b}</p>
              <div className="rvf"><span className="who">{x.n}{x.city ? ' · ' + x.city : ''}{x.v ? <> <em>✓ Verified buyer</em></> : null}</span><button className={helped[x.id] ? 'on' : ''} onClick={() => helpful(x)}>Helpful (<span>{x.help}</span>)</button></div></article>) : <p className="empty">No reviews with this rating yet.</p>}</div>
          </div>
        </div>
      </div></section>

      {recs.length ? <section className="band"><div className="wrap"><div className="head"><Split text="Make it at home" /><Cta to="/recipes">All recipes</Cta></div><div className="recg">{recs.map(id => <RecCard key={id} id={id} />)}</div></div></section> : null}
      {rel.length ? <section className="band"><div className="wrap"><div className="head"><Split text="You may also like" /><Cta to={`/shop/${p.c}`}>View all</Cta></div><div className="sgrid">{rel.map((x, i) => <Card key={x.h} p={x} i={i} />)}</div></div></section> : null}
      {rv.length ? <section className="band"><div className="wrap"><div className="head"><Split text="Recently viewed" /></div><div className="sgrid">{rv.map((x, i) => <Card key={x.h} p={x} i={i} />)}</div></div></section> : null}
      {p.ok ? <div className={`sticky-atc${satc ? ' on' : ''}`} id="satc"><div className="wrap"><div className="si"><Thumb p={p} /><div><b>{p.t}</b><small>{p.b} · {money(p.p)}</small></div></div><button className="cta" onClick={e => add(p.h, e.currentTarget, pq)}><i><PlusSvg /></i><span>Add to cart — {money(p.p)}</span></button></div></div> : null}
    </>
  )
}

function FbtItem({ x, last, checked, onChange }: { x: Product; last: boolean; checked: boolean; onChange: (c: boolean) => void }) {
  return <>
    <label className="fbti"><input type="checkbox" checked={checked} data-fbt={x.h} onChange={e => onChange(e.target.checked)} /><span className="im"><Thumb p={x} /></span><span><small>{x.b}</small><b>{x.t}</b><em>{money(x.p)}</em></span></label>
    {!last ? <span className="plus">+</span> : null}
  </>
}
