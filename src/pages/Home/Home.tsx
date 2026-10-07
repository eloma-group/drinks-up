import { useSeo } from '../../utils/seo';
import { SITE, IMG } from '../../data/site';
import { sized } from '../../utils/image';
import { Hero } from './sections/Hero';
import { StockistTicker, Pillars } from './sections/Pillars';
import { CategoryIndex } from './sections/CategoryIndex';
import { DealsRail } from './sections/DealsRail';
import { SpiritOfMonth } from './sections/SpiritOfMonth';
import { Bestsellers } from './sections/Bestsellers';
import { BrandTiles } from './sections/Brands';
import { Story } from './sections/Story';
import { Benefits, RecipesTeaser } from './sections/RecipesTeaser';

const ORG_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'OnlineStore',
  name: 'DrinksUp',
  url: SITE.url,
  logo: `${SITE.url}/brand/mark-coral.png`,
  telephone: SITE.phone,
  areaServed: 'AU',
  currenciesAccepted: 'AUD',
  sameAs: SITE.socials.map((s) => s.href),
  parentOrganization: { '@type': 'Organization', name: SITE.licence.licensee },
};

export default function Home() {
  useSeo({
    title: 'DrinksUp | Premium Spirits, Liqueurs & Cocktail Packs Delivered Australia-wide',
    description:
      'Tired of boring drinks? Shop a curated shelf of spirits, Giffard liqueurs & syrups and bartender-picked cocktail packs. Australian owned, free shipping over $150.',
    image: sized(IMG.beachTiki, 1200),
    path: '/',
    jsonLd: ORG_JSONLD,
  });

  return (
    <>
      <Hero />
      <StockistTicker />
      <Pillars />
      <CategoryIndex />
      <DealsRail />
      <SpiritOfMonth />
      <Bestsellers />
      <Story />
      <BrandTiles />
      <RecipesTeaser />
      <Benefits />
    </>
  );
}
