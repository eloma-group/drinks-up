import { useRef, useState } from 'react'
import { k$ } from '../lib/format'

type Series = { n: string; v: number[]; c: string; dash?: boolean }

export function LineChart({ labels, series, h = 240, fmt = (v: number) => k$(v) }: { labels: string[]; series: Series[]; h?: number; fmt?: (v: number) => string | number }) {
  const W = 800, pl = 46, pr = 10, pt = 10, pb = 26
  const max = Math.max(...series.flatMap(s => s.v)) * 1.1 || 4
  const nice = (() => { const st = Math.pow(10, Math.floor(Math.log10(max / 4))); const m = [1, 2, 2.5, 5, 10].find(m => m * st * 4 >= max) || 10; return m * st })()
  const top = nice * 4
  const n = labels.length
  const x = (i: number) => pl + i * (W - pl - pr) / Math.max(1, n - 1)
  const y = (v: number) => pt + (h - pt - pb) * (1 - v / top)
  const step = Math.ceil(n / 7)
  const [hover, setHover] = useState<number | null>(null)
  const [tipLeft, setTipLeft] = useState(0)
  const svgRef = useRef<SVGSVGElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const move = (e: React.PointerEvent) => {
    const svg = svgRef.current; if (!svg) return
    const r = svg.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width * W
    let i = Math.round((px - pl) / ((W - pl - pr) / Math.max(1, n - 1)))
    i = Math.max(0, Math.min(n - 1, i))
    setHover(i)
    const tw = tipRef.current?.offsetWidth || 120
    const tx = x(i) / W * r.width
    setTipLeft(Math.min(r.width - tw, Math.max(0, tx - tw / 2)))
  }

  return (
    <div className="chart">
      <div ref={tipRef} className={'tip' + (hover !== null ? ' on' : '')} style={{ left: tipLeft, top: -8 }}>
        {hover !== null && <>
          <b>{labels[hover]}</b>
          {series.map(s => <span key={s.n}><br /><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: s.c, marginRight: 6 }} />{s.n}: <b>{fmt(s.v[hover])}</b></span>)}
        </>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${h}`} role="img" aria-label={series.map(s => s.n).join(' vs ')} onPointerMove={move} onPointerLeave={() => setHover(null)}>
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}><line className="gl" x1={pl} x2={W - pr} y1={y(nice * i)} y2={y(nice * i)} /><text className="ax" x={pl - 8} y={y(nice * i) + 4} textAnchor="end">{fmt(nice * i)}</text></g>
        ))}
        {labels.map((l, i) => i % step === 0 || i === n - 1 ? <text key={i} className="ax" x={x(i)} y={h - 6} textAnchor="middle">{l}</text> : null)}
        {series[0] && <path d={`M${x(0)} ${y(0)}${series[0].v.map((v, i) => 'L' + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('')}L${x(n - 1)} ${y(0)}Z`} fill={series[0].c} opacity=".07" />}
        {series.map(s => <path key={s.n} d={s.v.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join('')} fill="none" stroke={s.c} strokeWidth="2" strokeDasharray={s.dash ? '4 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />)}
        <line className="cx" y1={pt} y2={h - pb} x1={hover !== null ? x(hover) : 0} x2={hover !== null ? x(hover) : 0} stroke="#121212" strokeOpacity=".25" style={{ opacity: hover !== null ? 1 : 0 }} />
        {series.map(s => <circle key={s.n} className="dot" r="4.5" fill={s.c} stroke="#fff" strokeWidth="2" cx={hover !== null ? x(hover) : 0} cy={hover !== null ? y(s.v[hover]) : 0} style={{ opacity: hover !== null ? 1 : 0 }} />)}
        <rect x={pl} y="0" width={W - pl - pr} height={h} fill="transparent" />
      </svg>
    </div>
  )
}

export function HBars({ rows, fmt = k$ }: { rows: [string, number, string?][]; fmt?: (v: number) => string }) {
  if (!rows.length) return <p className="note">No sales yet.</p>
  const m = Math.max(...rows.map(r => r[1])) || 1
  return <>{rows.map(r => (
    <div className="hb" key={r[0]} title={`${r[0]}: ${fmt(r[1])}${r[2] ? ' · ' + r[2] : ''}`}>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r[0]}</span>
      <span className="tr"><i style={{ width: (r[1] / m * 100).toFixed(1) + '%' }} /></span>
      <span className="v">{fmt(r[1])}</span>
    </div>
  ))}</>
}

export function Spark({ v, c = '#E8446F' }: { v: number[]; c?: string }) {
  const W = 200, H = 34, m = Math.max(...v), n = Math.min(...v)
  const x = (i: number) => i * W / Math.max(1, v.length - 1), y = (a: number) => H - 3 - (a - n) / ((m - n) || 1) * (H - 6)
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
    <path d={v.map((a, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(a).toFixed(1)).join('')} fill="none" stroke={c} strokeWidth="2" vectorEffect="non-scaling-stroke" />
  </svg>
}
