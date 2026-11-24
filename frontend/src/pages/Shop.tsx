import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore, type Filters } from '../lib/store'
import { CATINFO, CATS, PRICES, SORTS, inCat, inPrice, save, src, typeOf, type Cat, type Product } from '../lib/data'
import Card from '../components/Card'
import { Cta, Split } from '../components/ui'

export function filtered(P: Product[], F: Filters) {
  let l = P.filter(p => inCat(p, F.cat))
  if (F.brand) l = l.filter(p => p.b === F.brand)
  l = l.filter(p => inPrice(p, F.price))
  if (F.stock) l = l.filter(p => p.ok)
  if (F.rate) l = l.filter(p => p.rating.avg >= +F.rate)
  if (F.q) { const q = F.q.toLowerCase(); l = l.filter(p => (p.t + ' ' + p.b + ' ' + (CATS[p.c] || '') + ' ' + typeOf(p)).toLowerCase().includes(q)) }
  const s = F.sort
  if (s === 'lo') l.sort((a, b) => a.p - b.p); else if (s === 'hi') l.sort((a, b) => b.p - a.p); else if (s === 'az') l.sort((a, b) => a.t.localeCompare(b.t))
  else if (s === 'top') l.sort((a, b) => b.rating.avg - a.rating.avg || b.rating.n - a.rating.n)
  else if (s === 'rev') l.sort((a, b) => b.rating.n - a.rating.n)
  else if (s === 'sale') l.sort((a, b) => save(b) - save(a))
  else l.sort((a, b) => (b.ok - a.ok) || ((b.best || 0) - (a.best || 0)))
  return l
}

export default function Shop() {
  const { cat: rawCat } = useParams()
  const { products: P, F, setF, fKey, bumpF } = useStore()
  const cat = rawCat && CATINFO[rawCat] ? rawCat : ''
  const curCat = F.cat === cat ? F.cat : cat
  useEffect(() => { if (F.cat !== cat) setF(f => ({ ...f, cat, brand: '', q: '' })) }, [cat])
  const Fx: Filters = F.cat === cat ? F : { ...F, cat, brand: '', q: '' }
  const info = CATINFO[curCat] || CATINFO['']
  const brands = [...new Set(P.filter(p => p.c !== 'packs').map(p => p.b))]
  const set = (k: keyof Filters, v: string | boolean) => { setF(f => ({ ...f, [k]: v })); if (k !== 'q') bumpF() }
  const pill = (k: string, l: string) => {
    const n = P.filter(p => inCat(p, k)).length
    return <Link key={k} className={`pill ${curCat === k ? 'on' : ''}`} to={`/shop${k ? '/' + k : ''}`}>{l}<sup>{n}</sup></Link>
  }
  const l = filtered(P, Fx)
  const any = Fx.brand || Fx.price || Fx.stock || Fx.q || Fx.rate
  const clear = () => { setF(f => ({ ...f, brand: '', price: '', stock: false, q: '' })); bumpF() }
  return (
    <>
      <section className="phead"><div className="wrap">
        <div className="crumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link>{curCat ? <><span>/</span>{info.t}</> : null}</div>
        <div className="phead-g"><div><Split key={info.t} as="h1" text={info.t} /><p className="rv">{info.d}</p></div><div className="phead-img clip"><img src={src(info.img)} alt="" /></div></div>
      </div></section>
      <div className="fbar" id="fbar"><div className="wrap">
        <div className="pills">{pill('', 'All')}{(Object.keys(CATS) as Cat[]).map(k => pill(k, CATS[k]))}{pill('non-alcoholic', 'Non-Alcoholic')}{pill('sale', 'Sale')}</div>
        <div className="fctl">
          <label className="search"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="9" r="6" /><path d="m14 14 4 4" /></svg><input id="q" placeholder="Search" value={Fx.q} onChange={e => { set('q', e.target.value); bumpF() }} /></label>
          <select onChange={e => set('brand', e.target.value)} aria-label="Brand" value={Fx.brand}><option value="">All brands</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}</select>
          <select onChange={e => set('price', e.target.value)} aria-label="Price" value={Fx.price}>{Object.entries(PRICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select onChange={e => set('rate', e.target.value)} aria-label="Rating" value={Fx.rate}><option value="">Any rating</option><option value="4.5">★ 4.5 &amp; up</option><option value="4">★ 4 &amp; up</option></select>
          <select onChange={e => set('sort', e.target.value)} aria-label="Sort" value={Fx.sort}>{Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <label className="tog"><input type="checkbox" checked={Fx.stock} onChange={e => set('stock', e.target.checked)} /><span></span>In stock</label>
        </div>
      </div></div>
      <section className="shopg"><div className="wrap" id="results">
        <div className="rcount">{l.length} product{l.length === 1 ? '' : 's'}{Fx.brand ? ` · ${Fx.brand}` : ''}{Fx.price ? ` · ${PRICES[Fx.price]}` : ''}{Fx.rate ? ` · ★ ${Fx.rate}+` : ''}{any ? <> <button className="clear" onClick={clear}>Clear filters ×</button></> : null}</div>
        {l.length ? <div className="sgrid" key={fKey + '|' + curCat}>{l.map((p, i) => <Card key={p.h} p={p} i={i} />)}</div>
          : <div className="none"><h3>No matches</h3><p>Try another filter or search.</p><Cta to="/shop">See all products</Cta></div>}
      </div></section>
    </>
  )
}
