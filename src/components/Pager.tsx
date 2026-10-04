import { motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { currentPage, goTo, isBusy, PAGES, slideSeconds, usePage } from '../lib/pager'
import { TURN } from '../scene/progress'

const EDGE = 2

function atEdge(el: HTMLElement, dir: 1 | -1) {
  return dir > 0 ? el.scrollTop + el.clientHeight >= el.scrollHeight - EDGE : el.scrollTop <= EDGE
}

/**
 * Four full-screen pages stacked vertically; the stack slides one screen at
 * a time. Inside a page, normal scrolling works until you hit its end — then
 * the next nudge turns the page.
 */
export default function Pager({ children }: { children: ReactNode[] }) {
  const page = usePage()
  const prev = useRef(page)
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const dur = slideSeconds(prev.current, page)
  // Home ↔ About rides the 3D fall: wait for his swivel, then move on the same curve as the camera.
  const fall = prev.current + page === 1 && dur > 0
  useEffect(() => {
    prev.current = page
    // New page starts at its top (or bottom when arriving from below? reference starts at top)
    const el = refs.current[page]
    if (el) el.scrollTop = 0
  }, [page])

  useEffect(() => {
    const el = () => refs.current[currentPage()]!
    const modalOpen = () => document.documentElement.classList.contains('lock')
    let lastWheel = 0
    let armed = true // one gesture → at most one page, and only if it started at the edge

    const onWheel = (e: WheelEvent) => {
      if (modalOpen() || e.ctrlKey) return
      const dir = (Math.sign(e.deltaY) || 0) as 1 | -1 | 0
      const now = performance.now()
      // Trackpads keep firing "momentum" events for seconds after a flick;
      // a pause of >250ms marks the start of a genuinely new gesture.
      const fresh = now - lastWheel > 250
      lastWheel = now
      if (!dir) return
      // A gesture may turn the page only if it *began* at the page's edge.
      if (fresh) armed = atEdge(el(), dir)
      if (!atEdge(el(), dir)) return // the page itself still has room to scroll
      e.preventDefault()
      if (!armed || isBusy() || Math.abs(e.deltaY) < 4) return
      armed = false
      goTo(currentPage() + dir)
    }

    let y0 = 0
    let edge = { down: false, up: false }
    const onTouchStart = (e: TouchEvent) => {
      y0 = e.touches[0].clientY
      edge = { down: atEdge(el(), 1), up: atEdge(el(), -1) }
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (modalOpen() || isBusy()) return
      const dy = y0 - e.changedTouches[0].clientY
      if (dy > 50 && edge.down) goTo(currentPage() + 1)
      else if (dy < -50 && edge.up) goTo(currentPage() - 1)
    }

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (modalOpen() || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.altKey || e.metaKey || e.ctrlKey) return
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)
      const up = e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault()
        goTo(e.key === 'Home' ? 0 : PAGES.length - 1)
        return
      }
      if (!down && !up) return
      if (!atEdge(el(), down ? 1 : -1)) return // let the page scroll itself
      e.preventDefault()
      if (!isBusy()) goTo(currentPage() + (down ? 1 : -1))
    }

    addEventListener('wheel', onWheel, { passive: false })
    addEventListener('touchstart', onTouchStart, { passive: true })
    addEventListener('touchend', onTouchEnd, { passive: true })
    addEventListener('keydown', onKey)
    return () => {
      removeEventListener('wheel', onWheel)
      removeEventListener('touchstart', onTouchStart)
      removeEventListener('touchend', onTouchEnd)
      removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[1] overflow-hidden">
      <motion.div
        className="h-full"
        animate={{ y: `${-page * 100}%` }}
        transition={
          fall
            ? { delay: page === 1 ? dur * TURN : 0, duration: dur * (1 - TURN), ease: [0.45, 0, 0.55, 1] }
            : { duration: dur, ease: [0.65, 0.05, 0.36, 1] }
        }
      >
        {children.map((child, i) => (
          <div
            key={PAGES[i]}
            ref={(r) => (refs.current[i] = r)}
            className="no-scrollbar h-full overflow-y-auto overflow-x-hidden overscroll-contain"
            aria-hidden={i !== page}
            {...(i !== page ? { inert: '' } : {})}
          >
            {child}
          </div>
        ))}
      </motion.div>
    </div>
  )
}
