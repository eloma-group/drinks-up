import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { full, money, save, src, type Product } from '../lib/data'
import { EyeSvg, HeartSvg, PlusSvg, Stars } from './ui'

export default function Card({ p, i = 0 }: { p: Product; i?: number }) {
  const { wish, wl, add, setModal } = useStore()
  const tag: [string, string] | null = !p.ok ? ['Sold out', 'out'] : p.cp ? ['Save ' + save(p) + '%', 'sale'] : p.best ? ['Best Seller', ''] : p.c === 'packs' ? ['Cocktail pack', ''] : null
  const rt = p.rating || { avg: 0, n: 0 }
  const url = `/product/${p.h}`
  return (
    <div className={`pc rv ${i % 2 ? 'd1' : ''}`}>
      <div className="boxw">
        <Link className="box" to={url}>
          {tag && <span className={`tag ${tag[1]}`}>{tag[0]}</span>}
          <span className="pr">{money(p.p)} AUD{p.cp ? <s>{money(p.cp)}</s> : null}</span>
          {p.cut ? <><img className="cut" src={src(p.cut)} alt={full(p)} /><span className="shadow" /></> : <img className="full" src={src(p.img[0])} alt={full(p)} />}
        </Link>
        <div className="qa">
          <button className={`ic wl ${wish.includes(p.h) ? 'on' : ''}`} data-wl={p.h} aria-label="Save to wishlist" onClick={() => wl(p.h)}><HeartSvg /></button>
          <button className="ic" aria-label="Quick view" onClick={() => setModal({ type: 'qv', h: p.h })}><EyeSvg /></button>
        </div>
        {p.ok ? <button className="qadd" onClick={e => add(p.h, e.currentTarget)}>Quick add +</button> : null}
      </div>
      <div className="row">
        <Link to={url}><h3>{p.t}<small>{p.b}{p.size ? ' · ' + p.size : ''}</small></h3></Link>
        <button className="add" disabled={!p.ok} aria-label={`Add ${full(p)} to cart`} onClick={e => add(p.h, e.currentTarget)}><PlusSvg /></button>
      </div>
      <Link className="rt" to={url}>{rt.n ? <><Stars v={rt.avg} /><b>{rt.avg.toFixed(1)}</b><span>({rt.n})</span></> : <span>No reviews yet</span>}</Link>
    </div>
  )
}

export function RecCard({ id }: { id: string }) {
  const { recipes, setModal } = useStore()
  const r = recipes[id]; if (!r) return null
  return (
    <button className="recc rv" onClick={() => setModal({ type: 'recipe', id })}>
      <span className="im"><img src={src(r.img)} alt={r.n} /></span>
      <span className="k">{r.b} · {r.k}</span><h3>{r.n}</h3><span className="d">{r.d}</span>
    </button>
  )
}
