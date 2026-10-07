import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone, Search, ShoppingBag, X } from 'lucide-react';
import { NAV, SHELF_MENU, SITE } from '../../data/site';
import { useUI } from '../../context/UIContext';
import { useCart } from '../../context/CartContext';
import { Logo } from '../Header/Logo';
import './MobileMenu.css';

const ease = [0.22, 1, 0.36, 1] as const;

export function MobileMenu() {
  const { panel, close, open } = useUI();
  const { count } = useCart();
  const isOpen = panel === 'menu';
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="mobile-menu"
          className="mmenu on-dark"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          initial={{ clipPath: 'circle(0% at 2.2rem 3.4rem)' }}
          animate={{ clipPath: 'circle(150% at 2.2rem 3.4rem)' }}
          exit={{ clipPath: 'circle(0% at 2.2rem 3.4rem)' }}
          transition={{ duration: 0.7, ease }}
          data-lenis-prevent
        >
          <div className="mmenu__top wrap">
            <button ref={closeRef} type="button" className="mmenu__close" onClick={close} aria-label="Close menu">
              <X size={22} />
            </button>
            <Logo light />
            <span className="mmenu__spacer" />
          </div>

          <nav className="mmenu__nav wrap" aria-label="Mobile">
            <ul role="list">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.to}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.6, ease }}
                >
                  <Link to={item.to}>
                    <span className="mmenu__idx">0{i + 1}</span>
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          <motion.div
            className="mmenu__shelf wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="label muted">The spirit shelf</p>
            <ul role="list" className="mmenu__chips">
              {SHELF_MENU.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="mmenu__foot wrap"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <div className="mmenu__actions">
              <button type="button" className="btn btn--light btn--md" onClick={() => open('search')}>
                <Search size={18} /> Search
              </button>
              <button type="button" className="btn btn--coral btn--md" onClick={() => open('cart')}>
                <ShoppingBag size={18} /> Cart ({count})
              </button>
            </div>
            <a href={`tel:${SITE.phone}`} className="mmenu__phone">
              <Phone size={16} /> {SITE.phoneDisplay}
            </a>
            <ul role="list" className="mmenu__socials">
              {SITE.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
