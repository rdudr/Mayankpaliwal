import { useFrame, type GroupProps } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type Pose = 'sit' | 'stand'
type Props = GroupProps & {
  pose: Pose
  holo?: boolean
  typing?: boolean
  wave?: boolean
  still?: boolean
}

const SKIN = '#f3c9a0'
const HAIR = '#7a5134'
const SHIRT = '#4a4a54'
const PANTS = '#2f2f39'
const SHOE = '#f4f4f4'

/** A chibi "clay" editor built from primitives. Faces +z. */
export default function Character({ pose, holo, typing, wave, still, ...group }: Props) {
  const armL = useRef<THREE.Group>(null)
  const armR = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)

  const mats = useMemo(() => {
    if (holo) {
      const m = new THREE.MeshBasicMaterial({ color: '#5fd2ff', wireframe: true, transparent: true, opacity: 0.85 })
      return { skin: m, hair: m, shirt: m, pants: m, shoe: m, eye: m }
    }
    const std = (color: string, roughness = 0.75) => new THREE.MeshStandardMaterial({ color, roughness })
    return { skin: std(SKIN, 0.6), hair: std(HAIR, 0.85), shirt: std(SHIRT), pants: std(PANTS), shoe: std(SHOE, 0.5), eye: std('#1a1a22', 0.3) }
  }, [holo])

  const seg = holo ? 14 : 24
  const hipY = pose === 'sit' ? 0.55 : 0.66
  const up = hipY - 0.66 // upper body offset relative to standing

  useFrame(({ clock }) => {
    if (still) return
    const t = clock.elapsedTime
    if (typing && armL.current && armR.current) {
      armL.current.rotation.x = -1.45 + Math.sin(t * 14) * 0.05
      armR.current.rotation.x = -1.45 + Math.sin(t * 14 + 1.7) * 0.05
    }
    if (wave && armR.current) {
      armR.current.rotation.z = 2.5 + Math.sin(t * 6) * 0.35
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6) * (typing ? 0.12 : 0.2)
      head.current.rotation.x = typing ? 0.12 + Math.sin(t * 0.9) * 0.03 : Math.sin(t * 0.8) * 0.04
    }
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

  const arm = (s: -1 | 1, ref: React.RefObject<THREE.Group>) => (
    <group ref={ref} position={[s * 0.31, 1.13 + up, 0]} rotation={[typing ? -1.45 : 0, 0, s * (typing ? 0.05 : 0.14)]}>
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
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.14, -0.03, 0.36]} material={mats.eye} scale={[0.85, 1.2, 0.6]}>
            <sphereGeometry args={[0.045, 12, 8]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
