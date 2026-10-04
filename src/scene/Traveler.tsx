import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { blip } from '../lib/sound'
import Character, { newRig } from './Character'
import { bounceScale, clamp01, desk, easeIn, easeInOut, easeOut, intro, LAB_Y, LAB_Z, moveProgress, trans, TURN, WIRE_Y } from './progress'
import { Chair } from './Room'
import { makeCanvas, rr } from './textures'

type Stage = 'sit' | 'fall' | 'float'

const SEAT_Y = 0.66 // standing on the chair seat at the moment he jumps
const LAND_Y = LAB_Y + 0.42 // standing on the tube floor, head just under the cap (like the reference)
const SCALE = 1.25
const H = 2.25 * SCALE // his height at hologram scale
const CHAIR = new THREE.Vector3(0, 0, 0.4)
const FACE_DESK = Math.PI
const FACE_CAMERA = 0.66 // swivelled round toward the home camera
const FACE_LAB_CAMERA = 0.38

// Intro beats (seconds after the loader finishes), modelled on the reference
const DROP = 1.1
const IMPACT = 0.35
const SWIVEL_OUT = [1.55, 2.05]
const WAVE_END = 4.0
const SWIVEL_BACK = 0.5

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** Chat-bubble sprite that pops above the timeline monitor ("new message"). */
function useBubbleTexture() {
  return useMemo(() => {
    const { ctx, tex } = makeCanvas(256, 256)
    ctx.fillStyle = '#ffffff'
    rr(ctx, 24, 40, 208, 140, 36)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(70, 176)
    ctx.lineTo(56, 222)
    ctx.lineTo(112, 178)
    ctx.fill()
    ctx.fillStyle = '#091434'
    for (let i = 0; i < 3; i++) (ctx.beginPath(), ctx.arc(86 + i * 42, 110, 13, 0, Math.PI * 2), ctx.fill())
    ctx.fillStyle = '#ff923e'
    ctx.beginPath()
    ctx.arc(214, 52, 26, 0, Math.PI * 2)
    ctx.fill()
    tex.needsUpdate = true
    return tex
  }, [])
}

/**
 * Everything the editor does, choreographed:
 *  · page 1 — drops into his chair (startled), the chair wobbles, he swivels
 *    round to wave, then works: types, blinks, clicks through footage on the
 *    Program monitor, and now and then turns to the timeline to type fast as
 *    a message pops up.
 *  · page 1 → 2 — the room bounces out, he hops and falls straight down,
 *    scanned from clay into a hologram at WIRE_Y, and lands in the tube.
 *  · page 2 — floats in the tube, facing you, arms drifting.
 * Everything in the fall is driven by trans.value, so it reverses going up.
 */
export default function Traveler({ reduced }: { reduced: boolean }) {
  const [stage, setStage] = useState<Stage>('sit')
  const rig = useRef(newRig('type'))
  const holoRig = useRef(newRig('float'))
  const fallRig = useRef({ ...newRig('fall'), scared: true })
  const sched = useRef({ landedAt: -10, introT0: -1, act: 'type' as 'type' | 'mouse' | 'fast', until: 0, mouseAt: 3, fastAt: 9, clickAt: 0, blinkAt: 2.5, popupT0: -10 })

  const chairRoot = useRef<THREE.Group>(null)
  const swivel = useRef<THREE.Group>(null)
  const drop = useRef<THREE.Group>(null)
  const popup = useRef<THREE.Sprite>(null)
  const popupMat = useRef<THREE.SpriteMaterial>(null)
  const faller = useRef<THREE.Group>(null)
  const scan = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.Mesh>(null)
  const pulseMat = useRef<THREE.MeshBasicMaterial>(null)
  const floater = useRef<THREE.Group>(null)
  const bubble = useBubbleTexture()

  // Clay is kept above the scan plane, the hologram below it.
  const clayClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 1, 0), -WIRE_Y)], [])
  const holoClip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), WIRE_Y)], [])

  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    const v = trans.value
    const S = sched.current
    const next: Stage = v < TURN ? 'sit' : v < 0.985 ? 'fall' : 'float'
    if (next !== stage) {
      if (next === 'float') S.landedAt = now
      setStage(next)
    }

    /* ── page 1 ─────────────────────────────────────────────── */
    if (intro.pending) {
      intro.pending = false
      if (!reduced && v === 0) {
        S.introT0 = now
        blip('chairImpact', DROP)
      }
    }
    const it = S.introT0 < 0 ? 99 : now - S.introT0
    const r = rig.current

    // drop into the chair
    if (drop.current) drop.current.position.y = it < DROP ? (1 - easeIn(it / DROP)) * 6 : 0
    // chair wobble on impact + swivel round to wave
    let wob = 0
    if (it >= DROP && it < DROP + IMPACT) {
      const k = (it - DROP) / IMPACT
      wob = Math.sin(k * Math.PI * 2) * 0.12 * (1 - k)
    }
    let sw = 0
    if (it >= SWIVEL_OUT[0] && it < SWIVEL_OUT[1]) sw = easeInOut((it - SWIVEL_OUT[0]) / (SWIVEL_OUT[1] - SWIVEL_OUT[0]))
    else if (it >= SWIVEL_OUT[1] && it < WAVE_END) sw = 1
    else if (it >= WAVE_END && it < WAVE_END + SWIVEL_BACK) sw = 1 - easeInOut((it - WAVE_END) / SWIVEL_BACK)
    // leaving for the lab: he swivels round to face you first (reference beat)
    if (v > 0) sw = Math.max(sw, easeOut(clamp01(v / TURN)))
    if (swivel.current) {
      swivel.current.rotation.set(wob, THREE.MathUtils.lerp(FACE_DESK, FACE_CAMERA, sw), -wob)
    }
    // the chair bounces away with the room during the fall
    if (chairRoot.current) {
      const k = bounceScale(v, 1)
      chairRoot.current.visible = k > 0.002
      chairRoot.current.scale.setScalar(Math.max(k, 0.002))
    }

    r.scared = it < DROP + 0.2 || v > 0
    if (v > 0) r.mode = 'rest'
    else if (it < SWIVEL_OUT[0]) r.mode = it < DROP ? 'rest' : 'type'
    else if (it < WAVE_END + 0.1) r.mode = sw > 0.55 ? 'wave' : 'rest'
    else if (reduced) r.mode = 'type'
    else {
      // idle routine
      if (now > S.until) {
        if (now >= S.fastAt) {
          S.act = 'fast'
          S.until = now + 3.2
          S.fastAt = now + rand(12, 17)
          S.popupT0 = now
          blip('notification')
          blip('typing', 0.6)
          blip('typing', 1.7)
        } else if (now >= S.mouseAt) {
          S.act = 'mouse'
          S.until = now + 1.4
          S.mouseAt = now + rand(3, 5.5)
          S.clickAt = now + 0.7
        } else S.act = 'type'
      }
      if (S.clickAt && now >= S.clickAt) {
        S.clickAt = 0
        desk.frame++
        blip('tick')
      }
      r.mode = S.act
    }
    // blink every few seconds
    if (now >= S.blinkAt) {
      r.blink = true
      if (now >= S.blinkAt + 0.13) {
        r.blink = false
        S.blinkAt = now + rand(3.5, 6)
      }
    }

    // "new message" pop-up over the timeline monitor
    if (popup.current && popupMat.current) {
      const age = now - S.popupT0
      const on = age >= 0 && age < 2 && stage === 'sit'
      popup.current.visible = on
      if (on) {
        popup.current.position.y = 2.45 + easeOut(age / 2) * 0.6
        popupMat.current.opacity = Math.min(age / 0.25, 1) * (age > 1.4 ? (2 - age) / 0.6 : 1)
      }
    }

    /* ── page 1 → 2: the fall ───────────────────────────────── */
    const c = moveProgress(v)
    const y = THREE.MathUtils.lerp(SEAT_Y, LAND_Y, clamp01(c * 1.08)) // he reaches the tube just before the camera settles
    if (faller.current) {
      faller.current.position.y = y
      faller.current.rotation.y = THREE.MathUtils.lerp(FACE_CAMERA, FACE_LAB_CAMERA, c)
    }
    if (scan.current) {
      scan.current.visible = stage === 'fall' && y < WIRE_Y && y + H > WIRE_Y
      scan.current.rotation.y = now * 2
    }
    const p = clamp01((v - 0.88) / 0.12)
    if (pulse.current && pulseMat.current) {
      pulse.current.visible = p > 0 && p < 1
      pulse.current.scale.setScalar(0.4 + p * 1.6)
      pulseMat.current.opacity = (1 - p) * 0.9
    }

    /* ── page 2: floating in the tube ───────────────────────── */
    // just landed: arms still up for a beat, then he settles (reference "water idle")
    holoRig.current.mode = now - S.landedAt < 0.55 ? 'fall' : 'float'
    if (floater.current) {
      floater.current.position.y = LAND_Y + (reduced ? 0 : 0.03 + Math.sin(now * 1.1) * 0.03)
      floater.current.rotation.set(reduced ? 0 : Math.sin(now * 0.7) * 0.02, FACE_LAB_CAMERA + (reduced ? 0 : Math.sin(now * 0.4) * 0.06), reduced ? 0 : Math.sin(now * 0.9) * 0.02)
    }
  })

  return (
    <>
      {/* chair + seated editor (swivel group pivots on the seat) */}
      <group ref={chairRoot} position={CHAIR}>
        <group ref={swivel} rotation={[0, FACE_DESK, 0]}>
          <Chair rotation={[0, -Math.PI, 0]} />
          {stage === 'sit' && (
            <group ref={drop}>
              <Character pose="sit" rig={rig} still={reduced} position={[0, 0.25, 0.1]} />
            </group>
          )}
        </group>
      </group>

      <sprite ref={popup} position={[-0.64, 2.45, -0.75]} scale={[0.42, 0.42, 0.42]} visible={false}>
        <spriteMaterial ref={popupMat} map={bubble} transparent depthWrite={false} />
      </sprite>

      {stage === 'fall' && (
        <group ref={faller} position={[0, SEAT_Y, LAB_Z]} scale={SCALE}>
          <Character pose="stand" rig={fallRig} still={reduced} clip={clayClip} />
          <Character pose="stand" rig={fallRig} still={reduced} holo clip={holoClip} />
        </group>
      )}

      {stage === 'float' && (
        <group ref={floater} position={[0, LAND_Y, LAB_Z]} scale={SCALE}>
          <Character pose="stand" holo rig={holoRig} still={reduced} />
        </group>
      )}

      {/* the scan line: a glowing ring + soft disc at the transform height */}
      <group ref={scan} position={[0, WIRE_Y, LAB_Z]} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.96, 0.025, 8, 64]} />
          <meshBasicMaterial color="#8ee2ff" toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.96, 48]} />
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
