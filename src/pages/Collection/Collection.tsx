import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import { getCollection, collections, isAvailable, minPrice } from '../../data';
import { SITE } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { sized } from '../../utils/image';
import { useSmoothScroll } from '../../context/SmoothScroll';
import { SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import { Button } from '../../components/Button/Button';
import { Photo } from '../../components/Photo';
import { ProductGrid } from '../../components/ProductGrid/ProductGrid';
import { EmptyState } from '../../components/States/States';
import NotFound from '../NotFound/NotFound';
import { FilterPanel } from './FilterPanel';
import { SORTS, useCatalogFilters, type SortKey } from './useCatalogFilters';
import './Collection.css';

const PAGE = 24;

export default function Collection({ searchMode = false }: { searchMode?: boolean }) {
  const { handle = 'all' } = useParams();
  const collection = searchMode ? collections.get('all') : getCollection(handle);
  if (!collection) return <NotFound />;
  return <CollectionView key={collection.handle + String(searchMode)} handle={collection.handle} searchMode={searchMode} />;
}

function CollectionView({ handle, searchMode }: { handle: string; searchMode: boolean }) {
  const collection = collections.get(handle)!;
  const f = useCatalogFilters(collection.products);
  const [shown, setShown] = useState(PAGE);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState(f.q);
  const { lock, scrollTo } = useSmoothScroll();

  useEffect(() => setShown(PAGE), [f.results]);
  useEffect(() => {
    lock(drawer);
    return () => lock(false);
  }, [drawer, lock]);
  useEffect(() => setQuery(f.q), [f.q]);

  const title = searchMode ? (f.q ? `Results for “${f.q}”` : 'Search the shelf') : collection.title;
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: collection.title,
      url: `${SITE.url}/collections/${collection.handle}`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: collection.products.length,
        itemListElement: collection.products.slice(0, 20).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE.url}/products/${p.handle}` })),
      },
    }),
    [collection],
  );
  useSeo({
    title: searchMode ? `Search${f.q ? `: ${f.q}` : ''}` : `${collection.title} — Buy Online`,
    description: (collection.description || `Shop ${collection.title} online at DrinksUp.`).slice(0, 158),
    image: sized(collection.image, 1200),
    path: searchMode ? '/search' : `/collections/${collection.handle}`,
    jsonLd: searchMode ? null : jsonLd,
  });

  const visible = f.results.slice(0, shown);
  const inStock = collection.products.filter(isAvailable).length;
  const from = collection.products.length ? Math.min(...collection.products.map(minPrice)) : 0;

  return (
    <div className="coll">
      <header className={`coll__hero ${searchMode ? 'coll__hero--search' : ''}`}>
        <div className="coll__hero-copy wrap">
          <Breadcrumbs items={searchMode ? [{ label: 'Search' }] : [{ label: 'Shop', to: '/collections/all' }, { label: collection.title }]} />
          <p className="label coll__eyebrow">{searchMode ? `${collection.products.length} products` : collection.eyebrow}</p>
          <SplitHeading as="h1" className="h1" text={title} immediate key={title} />
          {searchMode ? (
            <form
              className="coll__search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                f.set('q', query.trim() || null);
              }}
            >
              <Search size={20} aria-hidden="true" />
              <label htmlFor="coll-search" className="sr-only">
                Search products
              </label>
              <input id="coll-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tequila, syrups, packs…" />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          ) : (
            collection.description && <p className="lead muted coll__desc">{collection.description}</p>
          )}
          {!searchMode && (
            <dl className="coll__facts">
              <div>
                <dt>Products</dt>
                <dd>{collection.products.length}</dd>
              </div>
              <div>
                <dt>In stock</dt>
                <dd>{inStock}</dd>
              </div>
              <div>
                <dt>From</dt>
                <dd>${Math.floor(from)}</dd>
              </div>
            </dl>
          )}
        </div>
        {!searchMode && (
          <div className="coll__hero-img">
            <Photo src={collection.image} alt="" sizes="(min-width: 1000px) 45vw, 100vw" eager />
          </div>
        )}
      </header>

      <div className="coll__toolbar">
        <div className="coll__toolbar-inner wrap">
          <button type="button" className="coll__filter-btn" onClick={() => setDrawer(true)} aria-haspopup="dialog">
            <SlidersHorizontal size={18} /> Filters
            {f.active.length > 0 && <span className="coll__filter-count">{f.active.length}</span>}
          </button>
          <p className="coll__count" aria-live="polite">
            <strong>{f.results.length}</strong> {f.results.length === 1 ? 'product' : 'products'}
          </p>
          <label className="coll__sort">
            <span className="sr-only">Sort by</span>
            <span aria-hidden="true" className="coll__sort-label">
              Sort
            </span>
            <select value={f.sort} onChange={(e) => f.set('sort', (e.target.value as SortKey) === 'featured' ? null : e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="coll__body wrap">
        <aside className="coll__aside" aria-label="Filters">
          <FilterPanel facets={f.facets} selected={f.selected} toggle={f.toggle} set={f.set} />
        </aside>

        <section className="coll__main" aria-label="Products">
          {f.active.length > 0 && (
            <ul role="list" className="coll__chips" aria-label="Active filters">
              {f.active.map((a) => (
                <li key={a.key + a.value}>
                  <button type="button" onClick={() => f.removeActive(a)} aria-label={`Remove filter ${a.label}`}>
                    {a.label} <X size={14} />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="coll__clear" onClick={f.clear}>
                  Clear all
                </button>
              </li>
            </ul>
          )}

          {f.results.length === 0 ? (
            <EmptyState
              title={f.q ? `Nothing on the shelf for “${f.q}”` : 'No products match those filters'}
              body="Try removing a filter or searching for something broader like “rum” or “syrup”."
            >
              {f.active.length > 0 && (
                <Button onClick={f.clear} variant="coral">
                  Clear filters
                </Button>
              )}
              <Button to="/collections/all" variant="outline">
                Browse everything
              </Button>
            </EmptyState>
          ) : (
            <>
              <ProductGrid products={visible} eager={4} label={`${collection.title} products`} />
              <div className="coll__more">
                <p className="muted">
                  Showing {visible.length} of {f.results.length}
                </p>
                <div className="coll__progress" aria-hidden="true">
                  <span style={{ transform: `scaleX(${visible.length / f.results.length})` }} />
                </div>
                {shown < f.results.length ? (
                  <Button variant="outline" onClick={() => setShown((n) => n + PAGE)} arrow>
                    Load more
                  </Button>
                ) : (
                  f.results.length > PAGE && (
                    <Button variant="outline" onClick={() => scrollTo(0)}>
                      Back to top
                    </Button>
                  )
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} aria-hidden="true" />
            <motion.div
              className="fdrawer"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              onKeyDown={(e) => e.key === 'Escape' && setDrawer(false)}
            >
              <div className="fdrawer__head">
                <h2 className="h3">Filters</h2>
                <button type="button" className="drawer__close" onClick={() => setDrawer(false)} aria-label="Close filters" autoFocus>
                  <X size={22} />
                </button>
              </div>
              <div className="fdrawer__body" data-lenis-prevent>
                <FilterPanel facets={f.facets} selected={f.selected} toggle={f.toggle} set={f.set} />
              </div>
              <div className="fdrawer__foot">
                <Button variant="outline" onClick={f.clear} disabled={!f.active.length}>
                  Clear
                </Button>
                <Button onClick={() => setDrawer(false)}>Show {f.results.length} products</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
