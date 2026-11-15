import Image, { type ImageProps } from 'next/image'
import type { CSSProperties } from 'react'

/**
 * Hosts configured in next.config.mjs images.remotePatterns. Anything else (unknown CDN,
 * data/blob URLs, SVG) falls back to a plain <img> so a missing host never breaks an image.
 */
const OPTIMIZED_HOSTS = ['res.cloudinary.com', 'lh3.googleusercontent.com']

function canOptimize(src: ImageProps['src']): boolean {
  if (typeof src !== 'string' || !src) return false
  if (/\.svg(\?|$)/i.test(src)) return false
  if (src.startsWith('/') && !src.startsWith('//')) return true
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && OPTIMIZED_HOSTS.includes(url.hostname)
  } catch {
    return false
  }
}

export function SmartImage({ alt, ...props }: ImageProps & { alt: string }) {
  if (canOptimize(props.src)) {
    return <Image alt={alt} {...props} />
  }
  const { src, fill, width, height, style, className, priority, sizes, onError } = props
  const fillStyle: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === 'string' ? src : undefined}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={fillStyle}
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
      onError={onError as React.ReactEventHandler<HTMLImageElement> | undefined}
    />
  )
}
