import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, Lock, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { SITE } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { money } from '../../utils/format';
import { shopifyCheckoutUrl, type CheckoutDetails } from '../../utils/checkout';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/States/States';
import { OrderSummary } from './OrderSummary';
import '../Contact/Contact.css';
import './Checkout.css';

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];
const STORAGE = 'drinksup.checkout.v1';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Errors = Partial<Record<keyof CheckoutDetails | 'age', string>>;

const empty: CheckoutDetails = { email: '', phone: '', firstName: '', lastName: '', address1: '', address2: '', city: '', state: '', postcode: '', note: '' };

function load(): CheckoutDetails {
  try {
    return { ...empty, ...JSON.parse(sessionStorage.getItem(STORAGE) ?? '{}') };
  } catch {
    return empty;
  }
}

function validate(d: CheckoutDetails, age: boolean, step: number): Errors {
  const e: Errors = {};
  if (step >= 0) {
    if (!EMAIL.test(d.email.trim())) e.email = 'Enter a valid email for your order confirmation.';
    if (!/^(\+?61|0)[2-478](\s?\d){8}$/.test(d.phone.replace(/\s/g, ''))) e.phone = 'Enter an Australian phone number, e.g. 0400 000 000.';
    if (!age) e.age = 'You must be 18 or over to buy alcohol.';
  }
  if (step >= 1) {
    if (!d.firstName.trim()) e.firstName = 'Required.';
    if (!d.lastName.trim()) e.lastName = 'Required.';
    if (d.address1.trim().length < 4) e.address1 = 'Enter your street address.';
    if (!d.city.trim()) e.city = 'Enter your suburb.';
    if (!STATES.includes(d.state)) e.state = 'Choose a state or territory.';
    if (!/^\d{4}$/.test(d.postcode)) e.postcode = '4-digit postcode.';
  }
  return e;
}

const STEPS = ['Contact', 'Delivery', 'Review & pay'];
const ease = [0.22, 1, 0.36, 1] as const;

export default function Checkout() {
  useSeo({ title: 'Checkout', description: 'Complete your DrinksUp order.' });
  const { resolved, lines, subtotal } = useCart();
  const [d, setD] = useState<CheckoutDetails>(load);
  const [age, setAge] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const blocked = resolved.filter((l) => !l.variant.available);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE, JSON.stringify(d));
    } catch {
      /* ignore */
    }
  }, [d]);

  // Returning via the back button (bfcache) should not leave the hand-off overlay up
  useEffect(() => {
    const onShow = () => setRedirecting(false);
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // Move focus to the first field of each new step (keyboard + screen reader users)
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    const t = window.setTimeout(() => document.querySelector<HTMLElement>('.checkout__step input, .checkout__step select, .checkout__nav .btn')?.focus(), 380);
    return () => window.clearTimeout(t);
  }, [step]);

  if (!resolved.length) {
    return (
      <div className="wrap section">
        <EmptyState title="There’s nothing to check out yet" body="Your cart is empty — add something from the shelf first.">
          <Button to="/collections/all" arrow>
            Shop the shelf
          </Button>
        </EmptyState>
      </div>
    );
  }

  const set = (k: keyof CheckoutDetails) => (e: { target: { value: string } }) => setD((x) => ({ ...x, [k]: e.target.value }));

  const next = (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(d, age, step);
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = Object.keys(errs)[0];
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    if (step < 2) return setStep(step + 1);
    if (blocked.length) return;
    setRedirecting(true);
    window.setTimeout(() => window.location.assign(shopifyCheckoutUrl(lines, d)), 900);
  };

  const input = (k: keyof CheckoutDetails, label: string, props: Record<string, unknown> = {}) => (
    <div className={`cfield ${errors[k] ? 'has-error' : ''}`}>
      <label htmlFor={`co-${k}`}>{label}</label>
      <input id={`co-${k}`} value={d[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `co-${k}-err` : undefined} {...props} />
      {errors[k] && (
        <p id={`co-${k}-err`} className="cfield__err">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="checkout">
      <div className="checkout__grid">
        <div className="checkout__main wrap">
          <Link to="/" className="checkout__logo" aria-label="DrinksUp home">
            <img src="/brand/wordmark.png" alt="" width={1038} height={232} />
          </Link>

          <ol className="steps" aria-label="Checkout progress">
            {STEPS.map((s, i) => (
              <li key={s} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                <button type="button" disabled={i > step} onClick={() => setStep(i)}>
                  <span className="steps__num">{i + 1}</span> {s}
                </button>
              </li>
            ))}
          </ol>

          <button type="button" className="checkout__summary-toggle" aria-expanded={summaryOpen} onClick={() => setSummaryOpen((o) => !o)}>
            <span>{summaryOpen ? 'Hide' : 'Show'} order summary</span>
            <ChevronDown size={18} className={summaryOpen ? 'is-flipped' : ''} />
            <strong>{money(subtotal)}</strong>
          </button>
          <AnimatePresence initial={false}>
            {summaryOpen && (
              <motion.div className="checkout__summary-mobile" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }}>
                <OrderSummary compact />
              </motion.div>
            )}
          </AnimatePresence>

          {blocked.length > 0 && (
            <div className="checkout__alert" role="alert">
              <AlertTriangle size={20} />
              <p>
                {blocked.map((l) => l.product.title).join(', ')} {blocked.length === 1 ? 'has' : 'have'} sold out. <Link to="/cart">Update your cart</Link> to continue.
              </p>
            </div>
          )}

          <form className="checkout__form" onSubmit={next} noValidate>
            <AnimatePresence mode="wait" initial={false}>
              <motion.fieldset key={step} className="checkout__step" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
                {step === 0 && (
                  <>
                    <legend className="h3">Contact</legend>
                    {input('email', 'Email', { type: 'email', autoComplete: 'email', inputMode: 'email' })}
                    {input('phone', 'Mobile', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '0400 000 000' })}
                    <label className={`checkout__age ${errors.age ? 'has-error' : ''}`}>
                      <input id="co-age" type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} aria-describedby="co-age-help" />
                      <span>
                        I confirm I am <strong>18 years or older</strong>.
                        <span id="co-age-help" className="muted">
                          {' '}
                          The recipient may be asked for proof of age on delivery.
                        </span>
                      </span>
                    </label>
                    {errors.age && <p className="cfield__err">{errors.age}</p>}
                  </>
                )}

                {step === 1 && (
                  <>
                    <legend className="h3">Delivery address</legend>
                    <div className="checkout__row">
                      {input('firstName', 'First name', { autoComplete: 'given-name' })}
                      {input('lastName', 'Last name', { autoComplete: 'family-name' })}
                    </div>
                    {input('address1', 'Street address', { autoComplete: 'address-line1' })}
                    {input('address2', 'Apartment, unit, etc. (optional)', { autoComplete: 'address-line2' })}
                    <div className="checkout__row checkout__row--3">
                      {input('city', 'Suburb', { autoComplete: 'address-level2' })}
                      <div className={`cfield ${errors.state ? 'has-error' : ''}`}>
                        <label htmlFor="co-state">State</label>
                        <select id="co-state" value={d.state} onChange={set('state')} autoComplete="address-level1" aria-invalid={Boolean(errors.state)}>
                          <option value="">Select</option>
                          {STATES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && <p className="cfield__err">{errors.state}</p>}
                      </div>
                      {input('postcode', 'Postcode', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 4 })}
                    </div>
                    <div className="cfield">
                      <label htmlFor="co-note">Delivery note (optional)</label>
                      <textarea id="co-note" rows={3} value={d.note} onChange={set('note')} placeholder="Leave at the door, gift message…" />
                    </div>
                    <p className="checkout__info">
                      <Truck size={18} /> We aim to dispatch within 1–2 business days.{' '}
                      {subtotal >= SITE.freeShippingThreshold ? 'Your order ships free.' : `Free shipping on Australian orders over ${money(SITE.freeShippingThreshold)}.`}
                    </p>
                  </>
                )}

                {step === 2 && (
                  <>
                    <legend className="h3">Review & pay</legend>
                    <dl className="checkout__review">
                      <div>
                        <dt>Contact</dt>
                        <dd>
                          {d.email}
                          <br />
                          {d.phone}
                        </dd>
                        <button type="button" onClick={() => setStep(0)}>
                          Edit
                        </button>
                      </div>
                      <div>
                        <dt>Ship to</dt>
                        <dd>
                          {d.firstName} {d.lastName}
                          <br />
                          {d.address1}
                          {d.address2 && `, ${d.address2}`}
                          <br />
                          {d.city} {d.state} {d.postcode}, Australia
                        </dd>
                        <button type="button" onClick={() => setStep(1)}>
                          Edit
                        </button>
                      </div>
                    </dl>
                    <div className="checkout__pay">
                      <p className="checkout__pay-title">
                        <Lock size={18} /> Payment
                      </p>
                      <p className="muted">
                        Payment is taken on DrinksUp’s secure Shopify checkout. Your details above are carried across, and you’ll see shipping options, can apply a
                        discount code and receive your order confirmation there.
                      </p>
                      <ul role="list" className="footer__pay checkout__methods">
                        {SITE.payments.map((p) => (
                          <li key={p.label}>
                            <img src={p.icon} alt={p.label} title={p.label} width={38} height={24} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </motion.fieldset>
            </AnimatePresence>

            <div className="checkout__nav">
              {step > 0 ? (
                <button type="button" className="link-line" onClick={() => setStep(step - 1)}>
                  ← Back
                </button>
              ) : (
                <Link to="/cart" className="link-line">
                  ← Return to cart
                </Link>
              )}
              <Button type="submit" variant={step === 2 ? 'coral' : 'ink'} size="lg" arrow disabled={redirecting || (step === 2 && blocked.length > 0)}>
                {step === 0 ? 'Continue to delivery' : step === 1 ? 'Review order' : 'Continue to secure payment'}
              </Button>
            </div>
            <p className="checkout__secure muted">
              <ShieldCheck size={16} /> Encrypted, PCI-compliant payment handled by Shopify.
            </p>
          </form>
        </div>

        <aside className="checkout__aside" aria-label="Order summary">
          <div className="checkout__aside-inner">
            <h2 className="h3">Order summary</h2>
            <OrderSummary />
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {redirecting && (
          <motion.div className="checkout__handoff on-dark" role="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <img src="/brand/mark-coral.png" alt="" width={120} height={120} />
            <p className="h3">Taking you to secure payment…</p>
            <p className="muted">
              If nothing happens, <a href={shopifyCheckoutUrl(lines, d)}>continue here</a>.
            </p>
            <button type="button" className="link-line" onClick={() => setRedirecting(false)}>
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
