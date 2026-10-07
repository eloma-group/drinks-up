import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { useSmoothScroll } from '../../context/SmoothScroll';
import './AgeGate.css';

const MIN_AGE = 18;
const ease = [0.22, 1, 0.36, 1] as const;

type Field = 'day' | 'month' | 'year';
const MAX: Record<Field, number> = { day: 2, month: 2, year: 4 };

/** Whole years between the date of birth and today */
function ageOn(dob: Date, today = new Date()) {
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function parseDob(d: string, m: string, y: string): { date?: Date; error?: string } {
  if (!d || !m || y.length < 4) return { error: 'Please enter your full date of birth.' };
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  const thisYear = new Date().getFullYear();
  if (month < 1 || month > 12) return { error: 'Please enter a month between 01 and 12.' };
  if (year < 1900 || year > thisYear) return { error: `Please enter a year between 1900 and ${thisYear}.` };
  const date = new Date(year, month - 1, day);
  // Rejects impossible dates like 31/02
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return { error: 'That date doesn’t exist. Please check it.' };
  if (date > new Date()) return { error: 'Your date of birth can’t be in the future.' };
  return { date };
}

/**
 * Full-screen 18+ gate. Rendered on every full page load (opening the site or
 * reloading), so the store is never shown without a date-of-birth check.
 */
export function AgeGate({ onVerified }: { onVerified: () => void }) {
  const [values, setValues] = useState<Record<Field, string>>({ day: '', month: '', year: '' });
  const [error, setError] = useState('');
  const [denied, setDenied] = useState(false);
  const refs = { day: useRef<HTMLInputElement>(null), month: useRef<HTMLInputElement>(null), year: useRef<HTMLInputElement>(null) };
  const { lenis } = useSmoothScroll();

  // Freeze the page behind the gate
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('age-locked');
    // after other mount effects, so nothing restarts smooth scrolling underneath
    const t = window.setTimeout(() => lenis()?.stop(), 0);
    return () => {
      window.clearTimeout(t);
      root.classList.remove('age-locked');
      lenis()?.start();
    };
  }, [lenis]);

  useEffect(() => {
    if (!denied) window.setTimeout(() => refs.day.current?.focus(), 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [denied]);

  const order: Field[] = ['day', 'month', 'year'];

  const onChange = (f: Field) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, MAX[f]);
    setValues((x) => ({ ...x, [f]: v }));
    setError('');
    // auto-advance once a field is complete
    if (v.length === MAX[f]) {
      const next = order[order.indexOf(f) + 1];
      if (next) refs[next].current?.focus();
    }
  };

  const onKeyDown = (f: Field) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[f]) {
      const prev = order[order.indexOf(f) - 1];
      if (prev) refs[prev].current?.focus();
    }
  };

  // Pad single digits when leaving day/month (5 → 05)
  const onBlur = (f: Field) => () => {
    if (f !== 'year' && values[f].length === 1 && values[f] !== '0') setValues((x) => ({ ...x, [f]: x[f].padStart(2, '0') }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const { date, error: err } = parseDob(values.day, values.month, values.year);
    if (!date) {
      setError(err ?? 'Please check your date of birth.');
      return;
    }
    if (ageOn(date) >= MIN_AGE) onVerified();
    else setDenied(true);
  };

  const retry = () => {
    setValues({ day: '', month: '', year: '' });
    setError('');
    setDenied(false);
  };

  return (
    <motion.div
      className="agegate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-title"
      aria-describedby="agegate-desc"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease } }}
      data-lenis-prevent
    >
      <div className="agegate__glow" aria-hidden="true" />

      <motion.div
        className="agegate__card"
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, delay: 0.15, ease } }}
        exit={{ opacity: 0, y: -30, scale: 1.04, transition: { duration: 0.5, ease } }}
      >
        <img src="/brand/logo-square.png" alt="DrinksUp" className="agegate__logo" width={600} height={469} />

        <AnimatePresence mode="wait" initial={false}>
          {!denied ? (
            <motion.div key="ask" className="agegate__body" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
              <p className="agegate__eyebrow">Australian owned · 18+ only</p>
              <h2 id="agegate-title" className="agegate__title">
                Are you <span className="accent">18 or over?</span>
              </h2>
              <p id="agegate-desc" className="agegate__desc">
                Enter your date of birth to step inside DrinksUp. You must be of legal drinking age in Australia to visit this site.
              </p>

              <form className="agegate__form" onSubmit={submit} noValidate>
                <fieldset className="agegate__dob" aria-describedby={error ? 'agegate-error' : undefined}>
                  <legend className="sr-only">Date of birth</legend>
                  {order.map((f) => (
                    <label key={f} className={`agegate__field agegate__field--${f}`}>
                      <span>{f === 'day' ? 'Day' : f === 'month' ? 'Month' : 'Year'}</span>
                      <input
                        ref={refs[f]}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={`bday-${f}`}
                        placeholder={f === 'day' ? 'DD' : f === 'month' ? 'MM' : 'YYYY'}
                        maxLength={MAX[f]}
                        value={values[f]}
                        onChange={onChange(f)}
                        onKeyDown={onKeyDown(f)}
                        onBlur={onBlur(f)}
                        aria-invalid={Boolean(error)}
                      />
                    </label>
                  ))}
                </fieldset>

                <AnimatePresence>
                  {error && (
                    <motion.p id="agegate-error" className="agegate__error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button type="submit" className="agegate__submit">
                  Enter DrinksUp
                  <span className="agegate__submit-icon" aria-hidden="true">
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </span>
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div key="denied" className="agegate__body agegate__body--denied" role="alert" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
              <span className="agegate__denied-icon" aria-hidden="true">
                <ShieldAlert size={30} />
              </span>
              <h2 id="agegate-title" className="agegate__title">
                Sorry, <span className="accent">not just yet.</span>
              </h2>
              <p id="agegate-desc" className="agegate__desc">
                You must be 18 or older to enter DrinksUp. Come back and raise a glass with us when you’re of legal drinking age.
              </p>
              <button type="button" className="agegate__retry" onClick={retry}>
                Entered the wrong date? Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="agegate__legal">
          Under the Liquor Control Act 1988, it is an offence to sell or supply liquor to a person under the age of 18 years, or for a person under 18
          to purchase or attempt to purchase liquor. Please enjoy responsibly.
        </p>
      </motion.div>
    </motion.div>
  );
}
