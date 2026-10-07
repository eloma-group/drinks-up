import { useRef, useState, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ProductImage, isPackshot } from '../ProductCard/ProductImage';
import { useCanHover } from '../../hooks/useMediaQuery';
import type { ProductImage as Img } from '../../types';
import './ProductGallery.css';

interface Props {
  images: Img[];
  title: string;
}

/**
 * Desktop: large stage with thumbnails and pointer-follow zoom on packshots.
 * Touch: swipeable scroll-snap carousel with a counter.
 */
export function ProductGallery({ images, title }: Props) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const canHover = useCanHover();
  const railRef = useRef<HTMLDivElement>(null);
  const current = images[index];

  if (!images.length) return <div className="gallery gallery--empty plate" aria-hidden="true" />;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  if (!canHover) {
    return (
      <div className="gallery gallery--touch">
        <div
          className="gallery__rail"
          ref={railRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          aria-label={`${title} images`}
          role="region"
          tabIndex={0}
        >
          {images.map((img, i) => (
            <div className="gallery__slide plate" key={img.src}>
              <ProductImage image={img} alt={i === 0 ? title : `${title} — image ${i + 1}`} sizes="100vw" eager={i === 0} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="gallery__dots" aria-hidden="true">
            {images.map((img, i) => (
              <span key={img.src} className={i === index ? 'is-active' : ''} />
            ))}
            <span className="gallery__counter">
              {index + 1} / {images.length}
            </span>
          </div>
        )}
      </div>
    );
  }

  const zoomable = isPackshot(current);

  return (
    <div className="gallery">
      {images.length > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Product images">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Image ${i + 1} of ${images.length}`}
              className={`gallery__thumb plate ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
            >
              <ProductImage image={img} alt="" sizes="96px" />
            </button>
          ))}
        </div>
      )}
      <div
        className={`gallery__stage plate ${zoomable ? 'is-zoomable' : ''} ${zoom && zoomable ? 'is-zoomed' : ''}`}
        onMouseMove={zoomable ? onMove : undefined}
        onMouseLeave={() => setZoom(null)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={current.src}
            className="gallery__frame"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={zoom && zoomable ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          >
            <ProductImage image={current} alt={index === 0 ? title : `${title} — image ${index + 1}`} sizes="(min-width: 1000px) 50vw, 100vw" eager={index === 0} />
          </motion.div>
        </AnimatePresence>
        {zoomable && <span className="gallery__hint label">Hover to zoom</span>}
      </div>
    </div>
  );
}
