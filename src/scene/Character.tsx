import { useGLTF } from '@react-three/drei/core/Gltf'
import { useFrame, type GroupProps } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { hand } from './progress'
import { shown } from './textures'

/**
 * The editor model. Each entry maps our limb names to the model's bones.
 *  · jake    — the model supplied by Rishabh ("Jake", Character Creator rig),
 *              compressed for the web (41 MB → 1.5 MB). Source/licence: TBC.
 *  · business — "Business Man" by Quaternius (CC0, poly.pizza/m/JFrLIKqvCH).
 * Poses are made by aiming limbs in code, so any rigged human works.
 */
const MODELS = {
  jake: {
    url: '/models/jake.glb',
    /** Right palm direction in the rest pose (T-pose: palms face down). */
    palmRest: [0, -1, 0] as [number, number, number],
    palmRestL: [0, -1, 0] as [number, number, number],
    idle: undefined as string | undefined,
    bones: {
      UpperArmL: 'CC_Base_L_Upperarm', LowerArmL: 'CC_Base_L_Forearm',
      UpperArmR: 'CC_Base_R_Upperarm', LowerArmR: 'CC_Base_R_Forearm',
      UpperLegL: 'CC_Base_L_Thigh', LowerLegL: 'CC_Base_L_Calf',
      UpperLegR: 'CC_Base_R_Thigh', LowerLegR: 'CC_Base_R_Calf',
      head: 'CC_Base_Head', wristR: 'CC_Base_R_Hand', wristL: 'CC_Base_L_Hand',
      eyeL: 'CC_Base_L_Eye', eyeR: 'CC_Base_R_Eye',
    } as Record<string, string>,
  },
  business: {
    url: '/models/editor.glb',
    palmRest: [1, 0, 0] as [number, number, number], // arms down, palms face the body
    palmRestL: [-1, 0, 0] as [number, number, number],
    idle: 'CharacterArmature|Idle' as string | undefined,
    bones: {
      UpperArmL: 'UpperArmL', LowerArmL: 'LowerArmL', UpperArmR: 'UpperArmR', LowerArmR: 'LowerArmR',
      UpperLegL: 'UpperLegL', LowerLegL: 'LowerLegL', UpperLegR: 'UpperLegR', LowerLegR: 'LowerLegR',
      head: 'Head', wristR: 'WristR', wristL: 'WristL',
    } as Record<string, string>,
  },
}
const CFG = MODELS.jake
useGLTF.preload(CFG.url)

/** Height of his hip joints when seated (chair seat top is ~0.12 below). */
const SEAT_HIP = 0.76

/** Height (in scene units) the character is scaled to, standing. */
const TARGET_HEIGHT = 2.05

type Pose = 'sit' | 'stand'

/** Live "puppet strings" for a character, written by a choreographer (Traveler.tsx) every frame. */
export type CharRig = {
  /** type: typing · mouse: left hand on the mouse · fast: quick typing, head to the timeline monitor
   *  wave: right arm waving · fall: arms flailing · float: drifting in the tube · rest: arms down */
  mode: 'type' | 'mouse' | 'fast' | 'wave' | 'fall' | 'float' | 'rest'
  blink: boolean
  scared: boolean
  /** World-space spots for his hands (keyboard / mouse). When set, the arms reach them exactly (IK). */
  ikL?: THREE.Vector3 | null
  ikR?: THREE.Vector3 | null
}
export const newRig = (mode: CharRig['mode'] = 'type'): CharRig => ({ mode, blink: false, scared: false })

type Props = GroupProps & {
  pose: Pose
  holo?: boolean
  typing?: boolean
  wave?: boolean
  still?: boolean
  /** Both arms thrown up — used while falling. */
  armsUp?: boolean
  /** Clipping planes (e.g. clay above a line, hologram below it). */
  clip?: THREE.Plane[]
  /** When given, this drives the pose instead of the simple flags above. */
  rig?: React.MutableRefObject<CharRig>
  /** Publish his right-wrist position while using the mouse (the desk mouse follows it). */
  trackHand?: boolean
}

const LIMBS = ['UpperArmL', 'LowerArmL', 'UpperArmR', 'LowerArmR', 'UpperLegL', 'LowerLegL', 'UpperLegR', 'LowerLegR'] as const
type Limb = (typeof LIMBS)[number]
type Dirs = Partial<Record<Limb, [number, number, number]>>

const v = (x: number, y: number, z: number) => [x, y, z] as [number, number, number]

/** Limb directions in the character's own space (+z forward, +x his left). */
function targetDirs(mode: CharRig['mode'], sitting: boolean, t: number): Dirs {
  const d: Dirs = {}
  const s = Math.sin
  if (sitting) {
    d.UpperLegL = v(0.06, -0.12, 1)
    d.UpperLegR = v(-0.06, -0.12, 1)
    d.LowerLegL = v(0.02, -1, 0.12)
    d.LowerLegR = v(-0.02, -1, 0.12)
  }
  switch (mode) {
    case 'type':
      d.UpperArmL = v(0.12, -0.75, 0.55)
      d.UpperArmR = v(-0.12, -0.75, 0.55)
      d.LowerArmL = v(-0.18, 0.02 + s(t * 14) * 0.08, 1)
      d.LowerArmR = v(0.18, 0.02 + s(t * 14 + 1.7) * 0.08, 1)
      break
    case 'fast':
      d.UpperArmL = v(0.12, -0.75, 0.55)
      d.UpperArmR = v(-0.12, -0.75, 0.55)
      d.LowerArmL = v(-0.18, 0.02 + s(t * 24) * 0.12, 1)
      d.LowerArmR = v(0.18, 0.02 + s(t * 24 + 1.3) * 0.12, 1)
      break
    case 'mouse':
      // right hand out to the mouse (his right = -x), small scrolling/clicking movements
      d.UpperArmR = v(-0.85, -0.62, 0.38)
      d.LowerArmR = v(-0.75 + s(t * 2.2) * 0.12, -0.18, 0.75 + s(t * 3.1) * 0.08)
      d.UpperArmL = v(0.12, -0.75, 0.55)
      d.LowerArmL = v(-0.18, 0.02, 1)
      break
    case 'wave':
      d.UpperArmR = v(-0.75, 0.6, 0.2)
      d.LowerArmR = v(-0.1 + s(t * 7) * 0.45, 1, 0.15)
      d.UpperArmL = v(0.25, -1, 0.05)
      d.LowerArmL = v(0.15, -1, 0.25)
      break
    case 'fall':
      d.UpperArmL = v(0.85, 0.45 + s(t * 13) * 0.25, 0.1)
      d.UpperArmR = v(-0.85, 0.45 + s(t * 13 + 2) * 0.25, 0.1)
      d.LowerArmL = v(0.45, 1, 0.1 + s(t * 15) * 0.2)
      d.LowerArmR = v(-0.45, 1, 0.1 + s(t * 15 + 1) * 0.2)
      if (!sitting) {
        d.UpperLegL = v(0.15, -0.85, 0.35 + s(t * 11) * 0.2)
        d.UpperLegR = v(-0.15, -0.85, 0.35 - s(t * 11) * 0.2)
        d.LowerLegL = v(0.05, -1, -0.3)
        d.LowerLegR = v(-0.05, -1, -0.3)
      }
      break
    case 'float':
      d.UpperArmL = v(0.38 + s(t * 1.3) * 0.08, -0.92, 0.05)
      d.UpperArmR = v(-0.38 - s(t * 1.4 + 0.5) * 0.08, -0.92, 0.05)
      d.LowerArmL = v(0.22, -0.95, 0.18 + s(t * 1.1) * 0.06)
      d.LowerArmR = v(-0.22, -0.95, 0.18 + s(t * 1.2 + 1) * 0.06)
      break
    default: // rest
      if (!CFG.idle) {
        d.UpperArmL = v(0.18, -1, 0.02)
        d.UpperArmR = v(-0.18, -1, 0.02)
        d.LowerArmL = v(0.1, -1, 0.12)
        d.LowerArmR = v(-0.1, -1, 0.12)
      }
  }
  return d
}

function headTarget(mode: CharRig['mode'], t: number): [number, number] {
  // [yaw, pitch] in radians
  switch (mode) {
    case 'type':
      return [Math.sin(t * 0.6) * 0.08, 0.22]
    case 'fast':
      return [0.42, 0.18] // toward the timeline monitor (his left)
    case 'mouse':
      return [-0.32, 0.2] // toward the Program monitor (his right)
    case 'wave':
      return [0, -0.05]
    case 'fall':
      return [0, -0.25]
    case 'float':
      return [Math.sin(t * 0.5) * 0.1, Math.sin(t * 0.9) * 0.04]
    default:
      return [Math.sin(t * 0.6) * 0.15, 0]
  }
}

// scratch objects
const _q = new THREE.Quaternion()
const _q2 = new THREE.Quaternion()
const _pq = new THREE.Quaternion()
const _mq = new THREE.Quaternion()
const _cur = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _e = new THREE.Euler()
const UP = new THREE.Vector3(0, 1, 0)
const _pole = new THREE.Vector3()

/** The bone's own "length" axis: towards its first child joint (works for any rig). */
function boneAxis(bone: THREE.Object3D) {
  const child = bone.children.find((c) => c.position.lengthSq() > 1e-8)
  return child ? child.position.clone().normalize() : UP.clone()
}

/** Rotate a bone so its length axis points along `dirWorld`. */
function aim(bone: THREE.Object3D, axis: THREE.Vector3, dirWorld: THREE.Vector3) {
  bone.updateWorldMatrix(true, false)
  bone.getWorldQuaternion(_q)
  _cur.copy(axis).applyQuaternion(_q).normalize()
  _q2.setFromUnitVectors(_cur, dirWorld)
  _q.premultiply(_q2)
  bone.parent!.getWorldQuaternion(_pq)
  bone.quaternion.copy(_pq.invert().multiply(_q))
  bone.updateWorldMatrix(false, true)
}

const _a = new THREE.Vector3()
const _n = new THREE.Vector3()
const _f = new THREE.Vector3()

/**
 * Twist the forearm around its own length so the palm faces `wantWorld`
 * (aiming alone leaves the twist arbitrary — the wave showed the back of the hand).
 */
function facePalm(forearm: THREE.Object3D, axis: THREE.Vector3, handBone: THREE.Object3D, palmLocal: THREE.Vector3, wantWorld: THREE.Vector3) {
  forearm.updateWorldMatrix(true, true)
  forearm.getWorldQuaternion(_q)
  _a.copy(axis).applyQuaternion(_q).normalize()
  handBone.getWorldQuaternion(_q2)
  _n.copy(palmLocal).applyQuaternion(_q2)
  // compare palm and wanted direction in the plane across the forearm
  _n.addScaledVector(_a, -_n.dot(_a)).normalize()
  _f.copy(wantWorld).addScaledVector(_a, -wantWorld.dot(_a)).normalize()
  if (_n.lengthSq() < 1e-6 || _f.lengthSq() < 1e-6) return
  const angle = Math.atan2(_cur.crossVectors(_n, _f).dot(_a), _n.dot(_f))
  _q2.setFromAxisAngle(_a, angle)
  _q.premultiply(_q2)
  forearm.parent!.getWorldQuaternion(_pq)
  forearm.quaternion.copy(_pq.invert().multiply(_q))
  forearm.updateWorldMatrix(false, true)
}

/**
 * Spectacles built in code and parented to the head bone, placed from the eye
 * joints in the rest pose — so they follow every head turn (and the hologram).
 */
function makeGlasses(head: THREE.Object3D, eyeL: THREE.Object3D, eyeR: THREE.Object3D) {
  const pL = eyeL.getWorldPosition(new THREE.Vector3())
  const pR = eyeR.getWorldPosition(new THREE.Vector3())
  const ipd = pL.distanceTo(pR)
  const g = new THREE.Group()
  g.name = 'Glasses'
  const frame = new THREE.MeshStandardMaterial({ color: '#16161c', roughness: 0.35, metalness: 0.4 })
  const lens = new THREE.MeshStandardMaterial({ color: '#cfe6ff', roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false })
  const r = ipd * 0.43
  for (const side of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, ipd * 0.05, 8, 32), frame)
    ring.scale.set(1, 0.78, 1)
    ring.position.set((side * ipd) / 2, 0, 0)
    const glass = new THREE.Mesh(new THREE.CircleGeometry(r, 32), lens)
    glass.scale.set(1, 0.78, 1)
    glass.position.copy(ring.position)
    const temple = new THREE.Mesh(new THREE.BoxGeometry(ipd * 0.05, ipd * 0.06, ipd * 1.7), frame)
    temple.position.set(side * (ipd / 2 + r * 0.98), ipd * 0.05, -ipd * 0.85)
    g.add(ring, glass, temple)
  }
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(ipd * 0.035, ipd * 0.035, ipd - 2 * r * 0.95, 8), frame)
  bridge.rotation.z = Math.PI / 2
  bridge.position.y = ipd * 0.12
  g.add(bridge)
  g.traverse((o) => (o.userData.glasses = true))
  // rest pose: centred between the eyes, a little in front, axes aligned with the model (+z forward)
  const centre = new THREE.Vector3().addVectors(pL, pR).multiplyScalar(0.5).add(new THREE.Vector3(0, ipd * 0.05, ipd * 0.42))
  const world = new THREE.Matrix4().makeTranslation(centre.x, centre.y, centre.z)
  const localM = head.matrixWorld.clone().invert().multiply(world)
  localM.decompose(g.position, g.quaternion, g.scale)
  return g
}

const _S = new THREE.Vector3()
const _E = new THREE.Vector3()
const _W = new THREE.Vector3()
const _T = new THREE.Vector3()
const _p = new THREE.Vector3()
const DOWN = new THREE.Vector3(0, -1, 0)

/** Two-bone IK: put the wrist on `target`, elbow bending toward `pole`. */
function reach(upper: THREE.Object3D, upAxis: THREE.Vector3, lower: THREE.Object3D, loAxis: THREE.Vector3, wrist: THREE.Object3D, target: THREE.Vector3, pole: THREE.Vector3) {
  upper.updateWorldMatrix(true, true)
  upper.getWorldPosition(_S)
  lower.getWorldPosition(_E)
  wrist.getWorldPosition(_W)
  const L1 = _S.distanceTo(_E)
  const L2 = _E.distanceTo(_W)
  _T.subVectors(target, _S)
  const dist = Math.min(Math.max(_T.length(), 1e-3), (L1 + L2) * 0.999)
  _T.normalize()
  const a = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist)
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a))
  _p.copy(pole).addScaledVector(_T, -pole.dot(_T)).normalize()
  _E.copy(_S).addScaledVector(_T, a).addScaledVector(_p, h) // elbow
  _W.copy(_S).addScaledVector(_T, dist) // reachable wrist spot
  aim(upper, upAxis, _dir.subVectors(_E, _S).normalize())
  aim(lower, loAxis, _dir.subVectors(_W, _E).normalize())
}

export default function Character({ pose, holo, typing, wave, still, armsUp, clip, rig, trackHand, ...group }: Props) {
  const { scene, animations } = useGLTF(CFG.url)
  const model = useMemo(() => clone(scene), [scene])
  const root = useRef<THREE.Group>(null)

  // materials: own copies per instance (clipping differs), or the hologram wireframe
  useEffect(() => {
    const holoMat = new THREE.MeshBasicMaterial({ color: '#5fd2ff', wireframe: true, transparent: true, opacity: 0.45, depthWrite: false, clippingPlanes: clip })
    model.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = false
      m.frustumCulled = false
      if (holo) m.material = holoMat
      else {
        const src = m.material as THREE.MeshStandardMaterial
        const mat = src.clone()
        mat.clippingPlanes = clip ?? null
        if (!m.userData.glasses) mat.roughness = Math.max(mat.roughness, 0.6)
        m.material = mat
      }
    })
  }, [model, holo, clip])

  const bones = useMemo(() => {
    const get = (n: string) => model.getObjectByName(n)!
    const map = Object.fromEntries(Object.entries(CFG.bones).map(([k, n]) => [k, get(n)])) as Record<Limb | 'head' | 'wristR' | 'wristL' | 'eyeL' | 'eyeR', THREE.Object3D>
    const axes = new Map(LIMBS.map((l) => [l, boneAxis(map[l])]))
    // rest rotations: models without an idle clip are reset to these every frame,
    // otherwise per-frame offsets (like the head turn) would accumulate and spin
    const rest = new Map([...LIMBS, 'head' as const].map((k) => [map[k], map[k].quaternion.clone()]))
    // palm normals in each hand's own space (from the rest pose)
    model.updateWorldMatrix(true, true)
    const local = (dir: [number, number, number], bone: THREE.Object3D) =>
      new THREE.Vector3(...dir).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion()).invert())
    const palm = local(CFG.palmRest, map.wristR)
    const palmL = local(CFG.palmRestL, map.wristL)
    if (map.eyeL && map.eyeR) map.head.add(makeGlasses(map.head, map.eyeL, map.eyeR))
    return { ...map, axes, rest, palm, palmL }
  }, [model])

  // size: scale to TARGET_HEIGHT; when sitting, drop him so his hip joints sit on the seat
  const { scale, sitDrop, standDrop } = useMemo(() => {
    model.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(model)
    const scale = TARGET_HEIGHT / (box.max.y - box.min.y)
    const hipY = (bones.UpperLegL.getWorldPosition(new THREE.Vector3()).y - box.min.y) * scale
    return { scale, sitDrop: SEAT_HIP - hipY - box.min.y * scale, standDrop: -box.min.y * scale }
  }, [model, bones])

  // breathing idle from the model's own animation
  const mixer = useMemo(() => new THREE.AnimationMixer(model), [model])
  useEffect(() => {
    const idle = CFG.idle ? THREE.AnimationClip.findByName(animations, CFG.idle) : undefined
    if (idle) mixer.clipAction(idle).play()
    return () => void mixer.stopAllAction()
  }, [mixer, animations])

  useEffect(() => () => void (trackHand && (hand.onMouse = false)), [trackHand])

  const ik = useRef<{ L?: THREE.Vector3; R?: THREE.Vector3 }>({})

  // smoothed limb directions (character space) + head
  const cur = useRef<Partial<Record<Limb, THREE.Vector3>>>({})
  const head = useRef<[number, number]>([0, 0])

  useFrame(({ clock }, dt) => {
    if (!shown(root.current)) return // off-screen: skip animation + IK work
    const t = clock.elapsedTime
    if (CFG.idle) mixer.update(still ? 0 : Math.min(dt, 0.05))
    else for (const [bone, q] of bones.rest) bone.quaternion.copy(q)

    const mode: CharRig['mode'] = rig ? rig.current.mode : armsUp ? 'fall' : wave ? 'wave' : typing ? 'type' : 'rest'
    const dirs = targetDirs(mode, pose === 'sit', still ? 0 : t)
    model.updateWorldMatrix(true, true)
    model.getWorldQuaternion(_mq)
    const k = 1 - Math.exp(-12 * dt)

    for (const limb of LIMBS) {
      const target = dirs[limb]
      const c = cur.current
      if (!target) {
        delete c[limb]
        continue
      }
      _dir.set(...target).normalize()
      if (!c[limb]) c[limb] = _dir.clone()
      else c[limb]!.lerp(_dir, k).normalize()
      aim(bones[limb], bones.axes.get(limb)!, _dir.copy(c[limb]!).applyQuaternion(_mq).normalize())
    }

    // hands on keyboard / mouse: exact placement + palms facing down
    const r = rig?.current
    if (r && (mode === 'type' || mode === 'fast' || mode === 'mouse')) {
      for (const side of ['L', 'R'] as const) {
        const target = side === 'L' ? r.ikL : r.ikR
        if (!target) continue
        const sm = (ik.current[side] ??= target.clone()).lerp(target, 1 - Math.exp(-18 * dt))
        const sgn = side === 'L' ? 1 : -1 // his left is +x
        _pole.set(sgn * 0.8, -0.45, -0.55).applyQuaternion(_mq)
        const upKey = side === 'L' ? 'UpperArmL' : 'UpperArmR'
        const loKey = side === 'L' ? 'LowerArmL' : 'LowerArmR'
        const wr = side === 'L' ? bones.wristL : bones.wristR
        reach(bones[upKey], bones.axes.get(upKey)!, bones[loKey], bones.axes.get(loKey)!, wr, sm, _pole)
        facePalm(bones[loKey], bones.axes.get(loKey)!, wr, side === 'L' ? bones.palmL : bones.palm, DOWN)
      }
    } else ik.current = {}

    if (mode === 'wave') {
      // palm toward whoever he's waving at (his forward, slightly up)
      _f.set(0, 0.25, 1).applyQuaternion(_mq).normalize()
      facePalm(bones.LowerArmR, bones.axes.get('LowerArmR')!, bones.wristR, bones.palm, _f.clone())
    }

    const [ty, tp] = headTarget(mode, still ? 0 : t)
    head.current[0] += (ty - head.current[0]) * (1 - Math.exp(-6 * dt))
    head.current[1] += (tp - head.current[1]) * (1 - Math.exp(-6 * dt))
    _e.set(head.current[1], head.current[0], 0)
    bones.head.quaternion.multiply(_q.setFromEuler(_e))

    if (import.meta.env.DEV && trackHand) {
      const w = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3()).toArray().map((n) => +n.toFixed(3))
      ;(window as unknown as { __wrists: unknown }).__wrists = { mode, L: w(bones.wristL), R: w(bones.wristR), tL: r?.ikL?.toArray(), tR: r?.ikR?.toArray(), shL: w(bones.UpperArmL), shR: w(bones.UpperArmR), elL: w(bones.LowerArmL) }
    }
    if (trackHand) {
      hand.onMouse = mode === 'mouse'
      if (hand.onMouse) {
        bones.wristR.getWorldPosition(_dir)
        hand.x = _dir.x
        hand.y = _dir.y
        hand.z = _dir.z
      }
    }
  })

  return (
    <group {...group}>
      <group ref={root} position={[0, pose === 'sit' ? sitDrop : standDrop, 0]} scale={scale}>
        <primitive object={model} />
      </group>
    </group>
  )
}
