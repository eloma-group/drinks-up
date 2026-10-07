import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import './States.css';

export function EmptyState({ title, body, children }: { title: ReactNode; body?: ReactNode; children?: ReactNode }) {
  return (
    <div className="state">
      <p className="state__glyph" aria-hidden="true">
        ¯\_(ツ)_/¯
      </p>
      <h2 className="h3">{title}</h2>
      {body && <p className="muted">{body}</p>}
      {children && <div className="state__actions">{children}</div>}
    </div>
  );
}

/** Route-level Suspense fallback — a quiet skeleton, never a blank screen */
export function PageLoader() {
  return (
    <div className="loader wrap" role="status" aria-live="polite">
      <span className="loader__bar" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton">
          <span className="skeleton__media" />
          <span className="skeleton__line" />
          <span className="skeleton__line skeleton__line--short" />
        </div>
      ))}
    </div>
  );
}

interface EBState {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('DrinksUp UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const chunk = /dynamically imported module|Loading chunk|Failed to fetch/i.test(this.state.error.message);
    return (
      <div className="wrap section">
        <EmptyState
          title={chunk ? 'A newer version of the store is available' : 'Something spilled'}
          body={chunk ? 'Reload the page to get the latest shelf.' : 'We couldn’t load this part of the store. Try again, or head back to the shelf.'}
        >
          <Button onClick={() => window.location.reload()} variant="coral">
            Reload
          </Button>
          <Button href="/" variant="outline">
            Go home
          </Button>
        </EmptyState>
      </div>
    );
  }
}
