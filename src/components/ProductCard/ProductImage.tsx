import { useEffect, useRef, useState } from 'react';
import { sized, srcSet } from '../../utils/image';
import type { ProductImage as Img } from '../../types';

/** PNG uploads on the store are white-background packshots; JPGs are lifestyle photos. */
export const isPackshot = (img: Img) => !img.src.startsWith('/brand/') && (/\.png($|\?)/i.test(img.src.split('?')[0]) || /\.webp/i.test(img.src));

interface Props {
  image: Img;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
  /** Force a fit mode; default picks contain for packshots, cover for photos */
  fit?: 'contain' | 'cover';
}

export function ProductImage({ image, alt, sizes, eager, className = '', fit }: Props) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // Cached images can finish before React attaches onLoad
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true);
  }, []);
  const mode = fit ?? (isPackshot(image) ? 'contain' : 'cover');
  return (
    <img
      ref={ref}
      className={`pimg pimg--${mode} ${loaded ? 'is-loaded' : ''} ${mode === 'contain' ? 'plate__product' : ''} ${className}`}
      src={sized(image.src, 800)}
      srcSet={srcSet(image.src, Math.min(2560, image.width))}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
    />
  );
}
