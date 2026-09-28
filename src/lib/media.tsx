import { forwardRef, useEffect, useState, type ImgHTMLAttributes, type VideoHTMLAttributes } from 'react'
import { sampleFor } from '../content/samples'

/** Tries the real /media file first, swaps to the sample if it is missing. */
function useFallback(path: string) {
  const [src, setSrc] = useState(path)
  useEffect(() => setSrc(path), [path])
  const sample = sampleFor(path)
  const onError = () => {
    if (sample && src !== sample) setSrc(sample)
  }
  return { src, onError, isSample: src === sample }
}

type ImgProps = ImgHTMLAttributes<HTMLImageElement> & { src: string; onSample?: (s: boolean) => void }

export const Img = forwardRef<HTMLImageElement, ImgProps>(function Img({ src: path, onSample, ...rest }, ref) {
  const { src, onError, isSample } = useFallback(path)
  useEffect(() => onSample?.(isSample), [isSample, onSample])
  return <img ref={ref} src={src} onError={onError} loading="lazy" decoding="async" {...rest} />
})

type VideoProps = VideoHTMLAttributes<HTMLVideoElement> & { src: string }

export const Video = forwardRef<HTMLVideoElement, VideoProps>(function Video({ src: path, ...rest }, ref) {
  const { src, onError } = useFallback(path)
  return <video ref={ref} src={src} onError={onError} playsInline {...rest} />
})

/** Resolves a /media path to whatever will actually load (real file or sample). */
export function useResolvedSrc(path: string) {
  const [src, setSrc] = useState(path)
  useEffect(() => {
    let alive = true
    fetch(path, { method: 'HEAD' })
      .then((r) => {
        const ok = r.ok && !(r.headers.get('content-type') ?? '').includes('text/html')
        if (alive) setSrc(ok ? path : sampleFor(path) ?? path)
      })
      .catch(() => alive && setSrc(sampleFor(path) ?? path))
    return () => {
      alive = false
    }
  }, [path])
  return src
}
