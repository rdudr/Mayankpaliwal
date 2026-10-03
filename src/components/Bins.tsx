import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Client } from '../content/site'
import { byClient, type ProjectView } from '../lib/projects'
import { useFinePointer } from '../lib/hooks'
import { Img } from '../lib/media'
import { blip } from '../lib/sound'
import { clientMeta, cx } from '../lib/util'
import { useOpenProject } from './ProjectModal'
import { Icon } from './ui'

const bins: Client[] = ['daud', 'raj-shamani', 'beerbiceps', 'freelance']
const FAN_MAX = 7

function Folder({ color, open }: { color: string; open: boolean }) {
  return (
    <svg viewBox="0 0 120 90" className="w-full" aria-hidden>
      <path d="M6 14a6 6 0 0 1 6-6h30l8 9h58a6 6 0 0 1 6 6v5H6z" fill={color} opacity=".85" />
      <motion.path
        d="M6 26h108v52a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6z"
        fill="#2e2e33"
        stroke={color}
        strokeOpacity=".35"
        animate={{ skewX: open ? -8 : 0, y: open ? 4 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{ transformOrigin: '60px 84px' }}
      />
    </svg>
  )
}

/** Premiere's Project panel: client bins on top, the open bin fanned out below. */
export default function Bins() {
  const [active, setActive] = useState<Client>('raj-shamani')
  const fine = useFinePointer()
  const total = bins.reduce((n, c) => n + byClient(c).length, 0)

  const pick = (c: Client) => {
    if (c !== active) blip('tick')
    setActive(c)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel text-ink shadow-[0_40px_90px_-40px_rgba(9,20,52,.6)]">
      <div className="mono flex items-center justify-between border-b border-line px-4 py-3 text-xs text-dim sm:px-5">
        <span>Project: Mayank_Paliwal.prproj</span>
        <span>{total} items</span>
      </div>

      <div role="tablist" aria-label="Client bins" className="grid grid-cols-2 gap-2 p-3 sm:gap-4 sm:p-5 md:grid-cols-4">
        {bins.map((c) => {
          const m = clientMeta[c]
          const on = c === active
          return (
            <button
              key={c}
              role="tab"
              aria-selected={on}
              aria-controls="bin-panel"
              onClick={() => pick(c)}
              onPointerEnter={() => fine && pick(c)}
              className={cx(
                'group flex flex-col items-center gap-2 rounded-lg border p-3 transition-colors sm:p-4',
                on ? 'border-line bg-panel-2' : 'border-transparent hover:bg-panel-2/60',
              )}
            >
              <div className="w-16 sm:w-24">
                <Folder color={m.color} open={on} />
              </div>
              <span className={cx('mono text-xs sm:text-sm', on ? 'text-ink' : 'text-dim')}>{m.bin}</span>
              <span className="mono text-[11px] text-faint">{byClient(c).length} items</span>
            </button>
          )
        })}
      </div>

      <div id="bin-panel" role="tabpanel" aria-label={`${clientMeta[active].label} bin`}>
        <Fan client={active} />
        <ClipList client={active} />
      </div>
    </div>
  )
}

function Fan({ client }: { client: Client }) {
  const stage = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(800)
  const open = useOpenProject()
  const items = byClient(client).slice(0, FAN_MAX)
  const color = clientMeta[client].color

  useEffect(() => {
    if (!stage.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(stage.current)
    return () => ro.disconnect()
  }, [])

  const n = items.length
  const cardW = Math.min(270, Math.max(118, w * (n > 3 ? 0.24 : 0.3)))
  const mid = (n - 1) / 2
  const stepX = n > 1 ? Math.min(cardW * 0.78, (w - cardW * 1.3 - 24) / (n - 1)) : 0
  const stepR = Math.min(7, 36 / Math.max(n, 1))

  return (
    <div ref={stage} className="relative border-t border-line bg-[#202024]" style={{ height: cardW * 0.5625 + 150 }}>
      <AnimatePresence mode="popLayout">
        {items.map((p, i) => {
          const d = i - mid
          return (
            <motion.button
              key={p.id}
              onClick={() => open(p)}
              aria-label={`Open ${p.title}`}
              className="absolute left-1/2 top-[56%] origin-bottom"
              style={{ width: cardW, marginLeft: -cardW / 2, marginTop: -(cardW * 0.5625) / 2, zIndex: 10 + i }}
              initial={{ opacity: 0, x: 0, y: 60, rotate: 0, scale: 0.8 }}
              animate={{ opacity: 1, x: d * stepX, y: Math.abs(d) * 8, rotate: d * stepR, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.85, transition: { duration: 0.15 } }}
              whileHover={{ y: -18, rotate: 0, scale: 1.08, zIndex: 50 }}
              whileFocus={{ y: -18, rotate: 0, scale: 1.08, zIndex: 50 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.035 }}
            >
              <div className="overflow-hidden rounded-md border-2 bg-panel shadow-[0_18px_40px_-12px_rgba(0,0,0,.8)]" style={{ borderColor: color }}>
                <Img src={p.thumb} alt="" className="aspect-video w-full object-cover" />
              </div>
              <span className="mono mt-2 block text-center text-[11px] text-dim">{p.episode ?? p.id.toUpperCase()}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/** List view under the fan: every clip in the bin, with title and episode. */
function ClipList({ client }: { client: Client }) {
  const items = byClient(client)
  return (
    <AnimatePresence mode="wait">
      <motion.ul
        key={client}
        className="grid grid-cols-1 gap-3 border-t border-line p-3 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {items.map((p, i) => (
          <ClipRow key={p.id} p={p} i={i} />
        ))}
      </motion.ul>
    </AnimatePresence>
  )
}

function ClipRow({ p, i }: { p: ProjectView; i: number }) {
  const open = useOpenProject()
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}>
      <button
        onClick={() => open(p)}
        className="group flex w-full gap-3 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-line hover:bg-panel-2"
      >
        <div className="relative w-32 shrink-0 overflow-hidden rounded-md bg-black sm:w-28">
          <Img src={p.thumb} alt="" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon.play className="size-5 text-white" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="mono flex items-center gap-1.5 text-[10px] text-faint">
            <span className="size-1.5 rounded-[2px]" style={{ background: p.meta.color }} aria-hidden />
            {p.episode ?? p.clipName}
          </p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink">{p.title}</p>
        </div>
      </button>
    </motion.li>
  )
}

