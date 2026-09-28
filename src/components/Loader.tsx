import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { profile } from '../content/site'

const LoaderScene = lazy(() => import('./LoaderScene'))
const KEY = 'mp-seen-loader'
const MAX_MS = 2500

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Decides once, before first paint, whether to show the render-bay loader. */
export function loaderMode(): 'none' | '2d' | '3d' {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none'
  try {
    if (localStorage.getItem(KEY)) return 'none'
  } catch {}
  const desktop = matchMedia('(min-width: 900px) and (hover: hover)').matches
  return desktop && hasWebGL() ? '3d' : '2d'
}

export default function Loader({ mode, onDone }: { mode: '2d' | '3d'; onDone: () => void }) {
  const [show, setShow] = useState(true)
  const finish = useCallback(() => setShow(false), [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {}
    const t = setTimeout(finish, MAX_MS) // hard cap: never hold the reel back longer than 2.5s
    const k = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && finish()
    addEventListener('keydown', k)
    return () => (clearTimeout(t), removeEventListener('keydown', k))
  }, [finish])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] bg-[#101012]"
          exit={{ opacity: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
          role="status"
          aria-label="Loading"
        >
          {mode === '3d' ? (
            <Suspense fallback={<Flat onDone={finish} />}>
              <LoaderScene duration={2.1} onDone={finish} />
            </Suspense>
          ) : (
            <Flat onDone={finish} />
          )}
          <button
            onClick={finish}
            className="glass mono absolute bottom-6 right-6 h-11 rounded-full px-5 text-xs text-dim transition-colors hover:text-ink"
          >
            Skip ›
          </button>
          <p className="mono absolute bottom-8 left-6 text-xs text-faint">Rendering Sequence 01 — {profile.name}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** 2D fallback: a render bar fills, then the Program Monitor scales up to full screen. */
function Flat({ onDone }: { onDone: () => void }) {
  return (
    <div className="grid size-full place-items-center p-6">
      <motion.div
        className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-line bg-[linear-gradient(135deg,#1d2a3a,#3b2a2e)]"
        animate={{ scale: [1, 1, 4.5], opacity: [1, 1, 0] }}
        transition={{ duration: 1.9, times: [0, 0.7, 1], ease: 'easeIn' }}
        onAnimationComplete={onDone}
      >
        <p className="display absolute inset-0 grid place-items-center text-3xl italic">{profile.name}</p>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
          <motion.div className="h-full bg-[#e8c34a]" initial={{ width: '0%' }} animate={{ width: '100%', backgroundColor: '#28c840' }} transition={{ duration: 1.3, ease: 'easeOut' }} />
        </div>
      </motion.div>
    </div>
  )
}
