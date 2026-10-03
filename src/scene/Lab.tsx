import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { profile } from '../content/site'
import Character from './Character'
import { drawAppLogo, drawWaveform, makeCanvas, toolLogo, type AppKind } from './textures'

const LAB_WHITE = '#e8f0fa'

function Mat({ color, rough = 0.6 }: { color: string; rough?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} />
}

/** An app icon tile hovering near the hologram — bobs and keeps facing the camera. */
function FloatingLogo({ kind, base, i, reduced }: { kind: AppKind; base: [number, number, number]; i: number; reduced: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const tex = useMemo(() => {
    const c = makeCanvas(256, 256)
    drawAppLogo(c.ctx, 256, kind)
    c.tex.needsUpdate = true
    return c.tex
  }, [kind])
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock, camera }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + i * 1.3
    g.position.set(base[0] + (reduced ? 0 : Math.sin(t * 0.5) * 0.08), base[1] + (reduced ? 0 : Math.sin(t * 0.9) * 0.16), base[2])
    target.copy(camera.position)
    g.lookAt(target)
    if (!reduced) g.rotateZ(Math.sin(t * 0.7) * 0.12)
  })

  return (
    <group ref={ref} position={base}>
      <RoundedBox args={[0.56, 0.56, 0.08]} radius={0.1} position={[0, 0, -0.045]}>
        <meshStandardMaterial color="#0d2f6e" roughness={0.3} metalness={0.2} />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[0.52, 0.52]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      {/* soft glow card behind */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial color="#5fd2ff" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  )
}

function Bubbles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: i * 2.4, r: 0.25 + ((i * 37) % 60) / 100, s: 0.25 + ((i * 13) % 10) / 20, o: i / 16 })), [])
  const m = useMemo(() => new THREE.Matrix4(), [])
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = reduced ? 0 : clock.elapsedTime
    seeds.forEach((b, i) => {
      const y = 0.45 + (((t * b.s * 0.4 + b.o) % 1) * 2.7)
      const sc = 0.04 + (i % 3) * 0.02
      m.makeScale(sc, sc, sc).setPosition(Math.cos(b.a + t * 0.3) * b.r, y, Math.sin(b.a + t * 0.3) * b.r)
      ref.current!.setMatrixAt(i, m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, seeds.length]}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial color="#bfeaff" transparent opacity={0.7} />
    </instancedMesh>
  )
}

function WaveScreen(p: JSX.IntrinsicElements['group']) {
  const { ctx, tex } = useMemo(() => makeCanvas(512, 320), [])
  const last = useRef(-1)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 1 / 20) return
    last.current = t
    drawWaveform(ctx, 512, 320, t)
    tex.needsUpdate = true
  })
  return (
    <group {...p}>
      <RoundedBox args={[1.4, 0.92, 0.1]} radius={0.06}>
        <Mat color={LAB_WHITE} rough={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[1.26, 0.78]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

const logoSpots: [number, number, number][] = [
  [-1.75, 2.85, 0.9],
  [-1.95, 1.55, 1.25],
  [-1.1, 3.75, 1.3],
  [1.45, 3.45, 1.35],
  [1.75, 2.05, 1.65],
  [1.05, 0.95, 1.9],
]

export default function Lab({ reduced }: { reduced: boolean }) {
  const holo = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!holo.current || reduced) return
    holo.current.rotation.y = clock.elapsedTime * 0.45
    holo.current.position.y = 0.42 + Math.sin(clock.elapsedTime * 1.2) * 0.05
  })

  const kinds = profile.tools.map((t) => toolLogo[t]).filter(Boolean)
  const pipe = (pts: [number, number, number][]) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, 0.07, 10)

  return (
    <group>
      {/* floor glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color="#1a5fc4" transparent opacity={0.35} />
      </mesh>

      {/* platform */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[1.28, 1.32, 0.14, 8]} />
        <Mat color="#c3cfdf" />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.12, 1.2, 0.24, 8]} />
        <Mat color={LAB_WHITE} />
      </mesh>
      <mesh position={[0, 0.375, 0]}>
        <cylinderGeometry args={[0.95, 0.95, 0.02, 48]} />
        <meshBasicMaterial color="#8ee2ff" />
      </mesh>

      {/* glass tube */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.98, 0.98, 2.95, 48, 1, true]} />
        <meshStandardMaterial color="#7fd0ff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} roughness={0.1} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[1.18, 1.12, 0.42, 48]} />
        <Mat color={LAB_WHITE} rough={0.45} />
      </mesh>
      <mesh position={[0, 3.36, 0]}>
        <cylinderGeometry args={[1.16, 1.16, 0.05, 48]} />
        <Mat color="#c3cfdf" />
      </mesh>

      <group ref={holo} position={[0, 0.42, 0]} scale={1.18}>
        <Character pose="stand" holo still />
      </group>
      <Bubbles reduced={reduced} />
      <pointLight position={[0, 1.8, 1.2]} color="#5fd2ff" intensity={10} distance={6} />

      {/* cabinet behind-left */}
      <RoundedBox args={[1.7, 1.35, 0.85]} radius={0.05} position={[-2.25, 0.68, -1.4]}>
        <Mat color="#d6e3f3" />
      </RoundedBox>
      <RoundedBox args={[1.0, 0.85, 0.55]} radius={0.04} position={[-2.1, 3.0, -1.55]}>
        <Mat color="#d6e3f3" />
      </RoundedBox>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-2.6 + i * 0.16, 1.55, -1.3]}>
          <cylinderGeometry args={[0.05, 0.05, 0.36, 12]} />
          <meshStandardMaterial color={['#9ee6ff', '#f6a6c9', '#b9f3c2'][i]} transparent opacity={0.85} />
        </mesh>
      ))}

      {/* console + waveform monitor */}
      <RoundedBox args={[1.15, 1.25, 0.95]} radius={0.06} position={[2.35, 0.63, 0.15]} rotation={[0, -0.35, 0]}>
        <Mat color={LAB_WHITE} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[2.05 + (i % 2) * 0.2, 1.27, 0.05 + Math.floor(i / 2) * 0.2]} rotation={[0, -0.35, 0]}>
          <boxGeometry args={[0.14, 0.03, 0.08]} />
          <Mat color="#8ec9f2" />
        </mesh>
      ))}
      <mesh position={[2.6, 1.3, 0.2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.06, 20]} />
        <Mat color="#e8c34a" />
      </mesh>
      {[-0.15, 0.12].map((dx, i) => (
        <mesh key={i} position={[2.45 + dx, 1.85, -0.05]}>
          <cylinderGeometry args={[0.045, 0.045, 1.2, 10]} />
          <Mat color={i ? '#f2b6a0' : '#9dd6c5'} />
        </mesh>
      ))}
      <WaveScreen position={[2.35, 2.75, -0.05]} rotation={[0, -0.35, 0]} />

      {/* pipes from console to platform */}
      <mesh geometry={pipe([[1.8, 0.35, 0.5], [1.55, 0.15, 0.7], [1.25, 0.15, 0.55]])}>
        <Mat color="#9dd6c5" />
      </mesh>
      <mesh geometry={pipe([[1.85, 0.5, 0.15], [1.55, 0.3, 0.05], [1.2, 0.2, 0.0]])}>
        <Mat color="#f2b6a0" />
      </mesh>

      {kinds.map((k, i) => (
        <FloatingLogo key={k} kind={k} base={logoSpots[i % logoSpots.length]} i={i} reduced={reduced} />
      ))}
    </group>
  )
}
