import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { useScrollLock } from '../lib/hooks'
import { blip } from '../lib/sound'
import { cx } from '../lib/util'

/** Reference-style heading: a short orange rule + orange kicker, then the big title. */
export function SectionHead({ kicker, title, intro, className, light }: { kicker: string; title: ReactNode; intro?: ReactNode; className?: string; light?: boolean }) {
  return (
    <header className={cx('mb-10 max-w-3xl md:mb-12', className)}>
      <motion.div
        className="mb-4 flex items-center gap-5"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.45 }}
      >
        <span aria-hidden className="h-0.5 w-10 bg-orange" />
        <span className="text-[1.15rem] font-medium text-orange">{kicker}</span>
      </motion.div>
      <motion.h2
        className={cx('text-[clamp(2.6rem,6vw,4.3rem)] font-semibold leading-[1.15] tracking-[-0.02em]', light ? 'text-white' : 'text-navy')}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.1, 1] }}
      >
        {title}
      </motion.h2>
      {intro && <p className="mt-4 max-w-xl text-lg text-slate">{intro}</p>}
    </header>
  )
}

export function Dot({ color, className }: { color: string; className?: string }) {
  return <span aria-hidden className={cx('inline-block size-2 shrink-0 rounded-[2px]', className)} style={{ background: color }} />
}

/** Accessible dialog: Esc closes, focus is trapped and restored. */
export function Modal({ open, onClose, label, children, className }: { open: boolean; onClose: () => void; label: string; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[data-autofocus],button')?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !ref.current) return
      const f = [...ref.current.querySelectorAll<HTMLElement>('button,a[href],input,textarea,select,iframe,[tabindex]:not([tabindex="-1"])')]
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={cx('relative max-h-full w-full overflow-auto rounded-[20px] border border-[#ece4d8] bg-white shadow-2xl', className)}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function CloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={() => (blip('click'), onClick())}
      aria-label="Close"
      className={cx('grid size-11 place-items-center rounded-full bg-black/50 text-ink transition-colors hover:bg-black/80', className)}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" /></svg>
    </button>
  )
}

export const Icon = {
  play: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
  ),
  pause: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg>
  ),
  arrow: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>
  ),
  external: (p: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={p.className} aria-hidden><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" stroke="currentColor" strokeWidth="1.8" fill="none" /></svg>
  ),
}
