import { useRef } from 'react';
import { ABOUT, IMG } from '../../../data/site';
import { gsap, useGSAP } from '../../../animations/gsap';
import { Reveal } from '../../../animations/Reveal';
import { prefersReducedMotion } from '../../../hooks/useReducedMotion';
import { Button } from '../../../components/Button/Button';
import { Photo } from '../../../components/Photo';
import './Story.css';

/** Full-bleed photo that expands from an inset card to edge-to-edge as you scroll. */
export function Story() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        '.story__frame',
        { clipPath: 'inset(8% 6% 8% 6% round 24px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', end: 'top 10%', scrub: true },
        },
      );
      gsap.fromTo('.story__frame img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } });
    },
    { scope: ref },
  );

  return (
    <section className="story" ref={ref} aria-labelledby="story-title">
      <div className="story__frame on-dark">
        <Photo src={IMG.poolside} alt="Bottles and spritz cocktails by a sunny pool" sizes="100vw" width={2048} height={1366} />
        <div className="story__overlay wrap">
          <p className="label">Our story</p>
          <h2 id="story-title" className="display">
            Educate <span className="accent">&amp;</span> inebriate
          </h2>
          <p className="lead">{ABOUT.story}</p>
        </div>
      </div>
      <Reveal className="story__values wrap" stagger={0.1}>
        {ABOUT.values.map((v) => (
          <div key={v.title} className="story__value">
            <h3 className="h3">{v.title}</h3>
            <p className="muted">{v.body}</p>
          </div>
        ))}
        <div className="story__value story__value--cta">
          <p className="serif story__social">{ABOUT.social}</p>
          <Button to="/pages/about-us-1" variant="outline" arrow>
            About DrinksUp
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
