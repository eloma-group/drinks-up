import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PILLARS, STOCKISTS } from '../../../data/site';
import { Marquee } from '../../../components/Marquee/Marquee';
import { Reveal, SplitHeading } from '../../../animations/Reveal';
import './Pillars.css';

/** “You can find us at:” — stockist & venue logos (replaces the brand-name ticker) */
export function StockistTicker() {
  return (
    <section className="stockists" aria-labelledby="stockists-title">
      <h2 id="stockists-title" className="stockists__title label">
        You can find us at:
      </h2>
      <Marquee
        speed={50}
        className="stockists__marquee"
        items={STOCKISTS.map((s) => (
          <span key={s.name} className="stockists__tile" title={s.name}>
            <img src={s.logo} alt={s.name} decoding="async" />
          </span>
        ))}
      />
    </section>
  );
}

export function Pillars() {
  return (
    <section className="pillars section wrap" aria-labelledby="pillars-title">
      <div className="section-head">
        <div>
          <p className="label">Why DrinksUp</p>
          <SplitHeading id="pillars-title" className="h2" text="Good times and better booze" accent={['better', 'booze']} />
        </div>
        <p className="lead muted">Determined to deliver only the highest quality products at the most affordable price.</p>
      </div>
      <Reveal as="ol" className="pillars__list" stagger={0.1}>
        {PILLARS.map((p, i) => (
          <li key={p.title} className="pillar">
            <span className="pillar__num">0{i + 1}</span>
            <h3 className="h3">{p.title}</h3>
            <p className="muted">{p.body}</p>
            <Link to={p.to} className="link-line pillar__cta">
              {p.cta} <ArrowUpRight size={16} />
            </Link>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
