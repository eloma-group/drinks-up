import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="crumbs">
      <ol role="list">
        <li>
          <Link to="/">Home</Link>
        </li>
        {items.map((c, i) => (
          <li key={i}>{c.to && i < items.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}
