import { useState, type FormEvent } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { SITE } from '../../data/site';
import './Newsletter.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Posts to the store's existing Shopify customer form (the same endpoint the
 * current theme uses), so sign-ups land in DrinksUp's Shopify customer list.
 * Shopify may show a quick bot-check in the new tab.
 */
export function Newsletter({ tone = 'coral' }: { tone?: 'coral' | 'dark' }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!EMAIL.test(email.trim())) {
      e.preventDefault();
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSent(true);
  };

  return (
    <form
      className={`news news--${tone}`}
      action={`${SITE.store}/contact#contact_form`}
      method="post"
      target="_blank"
      onSubmit={onSubmit}
      noValidate
    >
      <input type="hidden" name="form_type" value="customer" />
      <input type="hidden" name="utf8" value="✓" />
      <input type="hidden" name="contact[tags]" value="newsletter" />
      <label htmlFor={`news-${tone}`} className="sr-only">
        Email address
      </label>
      <div className={`news__field ${error ? 'has-error' : ''}`}>
        <input
          id={`news-${tone}`}
          type="email"
          name="contact[email]"
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSent(false);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`news-${tone}-msg`}
          required
        />
        <button type="submit" aria-label="Subscribe">
          {sent ? <Check size={20} /> : <ArrowRight size={20} />}
        </button>
      </div>
      <p id={`news-${tone}-msg`} className="news__msg" aria-live="polite">
        {error || (sent ? 'Nearly there — confirm your sign-up in the DrinksUp tab that just opened.' : 'Exclusive deals and recipes. No spam, unsubscribe anytime.')}
      </p>
    </form>
  );
}
