import { PRICE_BANDS, type Facet } from './useCatalogFilters';
import { Accordion } from '../../components/Accordion/Accordion';

interface Props {
  facets: { category: Facet[]; type: Facet[]; brand: Facet[] };
  selected: { category: string[]; brand: string[]; type: string[]; price: string; inStock: boolean; onSale: boolean };
  toggle: (key: string, value: string) => void;
  set: (key: string, value: string | null) => void;
}

function CheckList({ name, items, selected, onToggle }: { name: string; items: Facet[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <ul role="list" className="fcheck">
      {items.map((f) => (
        <li key={f.value}>
          <label className="fcheck__item">
            <input type="checkbox" name={name} value={f.value} checked={selected.includes(f.value)} onChange={() => onToggle(f.value)} />
            <span className="fcheck__box" aria-hidden="true" />
            <span className="fcheck__label">{f.label}</span>
            <span className="fcheck__count">{f.count}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function FilterPanel({ facets, selected, toggle, set }: Props) {
  const sections = [
    facets.category.length > 1 && {
      title: 'Category',
      content: <CheckList name="category" items={facets.category} selected={selected.category} onToggle={(v) => toggle('category', v)} />,
    },
    facets.type.length > 1 && {
      title: 'Spirit type',
      content: <CheckList name="type" items={facets.type} selected={selected.type} onToggle={(v) => toggle('type', v)} />,
    },
    facets.brand.length > 1 && {
      title: 'Brand',
      content: <CheckList name="brand" items={facets.brand} selected={selected.brand} onToggle={(v) => toggle('brand', v)} />,
    },
    {
      title: 'Price',
      content: (
        <ul role="list" className="fcheck">
          {PRICE_BANDS.map((b) => (
            <li key={b.value}>
              <label className="fcheck__item">
                <input type="radio" name="price" checked={selected.price === b.value} onChange={() => set('price', b.value)} onClick={() => selected.price === b.value && set('price', null)} />
                <span className="fcheck__box fcheck__box--radio" aria-hidden="true" />
                <span className="fcheck__label">{b.label}</span>
              </label>
            </li>
          ))}
        </ul>
      ),
    },
  ].filter(Boolean) as { title: string; content: React.ReactNode }[];

  return (
    <div className="fpanel">
      <div className="fpanel__toggles">
        <label className="ftoggle">
          <input type="checkbox" role="switch" checked={selected.inStock} onChange={(e) => set('stock', e.target.checked ? '1' : null)} />
          <span className="ftoggle__track" aria-hidden="true" />
          In stock only
        </label>
        <label className="ftoggle">
          <input type="checkbox" role="switch" checked={selected.onSale} onChange={(e) => set('sale', e.target.checked ? '1' : null)} />
          <span className="ftoggle__track" aria-hidden="true" />
          On sale
        </label>
      </div>
      <Accordion items={sections} defaultOpen={0} />
    </div>
  );
}
