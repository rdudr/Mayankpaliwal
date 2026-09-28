import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

// Loaded lazily — only desktop first visits ever download three.js.

const TW = 1024
const TH = 640
const SW = 4 // screen width in world units
const SH = (SW * TH) / TW
const PM = { x: 540, y: 28, w: 460, h: 260 } // Program Monitor in texture pixels
const pmCenter = new THREE.Vector3(((PM.x + PM.w / 2) / TW - 0.5) * SW, (0.5 - (PM.y + PM.h / 2) / TH) * SH, 0)

const clipsV1 = [
  ['#a393eb', 40, 330],
  ['#2ec4b6', 330, 470],
  ['#e0698e', 475, 560],
  ['#f2a93b', 590, 900],
] as const

function drawUI(ctx: CanvasRenderingContext2D, p: number) {
  ctx.fillStyle = '#1c1c1f'
  ctx.fillRect(0, 0, TW, TH)
  const panel = (x: number, y: number, w: number, h: number) => {
    ctx.fillStyle = '#26262a'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = '#35353b'
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
  }
  // Source monitor, program monitor, project bin, timeline
  panel(20, 28, 505, 260)
  panel(PM.x, PM.y, PM.w, PM.h)
  panel(20, 300, 220, 320)
  panel(250, 300, 754, 320)

  ctx.font = '14px monospace'
  ctx.fillStyle = '#a8a7a3'
  ctx.fillText('Source: A001_OPEN.mov', 32, 20)
  ctx.fillText('Program: Sequence 01', PM.x + 10, 20)

  // Program monitor picture: a slow gradient "frame"
  const g = ctx.createLinearGradient(PM.x, PM.y, PM.x + PM.w, PM.y + PM.h)
  g.addColorStop(0, '#1d2a3a')
  g.addColorStop(1, '#3b2a2e')
  ctx.fillStyle = g
  ctx.fillRect(PM.x + 8, PM.y + 8, PM.w - 16, PM.h - 16)
  ctx.fillStyle = '#ecebe8'
  ctx.font = 'italic 44px Georgia, serif'
  ctx.fillText('Mayank Paliwal', PM.x + 70, PM.y + PM.h / 2 + 14)

  // Bins
  ctx.font = '13px monospace'
  ;['DAUD_BTS', 'RAJ_SHAMANI', 'BEERBICEPS', 'FREELANCE'].forEach((b, i) => {
    ctx.fillStyle = ['#2ec4b6', '#f2a93b', '#e0698e', '#a393eb'][i]
    ctx.fillRect(34, 322 + i * 34, 14, 10)
    ctx.fillStyle = '#a8a7a3'
    ctx.fillText(b, 56, 332 + i * 34)
  })

  // Timeline tracks + clips
  const tx = 250
  ;['V2', 'V1', 'A1'].forEach((t, i) => {
    ctx.fillStyle = '#76767c'
    ctx.fillText(t, tx + 10, 360 + i * 60)
    ctx.fillStyle = '#2e2e33'
    ctx.fillRect(tx + 40, 335 + i * 60, 700, 44)
  })
  clipsV1.forEach(([c, a, b]) => {
    ctx.fillStyle = c
    ctx.fillRect(tx + 40 + (a * 700) / 1000, 395, ((b - a) * 700) / 1000 - 3, 44)
  })
  ctx.fillStyle = '#2ec4b6'
  ctx.fillRect(tx + 40 + 231, 335, 97, 44)
  ctx.fillStyle = '#2ec4b655'
  for (let i = 0; i < 140; i++) {
    const h = 6 + Math.abs(Math.sin(i * 1.7) * 16)
    ctx.fillRect(tx + 44 + i * 5, 477 - h / 2, 2, h)
  }

  // Render bar (yellow → green as it completes, like Premiere)
  ctx.fillStyle = p < 1 ? '#e8c34a' : '#28c840'
  ctx.fillRect(tx + 40, 325, 700 * p, 5)
  // Playhead
  const px = tx + 40 + 700 * p
  ctx.fillStyle = '#3b8cff'
  ctx.fillRect(px - 1, 318, 2, 290)
  ctx.font = '13px monospace'
  ctx.fillText(`Rendering… ${Math.round(p * 100)}%`, tx + 560, 608)
}

function Monitor({ progress }: { progress: React.MutableRefObject<number> }) {
  const canvas = useMemo(() => Object.assign(document.createElement('canvas'), { width: TW, height: TH }), [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  const ctx = canvas.getContext('2d')!

  useFrame(() => {
    drawUI(ctx, Math.min(progress.current * 1.25, 1))
    tex.needsUpdate = true
  })

  return (
    <group>
      <RoundedBox args={[SW + 0.24, SH + 0.24, 0.16]} radius={0.06} position={[0, 0, -0.09]}>
        <meshStandardMaterial color="#111114" roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[SW, SH]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -SH / 2 - 0.55, -0.2]}>
        <boxGeometry args={[0.25, 0.9, 0.12]} />
        <meshStandardMaterial color="#141417" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, -SH / 2 - 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#17171a" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Dolly({ progress, duration, onDone }: { progress: React.MutableRefObject<number>; duration: number; onDone: () => void }) {
  const { camera } = useThree()
  const t0 = useRef<number | null>(null)
  const done = useRef(false)
  const from = useMemo(() => new THREE.Vector3(-1.4, 0.4, 6.4), [])
  const to = useMemo(() => pmCenter.clone().setZ(1.05), [])
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    t0.current ??= state.clock.elapsedTime
    const t = Math.min((state.clock.elapsedTime - t0.current) / duration, 1)
    progress.current = t
    const e = t < 0.35 ? 0 : easeInOut((t - 0.35) / 0.65) // hold, then dolly in
    camera.position.lerpVectors(from, to, e)
    look.set(0, 0, 0).lerp(pmCenter, Math.min(1, e * 1.4))
    camera.lookAt(look)
    if (t >= 1 && !done.current) {
      done.current = true
      onDone()
    }
  })
  return null
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

export default function LoaderScene({ duration, onDone }: { duration: number; onDone: () => void }) {
  const progress = useRef(0)
  useEffect(() => () => void (progress.current = 0), [])
  return (
    <Canvas camera={{ fov: 40, position: [-1.4, 0.4, 6.4] }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
      <color attach="background" args={['#101012']} />
      <fog attach="fog" args={['#101012', 6, 14]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[2, 3, 4]} intensity={30} color="#9fc2ff" />
      <pointLight position={[-3, 1, 2]} intensity={12} color="#f2a93b" />
      <Monitor progress={progress} />
      <Dolly progress={progress} duration={duration} onDone={onDone} />
    </Canvas>
  )
}
