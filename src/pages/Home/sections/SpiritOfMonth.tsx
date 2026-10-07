import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { getProduct } from '../../../data';
import { SPIRIT_OF_THE_MONTH as SOM } from '../../../data/site';
import { shortTitle } from '../../../utils/format';
import { ClipReveal, Parallax, Reveal, SplitHeading } from '../../../animations/Reveal';
import { BuyBox } from '../../../components/BuyBox/BuyBox';
import './SpiritOfMonth.css';

export function SpiritOfMonth() {
  const product = getProduct(SOM.handle);
  if (!product) return null;

  return (
    <section className="som on-dark" aria-labelledby="som-title">
      <div className="som__grid wrap">
        <div className="som__visual">
          <ClipReveal className="som__photo">
            <Parallax amount={14} className="som__parallax">
              <img
                src="/brand/burnt-ends-feature-1254.webp"
                srcSet="/brand/burnt-ends-feature-800.webp 800w, /brand/burnt-ends-feature-1254.webp 1254w"
                sizes="(min-width: 1000px) 45vw, 100vw"
                alt="Burnt Ends Blended Whiskey bottle beside a glass of whiskey on ice, with oak barrel and barley"
                width={1254}
                height={1254}
                loading="lazy"
                decoding="async"
              />
            </Parallax>
          </ClipReveal>
          <p className="som__stamp" aria-hidden="true">
            Spirit
            <br />
            of the
            <br />
            month
          </p>
        </div>

        <div className="som__copy">
          <p className="label som__kicker">Featured · Spirit of the month</p>
          <SplitHeading id="som-title" as="h2" className="h2" text={shortTitle(product.title)} />
          <p className="som__tag serif">🔥 {SOM.kicker}</p>
          <Reveal as="ul" className="som__reasons" stagger={0.06}>
            {SOM.reasons.map((r) => (
              <li key={r}>
                <Check size={18} aria-hidden="true" /> {r}
              </li>
            ))}
          </Reveal>

          <Reveal className="som__card">
            <div className="som__recipe">
              <p className="label">🍋 The recipe</p>
              <h3 className="h3">{SOM.recipe.name}</h3>
              <div className="som__recipe-cols">
                <ul role="list">
                  {SOM.recipe.ingredients.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <ol>
                  {SOM.recipe.method.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ol>
              </div>
            </div>
            <BuyBox product={product} compact />
            <Link to={`/products/${product.handle}`} className="link-line som__more">
              Read the full story
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
