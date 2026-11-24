import { src, type Product } from './data'

export const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)]
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ---------- reveal observer (global) ---------- */
const SEL = '.rv,.clip,[data-split],.copy-bot'
let io: IntersectionObserver | null = null
const seen = new WeakSet<Element>()
function observe(el: Element) {
  if (seen.has(el) || el.closest('.hero') || el.classList.contains('in')) return
  seen.add(el); io!.observe(el)
}
function scan(root: ParentNode) {
  if (root instanceof Element && root.matches(SEL)) observe(root)
  $$(SEL, root).forEach(observe)
}
export function initReveal() {
  if (io) return
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io!.unobserve(e.target) } }), { threshold: .12, rootMargin: '0px 0px -5% 0px' })
  scan(document.body)
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) scan(n as Element) }))).observe(document.body, { childList: true, subtree: true })
}

/* ---------- reviews slider state ---------- */
export const slider = { rT: 0, paused: false, inView: false, RDUR: 5200 }
export function slide(d: number) {
  const track = $('#rtrack'); if (!track) return
  const c = track.querySelector<HTMLElement>('.rc'); if (!c) return
  const max = track.scrollWidth - track.clientWidth
  let to = track.scrollLeft + d * (c.offsetWidth + 14)
  if (to > max + 5) to = 0; if (to < -5) to = max
  track.scrollTo({ left: to, behavior: 'smooth' }); slider.rT = 0
}

/* ---------- frame loop ---------- */
let started = false
export function startLoop() {
  if (started) return; started = true
  let mqx = 0, vel = 0, lastY = scrollY
  const frame = () => {
    const y = scrollY, dy = y - lastY; lastY = y; vel = lerp(vel, dy, .12)
    const nav = $('#nav'), prog = $('#progress'), home = $('#home')
    const H = document.documentElement.scrollHeight - innerHeight
    if (prog) prog.style.scale = `${H > 0 ? y / H : 0} 1`
    if (nav) {
      nav.classList.toggle('solid', y > 40 || !home)
      if (y > 320 && dy > 4) nav.classList.add('hide'); else if (dy < -4 || y < 320) nav.classList.remove('hide')
    }
    if (!reduce) {
      $$<HTMLImageElement>('.phead-img img,.about-hero>img,.cimg img').forEach(im => { const b = (im.parentNode as HTMLElement).getBoundingClientRect(); im.style.translate = `0 ${((b.top + b.height / 2) - innerHeight / 2) * -.08}px` })
      if (home) {
        const side = $<HTMLImageElement>('.lgrid .side img')
        if (side) { const sr = (side.parentNode!.parentNode as HTMLElement).getBoundingClientRect(), sp = clamp(-sr.top / (sr.height || 1), 0, 1); side.style.transform = `scale(${1.04 - sp * .04})` }
        const reviews = $('.reviews'), revbg = $('#revbg')
        if (reviews && revbg) { const rr = reviews.getBoundingClientRect(), rpv = clamp(1 - rr.bottom / (innerHeight + rr.height), 0, 1); revbg.style.transform = `scale(${1.08 + rpv * .18}) translateY(${(rpv - .5) * 40}px)` }
        $$<HTMLImageElement>('.story .clip img').forEach(im => { const b = (im.parentNode as HTMLElement).getBoundingClientRect(); im.style.translate = `0 ${((b.top + b.height / 2) - innerHeight / 2) * -.06}px` })
        const mqt = $('#mqt')
        if (mqt) { mqx -= 0.55 + Math.abs(vel) * .35; const half = mqt.scrollWidth / 2; if (half && -mqx > half) mqx += half; mqt.style.transform = `translateX(${mqx}px)` }
        if (slider.inView && !slider.paused) {
          slider.rT += 16; const rp = $('#rprog'); if (rp) rp.style.width = (slider.rT / slider.RDUR * 100) + '%'
          if (slider.rT >= slider.RDUR) slide(1)
        }
      }
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

/* ---------- fly to cart ---------- */
export function fly(p: Product, el: Element | null) {
  const bag = $('.bag'); if (!bag) return
  bag.classList.remove('bump'); void bag.offsetWidth; bag.classList.add('bump')
  const c = $('#count'); if (c) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }
  $('#nav')?.classList.remove('hide')
  if (reduce || !el) return
  const holder = el.closest('.pc') || document.querySelector('.pdp')
  const srcImg = holder ? holder.querySelector<HTMLImageElement>('.box img,#gmain img') : null
  const s = (srcImg || el).getBoundingClientRect(), t = bag.getBoundingClientRect()
  const im = document.createElement('img'); im.className = 'flyer'; im.src = srcImg ? srcImg.src : src(p.cut || p.img[0])
  const w = Math.min(140, Math.max(60, s.width * .5)), hh = w * 1.35
  Object.assign(im.style, { left: (s.left + s.width / 2 - w / 2) + 'px', top: (s.top + s.height / 2 - hh / 2) + 'px', width: w + 'px', height: hh + 'px' })
  document.body.appendChild(im)
  const dx = t.left + t.width / 2 - (s.left + s.width / 2), dy = t.top + t.height / 2 - (s.top + s.height / 2)
  im.animate([{ transform: 'translate(0,0) scale(1) rotate(0)' }, { transform: `translate(${dx * .5}px,${dy * .5 - 160}px) scale(.6) rotate(-20deg)`, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(.12) rotate(-40deg)`, opacity: .2 }], { duration: 900, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => im.remove()
}
