import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { profile } from '../content/site'
import { Video } from '../lib/media'
import { blip } from '../lib/sound'
import { timecode, FPS } from '../lib/util'
import { CloseButton, Icon, Modal } from './ui'

const ReelCtx = createContext<{ open: () => void }>({ open: () => {} })
export const useReel = () => useContext(ReelCtx)

export function ReelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => (blip('click'), setOpen(true)), [])
  const close = useCallback(() => setOpen(false), [])
  return (
    <ReelCtx.Provider value={{ open }}>
      {children}
      <Modal open={isOpen} onClose={close} label="Showreel" className="max-w-6xl bg-black">
        <ReelPlayer onClose={close} />
      </Modal>
    </ReelCtx.Provider>
  )
}

/** Full reel with sound. J / K / L, Space and ← → work like Premiere's transport. */
function ReelPlayer({ onClose }: { onClose: () => void }) {
  const v = useRef<HTMLVideoElement>(null)
  const [t, setT] = useState(0)
  const [dur, setDur] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)

  const toggle = useCallback(() => {
    const el = v.current
    if (!el) return
    el.paused ? el.play() : el.pause()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = v.current
      if (!el || (e.target as HTMLElement).tagName === 'INPUT') return
      const k = e.key.toLowerCase()
      if (k === ' ') (e.preventDefault(), toggle())
      else if (k === 'k') el.pause()
      else if (k === 'l') {
        const next = el.paused ? 1 : Math.min(el.playbackRate * 2, 4)
        el.playbackRate = next
        setRate(next)
        el.play()
      } else if (k === 'j') {
        // Browsers can't play backwards, so J jumps back 5s like a shuttle nudge.
        el.currentTime = Math.max(0, el.currentTime - 5)
        el.playbackRate = 1
        setRate(1)
      } else if (k === 'arrowleft') (e.preventDefault(), el.pause(), (el.currentTime -= 1 / FPS))
      else if (k === 'arrowright') (e.preventDefault(), el.pause(), (el.currentTime += 1 / FPS))
      else if (k === 'm') el.muted = !el.muted
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return (
    <div className="relative">
      <Video
        ref={v}
        src={profile.showreel}
        poster={profile.showreelPoster}
        autoPlay
        className="aspect-video max-h-[72svh] w-full bg-black object-contain"
        onClick={toggle}
        onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <CloseButton onClick={onClose} className="absolute right-3 top-3" />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-panel px-3 py-3 sm:px-4">
        <button
          onClick={toggle}
          data-autofocus
          aria-label={playing ? 'Pause' : 'Play'}
          className="grid size-11 place-items-center rounded-full bg-orange text-white"
        >
          {playing ? <Icon.pause className="size-4" /> : <Icon.play className="size-4" />}
        </button>
        <span className="mono text-sm tabular-nums text-orange">{timecode(t)}</span>
        <label className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <span className="sr-only">Scrub reel</span>
          <input
            type="range"
            min={0}
            max={dur || 1}
            step={1 / FPS}
            value={t}
            onChange={(e) => v.current && (v.current.currentTime = +e.target.value)}
            className="h-11 w-full accent-[var(--color-orange)]"
          />
        </label>
        <span className="mono text-sm tabular-nums text-faint">{timecode(dur)}</span>
        {rate > 1 && <span className="mono rounded bg-orange/20 px-1.5 text-xs text-orange">{rate}×</span>}
        <p className="mono ml-auto hidden text-xs text-faint lg:block">J ◂ · K ■ · L ▸ · Space · ← →</p>
      </div>
    </div>
  )
}
