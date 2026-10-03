import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import Character from './Character'
import { clamp01, easeInOut, LAB_Y, LAB_Z, trans, WIRE_Y } from './progress'

type Stage = 'sit' | 'fall' | 'float'

const SEAT_Y = 0.66 // standing on the chair seat at the moment he jumps
const LAND_Y = LAB_Y + 0.42 // tube floor
const H = 2.25 * 1.18 // his height at hologram scale

/**
 * The editor's trip from page 1 to page 2, driven by trans.value (0 → 1):
 * he hops off the chair as the room bounces away, falls straight down, and
 * as he passes WIRE_Y the clay body is "scanned" into a wireframe hologram,
 * landing in the lab's tube. Plays in reverse on the way back up.
 */
export default function Traveler({ reduced }: { reduced: boolean }) {
  const [stage, setStage] = useState<Stage>('sit')
  const faller = useRef<THREE.Group>(null)
  const scan = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.Mesh>(null)
  const pulseMat = useRef<THREE.MeshBasicMaterial>(null)
  const floater = useRef<THREE.Group>(null)

  // Clay is kept above the scan plane, the hologram below it.
  const clayClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), -WIRE_Y)], [])
  const holoClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), WIRE_Y)], [])

  useFrame(({ clock }) => {
    const v = trans.value
    const next: Stage = v < 0.03 ? 'sit' : v < 0.985 ? 'fall' : 'float'
    if (next !== stage) setStage(next)
    const time = clock.elapsedTime

    // fall: a little hop up first, then down the shaft
    const f = clamp01((v - 0.03) / 0.9)
    const hop = Math.sin(clamp01(f / 0.22) * Math.PI) * 0.7 * (f < 0.22 ? 1 : 0)
    const y = THREE.MathUtils.lerp(SEAT_Y, LAND_Y, easeInOut(f)) + hop
    if (faller.current) {
      faller.current.position.y = y
      faller.current.rotation.y = Math.PI + easeInOut(f) * Math.PI // turns to face us on the way down
    }

    // scan ring at the clay → hologram line, only while he's crossing it
    if (scan.current) {
      const crossing = stage === 'fall' && y < WIRE_Y && y + H > WIRE_Y
      scan.current.visible = crossing
      scan.current.rotation.y = time * 2
    }

    // landing pulse on the tube floor
    const r = clamp01((v - 0.88) / 0.12)
    if (pulse.current && pulseMat.current) {
      pulse.current.visible = r > 0 && r < 1
      pulse.current.scale.setScalar(0.4 + r * 1.6)
      pulseMat.current.opacity = (1 - r) * 0.9
    }

    // floating in the tube ("water idle")
    if (floater.current) {
      floater.current.position.y = LAND_Y + (reduced ? 0 : 0.08 + Math.sin(time * 1.3) * 0.08)
      floater.current.rotation.y = reduced ? 0 : time * 0.4
    }
  })

  return (
    <>
      {stage === 'sit' && (
        <Character pose="sit" typing={!reduced} still={reduced} position={[0, 0.25, 0.3]} rotation={[0, Math.PI, 0]} />
      )}

      {stage === 'fall' && (
        <group ref={faller} position={[0, SEAT_Y, LAB_Z]} scale={1.18}>
          <Character pose="stand" armsUp={!reduced} still={reduced} clip={clayClip} />
          <Character pose="stand" armsUp={!reduced} still={reduced} holo clip={holoClip} />
        </group>
      )}

      {stage === 'float' && (
        <group ref={floater} position={[0, LAND_Y, LAB_Z]} scale={1.18}>
          <Character pose="stand" holo still />
        </group>
      )}

      {/* the scan line: a glowing ring + soft disc at the transform height */}
      <group ref={scan} position={[0, WIRE_Y, LAB_Z]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.025, 8, 64]} />
          <meshBasicMaterial color="#8ee2ff" toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.62, 48]} />
          <meshBasicMaterial color="#5fd2ff" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh ref={pulse} position={[0, LAB_Y + 0.4, LAB_Z]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.55, 0.7, 48]} />
        <meshBasicMaterial ref={pulseMat} color="#8ee2ff" transparent depthWrite={false} />
      </mesh>
    </>
  )
}
