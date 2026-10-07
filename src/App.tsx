import { lazy, Suspense, useEffect, useRef, type RefObject } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SmoothScrollProvider, useSmoothScroll } from './context/SmoothScroll';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';
import { ScrollTrigger } from './animations/gsap';
import { Header } from './components/Header/Header';
import { MobileMenu } from './components/MobileMenu/MobileMenu';
import { SearchOverlay } from './components/Search/SearchOverlay';
import { CartDrawer } from './components/CartDrawer/CartDrawer';
import { QuickView } from './components/QuickView/QuickView';
import { Toasts } from './components/Toasts/Toasts';
import { Footer } from './components/Footer/Footer';
import { ErrorBoundary, PageLoader } from './components/States/States';
import Home from './pages/Home/Home';
import { SITE_LOCKED } from './config';

const ComingSoon = lazy(() => import('./pages/ComingSoon/ComingSoon'));

const Collection = lazy(() => import('./pages/Collection/Collection'));
const Product = lazy(() => import('./pages/Product/Product'));
const Recipes = lazy(() => import('./pages/Recipes/Recipes'));
const Recipe = lazy(() => import('./pages/Recipes/Recipe'));
const Collections = lazy(() => import('./pages/Collections/Collections'));
const About = lazy(() => import('./pages/About/About'));
const Contact = lazy(() => import('./pages/Contact/Contact'));
const Policy = lazy(() => import('./pages/Policy/Policy'));
const Cart = lazy(() => import('./pages/Cart/Cart'));
const Checkout = lazy(() => import('./pages/Checkout/Checkout'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

/** Shopify-style nested product URLs → canonical product URL */
function ProductRedirect() {
  const { handle } = useParams();
  return <Navigate to={`/products/${handle}`} replace />;
}

/** Recalculate ScrollTrigger positions whenever page height changes (images, filters, accordions). */
function useAutoRefresh(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    let t = 0;
    let last = 0;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height);
      if (Math.abs(h - last) < 2) return;
      last = h;
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [ref]);
}

function AnimatedRoutes() {
  const location = useLocation();
  const { scrollTo } = useSmoothScroll();
  const mainRef = useRef<HTMLElement>(null);
  useAutoRefresh(mainRef);

  return (
    <main id="main" ref={mainRef} tabIndex={-1}>
      <AnimatePresence
        mode="wait"
        initial={false}
        onExitComplete={() => {
          scrollTo(0, { immediate: true });
          mainRef.current?.focus({ preventScroll: true });
        }}
      >
        <motion.div
          key={location.pathname}
          className="page-enter"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.22, ease: [0.65, 0, 0.35, 1] } }}
          onAnimationComplete={() => ScrollTrigger.refresh()}
        >
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              {SITE_LOCKED ? (
                /* Pre-launch: only the homepage is public. Every other route shows “Coming soon”. */
                <Routes location={location}>
                  <Route path="/" element={<Home />} />
                  <Route path="*" element={<ComingSoon />} />
                </Routes>
              ) : (
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/brands" element={<Collections />} />
                <Route path="/collections/:handle" element={<Collection />} />
                <Route path="/collections/:collection/products/:handle" element={<ProductRedirect />} />
                <Route path="/search" element={<Collection searchMode />} />
                <Route path="/products/:handle" element={<Product />} />
                <Route path="/blogs/recipes" element={<Recipes />} />
                <Route path="/blogs/recipes/:handle" element={<Recipe />} />
                <Route path="/pages/about-us-1" element={<About />} />
                <Route path="/pages/about" element={<Navigate to="/pages/about-us-1" replace />} />
                <Route path="/pages/contact" element={<Contact />} />
                <Route path="/policies/:slug" element={<Policy />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              )}
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <CartProvider>
        <UIProvider>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          <AnimatedRoutes />
          <Footer />
          <MobileMenu />
          <SearchOverlay />
          <CartDrawer />
          <QuickView />
          <Toasts />
        </UIProvider>
      </CartProvider>
    </SmoothScrollProvider>
  );
}
