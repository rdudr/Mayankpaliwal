import { motion } from 'framer-motion'
import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { beforeAfter } from '../content/site'
import { Img } from '../lib/media'
import { blip } from '../lib/sound'
import { cx } from '../lib/util'
import { SectionHead } from './ui'

export default function BeforeAfter() {
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState(50)
  const [dragging, setDragging] = useState(false)
  const [sample, setSample] = useState(false)
  const onSample = useCallback((s: boolean) => setSample(s), [])

  const moveTo = (clientX: number) => {
    const r = box.current!.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  const down = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    blip('razor')
    moveTo(e.clientX)
  }

  const preset = (v: number) => (blip('tick'), setPos(v))

  return (
    <section id="grade" aria-labelledby="grade-title" className="section-pad mx-auto max-w-[1500px] py-20 md:py-32">
      <SectionHead
        id="grade"
        title={<span id="grade-title">Before <em>/</em> after</span>}
        intro="Drag the razor across the frame, or use the buttons below."
      />

      {/* J-cut: the labels (the "audio") arrive a beat before the picture. */}
      <div className="mb-3 flex justify-between">
        {['Before · raw', 'After · final'].map((t, i) => (
          <motion.span
            key={t}
            className="mono text-xs uppercase text-dim"
            initial={{ opacity: 0, x: i ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.35 }}
          >
            {t}
          </motion.span>
        ))}
      </div>

      <motion.div
        ref={box}
        data-cursor="razor"
        onPointerDown={down}
        onPointerMove={(e) => dragging && moveTo(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-xl bg-panel sm:aspect-video"
        initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)' }}
        whileInView={{ opacity: 1, clipPath: 'inset(0 0 0 0%)' }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.2, 0.7, 0.1, 1] }}
      >
        <Img src={beforeAfter.after} alt="Final graded frame" draggable={false} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <Img
            src={beforeAfter.before}
            onSample={onSample}
            alt="Raw ungraded frame"
            draggable={false}
            className={cx('absolute inset-0 size-full object-cover', sample && 'log')}
          />
        </div>

        {/* Razor line */}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90" style={{ left: `${pos}%` }}>
          <div className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path d="M9 6l-6 6 6 6M15 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        <label className="sr-only">
          Before and after split position
          <input type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(+e.target.value)} />
        </label>
      </motion.div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-dim">{beforeAfter.caption}</p>
        <div className="flex gap-2" role="group" aria-label="Jump to">
          {[
            ['Before', 100],
            ['Split', 50],
            ['After', 0],
          ].map(([l, v]) => (
            <button
              key={l}
              onClick={() => preset(v as number)}
              aria-pressed={Math.round(pos) === v}
              className={cx('mono h-11 rounded-full border px-4 text-xs transition-colors', Math.round(pos) === v ? 'border-accent text-ink' : 'border-line text-dim hover:text-ink')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
