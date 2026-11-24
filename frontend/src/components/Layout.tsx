import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { CATS, money, src, typeOf } from '../lib/data'
import { ArrowSvg, Cta, GlassTop, LogoMark, PlusSvg, ShipBar, Split, Stars, Thumb } from './ui'

/* ---------------- age gate ---------------- */
export const gateState = { entered: false }
try { gateState.entered = sessionStorage.getItem('du_age') === '1' } catch { /* ignore */ }

export function Gate() {
  const [show, setShow] = useState(!gateState.entered)
  const [out, setOut] = useState(false)
  useEffect(() => {
    if (gateState.entered) { document.body.classList.add('ready'); document.getElementById('stage')?.classList.add('live'); return }
    document.body.style.overflow = 'hidden'
  }, [])
  if (!show) return null
  const enter = () => {
    gateState.entered = true
    try { sessionStorage.setItem('du_age', '1') } catch { /* ignore */ }
    setOut(true); document.body.style.overflow = ''
    setTimeout(() => { document.body.classList.add('ready'); document.querySelector('.hero h1')?.classList.add('in') }, 350)
    setTimeout(() => { setShow(false); document.getElementById('stage')?.classList.add('live') }, 2100)
  }
  return (
    <div id="gate" className={out ? 'out' : ''}>
      <div className="gin">
        <div className="logo"><LogoMark /></div>
        <h2>Are you 18 or over?</h2>
        <p>You must be of legal drinking age to enter Drinks Up.</p>
        <div className="row"><button className="cta lg" onClick={enter}><i><ArrowSvg /></i><span>Yes, I'm 18+</span></button><a className="cta lg ghost" href="https://www.google.com.au"><span>No, take me back</span></a></div>
        <small>Under the Liquor Control Act 1988 it is an offence to sell or supply liquor to a person under the age of 18 years.</small>
      </div>
    </div>
  )
}

/* ---------------- nav ---------------- */
export function Nav() {
  const { count, wish, openCart, setSearchOpen } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  useEffect(() => {
    const f = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', f); return () => document.removeEventListener('click', f)
  }, [])
  const close = () => setOpen(false)
  return (
    <nav className="top" id="nav"><div className="wrap">
      <div className={`pages${open ? ' open' : ''}`} id="pages" ref={ref}>
        <button onClick={() => setOpen(o => !o)}>Menu <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="m2 4 3 3 3-3" /></svg></button>
        <div className="menu mega" onClick={e => { if ((e.target as HTMLElement).closest('a')) close() }}>
          <div><h6>Shop</h6><Link to="/shop">All products</Link><Link to="/shop/spirits">Spirits</Link><Link to="/shop/liqueurs">Liqueurs</Link><Link to="/shop/syrups">Syrups</Link><Link to="/shop/purees">Fruit purées</Link><Link to="/shop/packs">Cocktail packs</Link><Link to="/shop/sale">Sale</Link></div>
          <div><h6>Pages</h6><Link to="/">Home</Link><Link to="/recipes">Recipes</Link><Link to="/about">About us</Link><Link to="/contact">Contact</Link><Link to="/wishlist">Wishlist</Link><Link to="/cart">Cart</Link><Link to="/account">My account</Link><Link to="/policy/shipping">Shipping &amp; returns</Link></div>
        </div>
      </div>
      <Link className="logo" to="/"><LogoMark /></Link>
      <div className="nav-r">
        <button className="nic" aria-label="Search" onClick={() => setSearchOpen(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg></button>
        <Link className="nic" aria-label="Account" to="/account"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg></Link>
        <Link className="nic" aria-label="Wishlist" to="/wishlist"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2.1 0 3.7 1.2 5.4 3.2 1.7-2 3.3-3.2 5.4-3.2 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20Z" /></svg><b id="wcount" hidden={!wish.length}>{wish.length}</b></Link>
        <Cta to="/shop">Buy Now</Cta>
        <button className="bag" aria-label="Open cart" onClick={openCart}><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 10h14l-1.2 13H8.2z" /><path d="M10.5 10V8.5a3.5 3.5 0 0 1 7 0V10" /></svg><b id="count">{count}</b></button>
      </div>
    </div></nav>
  )
}

/* ---------------- footer ---------------- */
export function Footer() {
  return (
    <footer>
      <div className="wrap g">
        <div>
          <div className="logo flogo"><span className="lw" data-grad-root=""><Split as="span" text="Dr" chars /><span className="li"><Split as="span" className="ig" text="i" chars base={110} /><GlassTop /></span><Split as="span" text="nks Up!" chars base={165} /></span></div>
          <div className="cols">
            <div><h5>Shop</h5><ul><li><Link to="/shop">All products</Link></li><li><Link to="/shop/spirits">Spirits</Link></li><li><Link to="/shop/packs">Cocktail packs</Link></li><li><Link to="/recipes">Recipes</Link></li></ul></div>
            <div><h5>Help</h5><ul><li><Link to="/policy/shipping">Shipping</Link></li><li><Link to="/policy/returns">Returns</Link></li><li><Link to="/contact">Contact</Link></li><li><a href="tel:0400242381">0400 242 381</a></li></ul></div>
            <div><h5>Company</h5><ul><li><Link to="/about">About us</Link></li><li><Link to="/policy/privacy">Privacy</Link></li><li><Link to="/policy/terms">Terms</Link></li><li>Licence 616214992620</li></ul></div>
          </div>
          <div className="follow"><h5 style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: 10 }}>Follow us</h5><div className="socials"><a href="https://www.instagram.com/3two1_drinks/">IG</a><a href="https://www.facebook.com/3two1drinks">FB</a><a href="https://www.youtube.com/@3two1_drinks">YT</a></div></div>
          <div className="legal"><p>Under the Liquor Control Act 1988, it is an offence to sell or supply liquor to a person under the age of 18 years on licensed or regulated premises; or for a person under the age of 18 years to purchase, or attempt to purchase, liquor on licensed or regulated premises.</p><p><b>©2026 Drinks Up · 3Two1 Import Pty Ltd t/a 3Two1 Drinks. All Rights Reserved.</b></p></div>
        </div>
        <div className="loved rv"><span className="stars">★★★★★</span><small>Bartender approved</small><h4>Loved by bartenders</h4><p>The bottles Australia’s best bars pour night after night — now on your shelf at home.</p><img src={src('be_cut')} alt="Burnt Ends Tennessee Peated Rye Whiskey" /></div>
      </div>
    </footer>
  )
}

/* ---------------- cart drawer ---------------- */
export function CartDrawer() {
  const { drawer, closeCart, cart, byH, count, qty, sub } = useStore()
  const lines = Object.entries(cart).filter(([h]) => byH[h])
  return (
    <>
      <div className={`scrim${drawer ? ' on' : ''}`} id="scrim" onClick={closeCart} />
      <aside className={`drawer${drawer ? ' on' : ''}`} id="drawer" aria-label="Cart">
        <header><h3>Your cart ({count})</h3><button aria-label="Close" onClick={closeCart} style={{ fontSize: '1.6rem' }}>×</button></header>
        {count ? <>
          <div className="lines">{lines.map(([h, q]) => {
            const p = byH[h]
            return <div className="ln" key={h}><Link className="im" to={`/product/${h}`} onClick={closeCart}><Thumb p={p} /></Link><div><b>{p.t}</b><small>{p.b}{p.size ? ' · ' + p.size : ''}</small><br /><span className="q"><button onClick={() => qty(h, -1)} aria-label="Decrease">−</button><span>{q}</span><button onClick={() => qty(h, 1)} aria-label="Increase">+</button></span></div><div style={{ fontWeight: 600, textAlign: 'right' }}>{money(p.p * q)}<br /><button className="lk" onClick={() => qty(h, -999)}>Remove</button></div></div>
          })}</div>
          <footer><ShipBar /><div className="tot"><span>Subtotal</span><span>{money(sub)}</span></div><Link className="checkout" to="/checkout" onClick={closeCart}>Checkout →</Link><Link className="viewcart" to="/cart" onClick={closeCart}>View full cart</Link><p style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: 10, textAlign: 'center' }}>Shipping calculated at checkout · 18+ ID may be required</p></footer>
        </> : <div className="empty"><p>Your cart is empty.</p><p style={{ marginTop: 16 }}><Cta to="/shop" onClick={closeCart}>Shop the lineup</Cta></p></div>}
      </aside>
    </>
  )
}

/* ---------------- search overlay ---------------- */
export function SearchOverlay() {
  const { searchOpen, setSearchOpen, products, recipes, setModal, setF, bumpF } = useStore()
  const [v, setV] = useState('')
  const inp = useRef<HTMLInputElement>(null)
  const nav = useNavigate()
  useEffect(() => { if (searchOpen) { setV(''); setTimeout(() => inp.current?.focus(), 50) } }, [searchOpen])
  const q = v.trim().toLowerCase()
  const l = q ? products.filter(p => (p.t + ' ' + p.b + ' ' + CATS[p.c] + ' ' + typeOf(p)).toLowerCase().includes(q)).slice(0, 6) : products.filter(p => p.best).slice(0, 6)
  const rs = q ? Object.keys(recipes).filter(id => (recipes[id].n + ' ' + recipes[id].b).toLowerCase().includes(q)).slice(0, 3) : []
  const close = () => setSearchOpen(false)
  return (
    <div className={`search${searchOpen ? ' on' : ''}`} id="search" onClick={e => { if (e.target === e.currentTarget) close() }}>
      <div className="sbox">
        <div className="sin"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg><input id="sq" ref={inp} placeholder="Search spirits, liqueurs, syrups, recipes…" value={v} onChange={e => setV(e.target.value)} autoComplete="off" /><button onClick={close} aria-label="Close search">×</button></div>
        <div className="sres" id="sres">
          <small>{q ? l.length + ' products' : 'Popular right now'}</small>
          {l.length ? l.map(p => <Link className="sr" key={p.h} to={`/product/${p.h}`} onClick={close}><span className="im"><Thumb p={p} /></span><span><b>{p.t}</b><small>{p.b}{p.rating.n ? <> · <Stars v={p.rating.avg} /> {p.rating.avg.toFixed(1)}</> : null}</small></span><em>{money(p.p)}</em></Link>) : <p className="none-s">No products found.</p>}
          {rs.length ? <><small>Recipes</small>{rs.map(id => <Link className="sr" key={id} to="/recipes" onClick={() => { close(); setTimeout(() => setModal({ type: 'recipe', id }), 300) }}><span className="im"><img src={src(recipes[id].img)} alt="" /></span><span><b>{recipes[id].n}</b><small>{recipes[id].b}</small></span></Link>)}</> : null}
          {q ? <a className="sall" href="/shop" onClick={e => { e.preventDefault(); close(); setF(f => ({ ...f, cat: '', brand: '', q: v.trim() })); bumpF(); nav('/shop') }}>See all results for “{v}” →</a> : null}
        </div>
      </div>
    </div>
  )
}

/* ---------------- recipe / quick view modal ---------------- */
export function Modal() {
  const { modal, setModal, recipes, byH, add } = useStore()
  const [last, setLast] = useState(modal)
  if (modal && modal !== last) setLast(modal)
  const m = modal || last
  const close = () => setModal(null)
  let body = null
  if (m?.type === 'recipe' && recipes[m.id]) {
    const r = recipes[m.id], p = byH[r.shop]
    body = <div className="mbox"><div className="mimg"><img src={src(r.img)} alt={r.n} /></div><div className="mbody"><button className="mclose" onClick={close} aria-label="Close">×</button><span className="eyebrow">{r.b} · {r.k}</span><h3>{r.n}</h3><p className="desc">{r.d}</p><table><tbody>{r.i.map(([a, b], k) => <tr key={k}><td>{a}</td><td>{b}</td></tr>)}</tbody></table><p className="method"><b>Method.</b> {r.m}</p>
      {p ? <div className="mbuy"><button className="cta" disabled={!p.ok} onClick={e => add(p.h, e.currentTarget)}><i><PlusSvg /></i><span>{p.ok ? 'Add ' + p.b + ' — ' + money(p.p) : 'Sold out'}</span></button><Link to={`/product/${p.h}`} onClick={close} className="ul">View bottle</Link></div> : null}</div></div>
  } else if (m?.type === 'qv' && byH[m.h]) {
    const p = byH[m.h], rt = p.rating
    body = <div className="mbox qvbox"><div className={`mimg ${p.cut ? 'cutbg' : ''}`}>{p.cut ? <img className="c" src={src(p.cut)} alt="" /> : <img src={src(p.img[0])} alt="" />}</div><div className="mbody"><button className="mclose" onClick={close} aria-label="Close">×</button>
      <span className="eyebrow">{p.b}</span><h3>{p.t}</h3><div className="rating">{rt.n ? <><Stars v={rt.avg} /><b>{rt.avg.toFixed(1)}</b><span>{rt.n} reviews</span></> : <span>No reviews yet</span>}</div>
      <div className="price sm">{money(p.p)} AUD{p.cp ? <> <s>{money(p.cp)}</s></> : null}</div><p className="desc">{p.d || ''}</p>
      <div className="specs">{p.abv ? <span>{p.abv} ABV</span> : null}{p.size ? <span>{p.size}</span> : null}<span>{typeOf(p)}</span></div>
      <div className="mbuy"><button className="cta" disabled={!p.ok} onClick={e => add(p.h, e.currentTarget)}><i><PlusSvg /></i><span>{p.ok ? 'Add to cart' : 'Sold out'}</span></button><Link className="ul" to={`/product/${p.h}`} onClick={close}>Full details</Link></div></div></div>
  }
  return <div className={`modal${modal ? ' on' : ''}`} id="modal" onClick={e => { if (e.target === e.currentTarget) close() }}>{body}</div>
}

export function Toast() {
  const { toastMsg, toastOn } = useStore()
  return <div className={`toast${toastOn ? ' on' : ''}`} id="toast">{toastMsg}</div>
}

