import { Link } from 'react-router-dom';

/** DrinksUp's original square logo (clapping hands + “drinksup”). */
export function Logo({ light, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''} ${className}`} aria-label="DrinksUp — home">
      <img src="/brand/logo-square.png" alt="" width={600} height={469} />
    </Link>
  );
}
