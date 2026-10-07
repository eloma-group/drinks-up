import { Link } from 'react-router-dom';
import { products, isAvailable } from '../../data';
import { useSeo } from '../../utils/seo';
import { Button } from '../../components/Button/Button';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import './NotFound.css';

export default function NotFound({ kind = 'page' }: { kind?: 'page' | 'product' }) {
  useSeo({ title: kind === 'product' ? 'Product unavailable' : 'Page not found', description: 'This page has moved or no longer exists.' });
  return (
    <div className="nf">
      <section className="nf__hero wrap">
        <p className="nf__code" aria-hidden="true">
          404
        </p>
        <h1 className="h1">{kind === 'product' ? 'This bottle has left the shelf' : 'Last call — this page is gone'}</h1>
        <p className="lead muted">
          {kind === 'product'
            ? 'The product you’re after is no longer available or the link has changed. Here’s what’s pouring right now.'
            : 'The link may be broken or the page may have moved. Try the shelf, or search for what you were after.'}
        </p>
        <div className="nf__actions">
          <Button to="/collections/all" arrow>
            Shop the shelf
          </Button>
          <Button to="/" variant="outline">
            Back home
          </Button>
        </div>
        <p className="muted nf__help">
          Need a hand? <Link to="/pages/contact">Contact us</Link>.
        </p>
      </section>
      <section className="wrap section" aria-label="Popular products">
        <ProductGrid products={products.filter(isAvailable).slice(0, 4)} />
      </section>
    </div>
  );
}
