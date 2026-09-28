import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { allProjects, type ProjectView } from '../lib/projects'
import { useFinePointer, useReducedMotion } from '../lib/hooks'
import { Img, Video } from '../lib/media'
import { gsap } from '../lib/scroll'
import { cx } from '../lib/util'
import { useOpenProject } from './ProjectModal'
import { Dot, SectionHead } from './ui'

const featured = ['rs-01', 'ep01', 'bb-01', 'rs-02', 'fl-01', 'ep04']
const picks = featured.map((id) => allProjects.find((p) => p.id === id)!).filter(Boolean)
// Bento rhythm on large screens: wide, tall, normal…
const spans = ['lg:col-span-7 lg:row-span-2', 'lg:col-span-5', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4']

export default function Work() {
  const grid = useRef<HTMLDivElement>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  // Match cut: the grid opens out of the same 2.39:1 frame the hero closed on.
  useLayoutEffect(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        grid.current,
        { clipPath: 'inset(14% 8% 14% 8% round 18px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: grid.current, start: 'top 95%', end: 'top 35%', scrub: true } },
      )
    }, wrap)
    return () => ctx.revert()
  }, [reduced])

  // Cursor spotlight "grades" the LOG footage back to colour.
  const onMove = (e: PointerEvent) => {
    if (!fine || !grid.current) return
    for (const card of grid.current.querySelectorAll<HTMLElement>('[data-card]')) {
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
  }

  return (
    <section ref={wrap} id="work" aria-labelledby="work-title" className="section-pad mx-auto max-w-[1500px] py-20 md:py-32">
      <SectionHead
        id="work"
        title={<span id="work-title">Selected <em>work</em></span>}
        intro={fine ? 'Everything starts flat, like LOG footage. Move across a frame to grade it; hover to roll a few seconds.' : 'Tap a frame to open it.'}
      />
      <div
        ref={grid}
        onPointerMove={onMove}
        onPointerLeave={() => grid.current?.querySelectorAll<HTMLElement>('[data-card]').forEach((c) => c.style.setProperty('--mx', '-999px'))}
        className="grid grid-cols-1 lg:auto-rows-[clamp(220px,19vw,300px)] gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4"
      >
        {picks.map((p, i) => (
          <Card key={p.id} p={p} i={i} className={spans[i]} fine={fine} />
        ))}
      </div>
    </section>
  )
}

function Card({ p, i, className, fine }: { p: ProjectView; i: number; className: string; fine: boolean }) {
  const open = useOpenProject()
  const video = useRef<HTMLVideoElement>(null)
  const [hover, setHover] = useState(false)
  const [graded, setGraded] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  // Touch screens: grade the frame as it crosses the middle of the screen.
  useLayoutEffect(() => {
    if (fine || !ref.current) return
    const io = new IntersectionObserver(([e]) => setGraded(e.isIntersecting), { rootMargin: '-35% 0px -35% 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [fine])

  const start = () => {
    if (!fine) return
    setHover(true)
    const v = video.current
    if (v) (v.currentTime = 0), v.play().catch(() => {})
  }
  const stop = () => {
    setHover(false)
    video.current?.pause()
  }

  return (
    <button
      ref={ref}
      data-card
      onClick={() => open(p)}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={() => setGraded(true)}
      onBlur={() => setGraded(false)}
      className={cx('group relative block aspect-video overflow-hidden rounded-lg bg-panel text-left lg:aspect-auto', i === 0 && 'sm:col-span-2', className)}
      style={{ '--mx': '-999px', '--my': '-999px' } as React.CSSProperties}
    >
      <div className="relative size-full">
        <Img src={p.thumb} alt="" className="log absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        {/* Graded layer, revealed by the spotlight mask */}
        <Img
          src={p.thumb}
          alt=""
          className={cx('absolute inset-0 size-full object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.03]', !fine && !graded ? 'opacity-0' : 'opacity-100')}
          style={
            graded || !fine
              ? undefined
              : { maskImage: 'radial-gradient(circle 240px at var(--mx) var(--my), #000 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(circle 240px at var(--mx) var(--my), #000 30%, transparent 100%)' }
          }
        />
        {fine && (
          <Video
            ref={video}
            src={p.preview}
            muted
            preload="none"
            onTimeUpdate={(e) => e.currentTarget.currentTime > 3 && (e.currentTarget.currentTime = 0)}
            className={cx('absolute inset-0 size-full object-cover transition-opacity duration-300', hover ? 'opacity-100' : 'opacity-0')}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-4 pt-16 sm:p-5 sm:pt-20">
        <p className="mono mb-1.5 flex items-center gap-2 text-[11px] text-dim">
          <Dot color={p.meta.color} /> {p.clipName}
        </p>
        <h3 className={cx('display text-2xl sm:text-3xl', i === 0 && 'lg:text-5xl')}>{p.displayTitle}</h3>
      </div>
      <span className="mono pointer-events-none absolute left-3 top-3 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-dim">
        {hover ? '● PREVIEW' : `V1 · ${String(i + 1).padStart(2, '0')}`}
      </span>
    </button>
  )
}
