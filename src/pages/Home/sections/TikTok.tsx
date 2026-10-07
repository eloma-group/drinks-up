import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, Play, X } from 'lucide-react';
import feed from '../../../data/tiktok.json';
import { useSmoothScroll } from '../../../context/SmoothScroll';
import { SplitHeading } from '../../../animations/Reveal';
import { formatDate } from '../../../utils/format';
import './TikTok.css';

interface Post {
  id: string;
  url: string;
  caption: string;
  publishedAt: string;
  likes: number;
  plays: number;
  cover: string;
}

/** Captions use “fancy” Unicode letters (𝕍𝕒𝕟𝕚𝕝𝕝𝕒); NFKC turns them back into plain text */
const clean = (s: string) => s.normalize('NFKC').replace(/\s+/g, ' ').trim();
const compact = new Intl.NumberFormat('en-AU', { notation: 'compact', maximumFractionDigits: 1 });

const posts = (feed.posts as Post[]).map((p) => ({ ...p, caption: clean(p.caption) }));
const profile = feed.profile;

function TikTokIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.7 5.7 0 0 0-.77-.05 5.68 5.68 0 1 0 5.68 5.68V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z" />
    </svg>
  );
}

/** “@drinks_up_please on TikTok”: the feed shown on drinksup.com.au, as a swipeable rail */
export function TikTokFeed() {
  const railRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<Post | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const { lock } = useSmoothScroll();

  useEffect(() => {
    lock(active !== null);
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, lock]);

  const updateEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  const page = (dir: 1 | -1) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!posts.length) return null;

  return (
    <section className="tiktok section" aria-labelledby="tiktok-title">
      <div className="wrap section-head">
        <div>
          <p className="label">On TikTok · @{profile.username}</p>
          <SplitHeading id="tiktok-title" className="h2" text="Shaken, stirred & posted" accent={['posted']} />
        </div>
        <div className="tiktok__head-actions">
          <div className="tiktok__arrows">
            <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label="Previous videos">
              <ArrowLeft size={20} />
            </button>
            <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label="Next videos">
              <ArrowRight size={20} />
            </button>
          </div>
          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="btn btn--ink btn--md tiktok__follow">
            <TikTokIcon /> Follow us
          </a>
        </div>
      </div>

      <ul className="tiktok__rail" role="list" ref={railRef} onScroll={updateEdges} data-lenis-prevent-touch>
        {posts.map((p) => (
          <li key={p.id} className="tiktok__item">
            <button type="button" className="tclip on-dark" onClick={() => setActive(p)} aria-label={`Play TikTok video: ${p.caption.slice(0, 80)}`}>
              <img src={p.cover} alt="" loading="lazy" decoding="async" width={540} height={960} />
              <span className="tclip__play" aria-hidden="true">
                <Play size={22} fill="currentColor" />
              </span>
              <span className="tclip__meta">
                <span className="tclip__caption">{p.caption}</span>
                <span className="tclip__stats">
                  <span>
                    <Play size={12} fill="currentColor" aria-hidden="true" /> {compact.format(p.plays)}
                  </span>
                  {p.likes > 0 && (
                    <span>
                      <Heart size={12} fill="currentColor" aria-hidden="true" /> {compact.format(p.likes)}
                    </span>
                  )}
                  <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                </span>
              </span>
            </button>
          </li>
        ))}
        <li className="tiktok__item tiktok__item--more">
          <a href={profile.url} target="_blank" rel="noopener noreferrer" className="tclip tclip--more">
            <TikTokIcon size={36} />
            <span className="h3">More on TikTok</span>
            <span className="tclip__handle">@{profile.username}</span>
            <ArrowUpRight size={22} aria-hidden="true" />
          </a>
        </li>
      </ul>

      <AnimatePresence>
        {active && (
          <>
            <motion.div className="overlay-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActive(null)} aria-hidden="true" />
            <motion.div
              className="tplayer"
              role="dialog"
              aria-modal="true"
              aria-label="TikTok video"
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <button type="button" className="tplayer__close" onClick={() => setActive(null)} aria-label="Close video" autoFocus>
                <X size={22} />
              </button>
              <div className="tplayer__frame">
                {/* Poster shows until TikTok's player loads (or if TikTok is unavailable on the network) */}
                <img src={active.cover} alt="" className="tplayer__poster" />
                <iframe
                  src={`https://www.tiktok.com/player/v1/${active.id}?autoplay=1&music_info=0&description=0&rel=0`}
                  title="TikTok video player"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="tplayer__info">
                <p className="tplayer__caption">{active.caption}</p>
                <a href={active.url} target="_blank" rel="noopener noreferrer" className="link-line">
                  Watch on TikTok <ArrowUpRight size={16} />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
