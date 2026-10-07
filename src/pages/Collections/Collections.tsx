import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { CATEGORIES, categoryCount, collections } from '../../data';
import { IMG } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { Reveal, SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Photo } from '../../components/Photo';
import { BrandTiles } from '../Home/sections/Brands';
import './Collections.css';

const EXTRA = ['tequila', 'rum', 'bourbon', 'aperitif', 'sale'];

export default function Collections() {
  useSeo({
    title: 'All Collections & Brands',
    description: 'Browse the DrinksUp spirit shelf by category or by brand — spirits, liqueurs, syrups, fruit purées, cocktail packs and more.',
    image: sized(IMG.spritzTable, 1200),
  });

  return (
    <div className="colls">
      <header className="colls__hero wrap">
        <Breadcrumbs items={[{ label: 'Collections' }]} />
        <p className="label">The spirit shelf</p>
        <SplitHeading as="h1" className="display" text="Every collection, every house" accent={['every', 'house']} immediate />
      </header>

      <section className="wrap" aria-label="Categories">
        <Reveal as="ul" className="colls__grid" stagger={0.06}>
          {CATEGORIES.map((c, i) => (
            <li key={c.key} className={i < 2 ? 'is-wide' : ''}>
              <Link to={`/collections/${c.key}`} className="ctile on-dark">
                <Photo src={c.image} alt="" sizes={i < 2 ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 25vw, 50vw'} />
                <span className="ctile__copy">
                  <span className="label">{categoryCount(c.key)} products</span>
                  <span className="ctile__name">{c.title}</span>
                  <span className="ctile__eyebrow">{c.eyebrow}</span>
                </span>
                <ArrowUpRight className="ctile__arrow" size={22} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </Reveal>

        <div className="colls__more">
          <p className="label muted">Also on the shelf</p>
          <ul role="list">
            {EXTRA.map((h) => {
              const c = collections.get(h);
              return c ? (
                <li key={h}>
                  <Link to={`/collections/${h}`}>
                    {c.title} <sup>{c.products.length}</sup>
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </section>

      <BrandTiles />
    </div>
  );
}
