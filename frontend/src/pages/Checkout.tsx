import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { FREE, STATES, STORE, delivery, money } from '../lib/data'
import { createOrder, login, register, validateDiscount, type Customer } from '../lib/api'
import { ArrowSvg, Cta, LockSvg, LogoMark, Split, Thumb } from '../components/ui'

export function Checkout() {
  const { cart, byH, count, sub, setCart } = useStore()
  const items = Object.entries(cart).filter(([h]) => byH[h])
  const [disc, setDisc] = useState('')
  const [dmsg, setDmsg] = useState<{ ok: boolean; code: string; reason?: string } | null>(null)
  const [pm, setPm] = useState('card')
  const [err, setErr] = useState('')
  const [btn, setBtn] = useState('')
  const [bad, setBad] = useState<Set<string>>(new Set())
  const discRef = useRef<HTMLInputElement>(null)

  if (!items.length) return <section className="phead"><div className="wrap"><Split as="h1" text="Checkout" /><div className="none"><h3>Your cart is empty</h3><p>Add something to your cart to check out.</p><Cta to="/shop" cls="lg">Shop all products</Cta></div></div></section>

  const free = sub >= FREE
  const saved = items.reduce((a, [h, q]) => a + ((byH[h].cp || byH[h].p) - byH[h].p) * q, 0)
  const permalink = (extra = '') => `${STORE}/cart/${items.map(([h, q]) => byH[h].v + ':' + q).join(',')}${extra}`

  const applyDisc = () => {
    const v = (discRef.current?.value || '').trim().toUpperCase()
    if (!v) { setDisc(''); setDmsg(null); return }
    validateDiscount(v).then(r => { if (r.valid) { setDisc(r.code || v); setDmsg({ ok: true, code: r.code || v }) } else { setDisc(''); setDmsg({ ok: false, code: v, reason: r.reason }) } })
      .catch(() => { setDisc(''); setDmsg({ ok: false, code: v }) })
  }

  const pay = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (btn) return
    const f = e.currentTarget
    const req = [...f.querySelectorAll<HTMLInputElement>('[required]')]
    const badEls = req.filter(i => i.type === 'checkbox' ? !i.checked : !i.value.trim() || (i.pattern && !new RegExp('^' + i.pattern + '$').test(i.value)) || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)))
    setBad(new Set(badEls.map(i => i.name)))
    if (badEls.length) { setErr('Please complete the highlighted fields.'); badEls[0].focus(); return }
    setErr('')
    const d = new FormData(f)
    const g = (k: string) => String(d.get(k) || '').trim()
    setBtn('Opening secure payment…')
    createOrder({
      email: g('email'), phone: g('phone'), news: d.get('news') === 'on', first: g('first'), last: g('last'), address1: g('address1'), address2: g('address2'),
      city: g('city'), state: g('state'), zip: g('zip'), note: g('note'), discount: disc || undefined, items: items.map(([h, q]) => ({ h, q })),
    }).then(r => {
      setCart({})
      location.href = r.checkoutUrl
    }).catch(x => { setBtn(''); setErr(x.message || 'We couldn’t place your order — please try again.') })
  }
  const cls = (n: string, base = 'fl') => `${base}${bad.has(n) ? ' bad' : ''}`

  return (
    <section className="co"><div className="wrap">
      <div className="co-top"><Link className="logo" to="/"><LogoMark /></Link><ol className="steps"><li className="done"><Link to="/cart">Cart</Link></li><li className="on">Details</li><li>Payment</li></ol><span className="secure"><LockSvg />Secure checkout</span></div>
      <div className="co-g">
        <form className="co-form" id="coform" onSubmit={pay} noValidate>
          <div className="express"><small>Express checkout</small><div className="xb"><a className="x shop" href={permalink()}>shop<b>Pay</b></a><a className="x pp" href={permalink()}><b>Pay</b>Pal</a><a className="x gp" href={permalink()}>G Pay</a></div><div className="or"><span>or continue below</span></div></div>
          <fieldset><legend><span>1</span>Contact</legend>
            <label className={cls('email')}><input name="email" type="email" required placeholder=" " autoComplete="email" /><span>Email address</span></label>
            <label className="fl"><input name="phone" type="tel" placeholder=" " autoComplete="tel" /><span>Mobile (for delivery updates)</span></label>
            <label className="chk"><input type="checkbox" name="news" defaultChecked /> Email me recipes, news and VIP offers</label>
            <p className="have">Have an account? <Link to="/account">Sign in</Link></p></fieldset>
          <fieldset><legend><span>2</span>Delivery</legend>
            <label className="fl"><select name="country" disabled><option>Australia</option></select><span>Country</span></label>
            <div className="two"><label className={cls('first')}><input name="first" required placeholder=" " autoComplete="given-name" /><span>First name</span></label><label className={cls('last')}><input name="last" required placeholder=" " autoComplete="family-name" /><span>Last name</span></label></div>
            <label className={cls('address1')}><input name="address1" required placeholder=" " autoComplete="address-line1" /><span>Street address</span></label>
            <label className="fl"><input name="address2" placeholder=" " autoComplete="address-line2" /><span>Apartment, unit, etc. (optional)</span></label>
            <div className="three"><label className={cls('city')}><input name="city" required placeholder=" " autoComplete="address-level2" /><span>Suburb</span></label><label className={cls('state')}><select name="state" required defaultValue=""><option value="">Select</option>{STATES.map(s => <option key={s}>{s}</option>)}</select><span>State</span></label><label className={cls('zip')}><input name="zip" required placeholder=" " inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="postal-code" /><span>Postcode</span></label></div>
            <label className="fl"><textarea name="note" rows={2} placeholder=" " /><span>Delivery instructions or gift message (optional)</span></label></fieldset>
          <fieldset><legend><span>3</span>Shipping method</legend>
            <label className="opt-row on"><input type="radio" name="ship" value="std" defaultChecked /><span className="r" /><div><b>Standard tracked delivery</b><small>Packed in 24h · dispatched in 1–2 business days · est. {delivery()}</small></div><em>{free ? 'Free' : 'Calculated next step'}</em></label>
            {free ? null : <p className="nudge">Add <b>{money(FREE - sub)}</b> more for free shipping. <Link to="/shop">Keep shopping</Link></p>}</fieldset>
          <fieldset><legend><span>4</span>Payment</legend>
            <div className="pays">
              <label className={`opt-row${pm === 'card' ? ' on' : ''}`}><input type="radio" name="pm" value="card" checked={pm === 'card'} onChange={() => setPm('card')} /><span className="r" /><div><b>Credit or debit card</b><small>Visa, Mastercard, American Express</small></div><span className="cards"><i>VISA</i><i>MC</i><i>AMEX</i></span></label>
              <label className={`opt-row${pm === 'paypal' ? ' on' : ''}`}><input type="radio" name="pm" value="paypal" checked={pm === 'paypal'} onChange={() => setPm('paypal')} /><span className="r" /><div><b>PayPal</b><small>Pay with your PayPal account</small></div></label>
              <label className={`opt-row${pm === 'wallet' ? ' on' : ''}`}><input type="radio" name="pm" value="wallet" checked={pm === 'wallet'} onChange={() => setPm('wallet')} /><span className="r" /><div><b>Apple Pay / Google Pay</b><small>Fast, one-tap payment</small></div></label></div>
            <p className="secnote"><LockSvg />Payment details are entered on our encrypted payment page, powered by Shopify. We never see or store your card number.</p></fieldset>
          <label className={`chk age${bad.has('age') ? ' bad' : ''}`}><input type="checkbox" name="age" required /> I confirm I am 18 years or older and agree to the <Link to="/policy/terms">terms of sale</Link> and <Link to="/policy/returns">returns policy</Link>.</label>
          <div className="err" id="coerr">{err}</div>
          <button className="cta lg co-pay" type="submit"><i><ArrowSvg /></i><span>{btn || `Continue to secure payment — ${money(sub)}`}</span></button>
          <Link className="back" to="/cart">‹ Return to cart</Link>
        </form>
        <aside className="co-sum"><h3>Order summary <small>({count} item{count === 1 ? '' : 's'})</small></h3>
          <div className="co-lines">{items.map(([h, q]) => { const p = byH[h]; return <div className="col" key={h}><span className="im"><Thumb p={p} /><b>{q}</b></span><div><b>{p.t}</b><small>{p.b}{p.size ? ' · ' + p.size : ''}</small></div><em>{money(p.p * q)}</em></div> })}</div>
          <div className="disc"><input id="disc" ref={discRef} placeholder="Discount code or gift card" defaultValue={disc} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyDisc() } }} /><button type="button" onClick={applyDisc}>Apply</button></div>
          <p className="dmsg" id="dmsg" style={dmsg && !dmsg.ok ? { color: 'var(--no)' } : undefined}>{dmsg ? dmsg.ok ? <>Code <b>{dmsg.code}</b> will be applied at payment.</> : (dmsg.reason || 'That code isn’t valid.') : ''}</p>
          <div className="srow"><span>Subtotal</span><b>{money(sub)}</b></div>
          {saved ? <div className="srow"><span>You save</span><b className="sv">−{money(saved)}</b></div> : null}
          <div className="srow"><span>Shipping</span><span>{free ? <b className="sv">Free</b> : 'Calculated at payment'}</span></div>
          <div className="srow tot"><span>Total</span><b><small>AUD</small> {money(sub)}</b></div>
          <p className="fine">Prices include GST.</p>
          <ul className="co-trust"><li>✓ Packed within 24 hours</li><li>✓ Tracked delivery Australia-wide</li><li>✓ 30-day returns on eligible items</li><li>✓ Questions? <a href="tel:0400242381">0400 242 381</a></li></ul>
        </aside></div></div></section>
  )
}

/* ---------------- account ---------------- */
const saveAuth = (token: string, c: Customer) => { try { localStorage.setItem('du_token', token); localStorage.setItem('du_customer', JSON.stringify(c)) } catch { /* ignore */ } }

function AccForm({ kind }: { kind: 'in' | 'up' }) {
  const [done, setDone] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [reset, setReset] = useState(false)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const d = new FormData(e.currentTarget); const g = (k: string) => String(d.get(k) || '').trim()
    const p = kind === 'in' ? login({ email: g('email'), password: String(d.get('password') || '') })
      : register({ first: g('first'), last: g('last'), email: g('email'), password: String(d.get('password') || ''), news: d.get('news') === 'on' })
    p.then(r => { saveAuth(r.token, r.customer); setDone((kind === 'up' ? g('first') : '') || r.customer.n.split(' ')[0] || '') })
      .catch(x => setErr(x.message || 'Something went wrong')).finally(() => setBusy(false))
  }
  const msg = kind === 'in' ? 'Signed in' : 'Account created'
  if (done !== null) return <form className={`acard rv in ${kind === 'up' ? 'd1' : ''}`}><h3>{msg} ✓</h3><p>Welcome, {done}. Your order history, saved addresses and wishlist now follow you on every device.</p><Cta to="/shop">Continue shopping</Cta></form>
  return kind === 'in' ? (
    <form className="acard rv" onSubmit={submit}><h3>Sign in</h3><p>Track orders, reorder favourites and check out faster.</p>
      <label>Email<input type="email" name="email" required autoComplete="email" /></label><label>Password<input type="password" name="password" required autoComplete="current-password" /></label>
      <a className="lk" href="/account" onClick={e => { e.preventDefault(); setReset(true) }}>{reset ? 'Reset link sent to your email ✓' : 'Forgot your password?'}</a>
      {err ? <p className="err">{err}</p> : null}
      <button className="cta lg" type="submit" disabled={busy}><i><ArrowSvg /></i><span>Sign in</span></button></form>
  ) : (
    <form className="acard rv d1" onSubmit={submit}><h3>Create account</h3><p>Join for VIP deals, new recipes and early access to releases.</p>
      <div className="two"><label>First name<input name="first" required /></label><label>Last name<input name="last" required /></label></div>
      <label>Email<input type="email" name="email" required /></label><label>Password<input type="password" name="password" required minLength={6} /></label>
      <label className="chk"><input type="checkbox" required /> I confirm I am 18 years or older</label>
      <label className="chk"><input type="checkbox" name="news" defaultChecked /> Email me recipes and offers</label>
      {err ? <p className="err">{err}</p> : null}
      <button className="cta lg" type="submit" disabled={busy}><i><ArrowSvg /></i><span>Create account</span></button></form>
  )
}

export function Account() {
  return (
    <>
      <section className="phead"><div className="wrap"><div className="crumb"><Link to="/">Home</Link><span>/</span>Account</div><Split as="h1" text="My account" /></div></section>
      <section className="shopg"><div className="wrap acc-g">
        <AccForm kind="in" />
        <AccForm kind="up" />
        <div className="acard rv d2 benefits"><h3>Member benefits</h3><ul><li>Order history &amp; one-click reorder</li><li>Saved addresses for faster checkout</li><li>Your wishlist on every device</li><li>VIP deals &amp; new recipes first</li></ul><Cta to="/shop">Continue shopping</Cta></div>
      </div></section>
    </>
  )
}
