import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { profile } from '../content/site'
import { useScrollLock } from '../lib/hooks'
import { goTo, PAGES, usePage } from '../lib/pager'
import { blip, setMuted, useMuted } from '../lib/sound'
import { cx } from '../lib/util'
import Logo from './Logo'
import { Social } from './Social'

export const pages = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
] as const

export default function Nav() {
  const [open, setOpen] = useState(false)
  const muted = useMuted()
  const active = PAGES[usePage()]
  const dark = active === 'about'
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open])

  const go = (id: string) => {
    blip('click')
    setOpen(false)
    goTo(id as (typeof PAGES)[number])
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className="content-width flex items-center justify-between py-4 sm:py-5">
          <a
            href="#home"
            onClick={(e) => (e.preventDefault(), go('home'))}
            aria-label={`${profile.name} — home`}
            className={cx('pointer-events-auto flex items-center gap-2.5 rounded-xl transition-colors', dark ? 'text-white' : 'text-navy')}
          >
            <span className={cx('grid place-items-center rounded-xl transition-colors', dark && 'bg-white/90 p-0.5')}>
              <Logo size={46} />
            </span>
          </a>
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={() => setMuted(!muted)}
              aria-pressed={!muted}
              aria-label={muted ? 'Turn sounds on' : 'Turn sounds off'}
              className="grid size-11 place-items-center rounded-xl bg-[#c9c9cc] text-white transition-transform hover:scale-105 active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
                <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                {muted ? (
                  <path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                ) : (
                  <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                )}
              </svg>
            </button>
            <button
              onClick={() => (blip('click'), setOpen(true))}
              aria-label="Open menu"
              aria-expanded={open}
              className="btn-orange grid size-11 place-items-center !rounded-xl"
            >
              <span className="flex flex-col gap-[5px]">
                {[0, 1, 2].map((i) => <span key={i} className="block h-[3.5px] w-6 rounded-full bg-white" />)}
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-navy/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.nav
              aria-label="Main menu"
              className="fixed inset-y-0 right-0 z-[61] flex w-full flex-col bg-white p-8 sm:w-[min(420px,45vw)] sm:p-12"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.5, ease: [0.65, 0.05, 0.36, 1] }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                autoFocus
                className="btn-orange ml-auto grid size-11 place-items-center !rounded-xl"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </button>
              <ul className="flex flex-1 flex-col justify-center gap-2">
                {pages.map((p, i) => (
                  <motion.li key={p.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                    <button
                      onClick={() => go(p.id)}
                      aria-current={active === p.id ? 'page' : undefined}
                      className={cx(
                        'relative py-2 text-[1.8rem] font-semibold text-navy transition-transform hover:translate-x-1',
                        active === p.id && 'translate-x-7 before:absolute before:-left-7 before:top-1/2 before:size-3.5 before:-translate-y-1/2 before:rounded-full before:bg-orange',
                      )}
                    >
                      {p.label}
                    </button>
                  </motion.li>
                ))}
              </ul>
              <hr className="my-6 h-0.5 border-0 bg-[#f0f0f0]" />
              <Social className="justify-start" />
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
