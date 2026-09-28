import { useSyncExternalStore } from 'react'

// Tiny UI sounds synthesised with WebAudio — no files to load. Muted by default.
let muted = true
const listeners = new Set<() => void>()
let ctx: AudioContext | undefined

export function setMuted(m: boolean) {
  muted = m
  listeners.forEach((l) => l())
  if (!m) blip('toggle')
}

export const useMuted = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => muted,
    () => true,
  )

const presets = {
  tick: { f: 1800, d: 0.025, g: 0.04, type: 'square' as OscillatorType },
  click: { f: 900, d: 0.05, g: 0.06, type: 'triangle' as OscillatorType },
  toggle: { f: 520, d: 0.09, g: 0.07, type: 'sine' as OscillatorType },
  razor: { f: 240, d: 0.06, g: 0.08, type: 'sawtooth' as OscillatorType },
}

export function blip(kind: keyof typeof presets = 'click') {
  if (muted) return
  ctx ??= new AudioContext()
  const p = presets[kind]
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = p.type
  o.frequency.value = p.f
  g.gain.setValueAtTime(p.g, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + p.d)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + p.d)
}
