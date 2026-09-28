import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { sequence } from '../content/sequence'
import { profile } from '../content/site'
import { ScrollTrigger, scrollToId } from '../lib/scroll'
import { blip, setMuted, useMuted } from '../lib/sound'
import { cx, timecode } from '../lib/util'
import { useReel } from './Reel'
import { Icon } from './ui'

const SECONDS_PER_SCREEN = 4

/** Scroll position, measured once per frame and shared by the header + dock. */
function useScrollState() {
  const [s, setS] = useState({ y: 0, max: 1, vh: 800 })
  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      setS({ y: scrollY, max: Math.max(1, document.documentElement.scrollHeight - innerHeight), vh: innerHeight })
    }
    const on = () => (raf ||= requestAnimationFrame(read))
    read()
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    return () => (removeEventListener('scroll', on), removeEventListener('resize', on), cancelAnimationFrame(raf))
  }, [])
  return s
}

export function Header() {
  const { y, vh } = useScrollState()
  const reel = useReel()
  const past = y > vh * 0.6
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 p-3 sm:p-4">
      <a href="#hero" onClick={(e) => (e.preventDefault(), scrollToId('hero'))} className="glass pointer-events-auto flex h-11 items-center gap-2.5 rounded-full pl-1.5 pr-4">
        <span className="display grid size-8 place-items-center rounded-full bg-ink text-lg text-page">M</span>
        <span className="text-sm font-medium">{profile.name}</span>
      </a>
      <div className="pointer-events-auto flex items-center gap-2">
        <motion.button
          onClick={reel.open}
          className="glass hidden h-11 items-center gap-2 rounded-full px-4 text-sm sm:flex"
          animate={{ opacity: past ? 1 : 0, x: past ? 0 : 10, pointerEvents: past ? 'auto' : 'none' }}
          aria-hidden={!past}
          tabIndex={past ? 0 : -1}
        >
          <Icon.play className="size-3 text-accent" /> Reel
        </motion.button>
        <div className="glass mono flex h-11 items-center gap-2 rounded-full px-4 text-sm tabular-nums" aria-label="Sequence timecode" role="timer">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          <span className="text-accent">{timecode((y / vh) * SECONDS_PER_SCREEN)}</span>
        </div>
      </div>
    </header>
  )
}

/** Premiere-style mini timeline docked at the bottom: clickable nav + playhead. */
export function MiniTimeline() {
  const { y, max } = useScrollState()
  const muted = useMuted()
  const [spans, setSpans] = useState<{ id: string; start: number; size: number }[]>([])
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const measure = () => {
      const total = document.documentElement.scrollHeight
      setSpans(
        sequence.map((s) => {
          const el = document.getElementById(s.id)
          const box = el?.closest('.pin-spacer') ?? el
          const r = box?.getBoundingClientRect()
          return { id: s.id, start: r ? (r.top + scrollY) / total : 0, size: r ? r.height / total : 0 }
        }),
      )
    }
    measure()
    ScrollTrigger.addEventListener('refresh', measure)
    addEventListener('resize', measure)
    const t = setTimeout(measure, 1200)
    return () => (ScrollTrigger.removeEventListener('refresh', measure), removeEventListener('resize', measure), clearTimeout(t))
  }, [])

  const p = y / max
  const total = document.documentElement.scrollHeight
  const pos = (y + (p * innerHeight)) / total // playhead sweeps the whole doc
  const active = [...spans].reverse().find((s) => pos >= s.start)?.id

  return (
    <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-[#18181b]/92 backdrop-blur-md" style={{ height: 'var(--dock)' }}>
      <div className="flex h-full">
        {/* Track headers */}
        <div className="flex w-14 shrink-0 flex-col border-r border-line sm:w-20">
          <div className="mono flex flex-1 items-center px-2 text-[10px] text-faint sm:px-3">V1</div>
          <div className="flex h-[20px] items-center gap-1 border-t border-line px-2 sm:h-[24px] sm:px-3">
            <span className="mono text-[10px] text-faint">A1</span>
            <button
              onClick={() => setMuted(!muted)}
              aria-pressed={!muted}
              aria-label={muted ? 'Turn UI sounds on' : 'Turn UI sounds off'}
              title="UI sounds"
              className={cx('mono relative grid h-4 w-5 place-items-center rounded-[3px] text-[10px] font-medium after:absolute after:-inset-3 after:content-[""]', muted ? 'bg-[#e8c34a] text-black' : 'bg-panel-2 text-dim')}
            >
              M
            </button>
          </div>
        </div>

        <div ref={bar} className="relative flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 bottom-[20px] sm:bottom-[24px]">
            {spans.map((s, i) => {
              const meta = sequence[i]
              if (!s.size) return null // section switched off in site.ts
              return (
                <button
                  key={s.id}
                  onClick={() => (blip('tick'), scrollToId(s.id))}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={cx(
                    'group absolute inset-y-1.5 overflow-hidden rounded-[3px] border px-1.5 text-left transition-colors',
                    active === s.id ? 'border-accent/80 bg-accent/25' : 'border-line bg-panel-2 hover:bg-[#3a3a40]',
                  )}
                  style={{ left: `${s.start * 100}%`, width: `calc(${s.size * 100}% - 2px)` }}
                >
                  <span className={cx('mono block truncate text-[10px] leading-tight', active === s.id ? 'text-ink' : 'text-dim')}>
                    <span className="hidden md:inline">{meta.clip} · </span>
                    {meta.label}
                  </span>
                  <span className="sr-only">, go to section</span>
                </button>
              )
            })}
          </div>
          {/* A1 waveform */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[20px] border-t border-line opacity-40 sm:h-[24px]" style={{ background: 'repeating-linear-gradient(90deg,#2ec4b633 0 1px,transparent 1px 3px)' }} />
          {/* Playhead */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-accent" style={{ left: `${Math.min(pos, 1) * 100}%` }}>
            <div className="absolute -left-[5px] top-0 h-2.5 w-[11px] bg-accent [clip-path:polygon(0_0,100%_0,100%_50%,50%_100%,0_50%)]" />
          </div>
        </div>
      </div>
    </nav>
  )
}
