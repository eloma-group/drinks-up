import { money } from '../../utils/format';
import './Price.css';

interface Props {
  price: number;
  compareAt?: number | null;
  /** “From $25.00” for multi-price products */
  from?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Price({ price, compareAt, from, size = 'md', className = '' }: Props) {
  const onSale = compareAt != null && compareAt > price;
  return (
    <span className={`price price--${size} ${onSale ? 'price--sale' : ''} ${className}`}>
      {from && <span className="price__from">From </span>}
      <span className="price__now">
        {onSale && <span className="sr-only">Sale price </span>}
        {money(price)}
      </span>
      {onSale && (
        <>
          <s className="price__was">
            <span className="sr-only">Regular price </span>
            {money(compareAt)}
          </s>
          <span className="price__save">Save {money(compareAt - price)}</span>
        </>
      )}
    </span>
  );
}
