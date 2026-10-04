import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import ContactScene from './ContactScene'
import Lab from './Lab'
import { backdrop, cam, CONTACT_X, cursor, LAB_Y, LAB_Z, moveProgress, scroll, trans, TRANS_SECONDS } from './progress'
import Room from './Room'
import Traveler from './Traveler'

// The lab sits straight below the room (he falls into it); contact is off to the side.

type Shot = {
  pos: THREE.Vector3
  target: THREE.Vector3
  /** Desktop: shift the picture sideways (fraction of width, negative = to the right). */
  sx: number
  /** Mobile: shift the picture vertically (fraction of height, negative = lower). */
  sy: number
  /** Extra pull-back on narrow (portrait) screens. */
  mz: number
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const shots: Shot[] = [
  { pos: v(4.4, 3.9, 5.9), target: v(0.2, 1.7, -0.2), sx: -0.2, sy: -0.27, mz: 1 },
  { pos: v(2.9, LAB_Y + 2.3, LAB_Z + 6.7), target: v(0.25, LAB_Y + 1.85, LAB_Z), sx: -0.2, sy: 0.12, mz: 1.3 },
  { pos: v(CONTACT_X + 4.6, 3.6, 7.2), target: v(CONTACT_X, 1.55, 0), sx: -0.22, sy: -0.22, mz: 1 },
]

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Maps the current page / transition to a camera shot. */
function Rig({ reduced }: { reduced: boolean }) {
  const { camera, size } = useThree()
  const pos = useMemo(() => new THREE.Vector3(), [])
  const tgt = useMemo(() => new THREE.Vector3(), [])
  const parallax = useRef({ x: 0, y: 0 })

  useFrame((_, dt) => {
    // Home → about plays as a timed transition (see progress.ts / lib/pager.ts)
    if (reduced) trans.value = trans.target
    else {
      const step = dt / TRANS_SECONDS
      trans.value = trans.value < trans.target ? Math.min(trans.target, trans.value + step) : Math.max(trans.target, trans.value - step)
    }
    // 0 = room, 1 = lab, 2 = contact (a hidden cut, made under the projects page)
    const s = cam.contact ? 2 : moveProgress(trans.value)
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
    if (aspect < 1.2) pos.sub(tgt).multiplyScalar((1 + (1.2 - aspect) * 0.9) * THREE.MathUtils.lerp(A.mz, B.mz, k)).add(tgt)

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

    // Backdrop: the cream sheet slides up with a hard edge over the lab blue,
    // in step with the camera (the reference does this with a screen-space quad).
    const sheet = cam.contact ? 0 : Math.min(s, 1)
    if (backdrop.sheet) backdrop.sheet.style.transform = `translate3d(0, ${(-sheet * 100).toFixed(3)}%, 0)`
  })
  return null
}

/**
 * Only draws (and animates) its scene while it can actually be seen — the
 * three scenes share one world, so this keeps the frame cost to one scene.
 */
function Only({ when, children, ...p }: { when: (s: number) => boolean; children: React.ReactNode } & JSX.IntrinsicElements['group']) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    if (g.current) g.current.visible = when(scroll.s)
  }, -1) // before everyone else, so hidden scenes can skip their own work
  return (
    <group ref={g} {...p}>
      {children}
    </group>
  )
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
      camera={{ fov: 32, near: 0.1, far: 120, position: [4.4, 3.9, 5.9] }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', localClippingEnabled: true }}
      aria-hidden
    >
      <hemisphereLight args={['#ffffff', '#d9c7ad', 1.4]} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} />
      <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#bcd4ff" />

      <Only when={(s) => s < 0.999 && !cam.contact}>
        <Room />
      </Only>
      <Traveler reduced={reduced} />

      <Only when={(s) => s > 0.05 && !cam.contact} position={[0, LAB_Y, LAB_Z]}>
        <Lab reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={9} blur={2.6} far={3.5} frames={1} color="#031a45" />
      </Only>

      <Only when={() => cam.contact} position={[CONTACT_X, 0, 0]}>
        <ContactScene reduced={reduced} />
        <ContactShadows position={[0, 0.002, 0]} opacity={0.35} scale={8} blur={2.4} far={3} frames={1} />
      </Only>

      <Rig reduced={reduced} />
      <Ready onReady={onReady} />
    </Canvas>
  )
}
