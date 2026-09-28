import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import type { Client } from '../content/site'
import { byClient } from '../lib/projects'
import { useFinePointer, useReducedMotion } from '../lib/hooks'
import { Img } from '../lib/media'
import { blip } from '../lib/sound'
import { clientMeta, cx } from '../lib/util'
import { useOpenProject } from './ProjectModal'
import { SectionHead } from './ui'

const bins: Client[] = ['daud', 'raj-shamani', 'beerbiceps', 'freelance']

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

export default function Bins() {
  const [active, setActive] = useState<Client>('daud')
  const fine = useFinePointer()
  const reduced = useReducedMotion()

  const pick = (c: Client) => {
    if (c !== active) blip('tick')
    setActive(c)
  }

  return (
    <motion.section
      id="bins"
      aria-labelledby="bins-title"
      className="section-pad mx-auto max-w-[1500px] py-20 md:py-32"
      initial={reduced ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-20% 0px' }}
      transition={{ duration: 1.1, ease: 'easeInOut' }}
    >
      <SectionHead
        id="bins"
        title={<span id="bins-title">The <em>bins</em></span>}
        intro="Every client gets a bin. Open one to fan out what's inside."
      />

      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <div className="mono flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-dim">
          <span>Project: Mayank_Paliwal.prproj</span>
          <span className="hidden sm:inline">{bins.reduce((n, c) => n + byClient(c).length, 0)} items</span>
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
                aria-controls="bin-fan"
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

        <Fan client={active} />
      </div>
    </motion.section>
  )
}

function Fan({ client }: { client: Client }) {
  const stage = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(800)
  const open = useOpenProject()
  const items = byClient(client)
  const color = clientMeta[client].color

  useEffect(() => {
    if (!stage.current) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(stage.current)
    return () => ro.disconnect()
  }, [])

  const n = items.length
  const cardW = Math.min(260, Math.max(120, w * (n > 3 ? 0.24 : 0.3)))
  const mid = (n - 1) / 2
  const stepX = n > 1 ? Math.min(cardW * 0.78, (w - cardW * 1.3 - 24) / (n - 1)) : 0
  const stepR = Math.min(7, 36 / Math.max(n, 1))

  return (
    <div
      id="bin-fan"
      role="tabpanel"
      ref={stage}
      className="relative border-t border-line bg-[#202024]"
      style={{ height: cardW * 0.5625 + 150 }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((p, i) => {
          const d = i - mid
          return (
            <motion.button
              key={p.id}
              onClick={() => open(p)}
              aria-label={`Open ${p.displayTitle}`}
              className="absolute left-1/2 top-[58%] origin-bottom"
              style={{ width: cardW, marginLeft: -cardW / 2, marginTop: -(cardW * 0.5625) / 2, zIndex: 10 + i }}
              initial={{ opacity: 0, x: 0, y: 60, rotate: 0, scale: 0.8 }}
              animate={{ opacity: 1, x: d * stepX, y: Math.abs(d) * 8, rotate: d * stepR, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.85, transition: { duration: 0.15 } }}
              whileHover={{ y: -18, rotate: 0, scale: 1.06, zIndex: 50 }}
              whileFocus={{ y: -18, rotate: 0, scale: 1.06, zIndex: 50 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24, delay: i * 0.035 }}
            >
              <div className="overflow-hidden rounded-md border-2 bg-panel shadow-[0_18px_40px_-12px_rgba(0,0,0,.8)]" style={{ borderColor: color }}>
                <Img src={p.thumb} alt="" className="aspect-video w-full object-cover" />
              </div>
              <span className="mono mt-2 block text-center text-[11px] text-dim">{p.id.toUpperCase()}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
