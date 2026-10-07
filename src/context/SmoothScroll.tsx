import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../animations/gsap';
import { prefersReducedMotion } from '../hooks/useReducedMotion';

interface SmoothScrollValue {
  lenis: () => Lenis | null;
  lock: (locked: boolean) => void;
  scrollTo: (target: number | string | HTMLElement, opts?: { immediate?: boolean; offset?: number }) => void;
}

const Ctx = createContext<SmoothScrollValue>({
  lenis: () => null,
  lock: () => {},
  scrollTo: () => {},
});

/**
 * Lenis drives the page scroll and GSAP's ticker drives Lenis, so
 * ScrollTrigger always reads the same scroll position (no jitter).
 * Disabled entirely for prefers-reduced-motion and touch-first devices
 * keep native momentum scrolling.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    ref.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      ref.current = null;
    };
  }, []);

  const lock = useCallback((locked: boolean) => {
    const root = document.documentElement;
    if (locked) {
      const gap = window.innerWidth - root.clientWidth;
      root.style.setProperty('--scrollbar-gap', `${gap}px`);
      root.classList.add('is-locked');
      ref.current?.stop();
    } else {
      root.classList.remove('is-locked');
      root.style.removeProperty('--scrollbar-gap');
      ref.current?.start();
    }
  }, []);

  const scrollTo = useCallback<SmoothScrollValue['scrollTo']>((target, opts) => {
    if (ref.current) ref.current.scrollTo(target, { immediate: opts?.immediate, offset: opts?.offset ?? 0, force: true });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts?.immediate ? 'instant' : 'smooth' });
    else {
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      el?.scrollIntoView({ behavior: opts?.immediate ? 'instant' : 'smooth' });
    }
  }, []);

  const value = useMemo(() => ({ lenis: () => ref.current, lock, scrollTo }), [lock, scrollTo]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSmoothScroll = () => useContext(Ctx);
