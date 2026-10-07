import { Link } from 'react-router-dom';

export function Logo({ light, className = '' }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={`logo ${light ? 'logo--light' : ''} ${className}`} aria-label="DrinksUp — home">
      <img src="/brand/wordmark.png" alt="" width={1038} height={232} />
    </Link>
  );
}
