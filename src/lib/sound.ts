import { useSyncExternalStore } from 'react'

/**
 * Sound design modelled on the reference site's cues (room ambience + typing,
 * birds, transition whoosh, water splash, bubbles, hologram, lab hum, clicks) —
 * all synthesised with WebAudio, so there are no audio files to license or load.
 * Off by default; the speaker button turns it on.
 */

let muted = true
const listeners = new Set<() => void>()
let ctx: AudioContext | undefined
let master: GainNode | undefined
let noiseBuf: AudioBuffer | undefined

export const useMuted = () =>
  useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    () => muted,
    () => true,
  )

function audio() {
  if (!ctx) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return { ctx, master: master!, noise: noiseBuf! }
}

export function setMuted(m: boolean) {
  muted = m
  listeners.forEach((l) => l())
  const { ctx, master } = audio()
  if (!m && ctx.state === 'suspended') ctx.resume()
  master.gain.cancelScheduledValues(ctx.currentTime)
  master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.15)
  if (!m) {
    blip('click')
    setAmbience(currentAmbience)
  }
}

/* ── building blocks ─────────────────────────────────────────── */

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone(freq: number, dur: number, peak: number, type: OscillatorType = 'sine', at = 0, slideTo?: number, dest?: AudioNode) {
  const { ctx, master } = audio()
  const t = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  env(g, t, peak, Math.min(0.02, dur / 4), dur)
  o.connect(g).connect(dest ?? master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function noise(dur: number, peak: number, filter: BiquadFilterType, f0: number, f1 = f0, at = 0, q = 1, dest?: AudioNode) {
  const { ctx, master, noise } = audio()
  const t = ctx.currentTime + at
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const bq = ctx.createBiquadFilter()
  bq.type = filter
  bq.Q.value = q
  bq.frequency.setValueAtTime(f0, t)
  bq.frequency.exponentialRampToValueAtTime(f1, t + dur)
  const g = ctx.createGain()
  env(g, t, peak, Math.min(0.08, dur / 3), dur)
  src.connect(bq).connect(g).connect(dest ?? master)
  src.start(t, Math.random())
  src.stop(t + dur + 0.1)
}

/* ── one-shot cues ───────────────────────────────────────────── */

const cues = {
  click: () => tone(1250, 0.05, 0.08, 'triangle'),
  tick: () => tone(1900, 0.03, 0.04, 'square'),
  toggle: () => tone(620, 0.1, 0.07, 'sine', 0, 880),
  razor: () => noise(0.09, 0.06, 'highpass', 2500),
  /** page transition */
  whoosh: () => noise(0.75, 0.18, 'bandpass', 300, 2600, 0, 0.8),
  whooshUp: () => noise(0.75, 0.18, 'bandpass', 2600, 300, 0, 0.8),
  /** landing in the tube */
  splash: () => {
    noise(0.55, 0.35, 'lowpass', 3200, 500)
    noise(0.25, 0.2, 'highpass', 3000, 6000)
    bubbles(6, 0.12)
  },
  bubbles: () => bubbles(5),
  /** hologram materialising */
  hologram: () => {
    tone(220, 1.1, 0.06, 'sawtooth', 0, 880)
    tone(330, 1.1, 0.05, 'sine', 0.05, 1320)
    for (let i = 0; i < 6; i++) tone(1400 + i * 260, 0.08, 0.03, 'sine', 0.15 + i * 0.12)
  },
  /** room bouncing back in */
  pop: () => {
    tone(180, 0.18, 0.12, 'sine', 0, 90)
    noise(0.12, 0.08, 'lowpass', 900)
  },
  /** dropping into the desk chair */
  chairImpact: () => {
    tone(110, 0.22, 0.25, 'sine', 0, 55)
    noise(0.18, 0.12, 'lowpass', 700, 200)
    noise(0.35, 0.05, 'bandpass', 900, 500, 0.18, 4) // chair creak
  },
  typing: () => typingBurst(),
  notification: () => {
    tone(880, 0.16, 0.05, 'sine')
    tone(1320, 0.22, 0.05, 'sine', 0.12)
  },
}

function bubbles(n: number, at = 0) {
  for (let i = 0; i < n; i++) {
    const f = 500 + Math.random() * 700
    tone(f, 0.07, 0.05, 'sine', at + i * 0.06 + Math.random() * 0.05, f * 2.2)
  }
}

export type Cue = keyof typeof cues

export function blip(kind: Cue = 'click', delay = 0) {
  if (muted) return
  if (delay) setTimeout(() => !muted && cues[kind](), delay * 1000)
  else cues[kind]()
}

/* ── ambience per page ───────────────────────────────────────── */

type Amb = 'home' | 'about' | 'work' | 'contact'
let currentAmbience: Amb = 'home'
let bed: { stop: () => void } | undefined
let timers: ReturnType<typeof setTimeout>[] = []

function loopNoiseBed(filter: BiquadFilterType, freq: number, gain: number, hum?: number[]) {
  const { ctx, master, noise } = audio()
  const out = ctx.createGain()
  out.gain.value = 0.0001
  out.gain.setTargetAtTime(gain, ctx.currentTime, 0.8)
  out.connect(master)
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const bq = ctx.createBiquadFilter()
  bq.type = filter
  bq.frequency.value = freq
  src.connect(bq).connect(out)
  src.start()
  const oscs = (hum ?? []).map((f) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = f
    g.gain.value = 0.35
    o.connect(g).connect(out)
    o.start()
    return o
  })
  return {
    stop: () => {
      out.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4)
      setTimeout(() => (src.stop(), oscs.forEach((o) => o.stop()), out.disconnect()), 1500)
    },
  }
}

function every(min: number, max: number, fn: () => void) {
  const run = () => {
    timers.push(setTimeout(() => (fn(), run()), (min + Math.random() * (max - min)) * 1000))
  }
  run()
}

function typingBurst() {
  const keys = 6 + Math.floor(Math.random() * 10)
  for (let i = 0; i < keys; i++) {
    const at = i * (0.07 + Math.random() * 0.08)
    noise(0.03, 0.06, 'bandpass', 2200 + Math.random() * 1500, undefined, at, 3)
    tone(140 + Math.random() * 40, 0.03, 0.03, 'triangle', at)
  }
}

function bird() {
  const base = 2600 + Math.random() * 900
  for (let i = 0; i < 3; i++) tone(base, 0.09, 0.025, 'sine', i * 0.13, base * 1.35)
}

export function setAmbience(page: Amb) {
  currentAmbience = page
  bed?.stop()
  bed = undefined
  timers.forEach(clearTimeout)
  timers = []
  if (muted) return
  if (page === 'home') {
    bed = loopNoiseBed('lowpass', 500, 0.025)
    every(2.5, 6, typingBurst)
    every(9, 16, bird)
    every(18, 30, () => cues.notification())
  } else if (page === 'about') {
    bed = loopNoiseBed('bandpass', 700, 0.02, [60, 120])
    every(1.2, 3.5, () => bubbles(1 + Math.floor(Math.random() * 3)))
  }
}
