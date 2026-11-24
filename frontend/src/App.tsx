import { useEffect, useLayoutEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import { CATINFO, full } from './lib/data'
import { initReveal, startLoop } from './lib/motion'
import { CartDrawer, Footer, Gate, Modal, Nav, SearchOverlay, Toast } from './components/Layout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductPage from './pages/Product'
import { About, Cart, Contact, Policy, Recipes, Wishlist } from './pages/Content'
import { Account, Checkout } from './pages/Checkout'

function Pages() {
  return (
    <Routes>
      <Route path="/shop/:cat?" element={<Shop />} />
      <Route path="/product/:h" element={<ProductPage />} />
      <Route path="/recipes" element={<Recipes />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/account" element={<Account />} />
      <Route path="/policy/:k?" element={<Policy />} />
      <Route path="*" element={<Shop />} />
    </Routes>
  )
}
const STATIC = new Set(['about', 'contact', 'account', 'policy'])

export default function App() {
  const loc = useLocation()
  const { loaded, byH, closeCart, setModal, setSearchOpen } = useStore()
  const [a, b] = loc.pathname.replace(/^\/+/, '').split('/')

  useEffect(() => { initReveal(); startLoop() }, [])
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') { setSearchOpen(false); closeCart(); setModal(null) } }
    document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f)
  }, [closeCart, setModal, setSearchOpen])

  useLayoutEffect(() => {
    setSearchOpen(false)
    document.body.classList.toggle('in-co', a === 'checkout')
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [loc.pathname]) // eslint-disable-line

  useEffect(() => {
    document.title = !a ? 'Drinks Up! — Happy Hour at Home'
      : (a === 'product' && byH[b] ? full(byH[b]) : a === 'shop' ? (CATINFO[b || ''] || CATINFO['']).t : a[0].toUpperCase() + a.slice(1)) + ' — Drinks Up!'
  }, [a, b, byH])

  return (
    <>
      <Gate />
      <Nav />
      {!a ? <Home key="home" /> : <main id="page" key={loc.pathname}>{loaded || STATIC.has(a) ? <Pages /> : null}</main>}
      <Footer />
      <div className="progress" id="progress" />
      <CartDrawer />
      <SearchOverlay />
      <Modal />
      <Toast />
    </>
  )
}
