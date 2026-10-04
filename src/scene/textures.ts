import * as THREE from 'three'

export type Ctx = CanvasRenderingContext2D

export function makeCanvas(w: number, h: number) {
  const canvas = Object.assign(document.createElement('canvas'), { width: w, height: h })
  const ctx = canvas.getContext('2d')!
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { canvas, ctx, tex }
}

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

const CLIPS = ['#f2a93b', '#e0698e', '#2ec4b6', '#a393eb', '#f2a93b', '#2ec4b6']

/** Left monitor: a Premiere-style timeline with a moving playhead. */
export function drawTimeline(ctx: Ctx, w: number, h: number, t: number) {
  ctx.fillStyle = '#2b2a35'
  ctx.fillRect(0, 0, w, h)
  // side panel
  ctx.fillStyle = '#34333f'
  ctx.fillRect(0, 0, w * 0.18, h)
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i === 1 ? '#6f8cff' : '#4a4957'
    rr(ctx, 12, 18 + i * 34, w * 0.18 - 24, 20, 4)
    ctx.fill()
  }
  // ruler
  ctx.fillStyle = '#3c3b48'
  ctx.fillRect(w * 0.18, 0, w, 22)
  // tracks
  const tx = w * 0.18 + 10
  const tw = w - tx - 10
  const rows = [40, 78, 116, 160, 196]
  rows.forEach((y, r) => {
    ctx.fillStyle = '#33323e'
    ctx.fillRect(tx, y, tw, r < 3 ? 30 : 26)
    let x = tx + ((r * 37) % 60)
    let k = r
    while (x < tx + tw - 30) {
      const cw = 50 + ((k * 53) % 110)
      ctx.fillStyle = r < 3 ? CLIPS[k % CLIPS.length] : '#2ec4b6aa'
      rr(ctx, x, y + 2, Math.min(cw, tx + tw - x), (r < 3 ? 30 : 26) - 4, 3)
      ctx.fill()
      if (r >= 3) {
        ctx.fillStyle = '#1f6f68'
        for (let i = 0; i < cw; i += 4) {
          const a = 4 + Math.abs(Math.sin((i + k * 13) * 0.3)) * 8
          ctx.fillRect(x + i, y + 13 - a / 2, 2, a)
        }
      }
      x += cw + 6 + ((k * 7) % 14)
      k++
    }
  })
  // playhead
  const px = tx + ((t * 40) % tw)
  ctx.fillStyle = '#3b8cff'
  ctx.fillRect(px, 0, 3, h)
  ctx.beginPath()
  ctx.moveTo(px - 7, 0)
  ctx.lineTo(px + 10, 0)
  ctx.lineTo(px + 1.5, 12)
  ctx.fill()
}

/** Right monitor: the Program monitor, showing a real frame from his work. */
export function drawProgram(ctx: Ctx, w: number, h: number, img: HTMLImageElement | null, t: number) {
  ctx.fillStyle = '#23222c'
  ctx.fillRect(0, 0, w, h)
  const fw = w - 40
  const fh = fw * 0.5625
  const fy = 18
  if (img?.complete && img.naturalWidth) ctx.drawImage(img, 20, fy, fw, fh)
  else {
    const g = ctx.createLinearGradient(0, fy, 0, fy + fh)
    g.addColorStop(0, '#9ec9f0')
    g.addColorStop(1, '#f3c58a')
    ctx.fillStyle = g
    ctx.fillRect(20, fy, fw, fh)
  }
  // transport bar
  ctx.fillStyle = '#3a3946'
  ctx.fillRect(20, fy + fh + 12, fw, 6)
  ctx.fillStyle = '#3b8cff'
  ctx.fillRect(20, fy + fh + 12, fw * ((t * 0.05) % 1), 6)
  ctx.fillStyle = '#d7d6e0'
  ctx.font = '600 16px monospace'
  const s = Math.floor(t * 25)
  const tc = `00:${String(Math.floor(s / 1500) % 60).padStart(2, '0')}:${String(Math.floor(s / 25) % 60).padStart(2, '0')}:${String(s % 25).padStart(2, '0')}`
  ctx.fillText(tc, 22, h - 16)
  ctx.fillStyle = '#ff5a4f'
  ctx.beginPath()
  ctx.arc(w - 34, h - 22, 6, 0, Math.PI * 2)
  ctx.fill()
}

/** Lab monitor: a live audio waveform. */
export function drawWaveform(ctx: Ctx, w: number, h: number, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#0d4fa8')
  g.addColorStop(1, '#0a3478')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(120,200,255,.18)'
  ctx.lineWidth = 1
  for (let x = 0; x < w; x += 32) (ctx.beginPath(), ctx.moveTo(x, 0), ctx.lineTo(x, h), ctx.stroke())
  for (let y = 0; y < h; y += 32) (ctx.beginPath(), ctx.moveTo(0, y), ctx.lineTo(w, y), ctx.stroke())
  const mid = h / 2
  ctx.beginPath()
  for (let x = 0; x <= w; x += 3) {
    const k = x / w
    const env = Math.sin(k * Math.PI) * 0.9
    const y = mid + Math.sin(k * 26 + t * 4) * Math.sin(k * 7 - t * 1.3) * h * 0.36 * env
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.lineTo(w, h)
  ctx.lineTo(0, h)
  ctx.closePath()
  ctx.fillStyle = 'rgba(52,191,255,.35)'
  ctx.fill()
  ctx.strokeStyle = '#7fd6ff'
  ctx.lineWidth = 3
  ctx.stroke()
}

export type AppKind = 'pr' | 'ae' | 'ps' | 'ai' | 'fcp' | 'dvr'

export const toolLogo: Record<string, AppKind> = {
  'Premiere Pro': 'pr',
  'After Effects': 'ae',
  Photoshop: 'ps',
  Illustrator: 'ai',
  'Final Cut Pro': 'fcp',
  'DaVinci Resolve': 'dvr',
}

/** App icons drawn from scratch — simple, recognisable tiles in each app's colours. */
export function drawAppLogo(ctx: Ctx, s: number, kind: AppKind) {
  ctx.clearRect(0, 0, s, s)
  const r = s * 0.2
  const adobe: Partial<Record<AppKind, [string, string, string]>> = {
    pr: ['#00005b', '#9999ff', 'Pr'],
    ae: ['#00005b', '#d291ff', 'Ae'],
    ps: ['#001e36', '#31a8ff', 'Ps'],
    ai: ['#330000', '#ff9a00', 'Ai'],
  }
  const a = adobe[kind]
  if (a) {
    ctx.fillStyle = a[0]
    rr(ctx, 0, 0, s, s, r)
    ctx.fill()
    ctx.strokeStyle = a[1]
    ctx.lineWidth = s * 0.05
    rr(ctx, s * 0.06, s * 0.06, s * 0.88, s * 0.88, r * 0.75)
    ctx.stroke()
    ctx.fillStyle = a[1]
    ctx.font = `600 ${s * 0.44}px Poppins, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(a[2], s / 2, s * 0.53)
    return
  }
  if (kind === 'fcp') {
    const g = ctx.createLinearGradient(0, 0, s, s)
    g.addColorStop(0, '#2b2b33')
    g.addColorStop(1, '#0f0f14')
    ctx.fillStyle = g
    rr(ctx, 0, 0, s, s, r)
    ctx.fill()
    // clapper in a rainbow gradient
    const c = ctx.createLinearGradient(s * 0.2, s * 0.25, s * 0.8, s * 0.8)
    c.addColorStop(0, '#ffd166')
    c.addColorStop(0.35, '#ef476f')
    c.addColorStop(0.7, '#7b5cff')
    c.addColorStop(1, '#2ec4ff')
    ctx.fillStyle = c
    rr(ctx, s * 0.2, s * 0.44, s * 0.6, s * 0.34, s * 0.05)
    ctx.fill()
    ctx.save()
    ctx.translate(s * 0.2, s * 0.42)
    ctx.rotate(-0.28)
    rr(ctx, 0, -s * 0.12, s * 0.6, s * 0.11, s * 0.03)
    ctx.fill()
    ctx.fillStyle = '#16161c'
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(s * (0.06 + i * 0.15), -s * 0.12)
      ctx.lineTo(s * (0.13 + i * 0.15), -s * 0.12)
      ctx.lineTo(s * (0.08 + i * 0.15), -s * 0.01)
      ctx.lineTo(s * (0.01 + i * 0.15), -s * 0.01)
      ctx.fill()
    }
    ctx.restore()
    return
  }
  // DaVinci-style: three petals on dark
  ctx.fillStyle = '#1b1b20'
  rr(ctx, 0, 0, s, s, r)
  ctx.fill()
  const petals: [string, number][] = [['#f6743a', -Math.PI / 2], ['#3aa8f4', Math.PI / 6], ['#5ed07a', (5 * Math.PI) / 6]]
  ctx.globalCompositeOperation = 'lighter'
  for (const [col, ang] of petals) {
    ctx.fillStyle = col
    ctx.beginPath()
    ctx.arc(s / 2 + Math.cos(ang) * s * 0.12, s / 2 + Math.sin(ang) * s * 0.12, s * 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'
}

/** Sticky note with handwritten-ish text. */
export function drawNote(ctx: Ctx, w: number, h: number, lines: string[], color: string) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(9,20,52,.75)'
  ctx.font = `500 ${h * 0.13}px Poppins, sans-serif`
  lines.forEach((l, i) => ctx.fillText(l, w * 0.1, h * (0.3 + i * 0.2)))
}

/** Wall-frame art: the YouTube or Instagram logo, drawn from scratch. */
export function drawSocialLogo(ctx: Ctx, s: number, kind: 'youtube' | 'instagram') {
  ctx.fillStyle = '#f7f4ee'
  ctx.fillRect(0, 0, s, s)
  if (kind === 'youtube') {
    const w = s * 0.7
    const h = w * 0.7
    ctx.fillStyle = '#ff0033'
    rr(ctx, (s - w) / 2, (s - h) / 2, w, h, h * 0.28)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.moveTo(s * 0.43, s * 0.39)
    ctx.lineTo(s * 0.43, s * 0.61)
    ctx.lineTo(s * 0.62, s * 0.5)
    ctx.closePath()
    ctx.fill()
    return
  }
  const w = s * 0.66
  const x = (s - w) / 2
  const g = ctx.createLinearGradient(x, x + w, x + w, x)
  g.addColorStop(0, '#feda75')
  g.addColorStop(0.3, '#fa7e1e')
  g.addColorStop(0.6, '#d62976')
  g.addColorStop(0.85, '#962fbf')
  g.addColorStop(1, '#4f5bd5')
  ctx.fillStyle = g
  rr(ctx, x, x, w, w, w * 0.28)
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = w * 0.075
  rr(ctx, x + w * 0.2, x + w * 0.2, w * 0.6, w * 0.6, w * 0.18)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(s / 2, s / 2, w * 0.15, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x + w * 0.69, x + w * 0.31, w * 0.045, 0, Math.PI * 2)
  ctx.fill()
}
