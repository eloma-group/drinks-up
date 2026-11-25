import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import { LINEUP, MQ, SHELF_CATS, src } from '../lib/data'
import { PREVIEW, getFeaturedReviews, type FeaturedReview } from '../lib/api'
import { slide, slider } from '../lib/motion'
import { gateState } from '../components/Layout'
import Card from '../components/Card'
import { Cta, PlusSvg, Split } from '../components/ui'

/* hero line-up: seven bottles in a half-circle arc, tallest in the centre (same line-up as 3two1.com.au) */
const HERO_BOTTLES: [string, string, string][] = [
  ['giffard-mango-puree', 'Giffard Mango Fruit for Mix purée bottle', '/product/giffard-mango-fruit-for-mix-1000ml'],
  ['giffard-lychee-liqueur', 'Giffard Lichi-Li lychee liqueur bottle', '/product/giffard-lychee-liqueur-modern'],
  ['black-tears-spiced-rum', 'Black Tears Dry Spiced rum bottle', '/product/black-tears-cuban-spiced-rum-700ml'],
  ['giffard-mango-syrup', 'Giffard Mango syrup bottle', '/product/giffard-mango-syrup'],
  ['demonio-acholado', 'Demonio de los Andes Acholado pisco bottle', '/product/demonio-de-los-andes-pisco-acholado-700ml'],
  ['worthy-park-rum', 'Worthy Park Single Estate Reserve Jamaica rum bottle', '/product/worthy-park-estate-single-estate-reserve-45-700ml'],
  ['burnt-ends-whiskey', 'Burnt Ends Blended Whiskey bottle', '/product/burnt-ends'],
]

/* hover splash art: public/images/splash-<bottle key>.webp, one per bottle tinted to its drink colour */
type SplashPos = { x: number; y: number; w: number; h: number }

export default function Home() {
  const { byH, add } = useStore()
  const nav = useNavigate()
  const rev = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [revs, setRevs] = useState<FeaturedReview[]>([])
  // per-bottle splash (stone-sip style): hidden + scaled to 0, grows in on hover while the bottle straightens; reverses on leave
  const [spPos, setSpPos] = useState<Record<string, SplashPos>>({})
  const [spOn, setSpOn] = useState<string | null>(null)
  const splashOn = (img: HTMLImageElement, k: string) => {
    const stage = img.parentElement!
    // measure the UNtransformed layout box (offset*): on hover the bottle straightens to 0deg, so its tilted
    // bounding box would put the splash off-centre (left bottles drift one way, right bottles the other)
    const row = [...stage.querySelectorAll<HTMLImageElement>('.hb')].filter(e => e.offsetParent !== null)
    const mid = (e: HTMLElement) => e.offsetLeft + e.offsetWidth / 2
    const i = row.indexOf(img), prev = row[i - 1], next = row[i + 1], cx = mid(img)
    // splash reaches out to the neighbouring bottles' centre lines and tucks in behind them (z-index), so it never covers another bottle
    const room = Math.min(prev ? cx - mid(prev) : cx, next ? mid(next) - cx : stage.clientWidth - cx)
    const w = Math.max(img.offsetWidth * 2.2, Math.min(img.offsetHeight * 1.1, room * 2)) // splash art is 3:2
    // the liquid bowl sits 3.3% right of the artwork's centre → shift so the bowl is on the bottle's axis;
    // bowl behind the bottle's body, crown rising around its shoulders
    setSpPos(p => ({ ...p, [k]: { x: cx - w * 0.033, y: img.offsetTop + img.offsetHeight * 0.42, w, h: w * 2 / 3 } }))
    setSpOn(k)
  }
  const splashOff = (k: string) => setSpOn(o => (o === k ? null : o))

  useEffect(() => {
    if (gateState.entered) {
      document.querySelector('.hero h1')?.classList.add('in')
      const st = document.getElementById('stage'); if (st && document.body.classList.contains('ready')) st.classList.add('live')
    }
    if (!PREVIEW) getFeaturedReviews().then(setRevs).catch(() => {})
  }, [])

  // reviews carousel: only shown once real customer reviews exist
  useEffect(() => {
    if (!revs.length) return
    const io = new IntersectionObserver(es => { slider.inView = es[0].isIntersecting })
    if (rev.current) io.observe(rev.current)
    const t = track.current
    const en = () => (slider.paused = true), lv = () => (slider.paused = false)
    t?.addEventListener('mouseenter', en); t?.addEventListener('mouseleave', lv)
    return () => { io.disconnect(); slider.inView = false; slider.paused = false; t?.removeEventListener('mouseenter', en); t?.removeEventListener('mouseleave', lv) }
  }, [revs.length])

  const lineup = LINEUP.map(h => byH[h]).filter(Boolean)
  const hd = (v: string) => ({ ['--hd' as string]: v }) as CSSProperties

  return (
    <div id="home">
      <header className="hero" id="top">
        <div className="wrap">
          <div className="rating hi" style={hd('.1s')}><span className="stars">★★★★★</span> Loved by Australia’s bartenders</div>
          <Split as="h1" text={'Bar-quality drinks,\npoured at home'} base={250} />
          <p className="sub hi" style={hd('.9s')}>Spirits, liqueurs, syrups &amp; Cocktails — packed within 24 hours.</p>
          <div className="hi" style={hd('1.05s')}><Cta to="/shop">Buy Now</Cta></div>
        </div>
        <div className="stage" id="stage">
          {HERO_BOTTLES.map(([k]) => {
            const p = spPos[k]
            // background-image (not <img>) so the hero's `.stage img` entrance/bob rules don't touch it
            return (
              <div key={'sp-' + k} className={`bsplash${spOn === k ? ' on' : ''}`} aria-hidden="true"
                style={{ left: p?.x ?? 0, top: p?.y ?? 0, width: p?.w ?? 0, height: p?.h ?? 0, backgroundImage: `url(${src('splash-' + k)})` }} />
            )
          })}
          {HERO_BOTTLES.map(([k, alt, to], i) => <img key={k} className={`hb hb${i - 3}`} src={src('hero-' + k)} alt={alt} role="link" tabIndex={0}
            onMouseEnter={e => splashOn(e.currentTarget, k)} onMouseLeave={() => splashOff(k)} onFocus={e => splashOn(e.currentTarget, k)} onBlur={() => splashOff(k)}
            onClick={() => nav(to)} onKeyDown={e => { if (e.key === 'Enter') nav(to) }} />)}
        </div>
        <div className="seen">
          <div className="wrap"><div className="seen-h"><span>On our shelf</span></div>
            <div className="btiles ctiles">{SHELF_CATS.map(([t, k, o, to]) => <Link className="btile ctile" key={t} to={to}><i><img src={src(k)} alt="" /></i><span><b>{t}</b><small>{o}</small></span></Link>)}</div>
          </div>
        </div>
      </header>

      <section className="compromise">
        <div className="wrap">
          <Split text="Happy hour without any compromise." />
          <div className="collage-row">
            <div className="collage">
              <figure className="p1 rv fly"><img src={src('bt_cuba')} alt="Black Tears Cuba Libre" /></figure>
              <figure className="p2 rv fly d1"><img src={src('m_gbart')} alt="Bartender garnishing a Giffard cocktail" /></figure>
              <figure className="p3 rv fly d2"><img src={src('sydney_toast')} alt="Toasting at sunset on Sydney Harbour" /></figure>
            </div>
            <div className="rv">
              <h3>Cocktails made the right way</h3>
              <p>Every bottle on our shelf is one Australia’s best bartenders already pour. No filler, no fashion — only the bottles that make the drink better, delivered to your door.</p>
              <div className="cta-grid">
                <Cta to="/recipes">View All Recipes</Cta>
                <Cta to="/shop/packs">Buy Cocktail Packs</Cta>
                <Cta to="/shop/purees">View Smoothie Packs</Cta>
                <Cta to="/shop/non-alcoholic">View Non-Alcoholic</Cta>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lineup" id="lineup">
        <div className="wrap">
          <div className="head"><Split text="The drink lineup" /><Cta to="/shop">View All</Cta></div>
          <div className="lgrid" id="lgrid">
            <div className="side rv"><img src={src('lineup_side')} alt="Bartender stirring a cocktail" /></div>
            {lineup.map((p, i) => <Card key={p.h} p={p} i={i} />)}
          </div>
        </div>
      </section>

      {revs.length > 0 && <section className="reviews" id="reviews" ref={rev}>
        <div className="bg" id="revbg" />
        <div className="wrap">
          <div className="head"><Split text="The reviews are in" /><div className="arrows"><button aria-label="Previous" onClick={() => slide(-1)}>‹</button><button aria-label="Next" onClick={() => slide(1)}>›</button></div></div>
          <div className="rtrack" id="rtrack" ref={track}>{revs.map(r => <div className="rc" key={r.id}><span className="stars">{'★'.repeat(r.r)}</span><h4>{r.t}</h4><p>“{r.b}”</p><div className="who"><span>{r.n} · {r.brand}</span>{r.v ? <span className="ver"><i>✓</i>Verified buyer</span> : null}</div></div>)}</div>
          <div className="rprog"><i id="rprog" /></div>
        </div>
      </section>}

      <section className="feat">
        <div className="wrap feat-g">
          <div className="feat-media">
            <div className="fm-main clip"><img src={src('bt_scene')} alt="Black Tears Dry Spiced Rum on the bar" /></div>
            <div className="fm-card rv d2"><img src={src('bt_cut')} alt="Black Tears Dry Spiced Rum bottle" /><div><small>Black Tears · 700ml · 40%</small><b>$72.99 AUD</b><s>$79.99</s></div></div>
          </div>
          <div className="feat-copy">
            <span className="eyebrow rv">Spirit spotlight · Havana, Cuba</span>
            <Split text="Cuba, decanted the right way." />
            <p className="rv">Black Tears is aged Cuban rum infused with island-grown cocoa, coffee and Cuban chilli — dry, deep and properly spiced. Made for Cuba Libres and coffee-forward old fashioneds.</p>
            <div className="chips copy-bot">
              <span className="chip y"><i>✓</i>Cocoa, coffee &amp; Cuban chilli</span>
              <span className="chip y"><i>✓</i>Aged under Havana sun</span>
              <span className="chip n"><i>✕</i>No added colouring</span>
              <span className="chip n"><i>✕</i>No artificial flavour</span>
            </div>
            <div className="feat-buy rv">
              <button className="cta lg" onClick={e => add('black-tears-cuban-spiced-rum-700ml', e.currentTarget)}><i><PlusSvg /></i><span>Add to cart — $72.99</span></button>
              <Link className="ul" to="/product/black-tears-cuban-spiced-rum-700ml">View details</Link>
            </div>
            <div className="feat-serve rv"><img src={src('bt_cuba')} alt="Black Tears Cuba Libre" /><div><small>Signature serve</small><b>Cuba Libre</b><span>50ml Black Tears · 10ml lime · 150ml cola · lime wedge</span></div></div>
          </div>
        </div>
      </section>

      <section className="story" id="story">
        <div className="wrap g">
          <div className="rv">
            <div className="a clip"><img src={src('story_bartender')} alt="Bartender straining a pink cocktail into a coupe" style={{ objectPosition: '70% 50%' }} /></div>
            <h3>Our journey began behind the bar, with a passion for bringing great drinks home.</h3>
            <p>Drinks Up is the at-home store of 3Two1 Drinks — founded in 2018 by ex-bartenders, ex-buyers and ex-reps who import Giffard, Black Tears, Burnt Ends and San Matías. The same bottles we place in Australia’s best venues, now delivered straight to you.</p>
            <Cta to="/about">About Us</Cta>
          </div>
          <div className="b clip d2"><img src={src('bt_ck')} alt="Black Tears rum cocktail" /></div>
        </div>
      </section>

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap mhead"><Split text="#HappyHourAtHome" /><div className="socials"><a href="https://www.instagram.com/3two1_drinks/" aria-label="Instagram">IG</a><a href="https://www.facebook.com/3two1drinks" aria-label="Facebook">FB</a><a href="https://www.youtube.com/@3two1_drinks" aria-label="YouTube">YT</a></div></div>
        <div className="mq"><div className="t" id="mqt">{MQ.concat(MQ).map((k, i) => <img key={i} src={src(k)} alt="" loading="lazy" />)}</div></div>
      </section>
    </div>
  )
}
