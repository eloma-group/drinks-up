import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { PILLARS } from '../../../data/site';
import { brands } from '../../../data';
import { Marquee } from '../../../components/Marquee/Marquee';
import { Reveal, SplitHeading } from '../../../animations/Reveal';
import './Pillars.css';

export function BrandTicker() {
  return (
    <div className="ticker on-dark" aria-label="Brands on the shelf">
      <Marquee
        speed={45}
        items={brands.map((b) => (
          <Link key={b.handle} to={`/collections/${b.handle}`} className="ticker__item">
            {b.name}
            <span className="ticker__star" aria-hidden="true">
              ✳
            </span>
          </Link>
        ))}
      />
    </div>
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
