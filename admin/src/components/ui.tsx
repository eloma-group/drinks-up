import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { AProduct } from '../lib/types'
import { thumbUrl } from '../lib/format'

export const B = ({ t, c }: { t: ReactNode; c?: string }) => <span className={'bdg ' + (c || '')}>{t}</span>
const FSC: Record<string, string> = { Unfulfilled: 'w', Packing: 'i', 'Ready to ship': 'i', Shipped: '', Delivered: 'g', Returned: 'r' }
const PSC: Record<string, string> = { Paid: 'g', Refunded: 'r', 'Partially refunded': 'w', 'Due in 14 days': 'w', 'Pending payment': 'w' }
export const FsB = ({ s }: { s: string }) => <B t={s} c={FSC[s]} />
export const PsB = ({ s }: { s: string }) => <B t={s} c={PSC[s]} />

export function Thumb({ p, c = '' }: { p?: AProduct | null; c?: string }) {
  const u = p ? thumbUrl(p.img) : ''
  return <span className={'pimg ' + c}>{u ? <img src={u} alt="" /> : null}</span>
}

export const Stars = ({ r }: { r: number }) => (
  <span className="stars" aria-label={`${r} out of 5`}>{'★'.repeat(r)}<span style={{ color: '#ddd' }}>{'★'.repeat(5 - r)}</span></span>
)

/* ---------- toast + drawer ---------- */
export type DrawerSpec = { kind: 'order' | 'customer' | 'po' | 'discount'; id?: string } | null
type UI = { toast: (m: string) => void; open: (d: DrawerSpec) => void; close: () => void; drawer: DrawerSpec }
const UICtx = createContext<UI | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [on, setOn] = useState(false)
  const [drawer, setDrawer] = useState<DrawerSpec>(null)
  const t = useRef<number | undefined>(undefined)
  const toast = useCallback((m: string) => {
    setMsg(m); setOn(true); window.clearTimeout(t.current); t.current = window.setTimeout(() => setOn(false), 2600)
  }, [])
  const open = useCallback((d: DrawerSpec) => setDrawer(d), [])
  const close = useCallback(() => setDrawer(null), [])
  return (
    <UICtx.Provider value={{ toast, open, close, drawer }}>
      {children}
      <div className={'toast' + (on ? ' on' : '')} role="status">{msg}</div>
    </UICtx.Provider>
  )
}
export function useUI() {
  const c = useContext(UICtx)
  if (!c) throw new Error('useUI outside provider')
  return c
}

/** Drawer shell — keeps the last content mounted during the close transition. */
export function DrawerShell({ children, on, onClose }: { children: ReactNode; on: boolean; onClose: () => void }) {
  const [shown, setShown] = useState<ReactNode>(children)
  useEffect(() => { if (on) setShown(children) }, [on, children])
  return (
    <>
      <div className={'ov' + (on ? ' on' : '')} onClick={onClose} />
      <aside className={'drawer' + (on ? ' on' : '')} aria-label="Detail panel">{on ? children : shown}</aside>
    </>
  )
}

export function Sw({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  const [s, set] = useState(on)
  const v = onChange ? on : s
  return <span className={'sw' + (v ? ' on' : '')} role="switch" aria-checked={v} onClick={() => onChange ? onChange(!on) : set(!s)} />
}
