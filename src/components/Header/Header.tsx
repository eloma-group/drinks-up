import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingBag, User } from 'lucide-react';
import { NAV, SHELF_MENU, SITE, IMG } from '../../data/site';
import { brands, collections } from '../../data';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import { money } from '../../utils/format';
import { sized } from '../../utils/image';
import { Logo } from './Logo';
import './Header.css';

function AnnouncementBar() {
  const { subtotal, count } = useCart();
  const remaining = SITE.freeShippingThreshold - subtotal;
  const msg =
    count === 0
      ? `Australian owned · Free shipping on orders over ${money(SITE.freeShippingThreshold)} in Aus.`
      : remaining > 0
        ? `Spend ${money(remaining)} more and get free shipping!`
        : 'You’ve unlocked free shipping in Australia 🎉';
  return (
    <div className="annbar on-dark" role="region" aria-label="Store announcement">
      <p aria-live="polite">{msg}</p>
    </div>
  );
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  const packs = collections.get('cocktail-packs');
  return (
    <motion.div
      className="mega"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mega__inner wrap">
        <div className="mega__col">
          <p className="label muted">Shop by category</p>
          <ul role="list" className="mega__list mega__list--big">
            {SHELF_MENU.map((l) => {
              const n = collections.get(l.to.split('/').pop()!)?.products.length ?? 0;
              return (
                <li key={l.to}>
                  <Link to={l.to} onClick={onClose}>
                    {l.label}
                    <sup>{n}</sup>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mega__col">
          <p className="label muted">Shop by brand</p>
          <ul role="list" className="mega__list">
            {brands.map((b) => (
              <li key={b.handle}>
                <Link to={`/collections/${b.handle}`} onClick={onClose} className="link-line">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/collections/all" className="mega__all link-line" onClick={onClose}>
            Shop all {collections.get('all')?.products.length} products →
          </Link>
        </div>
        <Link to="/collections/cocktail-packs" className="mega__feature" onClick={onClose}>
          <img src={sized(IMG.blueBeach, 900)} alt="" loading="lazy" />
          <span className="mega__feature-copy on-dark">
            <span className="label">Gifting · {packs?.products.length} packs</span>
            <span className="h3">Cocktail packs, hand-picked by career bartenders</span>
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

export function Header() {
  const { count } = useCart();
  const { open, panel, cartPulse } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mega, setMega] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<number>(0);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 420 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 420) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMega(false), [location.pathname]);

  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    closeTimer.current = window.setTimeout(() => setMega(false), 140);
  };

  return (
    <>
      <AnnouncementBar />
      <header
        className={`header ${scrolled ? 'is-scrolled' : ''} ${hidden && !mega && !panel ? 'is-hidden' : ''} ${mega ? 'is-mega' : ''}`}
        onMouseLeave={closeMega}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setMega(false);
        }}
        onKeyDown={(e) => e.key === 'Escape' && setMega(false)}
      >
        <div className="header__bar wrap">
          <button
            type="button"
            className={`burger ${panel === 'menu' ? 'is-open' : ''}`}
            aria-label="Open menu"
            aria-expanded={panel === 'menu'}
            aria-controls="mobile-menu"
            onClick={() => open('menu')}
          >
            <span />
            <span />
          </button>

          <Logo className="header__logo" />

          <nav className="header__nav" aria-label="Primary">
            <ul role="list">
              {NAV.map((item) =>
                'mega' in item ? (
                  <li key={item.to} onMouseEnter={openMega} onFocus={openMega}>
                    <NavLink to={item.to} className="link-line" aria-haspopup="true" aria-expanded={mega}>
                      {item.label}
                    </NavLink>
                  </li>
                ) : (
                  <li key={item.to} onMouseEnter={closeMega}>
                    <NavLink to={item.to} className={`link-line ${item.label === 'Sale' ? 'is-sale' : ''}`}>
                      {item.label}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="header__tools">
            <button type="button" className="tool" onClick={() => open('search')} aria-label="Search products">
              <Search size={20} />
              <span className="tool__label">Search</span>
              <kbd className="tool__kbd">/</kbd>
            </button>
            <a className="tool tool--account" href={`${SITE.store}/account`} aria-label="Account (opens the DrinksUp store account)">
              <User size={20} />
            </a>
            <button type="button" className="tool tool--cart" onClick={() => open('cart')} aria-label={`Open cart, ${count} items`}>
              <ShoppingBag size={20} />
              <span className="tool__label">Cart</span>
              <motion.span
                key={cartPulse}
                className={`cart-count ${count ? '' : 'is-empty'}`}
                initial={cartPulse ? { scale: 1.8 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                aria-hidden="true"
              >
                {count}
              </motion.span>
            </button>
          </div>
        </div>

        <AnimatePresence>{mega && <MegaMenu onClose={() => setMega(false)} />}</AnimatePresence>
      </header>
      <AnimatePresence>
        {mega && (
          <motion.div
            className="mega-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMega(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}
