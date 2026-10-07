import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { IMG } from '../../data/site';
import { formatDate } from '../../utils/format';
import { Photo } from '../../components/Photo';
import type { Recipe } from '../../types';
import './RecipeCard.css';

const FALLBACK = [IMG.sunsetSand, IMG.pinkCocktail, IMG.blueBeach, IMG.mintGlass, IMG.passionfruit];

export const recipeImage = (r: Recipe, i: number) => r.image ?? FALLBACK[i % FALLBACK.length];

export function RecipeCard({ recipe, index, large }: { recipe: Recipe; index: number; large?: boolean }) {
  return (
    <article className={`rcard ${large ? 'rcard--large' : ''}`}>
      <div className="rcard__img">
        <Photo src={recipeImage(recipe, index)} alt="" sizes={large ? '(min-width: 900px) 55vw, 100vw' : '(min-width: 760px) 33vw, 100vw'} />
      </div>
      <div className="rcard__body">
        <p className="label muted">
          <time dateTime={recipe.publishedAt}>{formatDate(recipe.publishedAt)}</time>
        </p>
        <h3 className={large ? 'h2' : 'h3'}>
          <Link to={`/blogs/recipes/${recipe.handle}`}>{recipe.title}</Link>
        </h3>
        <p className="muted rcard__summary">{recipe.summary}</p>
        <span className="rcard__more link-line" aria-hidden="true">
          Read recipe <ArrowUpRight size={16} />
        </span>
      </div>
    </article>
  );
}
