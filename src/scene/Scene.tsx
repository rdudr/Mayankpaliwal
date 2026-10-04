import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import ContactScene from './ContactScene'
import Lab from './Lab'
import { cam, CONTACT_X, cursor, LAB_Y, LAB_Z, scroll, trans, TRANS_SECONDS } from './progress'
import Room from './Room'
import Traveler from './Traveler'

// The lab sits straight below the room (he falls into it); contact is off to the side.

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
  { pos: v(4.3, LAB_Y + 3.2, LAB_Z + 8.2), target: v(0.15, LAB_Y + 1.95, LAB_Z), bg: new THREE.Color('#0B3D91'), sx: -0.21, sy: 0.17 },
  { pos: v(CONTACT_X + 4.6, 3.6, 7.2), target: v(CONTACT_X, 1.55, 0), bg: new THREE.Color('#F5EFE6'), sx: -0.22, sy: -0.22 },
]

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Maps the current page / transition to a camera shot. */
function Rig({ reduced }: { reduced: boolean }) {
  const { camera, scene, size } = useThree()
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const bg = useMemo(() => new THREE.Color(), [])
  const parallax = useRef({ x: 0, y: 0 })

  useFrame((_, dt) => {
    // Home → about plays as a timed transition (see progress.ts / lib/pager.ts)
    if (reduced) trans.value = trans.target
    else {
      const step = dt / TRANS_SECONDS
      trans.value = trans.value < trans.target ? Math.min(trans.target, trans.value + step) : Math.max(trans.target, trans.value - step)
    }
    // 0 = room, 1 = lab, 2 = contact (a hidden cut, made under the projects page)
    const s = cam.contact ? 2 : ease(trans.value)
    scroll.s = s
    const i = Math.min(1, Math.floor(s))
    const k = i === 0 ? s : ease(s - i)
    const A = shots[i]
    const B = shots[Math.min(i + 1, 2)]

    pos.lerpVectors(A.pos, B.pos, k)
    tgt.lerpVectors(A.target, B.target, k)

    // Narrow screens: pull back so the scene fits
    const aspect = size.width / size.height
    const mobile = size.width < 768
    if (aspect < 1.2) pos.sub(tgt).multiplyScalar(1 + (1.2 - aspect) * 0.9).add(tgt)

    camera.position.copy(pos)
    camera.lookAt(tgt)

    // Cursor parallax (desktop): the camera drifts toward the pointer, like the reference
    const P = parallax.current
    const tx = cursor.active && !reduced ? cursor.x * 0.45 : 0
    const ty = cursor.active && !reduced ? -cursor.y * 0.45 : 0
    P.x = THREE.MathUtils.damp(P.x, tx, 3, dt)
    P.y = THREE.MathUtils.damp(P.y, ty, 3, dt)
    camera.translateX(P.x)
    camera.translateY(P.y)

    const sx = mobile ? 0 : THREE.MathUtils.lerp(A.sx, B.sx, k)
    const sy = mobile ? THREE.MathUtils.lerp(A.sy, B.sy, k) : 0
    const pcam = camera as THREE.PerspectiveCamera
    pcam.setViewOffset(size.width, size.height, sx * size.width, sy * size.height, size.width, size.height)

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
  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)')
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !fine.matches) return
      cursor.x = e.clientX / innerWidth - 0.5
      cursor.y = e.clientY / innerHeight - 0.5
      cursor.active = true
    }
    const leave = () => (cursor.active = false)
    addEventListener('pointermove', move)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => (removeEventListener('pointermove', move), document.documentElement.removeEventListener('pointerleave', leave))
  }, [])

  return (
    <Canvas
      className="!fixed inset-0"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      camera={{ fov: 32, near: 0.1, far: 120, position: [5.6, 4.6, 7.6] }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance', localClippingEnabled: true }}
      aria-hidden
    >
      <color attach="background" args={['#F5EFE6']} />
      <fog attach="fog" args={['#F5EFE6', 16, 30]} />
      <hemisphereLight args={['#ffffff', '#d9c7ad', 1.4]} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#bcd4ff" />

      <Room />
      <Traveler reduced={reduced} />

      <group position={[0, LAB_Y, LAB_Z]}>
        <Lab reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={9} blur={2.6} far={3.5} frames={1} color="#031a45" />
      </group>

      <group position={[CONTACT_X, 0, 0]}>
        <ContactScene reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.35} scale={8} blur={2.4} far={3} frames={1} />
      </group>

      <Rig reduced={reduced} />
      <Ready onReady={onReady} />
    </Canvas>
  )
}
