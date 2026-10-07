import { srcSet, sized } from '../utils/image';

interface Props {
  src: string;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
  /** Intrinsic ratio hint to prevent layout shift */
  width?: number;
  height?: number;
  max?: number;
}

/** Lifestyle photography from the store's CDN, responsive + lazy by default. */
export function Photo({ src, alt, sizes, eager, className, width = 1600, height = 1067, max = 2560 }: Props) {
  return (
    <img
      className={className}
      src={sized(src, 1080)}
      srcSet={srcSet(src, max)}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
    />
  );
}
