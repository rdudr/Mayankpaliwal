import { useEffect, useState, useSyncExternalStore } from 'react'

function useMedia(query: string, fallback = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  )
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
/** Mouse/trackpad users — hover previews and tool cursors only apply here. */
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)')
export const useIsDesktop = () => useMedia('(min-width: 900px)')

export function useKey(key: string, handler: (e: KeyboardEvent) => void, active = true) {
  useEffect(() => {
    if (!active) return
    const fn = (e: KeyboardEvent) => e.key === key && handler(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [key, handler, active])
}

export function useInView<T extends Element>(ref: React.RefObject<T>, margin = '0px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: margin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, margin])
  return inView
}

/** Locks page scroll while a modal is open. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    document.documentElement.classList.add('lock')
    window.__lenis?.stop()
    return () => {
      document.documentElement.classList.remove('lock')
      window.__lenis?.start()
    }
  }, [locked])
}
