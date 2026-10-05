import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import Character, { PORTFOLIO } from './Character'

const CARD = '#d9b183'
const TAPE = '#ead2ad'

function Parcel({ size, ...p }: { size: [number, number, number] } & JSX.IntrinsicElements['group']) {
  const [w, h, d] = size
  return (
    <group {...p}>
      <RoundedBox args={size} radius={0.03}>
        <meshStandardMaterial color={CARD} roughness={0.9} />
      </RoundedBox>
      <mesh position={[0, h / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.22, d * 1.002]} />
        <meshStandardMaterial color={TAPE} roughness={0.6} />
      </mesh>
      <mesh position={[0, h * 0.2, d / 2 + 0.002]}>
        <planeGeometry args={[w * 0.22, h * 0.6]} />
        <meshStandardMaterial color={TAPE} roughness={0.6} />
      </mesh>
      {/* shipping label */}
      <mesh position={[w * 0.28, -h * 0.15, d / 2 + 0.003]}>
        <planeGeometry args={[w * 0.22, h * 0.24]} />
        <meshStandardMaterial color="#f7f3ec" />
      </mesh>
    </group>
  )
}

function Envelope({ i, reduced }: { i: number; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const flap = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.25, 0.16)
    s.lineTo(0.25, 0.16)
    s.lineTo(0, -0.02)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  const seed = useMemo(() => ({ x: -2.2 + ((i * 1.37) % 4.4), z: -1.9 + ((i * 0.71) % 1.1), sp: 0.25 + (i % 3) * 0.08, ph: i * 0.37, spin: (i % 2 ? 1 : -1) * (0.4 + (i % 4) * 0.15) }), [i])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = reduced ? i : clock.elapsedTime
    const k = (t * seed.sp * 0.25 + seed.ph) % 1 // falls from 4.6 to 0.4, loops
    g.position.set(seed.x + Math.sin(t * 0.8 + i) * 0.25, 4.6 - k * 4.2, seed.z)
    g.rotation.set(Math.sin(t * 0.9 + i) * 0.5, t * seed.spin, Math.sin(t * 0.7 + i) * 0.4)
    const fade = Math.min(1, k * 6, (1 - k) * 6)
    g.scale.setScalar(0.7 + fade * 0.3)
  })

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.5, 0.32, 0.012]} />
        <meshStandardMaterial color="#fbfbfd" roughness={0.8} />
      </mesh>
      <mesh geometry={flap} position={[0, 0, 0.008]}>
        <meshStandardMaterial color="#e6e8f0" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function ContactScene({ reduced }: { reduced: boolean }) {
  return (
    <group>
      <Parcel size={[1.4, 1.0, 1.05]} position={[0, 0.5, 0]} />
      <Parcel size={[1.1, 0.8, 0.9]} position={[0.05, 1.4, -0.05]} rotation={[0, 0.25, 0]} />
      <Parcel size={[0.7, 0.5, 0.6]} position={[1.25, 0.25, 0.65]} rotation={[0, -0.45, 0]} />
      <Parcel size={[0.55, 0.4, 0.5]} position={[-1.2, 0.2, 0.75]} rotation={[0, 0.5, 0]} />
      <Character pose="sit" wave={!reduced} still={reduced} position={[0.05, PORTFOLIO ? 1.02 : 1.27, 0.08]} rotation={[0, 0.25, 0]} />
      {Array.from({ length: 8 }, (_, i) => (
        <Envelope key={i} i={i} reduced={reduced} />
      ))}
    </group>
  )
}
