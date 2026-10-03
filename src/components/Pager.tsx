import { motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { currentPage, goTo, isBusy, PAGES, slideSeconds, usePage } from '../lib/pager'

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
    let edgeSince = 0

    const onWheel = (e: WheelEvent) => {
      if (modalOpen() || e.ctrlKey) return
      const dir = (Math.sign(e.deltaY) || 0) as 1 | -1 | 0
      if (!dir) return
      const now = performance.now()
      const fresh = now - lastWheel > 220 // a new gesture, not trackpad momentum
      lastWheel = now
      if (!atEdge(el(), dir)) {
        edgeSince = 0
        return
      }
      e.preventDefault()
      if (isBusy()) return
      if (!edgeSince) edgeSince = now
      if (fresh || now - edgeSince > 900) {
        edgeSince = 0
        goTo(currentPage() + dir)
      }
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
        transition={{ duration: dur, ease: [0.65, 0.05, 0.36, 1] }}
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
