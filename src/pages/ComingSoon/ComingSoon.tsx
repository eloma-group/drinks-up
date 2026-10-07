import { useEffect } from 'react';
import { Phone } from 'lucide-react';
import { SITE, IMG } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { SplitHeading } from '../../animations/Reveal';
import { Button } from '../../components/Button/Button';
import { Photo } from '../../components/Photo';
import './ComingSoon.css';

/** Shown for every route except the homepage while the site is locked. */
export default function ComingSoon() {
  useSeo({ title: 'Coming soon', description: 'This part of the new DrinksUp store is opening soon.' });

  // Keep locked pages out of search results
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <section className="soon" aria-labelledby="soon-title">
      <div className="soon__copy wrap">
        <p className="label">Opening soon</p>
        <SplitHeading id="soon-title" as="h1" className="display" text="Something good is on the way" accent={['on', 'the', 'way']} immediate />
        <p className="lead muted">
          We’re putting the finishing touches on the new DrinksUp store. This page isn’t open just yet — check back soon, or start on the homepage.
        </p>
        <div className="soon__actions">
          <Button to="/" size="lg" arrow>
            Back to homepage
          </Button>
          <Button href={`tel:${SITE.phone}`} size="lg" variant="outline" icon={<Phone size={18} />}>
            {SITE.phoneDisplay}
          </Button>
        </div>
      </div>
      <div className="soon__img">
        <Photo src={IMG.sunsetSand} alt="" sizes="(min-width: 1000px) 45vw, 100vw" width={1080} height={1080} eager />
      </div>
    </section>
  );
}
