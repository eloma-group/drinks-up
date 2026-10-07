/**
 * Business information and editorial content carried over from drinksup.com.au.
 * Product data lives in catalogue.json (synced from the store) — not here.
 */

const CDN = 'https://cdn.shopify.com/s/files/1/0713/8623/5191';

export const SITE = {
  name: 'DrinksUp',
  url: (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://drinksup.com.au',
  /** Existing Shopify store — handles secure checkout, accounts and form submissions */
  store: (import.meta.env.VITE_SHOPIFY_STORE_URL as string | undefined) ?? 'https://drinksup.com.au',
  currency: 'AUD',
  freeShippingThreshold: 150,
  phone: '0400242381',
  phoneDisplay: '0400 242 381',
  licence: {
    number: '616214992620',
    class: 'Wholesaler Licence',
    licensee: '3Two1 Import Pty Ltd t/a 3Two1 Drinks',
    abn: '47 613 716 35',
  },
  warning:
    'Under the Liquor Control Act 1988, it is an offence to sell or supply liquor to a person under the age of 18 years on licensed or regulated premises; or for a person under the age of 18 years to purchase, or attempt to purchase, liquor on licensed or regulated premises.',
  socials: [
    { label: 'Instagram', href: 'https://www.instagram.com/3two1_drinks' },
    { label: 'Facebook', href: 'https://www.facebook.com/3two1drinks' },
    { label: 'YouTube', href: 'https://www.youtube.com/@3two1_drinks' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/17929620/' },
  ],
  /** Accepted at the Shopify checkout — logos are the store's own payment icons */
  payments: [
    { label: 'Visa', icon: '/payments/visa.svg' },
    { label: 'Mastercard', icon: '/payments/mastercard.svg' },
    { label: 'American Express', icon: '/payments/amex.svg' },
    { label: 'PayPal', icon: '/payments/paypal.svg' },
    { label: 'Apple Pay', icon: '/payments/apple-pay.svg' },
    { label: 'Google Pay', icon: '/payments/google-pay.svg' },
    { label: 'Shop Pay', icon: '/payments/shop-pay.svg' },
    { label: 'UnionPay', icon: '/payments/unionpay.svg' },
  ],
} as const;

export const IMG = {
  beachTiki: `${CDN}/products/custom_resized_aa9376c0-90a2-405c-a3b1-afba591b6ae4.jpg`,
  cheers: `${CDN}/products/2064163862350156304_3841dbc3-3389-4c0f-90b4-17ec5df6e1b7.jpg`,
  beachHost: `${CDN}/products/custom_resized_393754a1-47c0-4b8b-ba6d-0e14376998a5.jpg`,
  sunsetSand: `${CDN}/products/2448168496498853483_55212264-defb-4208-a07c-fb9bf179d993.jpg`,
  elderflowerBar: `${CDN}/products/3Two1-11.12.21-009.jpg`,
  pinkCocktail: `${CDN}/products/2131652553753775305_78a85fec-5fcc-4e83-8f46-6fcd5cac5459.jpg`,
  blueBeach: `${CDN}/products/custom_resized_10d09114-85c2-4505-b37d-9c96d5d01294.jpg`,
  pastelTiki: `${CDN}/products/IMG_8300_f546f314-5259-4412-aa0b-37e91909bc6c.jpg`,
  spritzTable: `${CDN}/products/custom_resized_0f7f3cfe-f563-46ab-b630-01ce323169a2.jpg`,
  gardenFizz: `${CDN}/products/IvyCityGarden-CandyFlossFizz_1.jpg`,
  sanMatiasDark: `${CDN}/products/1964209851988380683.jpg`,
  coldBrew: `${CDN}/files/IMG_7766_9e5876d4-225a-481f-86b1-2b394de3ece2.jpg`,
  pastelPineapple: `${CDN}/products/IMG_8300_3e7a4b3c-ee45-4ed1-885a-163c31734338.jpg`,
  poolside: `${CDN}/products/bitterlifestyle_a5c4be69-6aee-4230-b98b-b7019644a9b4.jpg`,
  bitterSpritz: `${CDN}/products/3Two1-11.12.21-103.jpg`,
  ladamaNight: `${CDN}/products/2516207322118102795.jpg`,
  rumbarJungle: `${CDN}/files/81_E9yqUm7L.jpg`,
  laniqueRoses: `${CDN}/products/DSC_3866.jpg`,
  whiskeyRowBalcony: `${CDN}/files/704ff9_66373c555d574106b7a1fa4ea202a4d3_mv2.jpg`,
  blackTears: `${CDN}/files/blacktears-2-craftrumclub.jpg`,
  burntEndsMood: `${CDN}/products/BurntEnds1.jpg`,
  puebloNeon: `${CDN}/products/2415673236023403516.jpg`,
  roseBar: `${CDN}/products/custom_resized_6dcd876a-5c21-43f4-92f3-ba7c814fb07c.jpg`,
  passionfruit: `${CDN}/products/2115695677389227813.jpg`,
  mintGlass: `${CDN}/products/2521433780226216817.jpg`,
} as const;

/** “You can find us at:” — venues & retailers from the store's homepage logo slider */
export const STOCKISTS = [
  { name: 'Savile Row', logo: '/stockists/savile-row.webp', w: 127, h: 70 },
  { name: 'Foxtrot Unicorn', logo: '/stockists/foxtrot-unicorn.webp', w: 110, h: 150, boost: 1.15 },
  { name: 'Crown', logo: '/stockists/crown.webp', w: 104, h: 80 },
  { name: 'Howard Smith Wharves', logo: '/stockists/howard-smith-wharves.webp', w: 106, h: 113 },
  { name: 'Arbory', logo: '/stockists/arbory.webp', w: 143, h: 49 },
  { name: 'Gimlet', logo: '/stockists/gimlet.webp', w: 150, h: 88 },
  { name: 'Naked for Satan', logo: '/stockists/naked-for-satan.webp', w: 176, h: 178 },
  { name: 'Rockpool Bar & Grill', logo: '/stockists/rockpool-bar-grill.webp', w: 150, h: 41 },
  { name: 'Maybe Sammy', logo: '/stockists/maybe-sammy.webp', w: 480, h: 197 },
  { name: 'Liquor Barons', logo: '/stockists/liquor-barons.webp', w: 132, h: 132, boost: 0.9 },
  { name: "Dan Murphy's", logo: '/stockists/dan-murphys.webp', w: 94, h: 100, boost: 0.9 },
  { name: 'Australian Venue Co.', logo: '/stockists/australian-venue-co.webp', w: 424, h: 234 },
  { name: 'Amazon', logo: '/stockists/amazon.webp', w: 480, h: 147 },
  { name: 'Funlab', logo: '/stockists/funlab.webp', w: 480, h: 232 },
] as const;

/** The four promises from the original homepage slideshow */
export const PILLARS = [
  {
    title: 'Tired of boring drinks?',
    body: 'Access a carefully curated collection of your favourite spirits and cocktail essentials.',
    to: '/collections/all',
    cta: 'Browse the shelf',
  },
  {
    title: 'Guided recipes for home',
    body: 'Discover easy-to-follow recipes to create professional quality cocktails at home.',
    to: '/blogs/recipes',
    cta: 'Get recipes',
  },
  {
    title: 'Seasonal recipes',
    body: 'Stay updated on season promotions and limited time offers for exciting new products.',
    to: '/collections/sale',
    cta: 'See the deals',
  },
  {
    title: 'Gifting options',
    body: 'Find the perfect gift for friends and family with our selection of cocktail packs and accessories.',
    to: '/collections/cocktail-packs',
    cta: 'Shop gifts',
  },
] as const;

/** From the store's About page */
export const ABOUT = {
  story:
    'Determined to deliver only the highest quality products at the most affordable price. The team at 3Two1 Drinks launched our premier online store; Drinks Up.',
  values: [
    {
      title: 'Good times and better booze',
      body: 'Take the stress out of ordering with our carefully crafted cocktail packs. Hand picked by career bartenders from some of Australia’s best bars.',
    },
    {
      title: 'Educate and inebriate',
      body: 'You’ll take home more than just some fantastic booze. Our online recipe platform takes the stress out of deciding what to mix up next.',
    },
  ],
  social: 'Hit us up on social media and share your creations!',
} as const;

export const BENEFITS = [
  { title: 'Free shipping', body: `On Australian orders over $150.` },
  { title: 'VIP', body: 'Sign up to our newsletter for exclusive deals and recipes.' },
  { title: 'Fast support', body: 'Got a quick question? Our support team is here to answer any questions.' },
] as const;

/** “Spirit of the month” feature from the original homepage */
export const SPIRIT_OF_THE_MONTH = {
  handle: 'burnt-ends',
  /** Clean bottle shot to float over the mood photo */
  packshot: 'Burntends.png',
  kicker: 'Southern smoke meets rye spice',
  reasons: [
    'Unique fusion of Tennessee whiskey & peat smoke',
    'Rye-forward spice balanced with smoky, savoury depth',
    'Crafted in small batches for purity and punch',
    'Versatile in bold cocktails or for sipping slow',
    'A smoky spin on a classic American profile',
  ],
  recipe: {
    name: 'Peated Rye Whiskey Sour',
    ingredients: [
      '60ml Burnt Ends Tennessee Peated Rye',
      '30ml fresh lemon juice',
      '15ml simple syrup',
      '(Optional) 10ml egg white for texture',
    ],
    method: [
      'Add all ingredients to a shaker (dry shake without ice if using egg white).',
      'Add ice and shake again hard for 10 seconds.',
      'Strain into a rocks glass over fresh ice.',
      'Garnish with a lemon twist or maraschino cherry.',
    ],
  },
} as const;

export const NAV = [
  { label: 'Spirit Shelf', to: '/collections/all', mega: true },
  { label: 'Recipes', to: '/blogs/recipes' },
  { label: 'Cocktail Packs', to: '/collections/cocktail-packs' },
  { label: 'Sale', to: '/collections/sale' },
  { label: 'About', to: '/pages/about-us-1' },
  { label: 'Contact', to: '/pages/contact' },
] as const;

/** The store's “Spirit Shelf” menu */
export const SHELF_MENU = [
  { label: 'Aperitif', to: '/collections/aperitif' },
  { label: 'Bourbon & Whiskey', to: '/collections/bourbon' },
  { label: 'Liqueur', to: '/collections/liqueur' },
  { label: 'Pisco', to: '/collections/pisco' },
  { label: 'Rum', to: '/collections/rum' },
  { label: 'Syrup', to: '/collections/syrups' },
  { label: 'Tequila', to: '/collections/tequila' },
  { label: 'Fruit for Mix', to: '/collections/fruit-for-mix' },
  { label: 'Cocktail Packs', to: '/collections/cocktail-packs' },
  { label: 'Gift Cards', to: '/collections/gift-cards' },
] as const;

export const POLICY_LINKS = [
  { label: 'Shipping Policy', to: '/policies/shipping-policy' },
  { label: 'Return Policy', to: '/policies/refund-policy' },
  { label: 'Privacy Policy', to: '/policies/privacy-policy' },
  { label: 'Terms of Service', to: '/policies/terms-of-service' },
] as const;
