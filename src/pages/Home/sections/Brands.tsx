import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { brands, brandImage } from '../../../data';
import { Reveal, SplitHeading } from '../../../animations/Reveal';
import { Photo } from '../../../components/Photo';
import { pluralise } from '../../../utils/format';
import './Brands.css';

export function BrandTiles({ heading = true }: { heading?: boolean }) {
  return (
    <section className="houses section" aria-labelledby={heading ? 'houses-title' : undefined} aria-label={heading ? undefined : 'Brands'}>
      {heading && (
        <div className="wrap section-head">
          <div>
            <p className="label">The houses we pour</p>
            <SplitHeading id="houses-title" className="h2" text="Houses with a story" accent={['story']} />
          </div>
          <p className="lead muted">From a family cachaça distillery in Brazil to pre-prohibition style bourbon and Giffard’s French liqueurs, crafted since 1885.</p>
        </div>
      )}
      <Reveal as="ul" className="houses__grid wrap" stagger={0.05}>
        {brands.map((b) => (
          <li key={b.handle}>
            <Link to={`/collections/${b.handle}`} className="house on-dark">
              <span className="house__img">
                <Photo src={brandImage(b.handle)} alt="" sizes="(min-width: 1100px) 25vw, (min-width: 640px) 45vw, 80vw" />
              </span>
              <span className="house__copy">
                <span className="label">{pluralise(b.products.length, 'product')}</span>
                <span className="house__name">{b.name}</span>
                {b.description && <span className="house__desc">{b.description}</span>}
              </span>
              <ArrowUpRight className="house__arrow" size={22} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
