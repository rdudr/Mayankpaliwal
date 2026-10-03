import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import ContactScene from './ContactScene'
import Lab from './Lab'
import Room from './Room'

// Scenes live side by side in one world; the camera flies between them.
const LAB_X = 40
const CONTACT_X = 80

type Shot = {
  pos: THREE.Vector3
  target: THREE.Vector3
  bg: THREE.Color
  /** Desktop: shift the picture sideways (fraction of width, negative = to the right). */
  sx: number
  /** Mobile: shift the picture vertically (fraction of height, negative = lower). */
  sy: number
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const shots: Shot[] = [
  { pos: v(5.6, 4.6, 7.6), target: v(0.15, 1.45, -0.2), bg: new THREE.Color('#F5EFE6'), sx: -0.2, sy: -0.2 },
  { pos: v(LAB_X + 4.3, 3.2, 8.2), target: v(LAB_X + 0.15, 1.95, 0), bg: new THREE.Color('#0B3D91'), sx: -0.21, sy: 0.17 },
  { pos: v(CONTACT_X + 4.6, 3.6, 7.2), target: v(CONTACT_X, 1.55, 0), bg: new THREE.Color('#F5EFE6'), sx: -0.22, sy: -0.22 },
]

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Reads section positions from the page and maps scroll → camera shot. */
function Rig() {
  const { camera, scene, size } = useThree()
  const marks = useRef({ a0: 0, a1: 1, b0: 2, b1: 3 })
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const bg = useMemo(() => new THREE.Color(), [])
  const smooth = useRef<number | null>(null)

  useEffect(() => {
    const measure = () => {
      const top = (id: string) => (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + scrollY
      const vh = innerHeight
      const aboutTop = top('about')
      const workTop = top('work')
      const workH = document.getElementById('work')?.offsetHeight ?? vh
      marks.current = {
        a0: 0,
        a1: Math.max(1, aboutTop), // home → lab while the about page slides up
        b0: workTop + 0.05 * vh, // lab → contact while the projects page covers the screen
        b1: workTop + Math.max(0.1 * vh, Math.min(workH - vh, vh) * 0.8),
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    addEventListener('resize', measure)
    return () => (ro.disconnect(), removeEventListener('resize', measure))
  }, [])

  useFrame((_, dt) => {
    const y = scrollY
    const m = marks.current
    // 0 = room, 1 = lab, 2 = contact
    const raw = y < m.b0 ? clamp01((y - m.a0) / (m.a1 - m.a0)) : 1 + clamp01((y - m.b0) / (m.b1 - m.b0))
    // Light damping so wheel steps glide instead of jump
    smooth.current = smooth.current === null ? raw : THREE.MathUtils.damp(smooth.current, raw, 6, dt)
    const s = Math.abs(smooth.current - raw) > 0.6 ? raw : smooth.current
    const i = Math.min(1, Math.floor(s))
    const k = ease(s - i)
    const A = shots[i]
    const B = shots[Math.min(i + 1, 2)]

    pos.lerpVectors(A.pos, B.pos, k)
    tgt.lerpVectors(A.target, B.target, k)
    pos.y += Math.sin(k * Math.PI) * 2.2 // arc up during the fly-over

    // Narrow screens: pull back so the scene fits
    const aspect = size.width / size.height
    const mobile = size.width < 768
    if (aspect < 1.2) pos.sub(tgt).multiplyScalar(1 + (1.2 - aspect) * 0.9).add(tgt)

    camera.position.copy(pos)
    camera.lookAt(tgt)

    const sx = mobile ? 0 : THREE.MathUtils.lerp(A.sx, B.sx, k)
    const sy = mobile ? THREE.MathUtils.lerp(A.sy, B.sy, k) : 0
    const cam = camera as THREE.PerspectiveCamera
    cam.setViewOffset(size.width, size.height, sx * size.width, sy * size.height, size.width, size.height)

    bg.lerpColors(A.bg, B.bg, k)
    ;(scene.background as THREE.Color).copy(bg)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(bg)
  })
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  const n = useRef(0)
  useFrame(() => {
    if (++n.current === 3) onReady()
  })
  return null
}

export default function Scene({ reduced, onReady }: { reduced: boolean; onReady: () => void }) {
  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      camera={{ fov: 32, near: 0.1, far: 120, position: [5.6, 4.6, 7.6] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <color attach="background" args={['#F5EFE6']} />
      <fog attach="fog" args={['#F5EFE6', 16, 30]} />
      <hemisphereLight args={['#ffffff', '#d9c7ad', 1.4]} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#bcd4ff" />

      <Room reduced={reduced} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={9} blur={2.4} far={3} frames={1} />

      <group position={[LAB_X, 0, 0]}>
        <Lab reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={9} blur={2.6} far={3.5} frames={1} color="#031a45" />
      </group>

      <group position={[CONTACT_X, 0, 0]}>
        <ContactScene reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.35} scale={8} blur={2.4} far={3} frames={1} />
      </group>

      <Rig />
      <Ready onReady={onReady} />
    </Canvas>
  )
}
