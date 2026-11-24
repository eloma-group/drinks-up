import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { useActions } from '../lib/actions'
import { usePersist } from '../lib/persist'
import { CATS, csv, full, money, SKU, STORE_URL, thumbUrl } from '../lib/format'
import type { AProduct, Cat } from '../lib/types'
import { Icon, SearchIcon } from '../components/icons'
import { B, Sw, Thumb, useUI } from '../components/ui'
import { useAdjust } from './Inventory'

type PFT = { cat: string; q: string; st: string }

export default function Products() {
  const { m } = useStore()
  const ui = useUI()
  const nav = useNavigate()
  const [PF, setPF] = usePersist<PFT>('PF', { cat: '', q: '', st: '' })
  const { P, INV } = m
  let l = P.filter(p => !PF.cat || p.c === PF.cat)
  if (PF.st) l = l.filter(p => m.stockState(p.h)[0] === PF.st)
  if (PF.q) { const q = PF.q.toLowerCase(); l = l.filter(p => (p.t + ' ' + p.b + ' ' + SKU(p)).toLowerCase().includes(q)) }
  const exportProducts = () => {
    csv('drinksup-products.csv', [['Handle', 'Title', 'Brand', 'Category', 'SKU', 'Variant ID', 'Price', 'Compare-at', 'On hand'], ...P.map(p => [p.h, p.t, p.b, CATS[p.c], SKU(p), p.v, p.p, p.cp || '', INV[p.h].st ?? ''])])
    ui.toast('Exported drinksup-products.csv')
  }
  return <>
    <div className="ph"><div><div className="eb">Catalogue</div><h1>Products</h1><p>{P.length} products · {P.filter(p => p.ok).length} active on drinksup.com.au</p></div><div className="acts"><button className="btn" onClick={() => ui.toast('Import CSV — choose a file')}>Import</button><button className="btn" onClick={exportProducts}><Icon n="dl" />Export</button><Link className="btn pri" to="/products/new"><Icon n="plus" />Add product</Link></div></div>
    <div className="card"><div className="tabs">{([['', 'All'], ...Object.entries(CATS)] as [string, string][]).map(([k, v]) => <button key={k} className={PF.cat === k ? 'on' : ''} onClick={() => setPF(p => ({ ...p, cat: k }))}>{v}<sup>{k ? P.filter(p => p.c === k).length : P.length}</sup></button>)}</div>
      <div className="fl"><label className="gs"><SearchIcon /><input placeholder="Search by name, brand or SKU" value={PF.q} onChange={e => setPF(p => ({ ...p, q: e.target.value }))} /></label>
        <select className="sel" value={PF.st} onChange={e => setPF(p => ({ ...p, st: e.target.value }))}><option value="">Any stock</option>{['In stock', 'Low stock', 'Out of stock', 'Stock not set'].map(s => <option key={s}>{s}</option>)}</select><span className="note" style={{ marginLeft: 'auto' }}>{l.length} products</span></div>
      <div className="tw"><table><thead><tr><th>Product</th><th>Status</th><th>Category</th><th>SKU</th><th className="num">Price</th><th className="num">Compare-at</th><th>Inventory</th><th className="num">Sold · 30d</th></tr></thead><tbody>
        {l.map(p => { const s = m.stockState(p.h), v = INV[p.h]; return <tr key={p.h} className="cl" onClick={() => nav('/products/' + encodeURIComponent(p.h))}><td><div className="pn"><Thumb p={p} /><div><b>{p.t}</b><span className="sub">{p.b}{p.size ? ' · ' + p.size : ''}</span></div></div></td><td>{p.ok ? <B t="Active" c="g" /> : <B t="Draft · sold out" />}</td><td>{CATS[p.c]}</td><td>{SKU(p)}</td><td className="num"><b>{money(p.p)}</b></td><td className="num">{p.cp ? money(p.cp) : '—'}</td><td><B t={v.st == null ? 'Not set' : v.st + ' ' + (s[1] === 'g' ? 'in stock' : s[1] === 'w' ? '· low' : '· out')} c={s[1]} /></td><td className="num">{v.s30}</td></tr> })}
      </tbody></table></div></div>
  </>
}

const NEWP: AProduct = { h: 'new', t: '', b: '', c: 'spirits', p: 0, cp: 0, ok: 1, size: '700ml', abv: '', v: '00000', best: 0, img: '', origin: '', d: '' }

export function ProductEdit() {
  const { h = '' } = useParams()
  const { m } = useStore()
  const isNew = h === 'new'
  const p = isNew ? NEWP : m.byH[h]
  if (!p) return <p className="empty">Product not found.</p>
  return <ProductForm key={h} p={p} isNew={isNew} />
}

function ProductForm({ p, isNew }: { p: AProduct; isNew: boolean }) {
  const { m } = useStore()
  const ui = useUI()
  const act = useActions()
  const nav = useNavigate()
  const adjust = useAdjust()
  const fileRef = useRef<HTMLInputElement>(null)
  const v = m.INV[p.h] || { st: 0, rop: 10, cost: 0, loc: '', inc: 0, s30: 0 }
  const [f, setF] = useState({
    t: p.t, b: p.b, c: p.c as Cat, d: p.d || '', p: p.p ? p.p.toFixed(2) : '', cp: p.cp ? p.cp.toFixed(2) : '',
    cost: v.cost ? v.cost.toFixed(2) : '', size: p.size, abv: p.abv, origin: p.origin || '', ean: '', active: !!p.ok, img: '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }))
  const price = parseFloat(f.p) || 0, cost = parseFloat(f.cost) || 0
  const mg = price ? ((price / 1.1 - cost) / (price / 1.1) * 100) : 0
  const preview: AProduct = { ...p, t: f.t, b: f.b, c: f.c }

  const save = async () => {
    if (!f.t.trim()) { ui.toast('Add a title first'); return }
    setBusy(true)
    try {
      const body: Record<string, unknown> = { t: f.t.trim(), b: f.b.trim(), c: f.c, d: f.d, p: price, cp: parseFloat(f.cp) || 0, cost, size: f.size, abv: f.abv, origin: f.origin, active: f.active }
      if (f.img) body.img = f.img
      const r = await act.saveProduct(isNew ? null : p.h, body)
      ui.toast(isNew ? 'Product created' : 'Changes saved')
      if (isNew && r?.h) nav('/products/' + encodeURIComponent(r.h), { replace: true })
    } catch (e) { ui.toast(e instanceof Error ? e.message : 'Save failed') } finally { setBusy(false) }
  }
  const upload = async (file?: File) => {
    if (!file) return
    try { const r = await act.upload(file); setF(s => ({ ...s, img: r.url })); ui.toast('Image uploaded — save to attach it') }
    catch (e) { ui.toast(e instanceof Error ? e.message : 'Upload failed') }
  }
  const tags = [CATS[p.c], p.cp ? 'Sale' : '', p.best ? 'Best sellers' : ''].filter(Boolean)
  return <>
    <div className="crumb"><Link to="/products">Products</Link> / {isNew ? 'New' : p.t}</div>
    <div className="ph"><div className="row">{isNew ? null : <Thumb p={p} c="lg" />}<div><h1>{isNew ? 'Add product' : full(p)}</h1><p>{isNew ? 'Create a new listing' : `${CATS[p.c]} · SKU ${SKU(p)} · Shopify variant ${p.v}`}</p></div></div>
      <div className="acts">{isNew ? null : <><a className="btn" href={`${STORE_URL}/product/${p.h}`} target="_blank" rel="noopener">Preview ↗</a><button className="btn" onClick={() => ui.toast('Duplicated as draft')}>Duplicate</button></>}<button className="btn pri" disabled={busy} onClick={save}><Icon n="check" />{busy ? 'Saving…' : 'Save'}</button></div></div>
    <div className="grid g21"><div className="grid" style={{ alignContent: 'start' }}>
      <div className="card"><div className="bd grid" style={{ gap: 14 }}><div className="fg"><label>Title</label><input className="in" value={f.t} onChange={set('t')} placeholder="e.g. Cuban Spiced Rum" /></div>
        <div className="fr"><div className="fg"><label>Brand</label><input className="in" value={f.b} onChange={set('b')} /></div><div className="fg"><label>Category</label><select className="in" value={f.c} onChange={set('c')}>{Object.entries(CATS).map(([k, c]) => <option key={k} value={k}>{c}</option>)}</select></div></div>
        <div className="fg"><label>Description</label><textarea className="in" value={f.d} onChange={set('d')} placeholder={isNew ? '' : `${full(p)} — tasting notes, serve suggestion and story appear on the product page.`} /></div></div></div>
      <div className="card"><div className="hd"><h3>Media</h3><div className="r note">Drag to reorder · first image is the cover</div></div><div className="bd row" style={{ flexWrap: 'wrap' }}>
        {isNew ? null : <Thumb p={p} c="lg" />}{f.img ? <span className="pimg lg"><img src={thumbUrl(f.img)} alt="" /></span> : null}
        <button className="pimg lg" style={{ border: '1.5px dashed #ccc', background: '#fff' }} aria-label="Upload image" onClick={() => fileRef.current?.click()}><Icon n="plus" /></button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e => { upload(e.target.files?.[0]); e.target.value = '' }} /></div></div>
      <div className="card"><div className="hd"><h3>Pricing</h3></div><div className="bd grid" style={{ gap: 14 }}><div className="fr"><div className="fg"><label>Price (inc. GST)</label><input className="in" inputMode="decimal" value={f.p} onChange={set('p')} /></div><div className="fg"><label>Compare-at price</label><input className="in" inputMode="decimal" value={f.cp} onChange={set('cp')} placeholder="Shows as a sale" /></div></div>
        <div className="fr"><div className="fg"><label>Cost per item (ex. GST)</label><input className="in" inputMode="decimal" value={f.cost} onChange={set('cost')} /></div><div className="fg"><label>Trade price (tier 2)</label><input className="in" value={price ? (price * .82).toFixed(2) : ''} readOnly /></div></div>
        <p className="note">{cost ? <>Margin <b style={{ color: 'var(--ink)' }}>{mg.toFixed(1)}%</b> · Profit {money(price / 1.1 - cost)} per unit · </> : <>Add the cost per item to see margin · </>}GST {money(price / 11)}</p></div></div>
      <div className="card"><div className="hd"><h3>Product details</h3></div><div className="bd fr"><div className="fg"><label>Size</label><input className="in" value={f.size} onChange={set('size')} /></div><div className="fg"><label>ABV</label><input className="in" value={f.abv} onChange={set('abv')} /></div><div className="fg"><label>Country of origin</label><input className="in" value={f.origin} onChange={set('origin')} /></div><div className="fg"><label>Barcode (EAN)</label><input className="in" value={f.ean} onChange={set('ean')} placeholder="93…" /></div></div></div>
      <div className="card"><div className="hd"><h3>Search engine listing</h3></div><div className="bd"><p style={{ color: '#1a0dab', fontSize: '1rem' }}>{full(preview) || 'Product title'} | Drinks Up</p><p style={{ color: '#006621', fontSize: '.8rem' }}>drinksup.com.au/products/{p.h}</p><p className="note">Buy {full(preview)} online — fast Australia-wide delivery, free over $150.</p></div></div>
    </div><div className="grid" style={{ alignContent: 'start' }}>
        <div className="card"><div className="hd"><h3>Status</h3></div><div className="bd grid" style={{ gap: 12 }}><select className="in" value={f.active ? 'Active' : 'Draft'} onChange={e => setF(s => ({ ...s, active: e.target.value === 'Active' }))}><option>Active</option><option>Draft</option></select>
          <div className="row"><Sw on />Online store</div><div className="row"><Sw on />Shop app</div><div className="row"><Sw on={p.c !== 'packs'} />Trade portal</div><div className="row"><Sw on />Requires 18+ age check</div></div></div>
        <div className="card"><div className="hd"><h3>Inventory</h3><div className="r">{isNew ? null : (() => { const s = m.stockState(p.h); return <B t={s[0]} c={s[1]} /> })()}</div></div><div className="bd"><dl className="kv"><dt>On hand</dt><dd><b>{v.st ?? 'Not set'}</b></dd><dt>Reorder point</dt><dd>{v.rop}</dd><dt>Incoming</dt><dd>{v.inc || '—'}</dd><dt>Bin</dt><dd>{v.loc || '—'}</dd><dt>Supplier</dt><dd>{isNew ? '—' : m.supOf(p)}</dd></dl>
          {!isNew && <button className="btn" style={{ marginTop: 12 }} onClick={() => adjust(p.h)}>Adjust stock</button>}</div></div>
        <div className="card"><div className="hd"><h3>Organisation</h3></div><div className="bd grid" style={{ gap: 10 }}><div className="fg"><label>Collections</label><div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>{tags.map(t => <span key={t} className="chip">{t} ×</span>)}</div></div><div className="fg"><label>Tags</label><input className="in" placeholder="e.g. gift, cocktail, rum" /></div></div></div>
      </div></div>
  </>
}
