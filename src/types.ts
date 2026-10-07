export interface ProductImage {
  src: string;
  width: number;
  height: number;
}

export interface ProductVariant {
  /** Shopify variant id — used for the secure checkout hand-off */
  id: string;
  /** null when the product only has a single default variant */
  title: string | null;
  price: number;
  compareAt: number | null;
  available: boolean;
  sku: string | null;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export type CategoryKey =
  | 'spirits'
  | 'liqueur'
  | 'syrups'
  | 'fruit-for-mix'
  | 'cocktail-packs'
  | 'bar-tools'
  | 'gift-cards';

export interface Product {
  id: string;
  handle: string;
  title: string;
  category: CategoryKey;
  /** Finer product type, e.g. Tequila, Rum, Syrup */
  type: string | null;
  brand: string | null;
  tags: string[];
  aperitif: boolean;
  descriptionHtml: string;
  excerpt: string;
  specs: ProductSpec[];
  images: ProductImage[];
  variants: ProductVariant[];
  /** Position in the store's best-selling list (lower = more popular) */
  rank: number;
  createdAt: string;
}

export interface Brand {
  handle: string;
  name: string;
  description: string;
  image: string | null;
  products: string[];
}

export interface Recipe {
  handle: string;
  title: string;
  publishedAt: string;
  image: string | null;
  summary: string;
  bodyHtml: string;
}

export interface Policy {
  title: string;
  bodyHtml: string;
}

export type CollectionKind = 'all' | 'category' | 'type' | 'brand' | 'edit';

export interface Collection {
  handle: string;
  title: string;
  kind: CollectionKind;
  eyebrow: string;
  description: string;
  /** Lifestyle/hero image for the collection header */
  image: string;
  products: Product[];
}

export interface CartLine {
  variantId: string;
  handle: string;
  quantity: number;
}
