import { animate, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { experience, profile } from '../content/site'
import { useReducedMotion } from '../lib/hooks'
import { clientMeta } from '../lib/util'
import { Dot } from './ui'

const stats = [
  { value: new Date().getFullYear() - profile.since, suffix: '+', label: 'years in the timeline' },
  { value: 500, suffix: 'K+', label: 'Instagram views on Daud BTS' },
  { value: 2500, suffix: '', label: 'followers for the creator in 3 days' },
  { value: 6, suffix: '', label: 'episodes in the Daud series' },
]

/** Counts up like a timecode rolling, frame digits flickering to the final value. */
function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const [n, setN] = useState(reduced ? value : 0)

  useEffect(() => {
    if (!inView || reduced) return
    const c = animate(0, value, { duration: 1.4, ease: [0.2, 0.7, 0.1, 1], onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, reduced, value])

  return (
    <span ref={ref} className="mono tabular-nums">
      {n.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

export default function Proof() {
  const items = experience.map((e) => ({ ...e, meta: clientMeta[e.client] }))
  const strip = [...items, ...items]

  return (
    <section id="proof" aria-label="Clients and results" className="relative bg-page pt-2">
      <h2 className="sr-only">Clients</h2>
      {/* Film strip marquee */}
      <div className="overflow-hidden border-y border-line bg-[#141416]">
        <div className="sprockets" />
        <div className="flex w-max marquee" aria-hidden>
          {strip.map((e, i) => (
            <div key={i} className="flex items-center gap-4 border-r border-line/60 px-6 py-5 sm:px-10">
              <Dot color={e.meta.color} className="size-3" />
              <span className="display whitespace-nowrap text-3xl sm:text-4xl">{e.title.split(' — ')[0]}</span>
              <span className="mono whitespace-nowrap text-xs text-faint">{e.period}</span>
            </div>
          ))}
        </div>
        <ul className="sr-only">
          {items.map((e) => (
            <li key={e.title}>{e.title}, {e.period}</li>
          ))}
        </ul>
        <div className="sprockets" />
      </div>

      <dl className="section-pad mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-10 py-16 md:grid-cols-4 md:py-24">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse justify-end border-l border-line pl-4 sm:pl-6">
            <dt className="mt-2 text-sm text-dim">{s.label}</dt>
            <dd className="text-[clamp(2.2rem,5vw,3.8rem)] leading-none text-ink">
              <Counter value={s.value} suffix={s.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
