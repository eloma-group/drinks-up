import { Link, useParams } from 'react-router-dom';
import { policies } from '../../data';
import { POLICY_LINKS } from '../../data/site';
import { useSeo } from '../../utils/seo';
import { SplitHeading } from '../../animations/Reveal';
import { Breadcrumbs } from '../../components/Breadcrumbs/Breadcrumbs';
import NotFound from '../NotFound/NotFound';
import './Policy.css';

export default function Policy() {
  const { slug = '' } = useParams();
  const policy = policies[slug];
  useSeo({ title: policy?.title ?? 'Policy', description: `DrinksUp ${policy?.title.toLowerCase() ?? 'policy'}.`, path: `/policies/${slug}` });
  if (!policy) return <NotFound />;

  return (
    <div className="policy wrap">
      <header className="policy__head">
        <Breadcrumbs items={[{ label: policy.title }]} />
        <SplitHeading as="h1" className="h1" text={policy.title} immediate key={slug} />
      </header>
      <div className="policy__body">
        <nav className="policy__nav" aria-label="Policies">
          <ul role="list">
            {POLICY_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} aria-current={l.to.endsWith(slug) ? 'page' : undefined}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="prose policy__prose" dangerouslySetInnerHTML={{ __html: policy.bodyHtml }} />
      </div>
    </div>
  );
}
