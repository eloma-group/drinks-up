import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Phone } from 'lucide-react';
import { IMG, SITE } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Button } from '../../components/Button/Button';
import { Photo } from '../../components/Photo';
import './Contact.css';

type Field = 'name' | 'email' | 'phone' | 'message';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {};
  if (!v.name.trim()) e.name = 'Please tell us your name.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Please enter a valid email address.';
  if (v.phone && !/^[\d\s()+-]{8,}$/.test(v.phone)) e.phone = 'That phone number doesn’t look right.';
  if (v.message.trim().length < 5) e.message = 'Please add a short message.';
  return e;
}

export default function Contact() {
  useSeo({ title: 'Contact Us', description: 'Questions about products, pricing or shipping? Ask DrinksUp anything — call 0400 242 381 or send us a message.', path: '/pages/contact' });
  const [values, setValues] = useState<Record<Field, string>>({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      e.preventDefault();
      const first = Object.keys(errs)[0];
      document.getElementById(`c-${first}`)?.focus();
      return;
    }
    // Let the native POST continue to the store's Shopify contact endpoint (new tab)
    window.setTimeout(() => setSent(true), 50);
  };

  const field = (name: Field, label: string, props: Record<string, unknown> = {}, textarea = false) => {
    const Tag = textarea ? 'textarea' : 'input';
    return (
      <div className={`cfield ${errors[name] ? 'has-error' : ''} ${textarea ? 'cfield--full' : ''}`}>
        <label htmlFor={`c-${name}`}>{label}</label>
        <Tag
          id={`c-${name}`}
          name={`contact[${name === 'message' ? 'body' : name}]`}
          value={values[name]}
          onChange={(e: { target: { value: string } }) => setValues((v) => ({ ...v, [name]: e.target.value }))}
          onBlur={() => errors[name] && setErrors(validate(values))}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `c-${name}-err` : undefined}
          {...props}
        />
        <AnimatePresence>
          {errors[name] && (
            <motion.p id={`c-${name}-err`} className="cfield__err" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {errors[name]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="contact">
      <div className="contact__grid">
        <div className="contact__copy wrap">
          <Breadcrumbs items={[{ label: 'Contact' }]} />
          <p className="label">Contact</p>
          <SplitHeading as="h1" className="display" text="Ask us anything!" accent={['anything!']} immediate />
          <p className="lead muted">If you have any questions about products, pricing, shipping or even the weather … ask us anything!</p>

          <a href={`tel:${SITE.phone}`} className="contact__phone">
            <Phone size={22} /> {SITE.phoneDisplay}
          </a>

          {sent ? (
            <motion.div className="contact__sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="status">
              <CheckCircle2 size={28} />
              <div>
                <p className="h4">Message on its way</p>
                <p className="muted">Your message was submitted through the DrinksUp store in a new tab. If a quick check appears there, complete it so we receive it.</p>
                <button type="button" className="link-line" onClick={() => setSent(false)}>
                  Send another message
                </button>
              </div>
            </motion.div>
          ) : (
            <form className="cform" action={`${SITE.store}/contact#contact_form`} method="post" target="_blank" onSubmit={onSubmit} noValidate>
              <input type="hidden" name="form_type" value="contact" />
              <input type="hidden" name="utf8" value="✓" />
              {field('name', 'Name', { autoComplete: 'name', required: true })}
              {field('email', 'Email', { type: 'email', autoComplete: 'email', required: true })}
              {field('phone', 'Phone number (optional)', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}
              {field('message', 'Message', { rows: 5, required: true }, true)}
              <Button type="submit" variant="coral" size="lg" arrow>
                Send message
              </Button>
            </form>
          )}

          <dl className="contact__licence">
            <div>
              <dt>Licence number</dt>
              <dd>{SITE.licence.number}</dd>
            </div>
            <div>
              <dt>Class of licence</dt>
              <dd>{SITE.licence.class}</dd>
            </div>
            <div>
              <dt>Licensee</dt>
              <dd>
                {SITE.licence.licensee} (ABN {SITE.licence.abn})
              </dd>
            </div>
          </dl>
        </div>
        <div className="contact__img">
          <Photo src={IMG.pinkCocktail} alt="A pink cocktail garnished with fresh fruit" sizes="(min-width: 1000px) 45vw, 100vw" width={1080} height={1080} eager />
        </div>
      </div>
    </div>
  );
}
