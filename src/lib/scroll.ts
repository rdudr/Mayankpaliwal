import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

declare global {
  interface Window {
    __lenis?: Lenis
  }
}

/** Smooth scroll (desktop only — touch keeps native scrolling) wired into ScrollTrigger. */
export function startSmoothScroll(reduced: boolean) {
  if (reduced) return () => {}
  const lenis = new Lenis({ lerp: 0.12 })
  window.__lenis = lenis
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(raf)
    lenis.destroy()
    window.__lenis = undefined
  }
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { duration: 1.2 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export { gsap, ScrollTrigger }
