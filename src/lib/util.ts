import type { Client } from '../content/site'

export const FPS = 25

/** Seconds → HH:MM:SS:FF, the way Premiere shows it. */
export function timecode(seconds: number, fps = FPS) {
  const s = Math.max(0, seconds)
  const f = Math.floor((s % 1) * fps)
  const t = Math.floor(s)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(t / 3600))}:${pad(Math.floor(t / 60) % 60)}:${pad(t % 60)}:${pad(f)}`
}

/** Hides unfinished "TODO" copy from the live site. */
export function tbc(value: string | undefined, fallback = '') {
  return !value || value.includes('TODO') ? fallback : value
}

export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
  return m?.[1]
}

export function instagramId(url: string) {
  return url.match(/instagram\.com\/(?:reel|p)\/([\w-]+)/)?.[1]
}

export const clientMeta: Record<Client, { label: string; bin: string; color: string }> = {
  'raj-shamani': { label: 'Raj Shamani', bin: 'RAJ_SHAMANI', color: 'var(--c-mango)' },
  beerbiceps: { label: 'BeerBiceps', bin: 'BEERBICEPS', color: 'var(--c-rose)' },
  daud: { label: 'Daud', bin: 'DAUD_BTS', color: 'var(--c-teal)' },
  freelance: { label: 'Freelance', bin: 'FREELANCE', color: 'var(--c-lavender)' },
}

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
