import { ContactShadows } from '@react-three/drei/core/ContactShadows'
import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { bounceScale, desk, hand, trans } from './progress'
import { drawNote, drawProgram, drawSocialLogo, drawTimeline, makeCanvas, rr, shown } from './textures'

const WOOD = '#d9b07a'
const WHITE = '#f6f4f1'

function Mat({ color, rough = 0.7, ...p }: { color: string; rough?: number; emissive?: string; emissiveIntensity?: number }) {
  return <meshStandardMaterial color={color} roughness={rough} {...p} />
}

/** A monitor whose screen is a live canvas. */
function Monitor({ draw, ...p }: { draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void } & JSX.IntrinsicElements['group']) {
  const { ctx, tex } = useMemo(() => makeCanvas(640, 380), [])
  const last = useRef(-1)
  const self = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (t - last.current < 1 / 15 || !shown(self.current)) return // 15fps is plenty for a screen
    last.current = t
    draw(ctx, 640, 380, t)
    tex.needsUpdate = true
  })
  return (
    <group ref={self} {...p}>
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

/** Keyboard with visible keycap rows (drawn once into a texture). */
function Keyboard(p: JSX.IntrinsicElements['group']) {
  const tex = useMemo(() => {
    const W = 720
    const H = 220
    const { ctx, tex } = makeCanvas(W, H)
    ctx.fillStyle = '#d9d7e2'
    ctx.fillRect(0, 0, W, H)
    const rows = [14, 14, 13, 12, 8]
    const pad = 10
    const kh = (H - pad * 2) / rows.length - 6
    rows.forEach((n, r) => {
      const y = pad + r * (kh + 6)
      if (r === 4) {
        // bottom row: modifiers + long space bar
        const widths = [1, 1, 1, 6.5, 1, 1, 1]
        const unit = (W - pad * 2 - 6 * (widths.length - 1)) / widths.reduce((a, b) => a + b)
        let x = pad
        widths.forEach((w) => {
          ctx.fillStyle = '#f7f6fb'
          rr(ctx, x, y, unit * w, kh, 6)
          ctx.fill()
          x += unit * w + 6
        })
        return
      }
      const kw = (W - pad * 2 - 6 * (n - 1)) / n
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = (r === 0 && (i === 0 || i === n - 1)) || (r === 2 && i === n - 1) ? '#ff923e' : '#f7f6fb'
        rr(ctx, pad + i * (kw + 6), y, kw, kh, 6)
        ctx.fill()
      }
    })
    tex.needsUpdate = true
    return tex
  }, [])
  return (
    <group {...p}>
      <RoundedBox args={[0.74, 0.035, 0.24]} radius={0.012}>
        <Mat color="#c9c7d4" rough={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.0185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.21]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
    </group>
  )
}

const MOUSE_REST = new THREE.Vector3(0.52, 1.215, -0.1)
const PAD = { x: 0.52, z: -0.1, w: 0.3, d: 0.28 }

/** Mouse on a pad. While he holds it, it slides along under his right hand (like the reference). */
function MouseAndPad() {
  const mouse = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const m = mouse.current
    if (!m) return
    if (hand.onMouse) {
      // palm sits slightly behind the wrist (toward the screen)
      target.set(
        THREE.MathUtils.clamp(hand.x, PAD.x - PAD.w / 2 + 0.05, PAD.x + PAD.w / 2 - 0.05),
        MOUSE_REST.y,
        THREE.MathUtils.clamp(hand.z - 0.07, PAD.z - PAD.d / 2 + 0.06, PAD.z + PAD.d / 2 - 0.06),
      )
    } else target.copy(MOUSE_REST)
    m.position.lerp(target, 1 - Math.exp(-14 * dt))
  })
  return (
    <>
      <RoundedBox args={[PAD.w, 0.008, PAD.d]} radius={0.004} position={[PAD.x, 1.204, PAD.z]}>
        <Mat color="#2d2d38" rough={0.95} />
      </RoundedBox>
      <group ref={mouse} position={MOUSE_REST}>
        <mesh scale={[0.62, 0.38, 1]} position={[0, 0.012, 0]}>
          <sphereGeometry args={[0.072, 20, 12]} />
          <Mat color="#f2f1f6" rough={0.35} />
        </mesh>
        <mesh position={[0, 0.036, -0.03]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.009, 0.009, 0.012, 12]} />
          <Mat color="#ff923e" />
        </mesh>
      </group>
    </>
  )
}

function WallFrame({ kind, color, size = 0.8, ...p }: { kind: 'youtube' | 'instagram'; color: string; size?: number } & JSX.IntrinsicElements['group']) {
  const tex = useMemo(() => {
    const c = makeCanvas(256, 256)
    drawSocialLogo(c.ctx, 256, kind)
    c.tex.needsUpdate = true
    return c.tex
  }, [kind])
  return (
    <group {...p}>
      <RoundedBox args={[size + 0.12, size + 0.12, 0.08]} radius={0.06}>
        <Mat color={color} />
      </RoundedBox>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
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

/** The desk chair (exported so the Traveler can sink it through the floor). */
export function Chair({ clip, ...p }: { clip?: THREE.Plane[] } & JSX.IntrinsicElements['group']) {
  return (
    <group {...p}>
      <RoundedBox args={[0.72, 0.08, 0.66]} radius={0.04} position={[0, 0.62, 0]}>
        <meshStandardMaterial color={WHITE} roughness={0.7} clippingPlanes={clip ?? null} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.62, 0.08]} radius={0.04} position={[0, 1.0, 0.33]} rotation={[-0.12, 0, 0]}>
        <meshStandardMaterial color={WHITE} roughness={0.7} clippingPlanes={clip ?? null} />
      </RoundedBox>
      {[[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]}>
          <cylinderGeometry args={[0.025, 0.025, 0.6, 8]} />
          <meshStandardMaterial color="#9a9aa3" roughness={0.3} clippingPlanes={clip ?? null} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A piece of the room that "bounces out" (back-ease shrink around its own
 * pivot) when he falls — staggered by order like the reference: desk first,
 * plant last. Reverses on the way back.
 */
function Bounce({ pivot, order, children }: { pivot: [number, number, number]; order: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const k = bounceScale(trans.value, order)
    g.visible = k > 0.002
    g.scale.setScalar(Math.max(k, 0.002))
  })
  return (
    <group position={pivot}>
      <group ref={ref}>
        <group position={[-pivot[0], -pivot[1], -pivot[2]]}>{children}</group>
      </group>
    </group>
  )
}

/** The desk room on the home page. */
export default function Room() {
  // The Program monitor shows his real episode frames; desk.frame advances when he "clicks".
  const frames = useRef<HTMLImageElement[]>([])
  useEffect(() => {
    frames.current = [4, 1, 3, 6, 2, 5].map((n) => Object.assign(new Image(), { src: `/media/projects/daud/ep0${n}.jpg` }))
  }, [])

  return (
    <group>
      <Bounce pivot={[0, 0, 0.2]} order={2}>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.35} scale={9} blur={2.4} far={3} frames={1} />
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
      </Bounce>
      <Bounce pivot={[0, 1.2, -0.6]} order={0}>
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
      <Monitor draw={(c, w, h, t) => drawProgram(c, w, h, frames.current[desk.frame % 6] ?? null, t)} position={[0.64, 1.88, -0.82]} rotation={[0, -0.18, 0]} />

      <Keyboard position={[0, 1.215, -0.12]} />
      <MouseAndPad />
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
      </Bounce>
      {/* the chair + the editor live in Traveler.tsx (he drops in, swivels, and falls to the lab) */}

      {/* Wall pieces, floating like the reference */}
      <Bounce pivot={[-1.7, 2.75, -1.5]} order={1}>
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
      </Bounce>
      <Bounce pivot={[0.35, 3.05, -1.65]} order={1}>
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
      </Bounce>
      {/* framed platform logos — YouTube (right) and Instagram (above the shelf) */}
      <Bounce pivot={[2.4, 2.45, -1.2]} order={2}>
        <WallFrame kind="youtube" color="#8fb4e3" position={[2.4, 2.45, -1.2]} rotation={[0, -0.45, 0]} />
      </Bounce>
      <Bounce pivot={[-1.75, 3.32, -1.55]} order={1}>
        <WallFrame kind="instagram" color="#e9d3a6" size={0.52} position={[-1.75, 3.32, -1.55]} rotation={[0, 0.12, 0]} />
      </Bounce>
      <Bounce pivot={[2.25, 0, 1.05]} order={3}>
        <Plant position={[2.25, 0, 1.05]} />
      </Bounce>
    </group>
  )
}
