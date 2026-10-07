import { Link } from 'react-router-dom';
import { ArrowUp, Phone } from 'lucide-react';
import { POLICY_LINKS, SHELF_MENU, SITE } from '../../data/site';
import { useSmoothScroll } from '../../context/SmoothScroll';
import { Newsletter } from '../Newsletter/Newsletter';
import './Footer.css';

const EXPLORE = [
  { label: 'Shop all', to: '/collections/all' },
  { label: 'The Deals', to: '/collections/sale' },
  { label: 'Recipes', to: '/blogs/recipes' },
  { label: 'Brands', to: '/brands' },
  { label: 'About us', to: '/pages/about-us-1' },
  { label: 'Contact', to: '/pages/contact' },
];

export function Footer() {
  const { scrollTo } = useSmoothScroll();
  const year = new Date().getFullYear();

  return (
    <footer className="footer on-dark">
      <section className="footer__cta wrap" aria-labelledby="vip-title">
        <div>
          <p className="label">VIP list</p>
          <h2 id="vip-title" className="h2">
            Exclusive deals <span className="accent">&amp; recipes</span>
          </h2>
        </div>
        <Newsletter tone="dark" />
      </section>

      <div className="footer__grid wrap">
        <nav aria-label="Spirit shelf" className="footer__col">
          <h3 className="label muted">Spirit shelf</h3>
          <ul role="list">
            {SHELF_MENU.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link-line">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Explore" className="footer__col">
          <h3 className="label muted">Explore</h3>
          <ul role="list">
            {EXPLORE.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link-line">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Policies" className="footer__col">
          <h3 className="label muted">Policies</h3>
          <ul role="list">
            {POLICY_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="link-line">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <h3 className="label muted footer__sub">Get connected</h3>
          <ul role="list">
            {SITE.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="link-line">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer__col footer__info">
          <h3 className="label muted">Information</h3>
          <a href={`tel:${SITE.phone}`} className="footer__phone">
            <Phone size={18} /> {SITE.phoneDisplay}
          </a>
          <dl>
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
      </div>

      <div className="footer__warning wrap">
        <p>
          <strong>WARNING</strong> {SITE.warning}
        </p>
      </div>

      <div className="footer__base wrap">
        <p>© {year} Drinksup.com.au · Australian owned</p>
        <ul role="list" className="footer__pay" aria-label="Accepted payment methods">
          {SITE.payments.map((p) => (
            <li key={p.label}>
              <img src={p.icon} alt={p.label} title={p.label} width={38} height={24} loading="lazy" />
            </li>
          ))}
        </ul>
        <button type="button" className="footer__top" onClick={() => scrollTo(0)}>
          Back to top <ArrowUp size={16} />
        </button>
      </div>
    </footer>
  );
}
