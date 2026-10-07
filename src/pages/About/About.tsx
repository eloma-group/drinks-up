import { ABOUT, IMG, SITE } from '../../data/site';
import { brands, products } from '../../data';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { ClipReveal, Parallax, Reveal, SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Button } from '../../components/Button/Button';
import { Photo } from '../../components/Photo';
import { Marquee } from '../../components/Marquee/Marquee';
import './About.css';

export default function About() {
  useSeo({
    title: 'About Us',
    description: ABOUT.story,
    image: sized(IMG.cheers, 1200),
    path: '/pages/about-us-1',
  });

  return (
    <div className="about">
      <header className="about__hero wrap">
        <Breadcrumbs items={[{ label: 'About us' }]} />
        <p className="label">About DrinksUp</p>
        <SplitHeading as="h1" className="display" text="Good times and better booze" accent={['better', 'booze']} immediate />
      </header>

      <ClipReveal className="about__banner">
        <Parallax amount={14} className="about__banner-img">
          <Photo src={IMG.cheers} alt="Friends raising cocktails over the ocean" sizes="100vw" width={2048} height={1366} eager />
        </Parallax>
      </ClipReveal>

      <section className="about__story wrap section" aria-labelledby="about-story">
        <p className="label">Our story</p>
        <h2 id="about-story" className="about__statement">
          {ABOUT.story}
        </h2>
      </section>

      <section className="about__values wrap" aria-label="What we stand for">
        {ABOUT.values.map((v, i) => (
          <Reveal key={v.title} className={`about__value ${i % 2 ? 'is-flip' : ''}`}>
            <ClipReveal className="about__value-img">
              <Photo src={i === 0 ? IMG.blueBeach : IMG.elderflowerBar} alt="" sizes="(min-width: 900px) 50vw, 100vw" />
            </ClipReveal>
            <div className="about__value-copy">
              <span className="about__num serif">0{i + 1}</span>
              <h3 className="h2">{v.title}</h3>
              <p className="lead muted">{v.body}</p>
              <Button to={i === 0 ? '/collections/cocktail-packs' : '/blogs/recipes'} arrow>
                {i === 0 ? 'Shop cocktail packs' : 'Explore recipes'}
              </Button>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="about__social on-dark" aria-labelledby="about-social">
        <Marquee speed={50} items={brands.map((b) => <span key={b.handle} className="about__tick">{b.name} ✳</span>)} />
        <div className="wrap about__social-inner">
          <h2 id="about-social" className="h2">
            {ABOUT.social.split('share')[0]}
            <span className="accent">share{ABOUT.social.split('share')[1]}</span>
          </h2>
          <ul role="list" className="about__links">
            {SITE.socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--md">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="muted">
            {products.length} products · {brands.length} brands · Licensed under {SITE.licence.licensee} (ABN {SITE.licence.abn})
          </p>
        </div>
      </section>
    </div>
  );
}
