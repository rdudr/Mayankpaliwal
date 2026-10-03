import Lenis from 'lenis'

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

/** Smooth wheel scrolling on desktop (touch keeps native scrolling). */
export function startSmoothScroll(reduced: boolean) {
  if (reduced) return () => {}
  const lenis = new Lenis({ lerp: 0.1 })
  window.__lenis = lenis
  let raf = 0
  const loop = (t: number) => {
    lenis.raf(t)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  return () => {
    cancelAnimationFrame(raf)
    lenis.destroy()
    window.__lenis = undefined
  }
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.4 })
  else el.scrollIntoView({ behavior: 'smooth' })
}
