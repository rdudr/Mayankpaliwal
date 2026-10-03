import { AnimatePresence, animate, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../lib/hooks'
import Logo from './Logo'

const CLIPS = [
  { c: '#f2a93b', x: 0, w: 22 },
  { c: '#2ec4b6', x: 23, w: 14 },
  { c: '#e0698e', x: 38, w: 18 },
  { c: '#a393eb', x: 57, w: 11 },
  { c: '#f2a93b', x: 69, w: 31 },
]

/**
 * "Rendering" loader: clips land on V1, the waveform plays on A1, the playhead
 * sweeps. When the 3D scene is ready the slate claps and the page slides up.
 */
export default function Loader({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduced = useReducedMotion()
  const [p, setP] = useState(0)
  const [clap, setClap] = useState(0)
  const [show, setShow] = useState(true)
  const done = useRef(false)

  // Ease to 85% on our own, then wait for the scene (max 6s) before finishing.
  useEffect(() => {
    const c = animate(0, 85, { duration: reduced ? 0.2 : 1.6, ease: 'easeOut', onUpdate: setP })
    return () => c.stop()
  }, [reduced])

  useEffect(() => {
    const finish = () => {
      if (done.current) return
      done.current = true
      animate(p, 100, { duration: 0.35, onUpdate: setP, onComplete: () => {
        setClap(1)
        setTimeout(() => setShow(false), reduced ? 0 : 420)
      } })
    }
    if (ready && p >= 85) finish()
    const cap = setTimeout(finish, 6000)
    return () => clearTimeout(cap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, p >= 85])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {show && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-cream"
          exit={{ y: '-100%', transition: { duration: reduced ? 0 : 0.7, ease: [0.65, 0.05, 0.36, 1] } }}
          role="status"
          aria-label={`Loading ${Math.round(p)}%`}
        >
          <div className="flex w-[min(440px,86vw)] flex-col items-center">
            <Logo size={84} clap={clap} />
            <div className="mt-8 w-full rounded-2xl bg-white p-4 shadow-[0_20px_60px_-30px_rgba(9,20,52,.35)]">
              <div className="mb-3 flex items-center justify-between text-xs text-slate">
                <span className="mono">Mayank_Paliwal.prproj</span>
                <span className="mono tabular-nums text-navy">{Math.round(p)}%</span>
              </div>
              <div className="relative overflow-hidden rounded-lg bg-[#f3f1ed] p-2">
                {/* V1 */}
                <div className="relative h-7">
                  {CLIPS.map((c, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-y-0 rounded-md"
                      style={{ left: `${c.x}%`, width: `${c.w}%`, background: c.c }}
                      initial={{ opacity: 0, y: -14 }}
                      animate={p > c.x ? { opacity: 1, y: 0 } : {}}
                      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                    />
                  ))}
                </div>
                {/* A1 waveform */}
                <div className="mt-1.5 flex h-6 items-center gap-[2px] overflow-hidden">
                  {Array.from({ length: 60 }, (_, i) => (
                    <span
                      key={i}
                      className="min-w-[2px] flex-1 rounded-full bg-[#2ec4b6]"
                      style={{ height: `${20 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 80}%`, opacity: i / 60 < p / 100 ? 0.9 : 0.2 }}
                    />
                  ))}
                </div>
                {/* playhead */}
                <div className="absolute inset-y-0 w-0.5 bg-orange" style={{ left: `calc(${p}% - 1px)` }}>
                  <span className="absolute -left-[5px] -top-0.5 size-3 rotate-45 rounded-[2px] bg-orange" />
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-slate">{p < 100 ? 'Rendering the edit…' : 'Export complete'}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
