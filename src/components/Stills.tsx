import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { stills } from '../content/site'
import { useFinePointer, useReducedMotion, useScrollLock } from '../lib/hooks'
import { Img, useResolvedSrc } from '../lib/media'
import { gsap } from '../lib/scroll'
import { blip } from '../lib/sound'
import { CloseButton, SectionHead } from './ui'

export default function Stills() {
  const [open, setOpen] = useState<number | null>(null)
  const root = useRef<HTMLElement>(null)
  const dip = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  // Dip to black: the page darkens fully, then the contact sheet fades up.
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 90%', end: 'top 20%', scrub: true } })
        .fromTo(dip.current, { opacity: 0 }, { opacity: 1, ease: 'none', duration: 1 })
        .to(dip.current, { opacity: 0, ease: 'none', duration: 1 })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section ref={root} id="stills" aria-labelledby="stills-title" className="relative bg-[#141416] py-20 md:py-32">
      <div ref={dip} aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-black opacity-0" />
      <div className="section-pad mx-auto max-w-[1500px]">
        <SectionHead id="stills" title={<span id="stills-title">Contact <em>sheet</em></span>} intro="Frames from the camera side. Open any to view it large." />
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-[#0e0e10] p-2 sm:grid-cols-3 sm:gap-3 sm:p-4 lg:grid-cols-4">
          {stills.map((s, i) => (
            <li key={s}>
              <Frame src={s} i={i} onOpen={() => (blip('click'), setOpen(i))} />
            </li>
          ))}
        </ul>
      </div>
      <Lightbox index={open} setIndex={setOpen} />
    </section>
  )
}

/** One frame with a loupe (magnifier) cursor on desktop. */
function Frame({ src, i, onOpen }: { src: string; i: number; onOpen: () => void }) {
  const fine = useFinePointer()
  const real = useResolvedSrc(src)
  const [loupe, setLoupe] = useState<{ x: number; y: number; w: number; h: number } | null>(null)

  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!fine) return
    const r = e.currentTarget.getBoundingClientRect()
    setLoupe({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height })
  }
  const Z = 2.5
  const R = 70

  return (
    <button
      onClick={onOpen}
      onPointerMove={move}
      onPointerLeave={() => setLoupe(null)}
      aria-label={`Open still ${i + 1}`}
      className="group relative block w-full overflow-hidden bg-black"
      style={{ cursor: fine ? 'none' : undefined }}
    >
      <Img src={src} alt="" className="aspect-[3/2] w-full object-cover transition-opacity group-hover:opacity-90" />
      <span className="mono absolute bottom-1.5 left-2 text-[10px] text-mango/90">{String(i + 1).padStart(2, '0')}A</span>
      {loupe && (
        <span
          aria-hidden
          className="pointer-events-none absolute rounded-full border-2 border-white/80 shadow-[0_8px_30px_rgba(0,0,0,.6)]"
          style={{
            width: R * 2,
            height: R * 2,
            left: loupe.x - R,
            top: loupe.y - R,
            backgroundImage: `url("${real}")`,
            backgroundSize: `${loupe.w * Z}px ${loupe.h * Z}px`,
            backgroundPosition: `${-(loupe.x * Z - R)}px ${-(loupe.y * Z - R)}px`,
          }}
        />
      )}
    </button>
  )
}

function Lightbox({ index, setIndex }: { index: number | null; setIndex: (i: number | null) => void }) {
  const open = index !== null
  useScrollLock(open)
  const go = useCallback((d: number) => index !== null && setIndex((index + d + stills.length) % stills.length), [index, setIndex])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, go, setIndex])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Still ${index + 1} of ${stills.length}`}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-3 sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="max-h-full max-w-full"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => Math.abs(info.offset.x) > 60 && go(info.offset.x < 0 ? 1 : -1)}
            >
              <Img src={stills[index]} alt={`Still ${index + 1}`} loading="eager" draggable={false} className="max-h-[82svh] w-auto max-w-full rounded object-contain" />
            </motion.div>
          </AnimatePresence>
          <CloseButton onClick={() => setIndex(null)} className="absolute right-3 top-3" />
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
            <button onClick={() => go(-1)} aria-label="Previous still" className="glass grid size-11 place-items-center rounded-full">‹</button>
            <span className="mono text-xs text-dim">{String(index + 1).padStart(2, '0')} / {String(stills.length).padStart(2, '0')}</span>
            <button onClick={() => go(1)} aria-label="Next still" className="glass grid size-11 place-items-center rounded-full">›</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
