import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { products, isAvailable, minPrice, categoryMeta } from '../../data';
import { useUI } from '../../context/UIContext';
import { useDebounced } from '../../hooks/useDebounced';
import { POPULAR_SEARCHES, searchProducts } from '../../utils/search';
import { shortTitle } from '../../utils/format';
import { sized } from '../../utils/image';
import { Price } from '../Price/Price';
import './Search.css';

const ease = [0.22, 1, 0.36, 1] as const;
const LIMIT = 8;

export function SearchOverlay() {
  const { panel, close } = useUI();
  const isOpen = panel === 'search';
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(-1);
  const q = useDebounced(query.trim(), 120);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const results = useMemo(() => (q ? searchProducts(products, q) : []), [q]);
  const shown = q ? results.slice(0, LIMIT) : products.filter(isAvailable).slice(0, 4);

  useEffect(() => {
    if (isOpen) window.setTimeout(() => inputRef.current?.focus(), 60);
    else setQuery('');
  }, [isOpen]);
  useEffect(() => setActive(-1), [q]);

  const go = (path: string) => {
    close();
    navigate(path);
  };
  const submit = () => {
    if (active >= 0 && shown[active]) return go(`/products/${shown[active].handle}`);
    if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(shown.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(-1, a - 1));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="overlay-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            className="search"
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.6, ease }}
            data-lenis-prevent
          >
            <div className="search__inner wrap">
              <form
                className="search__form"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <Search className="search__icon" size={26} aria-hidden="true" />
                <label htmlFor="site-search" className="sr-only">
                  Search the spirit shelf
                </label>
                <input
                  ref={inputRef}
                  id="site-search"
                  type="search"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Search tequila, syrups, packs…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  role="combobox"
                  aria-expanded={shown.length > 0}
                  aria-controls="search-results"
                  aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
                />
                <button type="button" className="search__close" onClick={close} aria-label="Close search">
                  <X size={22} />
                </button>
              </form>

              <div className="search__body">
                <aside className="search__aside">
                  <p className="label muted">{q ? 'Try also' : 'Popular searches'}</p>
                  <ul role="list" className="search__chips">
                    {POPULAR_SEARCHES.map((s) => (
                      <li key={s}>
                        <button type="button" onClick={() => setQuery(s)}>
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>

                <div className="search__results">
                  <p className="label muted" aria-live="polite">
                    {q ? `${results.length} result${results.length === 1 ? '' : 's'} for “${q}”` : 'Trending on the shelf'}
                  </p>

                  {q && results.length === 0 ? (
                    <div className="search__empty">
                      <p className="h3">Nothing on the shelf for “{q}”</p>
                      <p className="muted">Check the spelling, try a broader word like “rum” or “syrup”, or browse everything.</p>
                      <Link to="/collections/all" onClick={close} className="link-line">
                        Browse all products <ArrowRight size={16} />
                      </Link>
                    </div>
                  ) : (
                    <ul role="listbox" id="search-results" className="search__list">
                      {shown.map((p, i) => (
                        <motion.li
                          key={p.handle}
                          role="option"
                          id={`sr-${i}`}
                          aria-selected={i === active}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.35 }}
                        >
                          <Link to={`/products/${p.handle}`} onClick={close} className={`sresult ${i === active ? 'is-active' : ''}`}>
                            <span className="sresult__img plate">
                              {p.images[0] && <img src={sized(p.images[0].src, 200)} alt="" className="plate__product" loading="lazy" />}
                            </span>
                            <span className="sresult__text">
                              <span className="label muted">{p.brand ?? categoryMeta(p.category).title}</span>
                              <span className="sresult__title">{shortTitle(p.title)}</span>
                            </span>
                            <span className="sresult__price">
                              <Price price={minPrice(p)} compareAt={p.variants.length > 1 ? null : p.variants[0].compareAt} size="sm" from={p.variants.length > 1} />
                              {!isAvailable(p) && <span className="label muted">Sold out</span>}
                            </span>
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  )}

                  {q && results.length > LIMIT && (
                    <button type="button" className="btn btn--ink btn--md search__all" onClick={submit}>
                      View all {results.length} results <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
