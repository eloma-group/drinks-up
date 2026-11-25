import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { FAQ, HOUSES, POL, POL_URL, STORE, money, src } from '../lib/data'
import { PREVIEW, SOON, sendContact } from '../lib/api'
import Card, { RecCard } from '../components/Card'
import { ArrowSvg, Cta, ShipBar, Soon, Split, Thumb } from '../components/ui'

export function Recipes() {
  const { recipes } = useStore()
  const [b, setB] = useState('')
  const brands = [...new Set(Object.values(recipes).map(r => r.b))]
  return (
    <>
      <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Recipes</div>
        <div className="phead-g"><div><Split as="h1" text="Cocktail corner" /><p className="rv">Specs, builds and twists — the signature serves Australia’s bar teams pour. Every spec is in millilitres, every one bar-tested.</p></div><div className="phead-img clip"><img src={src('l_gck')} alt="" /></div></div></div></section>
      <div className="fbar"><div className="wrap"><div className="pills" id="rpills"><button className={`pill ${b === '' ? 'on' : ''}`} onClick={() => setB('')}>All</button>{brands.map(x => <button key={x} className={`pill ${b === x ? 'on' : ''}`} onClick={() => setB(x)}>{x}</button>)}</div></div></div>
      <section className="shopg"><div className="wrap"><div className="recg" id="recg">{Object.keys(recipes).map(id => <div key={id} hidden={!!b && recipes[id].b !== b} style={{ display: 'contents' }}><RecCard id={id} /></div>)}</div></div></section>
    </>
  )
}

export function About() {
  return (
    <>
      <section className="about-hero"><img src={src('l_sydney')} alt="" /><div className="wrap"><div className="crumb light"><Link to="/">Home</Link><span>/</span>About</div><Split as="h1" text="Our story" /></div></section>
      <section className="band"><div className="wrap ab-intro"><Split text="Built in Australia, poured everywhere." /><div className="rv"><p>Drinks Up is the at-home store of 3Two1 Drinks — founded in 2018 by ex-bartenders, ex-buyers and ex-reps who got tired of seeing lower-quality bottles on Australian shelves.</p><p>Today we import nine world-class brands across rum, tequila, whiskey, pisco, cachaça, liqueurs and syrups, and place them in Australia’s best bars, bottle shops and cafés. Drinks Up brings those same bottles straight to your door.</p><Cta to="/shop" cls="lg">Shop the lineup</Cta></div></div></section>
      <section className="stats"><div className="wrap">{[['2018', 'Founded by hospitality people'], ['9', 'World-class brands imported'], ['24h', 'Packed & ready to dispatch'], ['$150', 'Free shipping threshold']].map(([n, l], i) => <div key={n} className={`rv ${i % 2 ? 'd1' : ''}`}><b data-count={n}>{n}</b><span>{l}</span></div>)}</div></section>
      <section className="band"><div className="wrap"><div className="head"><Split text="The houses we import" /></div><div className="houses">{HOUSES.map(([n, o, d, k], i) => <Link key={n} className={`house rv ${i % 2 ? 'd1' : ''}`} to="/shop"><img src={src(k)} alt="" /><div><small>{o}</small><h3>{n}</h3><span>{d}</span></div></Link>)}</div></div></section>
      <section className="band quoteband"><div className="wrap"><Split as="blockquote" text="“Imported with intent — placed where it belongs.”" /><p className="rv">— 3Two1 Drinks</p></div></section>
      <section className="band"><div className="wrap faq-g"><Split text="Questions, answered" /><div className="faq rv">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></div></section>
    </>
  )
}

export function Contact() {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr('')
    if (PREVIEW) { setErr(SOON); return }
    setBusy(true)
    const d = Object.fromEntries(new FormData(e.currentTarget))
    sendContact(d).then(() => setSent(true)).catch(x => setErr(x.message || 'Something went wrong — please try again.')).finally(() => setBusy(false))
  }
  return (
    <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Contact</div>
      <div className="contact-g"><div><Split as="h1" text="Ask us anything!" /><p className="rv lead">Questions about products, pricing, shipping — or even the weather? Our team has worked behind a bar, so ask away.</p>
        <div className="cinfo rv"><div><small>Phone</small><a href="tel:0400242381">0400 242 381</a></div><div><small>Shipping</small><span>Packed in 24h · Free over $150</span></div><div><small>Follow</small><span><a href="https://www.instagram.com/3two1_drinks/">Instagram</a> · <a href="https://www.facebook.com/3two1drinks">Facebook</a></span></div><div><small>Licence</small><span>Wholesaler 616214992620</span></div></div>
        <div className="cimg clip"><img src={src('l_bar')} alt="" /></div></div>
        <form className="cform rv" onSubmit={submit}>
          {sent ? <><h3>Thanks for reaching out!</h3><p>We’ll get back to you as soon as possible.</p></> : <>
            <h3>Send a message</h3>
            <label>Name<input required name="name" /></label><label>Email<input required type="email" name="email" /></label><label>Phone<input name="phone" /></label>
            <label>Topic<select name="topic"><option>Product question</option><option>Order &amp; shipping</option><option>Gifting &amp; corporate</option><option>Something else</option></select></label>
            <label>Message<textarea required rows={5} name="message" /></label>
            {err ? err === SOON ? <Soon /> : <p className="err">{err}</p> : null}
            <button className="cta lg" type="submit" disabled={busy}><i><ArrowSvg /></i><span>Send message</span></button></>}
        </form></div></div></section>
  )
}

export function Cart() {
  const { cart, byH, products, qty, toWish, count, sub } = useStore()
  const items = Object.entries(cart).filter(([h]) => byH[h])
  const saved = items.reduce((a, [h, q]) => a + ((byH[h].cp || byH[h].p) - byH[h].p) * q, 0)
  const best = products.filter(p => p.ok && p.best && !cart[p.h]).slice(0, 4)
  return (
    <>
      <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Cart</div><Split as="h1" text="Your cart" /></div></section>
      <section className="shopg"><div className="wrap">{items.length ? <div className="cart-g">
        <div className="cart-lines">{items.map(([h, q]) => {
          const p = byH[h]
          return <div className="cl" key={h}><Link className="im" to={`/product/${h}`}><Thumb p={p} /></Link><div className="ci"><small>{p.b}</small><Link to={`/product/${h}`}><b>{p.t}</b></Link><span className="meta">{p.size || ''}{p.cp ? <> · <s>{money(p.cp)}</s></> : null}</span>
            <div className="acts"><span className="q"><button onClick={() => qty(h, -1)} aria-label="Decrease">−</button><span>{q}</span><button onClick={() => qty(h, 1)} aria-label="Increase">+</button></span><button className="lk" onClick={() => toWish(h)}>Save for later</button><button className="lk" onClick={() => qty(h, -999)}>Remove</button></div></div><div className="cp">{money(p.p * q)}<small>{money(p.p)} each</small></div></div>
        })}</div>
        <aside className="summary"><h3>Order summary</h3><div data-ship=""><ShipBar /></div>
          <div className="srow"><span>Subtotal ({count} items)</span><b>{money(sub)}</b></div>
          <div className="srow"><span>You save</span><b className="sv">{money(saved)}</b></div>
          <div className="srow"><span>Shipping</span><span>{sub >= 150 ? <b className="sv">Free</b> : 'Calculated at checkout'}</span></div>
          <div className="srow tot"><span>Estimated total</span><b>{money(sub)} AUD</b></div>
          <details className="promo"><summary>Have a discount code?</summary><p>Enter your code on the next step — it’s applied securely at checkout.</p></details>
          <Link className="checkout" to="/checkout">Secure checkout →</Link>
          <div className="pay">{['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'APPLE PAY', 'G PAY'].map(x => <span key={x}>{x}</span>)}</div>
          <p className="fine">Packed within 24h · 18+ ID may be required on delivery</p></aside></div>
        : <div className="none"><h3>Your cart is empty</h3><p>Time to stock the home bar.</p><Cta to="/shop" cls="lg">Shop all products</Cta></div>}
        {best.length ? <><div className="head" style={{ marginTop: 80 }}><Split text="Bestsellers you might like" /></div><div className="sgrid">{best.map((p, i) => <Card key={p.h} p={p} i={i} />)}</div></> : null}
      </div></section>
    </>
  )
}

export function Wishlist() {
  const { wish, byH } = useStore()
  const l = wish.map(h => byH[h]).filter(Boolean)
  return (
    <>
      <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Wishlist</div><Split as="h1" text="Wishlist" /><p className="rv" style={{ marginTop: 12, fontWeight: 500 }}>{l.length} saved item{l.length === 1 ? '' : 's'}</p></div></section>
      <section className="shopg"><div className="wrap">{l.length ? <div className="sgrid">{l.map((p, i) => <Card key={p.h} p={p} i={i} />)}</div> : <div className="none"><h3>Nothing saved yet</h3><p>Tap the heart on any product to save it here.</p><Cta to="/shop" cls="lg">Browse products</Cta></div>}</div></section>
    </>
  )
}

export function Policy() {
  const { k = 'shipping' } = useParams()
  const key = POL[k] ? k : 'shipping'
  const p = POL[key]
  return (
    <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Help<span>/</span>{p.t}</div>
      <div className="pol-g"><aside className="pol-nav">{Object.entries(POL).map(([kk, v]) => <Link key={kk} className={kk === k ? 'on' : ''} to={`/policy/${kk}`}>{v.t}</Link>)}<Link to="/contact">Contact us</Link></aside>
        <div><Split as="h1" text={p.t} /><p className="rv pol-lead">The key points, in plain English.{PREVIEW ? '' : ' The full legal policy is available from our store.'}</p>
          <div className="pol-list">{p.k.map(([h, b], i) => <div className="rv" key={h}><span>{String(i + 1).padStart(2, '0')}</span><div><h3>{h}</h3><p>{b}</p></div></div>)}</div>
          <div className="pol-help rv"><div><h3>Still have a question?</h3><p>Call <a href="tel:0400242381">0400 242 381</a> or send us a message.</p></div><Cta to="/contact">Contact us</Cta></div>
          {PREVIEW ? null : <p className="fine">Read the <a href={`${STORE}/policies/${POL_URL[k] || 'shipping-policy'}`} target="_blank" rel="noopener">full legal {p.t.toLowerCase()}</a>.</p>}</div></div></div></section>
  )
}
