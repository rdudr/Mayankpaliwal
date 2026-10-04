import { useFrame, type GroupProps } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Pose = 'sit' | 'stand'

/**
 * Live "puppet strings" for a character, written by a choreographer
 * (Traveler.tsx) every frame. The character eases its limbs toward them.
 */
export type CharRig = {
  /** type: both hands typing · mouse: left hand on the mouse · fast: quick typing, head to the timeline monitor
   *  wave: turned to camera, right arm waving · fall: arms flailing · float: drifting in the tube · rest: arms down */
  mode: 'type' | 'mouse' | 'fast' | 'wave' | 'fall' | 'float' | 'rest'
  blink: boolean
  scared: boolean
}
export const newRig = (mode: CharRig['mode'] = 'type'): CharRig => ({ mode, blink: false, scared: false })

type Props = GroupProps & {
  pose: Pose
  holo?: boolean
  typing?: boolean
  wave?: boolean
  still?: boolean
  /** Both arms thrown up — used while falling into the lab. */
  armsUp?: boolean
  /** Clipping planes (e.g. hide everything below a line). */
  clip?: THREE.Plane[]
  /** When given, this drives arms/head/eyes instead of the simple flags above. */
  rig?: React.MutableRefObject<CharRig>
}

const SKIN = '#f3c9a0'
const HAIR = '#7a5134'
const SHIRT = '#4a4a54'
const PANTS = '#2f2f39'
const SHOE = '#f4f4f4'

const damp = THREE.MathUtils.damp

/** A chibi "clay" editor built from primitives. Faces +z. */
export default function Character({ pose, holo, typing, wave, still, armsUp, clip, rig, ...group }: Props) {
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<(THREE.Mesh | null)[]>([])

  const mats = useMemo(() => {
    if (holo) {
      const m = new THREE.MeshBasicMaterial({ color: '#5fd2ff', wireframe: true, transparent: true, opacity: 0.85, clippingPlanes: clip })
      return { skin: m, hair: m, shirt: m, pants: m, shoe: m, eye: m }
    }
    const std = (color: string, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness, clippingPlanes: clip })
    return { skin: std(SKIN, 0.6), hair: std(HAIR, 0.85), shirt: std(SHIRT), pants: std(PANTS), shoe: std(SHOE, 0.5), eye: std('#1a1a22', 0.3) }
  }, [holo, clip])

  const seg = holo ? 14 : 24
  const hipY = pose === 'sit' ? 0.55 : 0.66
  const up = hipY - 0.66 // upper body offset relative to standing

  useFrame(({ clock }, dt) => {
    if (still && !rig) return
    const t = clock.elapsedTime
    const L = armL.current
    const R = armR.current
    const H = head.current
    if (!L || !R || !H) return

    if (rig) {
      const r = rig.current
      // targets: [Lx, Lz, Rx, Rz, headYaw, headPitch]
      let T: number[]
      switch (r.mode) {
        case 'type':
          T = [-1.45 + Math.sin(t * 14) * 0.05, -0.05, -1.45 + Math.sin(t * 14 + 1.7) * 0.05, 0.05, Math.sin(t * 0.6) * 0.08, 0.14]
          break
        case 'fast':
          T = [-1.45 + Math.sin(t * 24) * 0.07, -0.05, -1.45 + Math.sin(t * 24 + 1.3) * 0.07, 0.05, 0.42, 0.1]
          break
        case 'mouse':
          T = [-1.3 + Math.sin(t * 5) * 0.02, -0.38, -1.2, 0.08, -0.32, 0.12]
          break
        case 'wave':
          T = [0, -0.14, 0.15, 2.55 + Math.sin(t * 7) * 0.38, 0, -0.06]
          break
        case 'fall':
          T = [0.35 + Math.sin(t * 13) * 0.2, -2.1 + Math.sin(t * 15) * 0.35, 0.35 + Math.sin(t * 13 + 2) * 0.2, 2.1 - Math.sin(t * 15 + 1) * 0.35, 0, -0.18]
          break
        case 'float':
          // relaxed "water idle": arms a little out from the body, drifting
          T = [0.05 + Math.sin(t * 1.1) * 0.06, -0.32 + Math.sin(t * 1.3) * 0.08, 0.05 + Math.sin(t * 1.2 + 1) * 0.06, 0.32 - Math.sin(t * 1.4 + 0.5) * 0.08, Math.sin(t * 0.5) * 0.1, -0.03 + Math.sin(t * 0.9) * 0.03]
          break
        default:
          T = [0, -0.14, 0, 0.14, Math.sin(t * 0.6) * 0.2, 0]
      }
      const k = 9
      L.rotation.x = damp(L.rotation.x, T[0], k, dt)
      L.rotation.z = damp(L.rotation.z, T[1], k, dt)
      R.rotation.x = damp(R.rotation.x, T[2], k, dt)
      R.rotation.z = damp(R.rotation.z, T[3], k, dt)
      H.rotation.y = damp(H.rotation.y, T[4], 6, dt)
      H.rotation.x = damp(H.rotation.x, T[5], 6, dt)
      // eyes: blink squash / scared wide
      const sy = r.blink ? 0.12 : r.scared ? 1.7 : 1.2
      const sx = r.scared ? 1.25 : 0.85
      for (const e of eyes.current) {
        if (!e) continue
        e.scale.y = damp(e.scale.y, sy, 30, dt)
        e.scale.x = damp(e.scale.x, sx, 20, dt)
      }
      return
    }

    if (typing) {
      L.rotation.x = -1.45 + Math.sin(t * 14) * 0.05
      R.rotation.x = -1.45 + Math.sin(t * 14 + 1.7) * 0.05
    }
    if (armsUp) {
      L.rotation.z = -2.7 + Math.sin(t * 9) * 0.25
      R.rotation.z = 2.7 - Math.sin(t * 9 + 1) * 0.25
    }
    if (wave) R.rotation.z = 2.5 + Math.sin(t * 6) * 0.35
    H.rotation.y = Math.sin(t * 0.6) * (typing ? 0.12 : 0.2)
    H.rotation.x = typing ? 0.12 + Math.sin(t * 0.9) * 0.03 : Math.sin(t * 0.8) * 0.04
  })

  const legs =
    pose === 'stand' ? (
      <>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.13, 0.36, 0]} material={mats.pants}>
              <capsuleGeometry args={[0.1, 0.42, 6, seg]} />
            </mesh>
            <mesh position={[s * 0.13, 0.06, 0.05]} material={mats.shoe} scale={[1, 0.65, 1.5]}>
              <sphereGeometry args={[0.12, seg, seg / 2]} />
            </mesh>
          </group>
        ))}
      </>
    ) : (
      <>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.13, hipY, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={mats.pants}>
              <capsuleGeometry args={[0.105, 0.34, 6, seg]} />
            </mesh>
            <mesh position={[s * 0.13, hipY - 0.26, 0.44]} material={mats.pants}>
              <capsuleGeometry args={[0.095, 0.34, 6, seg]} />
            </mesh>
            <mesh position={[s * 0.13, hipY - 0.5, 0.5]} material={mats.shoe} scale={[1, 0.65, 1.5]}>
              <sphereGeometry args={[0.12, seg, seg / 2]} />
            </mesh>
          </group>
        ))}
      </>
    )

  const startTyping = typing || rig?.current.mode === 'type'
  const arm = (s: -1 | 1, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[s * 0.31, 1.13 + up, 0]} rotation={[startTyping ? -1.45 : 0, 0, s * (startTyping ? 0.05 : 0.14)]}>
      <mesh position={[0, -0.21, 0]} material={mats.shirt}>
        <capsuleGeometry args={[0.085, 0.3, 6, seg]} />
      </mesh>
      <mesh position={[0, -0.44, 0]} material={mats.skin}>
        <sphereGeometry args={[0.085, seg, seg / 2]} />
      </mesh>
    </group>
  )

  return (
    <group {...group}>
      {legs}
      <mesh position={[0, hipY, 0]} material={mats.pants} scale={[1, 0.6, 0.8]}>
        <sphereGeometry args={[0.27, seg, seg / 2]} />
      </mesh>
      <mesh position={[0, 0.94 + up, 0]} material={mats.shirt} scale={[1.08, 1, 0.82]}>
        <capsuleGeometry args={[0.25, 0.28, 8, seg]} />
      </mesh>
      {arm(-1, armL)}
      {arm(1, armR)}
      <mesh position={[0, 1.26 + up, 0]} material={mats.skin}>
        <cylinderGeometry args={[0.08, 0.09, 0.12, seg]} />
      </mesh>
      <group ref={head} position={[0, 1.62 + up, 0]}>
        <mesh material={mats.skin} scale={[1, 0.94, 0.94]}>
          <sphereGeometry args={[0.4, seg * 1.5, seg]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.385, -0.02, 0]} material={mats.skin} scale={[0.6, 1, 0.8]}>
            <sphereGeometry args={[0.09, seg, seg / 2]} />
          </mesh>
        ))}
        {/* hair: a cap plus a swept fringe */}
        <mesh position={[0, 0.05, -0.02]} rotation={[-0.35, 0, 0]} material={mats.hair}>
          <sphereGeometry args={[0.425, seg * 1.5, seg, 0, Math.PI * 2, 0, 1.75]} />
        </mesh>
        <mesh position={[0.06, 0.26, 0.24]} rotation={[0.5, 0.2, -0.4]} material={mats.hair} scale={[1.5, 0.55, 0.9]}>
          <sphereGeometry args={[0.2, seg, seg / 2]} />
        </mesh>
        {[-1, 1].map((s, i) => (
          <mesh key={s} ref={(m) => (eyes.current[i] = m)} position={[s * 0.14, -0.03, 0.36]} material={mats.eye} scale={[0.85, 1.2, 0.6]}>
            <sphereGeometry args={[0.045, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
