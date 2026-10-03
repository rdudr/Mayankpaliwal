import { useSyncExternalStore } from 'react'
import { cam, trans, TRANS_SECONDS } from '../scene/progress'
import { blip, setAmbience } from './sound'

/**
 * Full-page navigation, like the reference: the site is four screens and a
 * small scroll / swipe / key press moves a whole page. Pages taller than the
 * screen scroll inside themselves first.
 */
export const PAGES = ['home', 'about', 'work', 'contact'] as const
export type PageId = (typeof PAGES)[number]

let index = 0
let busyUntil = 0
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export const usePage = () =>
  useSyncExternalStore(
    (cb) => (subs.add(cb), () => subs.delete(cb)),
    () => index,
    () => 0,
  )

export const currentPage = () => index
export const isBusy = () => performance.now() < busyUntil

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** How long the page slide takes (home ↔ about matches the 3D fall). */
export function slideSeconds(from: number, to: number) {
  if (reduced()) return 0
  return from + to === 1 ? TRANS_SECONDS : 1.0
}

let camTimer: ReturnType<typeof setTimeout> | undefined

export function goTo(target: number | PageId) {
  const i = Math.max(0, Math.min(PAGES.length - 1, typeof target === 'number' ? target : PAGES.indexOf(target)))
  if (i === index) return false
  const from = index
  const dur = slideSeconds(from, i)
  index = i

  // 3D: home ↔ lab is the fall; the contact scene is cut to while the opaque
  // projects page covers the screen.
  trans.target = i >= 1 ? 1 : 0
  const jump = Math.abs(i - from) > 1
  if (jump) trans.value = trans.target
  clearTimeout(camTimer)
  if (i >= 2 && !cam.contact) {
    if (jump || from === 3) cam.contact = true
    else camTimer = setTimeout(() => index >= 2 && (cam.contact = true), dur * 1000)
  } else if (i < 2) cam.contact = false

  // Sound cues, timed to the reference's beats
  blip(i > from ? 'whoosh' : 'whooshUp')
  if (from === 0 && i === 1) {
    blip('splash', dur * 0.84) // hits the tube
    blip('hologram', dur * 0.95)
  } else if (from === 1 && i === 0) blip('pop', dur * 0.92) // room bounces back in
  setAmbience(PAGES[i])

  busyUntil = performance.now() + dur * 1000 + 450
  emit()
  return true
}
