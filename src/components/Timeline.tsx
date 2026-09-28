import { motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'
import { experience } from '../content/site'
import { useIsDesktop, useReducedMotion } from '../lib/hooks'
import { gsap } from '../lib/scroll'
import { blip } from '../lib/sound'
import { clientMeta, cx, tbc } from '../lib/util'
import { Icon, SectionHead } from './ui'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const START_YEAR = 2021
const now = new Date()
const NOW_M = (now.getFullYear() - START_YEAR) * 12 + now.getMonth()
const END_YEAR = now.getFullYear()
const TOTAL_M = (END_YEAR - START_YEAR + 1) * 12

/** "Sep 2025", "2024", "Present" → month index from Jan 2021. */
function toMonth(s: string, end: boolean) {
  s = s.trim()
  if (/present/i.test(s)) return NOW_M + 1
  const [a, b] = s.split(' ')
  if (b) return (+b - START_YEAR) * 12 + MONTHS.indexOf(a) + (end ? 1 : 0)
  return (+a - START_YEAR) * 12 + (end ? 12 : 0)
}

const FALLBACK: Record<string, string> = {
  'raj-shamani': 'Video editor on Raj Shamani’s channel. Episode details coming soon.',
  beerbiceps: 'Video editor on the BeerBiceps channel. Project details coming soon.',
}

const clips = experience.map((e) => {
  const [a, b = a] = e.period.split('–')
  const start = toMonth(a, false)
  const end = toMonth(b, true)
  const summary = e.summary.includes('TODO') ? tbc(e.summary.split('TODO')[0].trim(), FALLBACK[e.client] ?? '') : e.summary
  return { ...e, start, end, track: 'partOf' in e ? 2 : 1, meta: clientMeta[e.client], summary, present: /present/i.test(b) }
})
type Clip = (typeof clips)[number]

function monthLabel(m: number) {
  const c = Math.min(Math.max(0, Math.floor(m)), NOW_M)
  return `${MONTHS[c % 12]} ${START_YEAR + Math.floor(c / 12)}`
}

export default function Timeline() {
  const desktop = useIsDesktop()
  const reduced = useReducedMotion()
  return (
    <section id="timeline" aria-labelledby="tl-title" className="relative py-20 md:py-0">
      {desktop && !reduced ? <Horizontal /> : <Vertical />}
    </section>
  )
}

/* ─── Desktop: pinned horizontal scroll, playhead follows the scroll ─── */
function Horizontal() {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [m, setM] = useState(0)
  const PX = 58 // px per month
  const W = TOTAL_M * PX

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const head = () => innerWidth * 0.38
      gsap.fromTo(
        track.current,
        { x: () => head() },
        {
          x: () => head() - (NOW_M + 1) * PX,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${(NOW_M + 1) * PX}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (st) => setM(st.progress * (NOW_M + 1)),
          },
        },
      )
    }, root)
    return () => ctx.revert()
  }, [])

  // Long clips: keep the label next to the playhead instead of scrolling out of view.
  const follow = (c: Clip) => Math.max(0, Math.min(m * PX - c.start * PX - 40, (c.end - c.start) * PX - 380))
  const active = clips.find((c) => c.track === 1 && m >= c.start && m < c.end) ?? clips.find((c) => m >= c.start && m < c.end)

  return (
    <div ref={root} className="flex h-[100svh] flex-col justify-center overflow-hidden pb-[var(--dock)]" data-cursor="hand">
      <div className="section-pad">
        <SectionHead id="timeline" title={<span id="tl-title">The <em>timeline</em></span>} className="!mb-8" intro="Scroll to scrub through the career. Click a clip to flip it." />
      </div>

      <div className="relative">
        {/* Playhead */}
        <div className="pointer-events-none absolute inset-y-0 left-[38%] z-30 -ml-px w-0.5 bg-accent">
          <div className="mono absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-accent px-2 py-1 text-xs text-white">
            {monthLabel(m)}
          </div>
          <div className="absolute -top-2 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-accent" />
        </div>

        <motion.div
          ref={track}
          className="relative"
          style={{ width: W }}
          initial={{ filter: 'blur(14px)', opacity: 0 }}
          whileInView={{ filter: 'blur(0px)', opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Ruler */}
          <div className="relative h-8 border-b border-line">
            {Array.from({ length: TOTAL_M }, (_, i) => (
              <div key={i} className={cx('absolute bottom-0 w-px', i % 12 === 0 ? 'h-4 bg-dim' : 'h-1.5 bg-line')} style={{ left: i * PX }}>
                {i % 12 === 0 && <span className="mono absolute -top-4 left-1.5 text-xs text-dim">{START_YEAR + i / 12}</span>}
              </div>
            ))}
          </div>
          <Track label="V2" height={120}>
            {clips.filter((c) => c.track === 2).map((c) => <FlipClip key={c.title} c={c} left={c.start * PX} width={(c.end - c.start) * PX} height={104} active={active === c} shift={follow(c)} />)}
          </Track>
          <Track label="V1" height={190}>
            {clips.filter((c) => c.track === 1).map((c) => <FlipClip key={c.title} c={c} left={c.start * PX} width={(c.end - c.start) * PX} height={174} active={active === c} shift={follow(c)} />)}
          </Track>
        </motion.div>
      </div>
    </div>
  )
}

function Track({ label, height, children }: { label: string; height: number; children: React.ReactNode }) {
  return (
    <div className="relative border-b border-line/70" style={{ height }} aria-label={`Track ${label}`}>
      {children}
    </div>
  )
}

/* ─── A clip that flips to its details ─── */
function FlipClip({ c, left, width, height, active, shift = 0 }: { c: Clip; left?: number; width?: number; height: number; active?: boolean; shift?: number }) {
  const [flipped, setFlipped] = useState(false)
  const positioned = left !== undefined
  return (
    <div
      className={cx(positioned ? 'absolute top-2' : 'relative w-full')}
      style={{ left, width: width && Math.max(width - 6, 200), height, perspective: 1200 }}
    >
      <motion.button
        onClick={() => (blip('tick'), setFlipped((f) => !f))}
        aria-pressed={flipped}
        aria-label={`${c.title}, ${c.period}. ${flipped ? 'Hide' : 'Show'} details`}
        className="relative size-full text-left [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      >
        {/* Front: the clip */}
        <div
          className={cx('absolute inset-0 flex flex-col justify-between overflow-hidden rounded-md p-3 [backface-visibility:hidden] sm:p-4', active && 'ring-2 ring-white/70')}
          style={{ background: `color-mix(in oklab, ${c.meta.color} 78%, #1c1c1f)` }}
        >
          <div className="flex max-w-[360px] items-start justify-between gap-3 text-[#141416]" style={{ transform: `translateX(${shift}px)` }}>
            <span className="mono truncate text-xs font-medium">{c.meta.bin}.mov</span>
            <span className="mono shrink-0 text-xs opacity-70">{c.period}</span>
          </div>
          <div className="text-[#141416]" style={{ transform: `translateX(${shift}px)` }}>
            <p className="display truncate text-3xl sm:text-4xl">{c.title.split(' — ')[0]}</p>
            <p className="text-sm opacity-75">{c.role}</p>
          </div>
          {/* waveform-ish texture */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-5 opacity-25" style={{ background: 'repeating-linear-gradient(90deg,#141416 0 2px,transparent 2px 5px)' }} />
        </div>
        {/* Back: details */}
        <div className="absolute inset-0 flex flex-col gap-2 overflow-hidden rounded-md border border-line bg-panel-2 p-3 [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-4">
          <p className="mono text-xs" style={{ color: c.meta.color }}>{c.period}</p>
          <p className="line-clamp-4 text-sm text-ink">{c.summary || 'Details coming soon.'}</p>
          {c.link && (
            <a
              href={c.link}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-auto inline-flex items-center gap-1.5 self-start text-sm text-dim underline-offset-4 hover:text-ink hover:underline"
            >
              Visit <Icon.external className="size-3.5" />
            </a>
          )}
        </div>
      </motion.button>
    </div>
  )
}

/* ─── Mobile / reduced motion: vertical track ─── */
function Vertical() {
  const ordered = [...clips].sort((a, b) => b.start - a.start)
  return (
    <div className="section-pad mx-auto max-w-3xl">
      <SectionHead id="timeline" title={<span id="tl-title">The <em>timeline</em></span>} intro="Latest first. Tap a clip to flip it." />
      <ol className="relative space-y-5 border-l-2 border-accent/60 pl-5 sm:pl-8">
        {ordered.map((c, i) => (
          <motion.li
            key={c.title}
            className={cx('relative', c.track === 2 && 'ml-4 sm:ml-8')}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
          >
            <span aria-hidden className="absolute -left-[27px] top-6 size-3 rounded-full border-2 border-page sm:-left-[39px]" style={{ background: c.meta.color }} />
            <FlipClip c={c} height={c.track === 2 ? 150 : 170} />
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
