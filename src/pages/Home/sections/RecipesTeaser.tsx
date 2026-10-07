import { Truck, Sparkles, MessageCircle } from 'lucide-react';
import { recipes } from '../../../data';
import { BENEFITS } from '../../../data/site';
import { Reveal, SplitHeading } from '../../../animations/Reveal';
import { Button } from '../../../components/Button/Button';
import { RecipeCard } from '../../Recipes/RecipeCard';
import './RecipesTeaser.css';

export function RecipesTeaser() {
  return (
    <section className="rteaser section on-cream" aria-labelledby="rteaser-title">
      <div className="wrap section-head">
        <div>
          <p className="label">Easy recipes at home</p>
          <SplitHeading id="rteaser-title" className="h2" text="Cocktails from your favourite bars but at home!" accent={['at', 'home!']} />
        </div>
        <Button to="/blogs/recipes" arrow>
          Get recipes
        </Button>
      </div>
      <Reveal as="ul" className="rteaser__grid wrap" stagger={0.1}>
        {recipes.slice(0, 3).map((r, i) => (
          <li key={r.handle}>
            <RecipeCard recipe={r} index={i} />
          </li>
        ))}
      </Reveal>
    </section>
  );
}

const ICONS = [Truck, Sparkles, MessageCircle];

export function Benefits() {
  return (
    <section className="benefits wrap" aria-label="Why shop with us">
      <Reveal as="ul" className="benefits__list" stagger={0.08}>
        {BENEFITS.map((b, i) => {
          const Icon = ICONS[i];
          return (
            <li key={b.title}>
              <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
              <div>
                <h3 className="h4">{b.title}</h3>
                <p className="muted">{b.body}</p>
              </div>
            </li>
          );
        })}
      </Reveal>
    </section>
  );
}
