import { Fragment, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { gsap, useGSAP } from './gsap';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Animate direct children one after another instead of the wrapper */
  stagger?: number;
  y?: number;
  delay?: number;
  start?: string;
}

/** Fade-up on scroll. Content is visible by default; GSAP only enhances. */
export function Reveal({ children, as: Tag = 'div', className, style, stagger, y = 36, delay = 0, start = 'top 88%' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const targets = stagger ? Array.from(ref.current.children) : ref.current;
      gsap.from(targets, {
        y,
        autoAlpha: 0,
        duration: 1,
        delay,
        stagger: stagger ?? 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start, once: true },
      });
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

interface SplitProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Words to render in the italic serif accent */
  accent?: string[];
  delay?: number;
  /** Play immediately (hero) instead of on scroll */
  immediate?: boolean;
  id?: string;
}

/** Word-by-word masked reveal. Screen readers get the plain sentence. */
export function SplitHeading({ text, as: Tag = 'h2', className, accent = [], delay = 0, immediate, id }: SplitProps) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.from(ref.current.querySelectorAll('.split__inner'), {
        yPercent: 115,
        rotate: 4,
        duration: 1.1,
        delay,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: immediate ? undefined : { trigger: ref.current, start: 'top 90%', once: true },
      });
    },
    { scope: ref },
  );
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={className} id={id} aria-label={text}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="split" aria-hidden="true">
            <span className={`split__inner${accent.includes(w.replace(/[^\w’'-]/g, '')) ? ' accent' : ''}`}>{w}</span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  );
}

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Percent of own height to travel across the viewport */
  amount?: number;
  style?: CSSProperties;
}

/** Scroll-linked drift. Wrap an oversized image inside an overflow:hidden frame. */
export function Parallax({ children, className, amount = 12, style }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.fromTo(
        ref.current,
        { yPercent: -amount / 2 },
        {
          yPercent: amount / 2,
          ease: 'none',
          scrollTrigger: { trigger: ref.current.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/** Image frame that un-clips from the bottom as it enters, with a slight zoom-out. */
export function ClipReveal({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true } });
      tl.from(ref.current, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.out' }).from(
        ref.current.querySelector('img'),
        { scale: 1.25, duration: 1.6, ease: 'expo.out' },
        0,
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={{ clipPath: 'inset(0% 0% 0% 0%)', ...style }}>
      {children}
    </div>
  );
}
