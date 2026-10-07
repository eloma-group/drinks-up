import { recipes } from '../../data';
import { IMG } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { Reveal, SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Button } from '../../components/Button/Button';
import { EmptyState } from '../../components/States/States';
import { RecipeCard } from './RecipeCard';
import './Recipes.css';

export default function Recipes() {
  useSeo({
    title: 'Cocktail Recipes for Home',
    description: 'Discover easy-to-follow recipes to create professional quality cocktails at home — from Pina Coladas to the Lanique Rose Lady.',
    image: sized(IMG.sunsetSand, 1200),
    path: '/blogs/recipes',
  });
  const [lead, ...rest] = recipes;

  return (
    <div className="recipes">
      <header className="recipes__hero wrap">
        <Breadcrumbs items={[{ label: 'Recipes' }]} />
        <p className="label">Guided recipes for home</p>
        <SplitHeading as="h1" className="display" text="Easy recipes at home" accent={['at', 'home']} immediate />
        <p className="lead muted">Cocktails from your favourite bars but at home! Easy-to-follow recipes for professional quality drinks.</p>
      </header>

      {!lead ? (
        <EmptyState title="New recipes are being mixed" body="Check back soon — or shop our cocktail packs in the meantime.">
          <Button to="/collections/cocktail-packs">Shop cocktail packs</Button>
        </EmptyState>
      ) : (
        <>
          <section className="wrap recipes__lead" aria-label="Featured recipe">
            <RecipeCard recipe={lead} index={0} large />
          </section>
          <section className="wrap section" aria-label="More recipes">
            <Reveal as="ul" className="recipes__grid" stagger={0.08}>
              {rest.map((r, i) => (
                <li key={r.handle}>
                  <RecipeCard recipe={r} index={i + 1} />
                </li>
              ))}
            </Reveal>
          </section>
        </>
      )}

      <section className="recipes__cta on-coral" aria-labelledby="packs-cta">
        <div className="wrap recipes__cta-inner">
          <h2 id="packs-cta" className="h2">
            Skip the shopping list. <span className="accent">Get the pack.</span>
          </h2>
          <Button to="/collections/cocktail-packs" size="lg" arrow>
            Shop cocktail packs
          </Button>
        </div>
      </section>
    </div>
  );
}
