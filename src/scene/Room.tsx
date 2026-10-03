import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import Character from './Character'
import { drawNote, drawProgram, drawTimeline, makeCanvas } from './textures'

const WOOD = '#d9b07a'
const WHITE = '#f6f4f1'

function Mat({ color, rough = 0.7, ...p }: { color: string; rough?: number; emissive?: string; emissiveIntensity?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} {...p} />
}

/** A monitor whose screen is a live canvas. */
function Monitor({ draw, ...p }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void } & JSX.IntrinsicElements['group']) {
  const { ctx, tex } = useMemo(() => makeCanvas(640, 380), [])
  const last = useRef(-1)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 1 / 15) return // 15fps is plenty for a screen
    last.current = t
    draw(ctx, 640, 380, t)
    tex.needsUpdate = true
  })
  return (
    <group {...p}>
      <RoundedBox args={[1.18, 0.74, 0.07]} radius={0.04}>
        <Mat color="#3b3948" rough={0.4} />
      </RoundedBox>
      <mesh position={[0, 0, 0.037]}>
        <planeGeometry args={[1.08, 0.64]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.5, -0.06]}>
        <boxGeometry args={[0.08, 0.32, 0.05]} />
        <Mat color="#3b3948" />
      </mesh>
      <mesh position={[0, -0.66, -0.02]}>
        <boxGeometry args={[0.36, 0.03, 0.22]} />
        <Mat color="#3b3948" />
      </mesh>
    </group>
  )
}

function Note({ lines, color, ...p }: { lines: string[]; color: string } & JSX.IntrinsicElements['group']) {
  const tex = useMemo(() => {
    const c = makeCanvas(256, 300)
    drawNote(c.ctx, 256, 300, lines, color)
    return c.tex
  }, [lines, color])
  return (
    <group {...p}>
      <mesh>
        <planeGeometry args={[0.42, 0.5]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0.04]}>
        <sphereGeometry args={[0.055, 16, 12]} />
        <Mat color="#e0525e" rough={0.35} />
      </mesh>
    </group>
  )
}

function Clapper(p: JSX.IntrinsicElements['group']) {
  return (
    <group {...p}>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.34, 0.2, 0.04]} />
        <Mat color="#222230" rough={0.5} />
      </mesh>
      <group position={[-0.17, 0.2, 0]} rotation={[0, 0, 0.35]}>
        <mesh position={[0.17, 0.03, 0]}>
          <boxGeometry args={[0.34, 0.06, 0.04]} />
          <Mat color="#222230" rough={0.5} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0.05 + i * 0.08, 0.03, 0.021]} rotation={[0, 0, -0.6]}>
            <planeGeometry args={[0.03, 0.07]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Plant(p: JSX.IntrinsicElements['group']) {
  const leaves = [
    [0, 0.2, 0], [0.9, 0.1, 0.35], [-0.9, 0.15, -0.3], [2.1, 0.05, 0.6], [-2.1, 0.1, -0.5], [3.1, 0.12, 0.4],
  ]
  return (
    <group {...p}>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.36, 0.28, 0.64, 32]} />
        <Mat color="#ece6dc" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.362, 0.33, 0.12, 32]} />
        <Mat color="#a88f74" />
      </mesh>
      {leaves.map(([a, lean, h], i) => (
        <group key={i} rotation={[0, a, 0]} position={[0, 0.64, 0]}>
          <mesh position={[0, 0.45 + (h as number) * 0.3, 0.18]} rotation={[0.35 + (lean as number), 0, 0]} scale={[0.2, 0.55, 0.05]}>
            <sphereGeometry args={[1, 20, 14]} />
            <Mat color={i % 2 ? '#7fc142' : '#97d34e'} rough={0.55} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default function Room({ reduced }: { reduced: boolean }) {
  const program = useRef<HTMLImageElement | null>(null)
  useEffect(() => {
    const img = new Image()
    img.src = '/media/projects/daud/ep04.jpg'
    program.current = img
  }, [])

  return (
    <group>
      {/* Rug */}
      {[
        [5.4, 4.4, '#ee9a3c', 0.02],
        [4.5, 3.5, '#f4b75a', 0.05],
        [3.5, 2.6, '#f6d88c', 0.08],
      ].map(([w, d, c, y]) => (
        <RoundedBox key={c as string} args={[w as number, 0.04, d as number]} radius={0.02} position={[0, y as number, 0.2]}>
          <Mat color={c as string} rough={0.95} />
        </RoundedBox>
      ))}

      {/* Desk */}
      <RoundedBox args={[2.8, 0.1, 1.15]} radius={0.04} position={[0, 1.15, -0.55]}>
        <Mat color={WHITE} rough={0.5} />
      </RoundedBox>
      {[[-1.25, -1.0], [1.25, -1.0], [-1.25, -0.12], [1.25, -0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.55, z]}>
          <cylinderGeometry args={[0.05, 0.04, 1.1, 12]} />
          <Mat color={WOOD} />
        </mesh>
      ))}

      <Monitor draw={drawTimeline} position={[-0.64, 1.88, -0.82]} rotation={[0, 0.18, 0]} />
      <Monitor draw={(c, w, h, t) => drawProgram(c, w, h, program.current, t)} position={[0.64, 1.88, -0.82]} rotation={[0, -0.18, 0]} />

      {/* keyboard + mouse */}
      <RoundedBox args={[0.72, 0.035, 0.22]} radius={0.012} position={[0, 1.22, -0.12]}>
        <Mat color="#e9e7f0" />
      </RoundedBox>
      <mesh position={[0.55, 1.22, -0.1]} scale={[0.7, 0.35, 1]}>
        <sphereGeometry args={[0.07, 16, 10]} />
        <Mat color="#e9e7f0" />
      </mesh>
      <Clapper position={[-1.05, 1.2, -0.45]} rotation={[0, 0.5, 0]} />
      {/* speaker */}
      <RoundedBox args={[0.26, 0.38, 0.24]} radius={0.04} position={[1.18, 1.39, -0.72]} rotation={[0, -0.4, 0]}>
        <Mat color="#f0a24a" />
      </RoundedBox>
      <mesh position={[1.12, 1.38, -0.6]} rotation={[Math.PI / 2, 0, 0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 24]} />
        <Mat color="#cfd2d8" />
      </mesh>
      {/* mug */}
      <mesh position={[0.95, 1.28, -0.3]}>
        <cylinderGeometry args={[0.07, 0.065, 0.16, 20]} />
        <Mat color="#4fa0e8" />
      </mesh>

      {/* Chair */}
      <group position={[0, 0, 0.4]}>
        <RoundedBox args={[0.72, 0.08, 0.66]} radius={0.04} position={[0, 0.62, 0]}>
          <Mat color={WHITE} />
        </RoundedBox>
        <RoundedBox args={[0.72, 0.62, 0.08]} radius={0.04} position={[0, 1.0, 0.33]} rotation={[-0.12, 0, 0]}>
          <Mat color={WHITE} />
        </RoundedBox>
        {[[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.3, z]}>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
            <Mat color="#9a9aa3" rough={0.3} />
          </mesh>
        ))}
      </group>
      <Character pose="sit" typing={!reduced} still={reduced} position={[0, 0.25, 0.3]} rotation={[0, Math.PI, 0]} />

      {/* Wall pieces, floating like the reference */}
      <group position={[-1.7, 2.75, -1.5]}>
        <RoundedBox args={[1.2, 0.07, 0.36]} radius={0.02}>
          <Mat color={WOOD} />
        </RoundedBox>
        {[['#f0a24a', -0.35, 0.42], ['#9aa4b8', -0.2, 0.36], ['#2ec4b6', -0.06, 0.4]].map(([c, x, h]) => (
          <RoundedBox key={c as string} args={[0.12, h as number, 0.28]} radius={0.015} position={[x as number, (h as number) / 2 + 0.04, 0]}>
            <Mat color={c as string} />
          </RoundedBox>
        ))}
        <mesh position={[0.3, 0.14, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.2, 20]} />
          <Mat color={WHITE} />
        </mesh>
        <mesh position={[0.3, 0.32, 0]} scale={[0.1, 0.2, 0.1]}>
          <sphereGeometry args={[1, 16, 12]} />
          <Mat color="#8fd04f" />
        </mesh>
      </group>

      <group position={[0.35, 3.05, -1.65]}>
        <RoundedBox args={[1.9, 1.25, 0.08]} radius={0.05}>
          <Mat color="#e9d3a6" />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.72, 1.07]} />
          <Mat color="#b39a86" rough={1} />
        </mesh>
        <Note lines={['HOOK in', 'first 5s!']} color="#bcd4f0" position={[-0.45, 0.1, 0.07]} rotation={[0, 0, 0.08]} />
        <Note lines={['EP 04', 'colour pass', 'B-roll ✓']} color="#fbfaf6" position={[0.42, -0.12, 0.07]} rotation={[0, 0, -0.06]} />
      </group>

      {/* picture frame with a film-frame icon */}
      <group position={[2.4, 2.45, -1.2]} rotation={[0, -0.45, 0]}>
        <RoundedBox args={[0.9, 0.7, 0.08]} radius={0.06}>
          <Mat color="#8fb4e3" />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[0.7, 0.5]} />
          <Mat color="#dfe9f6" />
        </mesh>
        <mesh position={[0.02, 0, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
          <circleGeometry args={[0.14, 3]} />
          <Mat color="#8fb4e3" />
        </mesh>
      </group>

      <Plant position={[2.25, 0, 1.05]} />
    </group>
  )
}
