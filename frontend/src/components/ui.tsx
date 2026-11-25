import { Fragment, useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { FREE, money, src, type Product } from '../lib/data'
import { SOON } from '../lib/api'

/* word / char split heading — renders the same .w > .wi structure the mockup builds at runtime */
type SplitProps = { as?: ElementType; text: string; base?: number; chars?: boolean; className?: string; style?: CSSProperties; id?: string }
export function Split({ as: Tag = 'h2', text, base, chars, className, style, id }: SplitProps) {
  let i = 0
  const ref = useRef<HTMLElement>(null)
  // one continuous gradient across the whole heading: each word's background is sized to the heading
  // and shifted by the word's offset (words are separate masked boxes, so the parent's clip can't reach them)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      // a wordmark built from several Splits shares one gradient via an ancestor marked data-grad-root
      const r = (el.closest('[data-grad-root]') || el).getBoundingClientRect()
      el.querySelectorAll<HTMLElement>('.w').forEach(w => {
        const b = w.getBoundingClientRect(), wi = w.firstElementChild as HTMLElement | null
        if (!wi) return
        wi.style.setProperty('--gw', r.width + 'px'); wi.style.setProperty('--gh', r.height + 'px')
        wi.style.setProperty('--gx', (r.left - b.left) + 'px'); wi.style.setProperty('--gy', (r.top - b.top) + 'px')
      })
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(el)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [text])
  const lines = text.split('\n')
  const s = { ...(style || {}), ['--b' as string]: (base || 0) + 'ms' } as CSSProperties
  return (
    <Tag ref={ref} data-split="" data-base={base} data-chars={chars ? '' : undefined} className={className} style={s} id={id}>
      {lines.map((line, li) => {
        const parts = chars ? [...line] : line.split(/(\s+)/)
        return (
          <Fragment key={li}>
            {li > 0 && <br />}
            {parts.map((t, k) => {
              if (!t) return null
              if (/^\s+$/.test(t)) return ' '
              const n = i++
              return <span className="w" key={k}><span className="wi" style={{ ['--i' as string]: n } as CSSProperties}>{t}</span></span>
            })}
          </Fragment>
        )
      })}
    </Tag>
  )
}

export const ArrowSvg = () => <svg viewBox="0 0 12 12" fill="none" strokeWidth="2"><path d="M2 10 10 2M4 2h6v6" /></svg>
export const PlusSvg = () => <svg viewBox="0 0 12 12" fill="none" strokeWidth="2.2"><path d="M6 1v10M1 6h10" /></svg>
export const HeartSvg = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20s-7-4.4-9.2-8.6C1.2 8.2 3 4.5 6.6 4.5c2.1 0 3.7 1.2 5.4 3.2 1.7-2 3.3-3.2 5.4-3.2 3.6 0 5.4 3.7 3.8 6.9C19 15.6 12 20 12 20Z" /></svg>
export const EyeSvg = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
export const LockSvg = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
/* "DRINKS UP!" wordmark with the cocktail glass sitting on top of the I */
export const GlassTop = () => <svg className="gl" viewBox="0 0 46 40" fill="none" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" aria-hidden="true"><path d="M4 4h38L23 36z" /><circle cx="35" cy="8" r="5" /></svg>
export const LogoMark = () => <span className="lw">Dr<span className="li"><span className="ig">i</span><GlassTop /></span>nks Up!</span>

export function Cta({ to, children, cls = '', onClick }: { to: string; children: ReactNode; cls?: string; onClick?: () => void }) {
  return <Link className={`cta ${cls}`} to={to} onClick={onClick}><i><ArrowSvg /></i><span>{children}</span></Link>
}

export const Stars = ({ v, cls = '' }: { v: number; cls?: string }) => (
  <span className={`st ${cls}`} style={{ ['--v' as string]: (v / 5 * 100).toFixed(1) + '%' } as CSSProperties} aria-label={`${v.toFixed(1)} out of 5 stars`} />
)

export const Thumb = ({ p }: { p: Product }) => (p.cut ? <img src={src(p.cut)} alt="" /> : <img className="full" src={src(p.img[0])} alt="" />)

export function ShipBar() {
  const { sub } = useStore()
  const left = Math.max(0, FREE - sub)
  return (
    <div className="ship">
      {left ? <>You’re <b>{money(left)}</b> away from free shipping</> : <>You’ve unlocked <b>free shipping</b></>}
      <div className="bar"><i style={{ width: Math.min(100, sub / FREE * 100) + '%' }} /></div>
    </div>
  )
}

/** Shown wherever a feature needs the backend while the storefront runs as a design preview. */
export const Soon = ({ cls = '' }: { cls?: string }) => (
  <p className={`soon ${cls}`} role="status"><b>Coming soon</b>{SOON.replace(/^Coming soon — /, '')}</p>
)
