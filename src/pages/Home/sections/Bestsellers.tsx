import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { products, isAvailable } from '../../../data';
import { IMG } from '../../../data/site';
import { SplitHeading, Parallax } from '../../../animations/Reveal';
import { Photo } from '../../../components/Photo';
import { ProductGrid } from '../../../components/ProductGrid/ProductGrid';
import './Bestsellers.css';

export function Bestsellers() {
  const best = products.filter((p) => isAvailable(p) && p.category !== 'bar-tools' && p.category !== 'gift-cards').slice(0, 8);
  return (
    <section className="best section wrap" aria-labelledby="best-title">
      <div className="section-head">
        <div>
          <p className="label">Best sellers</p>
          <SplitHeading id="best-title" className="h2" text="Most poured this season" accent={['poured']} />
        </div>
        <Link to="/collections/all?sort=best" className="link-line">
          Shop all best sellers <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="best__layout">
        <Link to="/collections/cocktail-packs" className="best__promo on-dark">
          <Parallax amount={16} className="best__promo-img">
            <Photo src={IMG.pastelTiki} alt="Pastel tiki cocktails with fresh pineapple" sizes="(min-width: 1100px) 33vw, 100vw" width={5472} height={3648} />
          </Parallax>
          <span className="best__promo-copy">
            <span className="label">Gifting options</span>
            <span className="h2">
              Cocktail packs <span className="accent">for gifting</span>
            </span>
            <span className="best__promo-cta">
              Find the perfect gift <ArrowUpRight size={18} />
            </span>
          </span>
        </Link>
        <ProductGrid products={best} label="Best-selling products" />
      </div>
    </section>
  );
}
