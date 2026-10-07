import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSmoothScroll } from './SmoothScroll';

export interface Toast {
  id: number;
  title: string;
  body?: string;
  image?: string;
  action?: { label: string; onClick: () => void };
}

type Panel = 'cart' | 'search' | 'menu' | null;

interface UIValue {
  panel: Panel;
  open: (p: Exclude<Panel, null>) => void;
  close: () => void;
  quickView: string | null;
  setQuickView: (handle: string | null) => void;
  toasts: Toast[];
  notify: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
  /** Bumped on every add-to-cart so the header badge can animate */
  cartPulse: number;
  pulseCart: () => void;
}

const UIContext = createContext<UIValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [quickView, setQuickView] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartPulse, setCartPulse] = useState(0);
  const nextId = useRef(1);
  const { lock } = useSmoothScroll();
  const location = useLocation();

  const open = useCallback((p: Exclude<Panel, null>) => setPanel(p), []);
  const close = useCallback(() => setPanel(null), []);

  // Any overlay locks page scroll
  const locked = panel !== null || quickView !== null;
  useEffect(() => lock(locked), [locked, lock]);

  // Navigating closes overlays
  useEffect(() => {
    setPanel(null);
    setQuickView(null);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel(null);
        setQuickView(null);
      }
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !/input|textarea|select/i.test((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        setPanel('search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const notify = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { ...t, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );
  const pulseCart = useCallback(() => setCartPulse((n) => n + 1), []);

  const value = useMemo(
    () => ({ panel, open, close, quickView, setQuickView, toasts, notify, dismiss, cartPulse, pulseCart }),
    [panel, open, close, quickView, toasts, notify, dismiss, cartPulse, pulseCart],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
