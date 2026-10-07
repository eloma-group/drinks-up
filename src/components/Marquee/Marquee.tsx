import type { CSSProperties, ReactNode } from 'react';
import './Marquee.css';

interface Props {
  items: ReactNode[];
  /** Seconds per loop */
  speed?: number;
  reverse?: boolean;
  className?: string;
}

/** CSS-only infinite ticker (pauses on hover, stops for reduced motion). */
export function Marquee({ items, speed = 40, reverse, className = '' }: Props) {
  const row = (hidden: boolean) => (
    <ul className="marquee__row" role="list" aria-hidden={hidden || undefined}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''} ${className}`} style={{ '--marquee-speed': `${speed}s` } as CSSProperties}>
      <div className="marquee__track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
