import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getRecipe, productsForText, recipes } from '../../data';
import { SITE } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { formatDate } from '../../utils/format';
import { ClipReveal, SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Photo } from '../../components/Photo';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import NotFound from '../NotFound/NotFound';
import { RecipeCard, recipeImage } from './RecipeCard';
import './Recipes.css';

export default function Recipe() {
  const { handle = '' } = useParams();
  const recipe = getRecipe(handle);
  const index = recipes.findIndex((r) => r.handle === handle);
  const shop = useMemo(() => (recipe ? productsForText(recipe.title + ' ' + recipe.bodyHtml, 4) : []), [recipe]);
  const jsonLd = useMemo(
    () =>
      recipe && {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: recipe.title,
        datePublished: recipe.publishedAt,
        image: recipeImage(recipe, index),
        publisher: { '@type': 'Organization', name: 'DrinksUp', url: SITE.url },
      },
    [recipe, index],
  );
  useSeo({
    title: recipe?.title ?? 'Recipe not found',
    description: recipe?.summary,
    image: recipe ? sized(recipeImage(recipe, index), 1200) : undefined,
    type: 'article',
    jsonLd: jsonLd || null,
  });
  if (!recipe) return <NotFound />;
  const more = recipes.filter((r) => r.handle !== recipe.handle).slice(0, 3);

  return (
    <article className="recipe">
      <header className="recipe__hero wrap">
        <Breadcrumbs items={[{ label: 'Recipes', to: '/blogs/recipes' }, { label: recipe.title }]} />
        <p className="label">
          <time dateTime={recipe.publishedAt}>{formatDate(recipe.publishedAt)}</time>
        </p>
        <SplitHeading as="h1" className="h1" text={recipe.title} immediate />
      </header>
      <ClipReveal className="recipe__img">
        <Photo src={recipeImage(recipe, index)} alt={recipe.title} sizes="100vw" eager />
      </ClipReveal>

      <div className="recipe__body wrap">
        <div className="prose recipe__prose" dangerouslySetInnerHTML={{ __html: recipe.bodyHtml }} />
        {shop.length > 0 && (
          <aside className="recipe__shop" aria-labelledby="recipe-shop">
            <h2 id="recipe-shop" className="label">
              Shop this recipe
            </h2>
            <div className="recipe__shop-grid">
              {shop.map((p) => (
                <ProductCard key={p.handle} product={p} sizes="(min-width: 1000px) 14vw, 45vw" />
              ))}
            </div>
          </aside>
        )}
      </div>

      {more.length > 0 && (
        <section className="section on-cream" aria-labelledby="more-recipes">
          <div className="wrap">
            <h2 id="more-recipes" className="h2 recipe__more-title">
              More <span className="accent">recipes</span>
            </h2>
            <ul role="list" className="recipes__grid">
              {more.map((r) => (
                <li key={r.handle}>
                  <RecipeCard recipe={r} index={recipes.indexOf(r)} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
