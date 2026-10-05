/**
 * The reference portfolio's 3D world (github.com/Yashchauhan008/portfolio-3d),
 * used with Yash's permission (per Rishabh). Models, baked textures, matcaps,
 * face sprites and the character's animation clips come from that repo
 * (public/ref/**); materials, placements and timings follow its code.
 * Mayank-specific: monitors show the editing timeline + his episodes.
 */
import { useGLTF } from '@react-three/drei/core/Gltf'
import { useFrame, useLoader } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { profile } from '../../content/site'
import { blip } from '../../lib/sound'
import { FloatingLogo } from '../Lab'
import { bounceScale, cam, clamp01, desk, easeIn, hand, intro, moveProgress, trans } from '../progress'
import { drawProgram, drawTimeline, makeCanvas, shown, toolLogo } from '../textures'

const M = '/ref/models'
const T = '/ref/textures'

// World layout (reference coordinates)
export const ROOM_Y = -5.7
export const LAB_Y = -19.9
export const CHAR_LAB_Y = -18.95
export const CONTACT_Y = -40
const CHAR_CONTACT_Y = CONTACT_Y + 0.27
const INTRO_FROM_Y = 2

/** Shared between room and character (chair wobble, message pop-up, mouse sync). */
const fx = { chair: null as THREE.Object3D | null, popupT0: -10 }

function useTex(url: string, { flipY = false, srgb = true } = {}) {
  const t = useLoader(THREE.TextureLoader, url)
  useMemo(() => {
    t.flipY = flipY
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
  }, [t, flipY, srgb])
  return t
}

const shadowVert = /* glsl */ `varying vec2 vUv;
void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vUv = uv; }`
const shadowFrag = /* glsl */ `uniform sampler2D alphaMask; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
void main() { float a = texture2D(alphaMask, vUv).r; gl_FragColor = vec4(uColor, (1.0 - a) * uOpacity); }`

function shadowMaterial(tex: THREE.Texture, color: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { alphaMask: { value: tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 } },
    vertexShader: shadowVert,
    fragmentShader: shadowFrag,
  })
}

/* ───────────────────────── Room ───────────────────────── */

export function RefRoom() {
  const room = useGLTF(`${M}/room/model.glb`)
  const shadow = useGLTF(`${M}/room/shadow-model.glb`)
  const baked = useTex(`${M}/room/baked.jpg`)
  const shadowTex = useTex(`${M}/room/shadow-baked.jpg`, { srgb: false })
  const messageTex = useTex(`${T}/sprites/new-message.png`, { flipY: true })

  // Monitors: the editing timeline + his episode frames (instead of the reference's code screens)
  const screens = useMemo(() => {
    const a = makeCanvas(640, 400)
    const b = makeCanvas(640, 400)
    a.tex.flipY = false
    b.tex.flipY = false
    return { a, b }
  }, [])
  const frames = useRef<HTMLImageElement[]>([])
  useEffect(() => {
    frames.current = [4, 1, 3, 6, 2, 5].map((n) => Object.assign(new Image(), { src: `/media/projects/daud/ep0${n}.jpg` }))
  }, [])

  const parts = useMemo(() => {
    const model = room.scene
    const mat = new THREE.MeshBasicMaterial({ map: baked, transparent: true, fog: false })
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = mat
    })
    const get = (n: string) => model.getObjectByName(n)!
    const base = get('room-base')
    for (const n of ['speaker', 'penguin', 'chair']) base.add(get(n))
    const mouse = get('mouse')
    base.add(mouse)
    mouse.position.x += 0.15
    mouse.position.z += 0.07
    const mouseRest = mouse.position.clone()
    get('desktop-plane-0').traverse((o) => ((o as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: screens.a.tex, fog: false })))
    get('desktop-plane-1').traverse((o) => ((o as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: screens.b.tex, fog: false })))

    const sMat = shadowMaterial(shadowTex, '#c4a37e')
    const catcher = shadow.scene.getObjectByName('shadowCatcher') as THREE.Mesh
    catcher.material = sMat
    model.add(catcher)

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: messageTex, transparent: true, opacity: 0, fog: false, depthTest: false }))
    sprite.position.set(-1.75, 3.5, 1.8)
    sprite.scale.setScalar(0.35)
    model.add(sprite)

    fx.chair = get('chair')
    return {
      model,
      sMat,
      sprite,
      mouse,
      mouseRest,
      bounce: [
        [base, 0],
        [get('shelving'), 1],
        [get('blackboard'), 1],
        [get('picture'), 2],
        [get('plant'), 3],
      ] as [THREE.Object3D, number][],
    }
  }, [room, shadow, baked, shadowTex, messageTex, screens])

  const last = useRef(-1)
  const self = useRef<THREE.Group>(null)
  const local = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }) => {
    if (!shown(self.current)) return
    const t = clock.elapsedTime
    const v = trans.value
    // staggered bounce-out / in (reference: room.bounceOut / bounceIn)
    for (const [o, order] of parts.bounce) {
      const k = bounceScale(v, order)
      o.visible = k > 0.002
      o.scale.setScalar(Math.max(k, 0.002))
    }
    parts.sMat.uniforms.uOpacity.value = clamp01(bounceScale(v, 0))

    // monitors at 15fps
    if (t - last.current > 1 / 15) {
      last.current = t
      drawTimeline(screens.a.ctx, 640, 400, t)
      screens.a.tex.needsUpdate = true
      drawProgram(screens.b.ctx, 640, 400, frames.current[desk.frame % 6] ?? null, t)
      screens.b.tex.needsUpdate = true
    }

    // "new message" pop-up (reference: messagePopUp.show)
    const age = t - fx.popupT0
    const sm = parts.sprite.material as THREE.SpriteMaterial
    if (age >= 0 && age < 2.2) {
      parts.sprite.position.y = 3.3 + Math.min(1, age / 2) * 0.7
      sm.opacity = Math.min(1, age / 0.5) * (age > 1.3 ? Math.max(0, 1 - (age - 1.3) / 0.5) : 1)
    } else sm.opacity = 0

    // mouse follows his right hand while he works (reference: updateMouseSync)
    if (hand.onMouse) {
      local.set(hand.x, hand.y, hand.z)
      if (local.y < 1.63 + ROOM_Y && local.y > 1.58 + ROOM_Y && local.x > 0.2 && local.x < 0.6) {
        parts.mouse.position.z = -local.x - 1.849
        parts.mouse.position.x = local.z + 0.92
      }
    } else parts.mouse.position.copy(parts.mouseRest)
  })

  return (
    <group ref={self} position={[0, ROOM_Y, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={parts.model} />
    </group>
  )
}

/* ───────────────────────── Lab ───────────────────────── */

const glassVert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const glassFrag = /* glsl */ `uniform vec3 uColorTop; uniform vec3 uColorBottom; uniform float uOpacity; varying vec2 vUv;
void main() { gl_FragColor = vec4(mix(uColorBottom, uColorTop, vUv.y), uOpacity); }`

export function RefLab({ reduced }: { reduced: boolean }) {
  const lab = useGLTF(`${M}/lab/model.glb`)
  const shadow = useGLTF(`${M}/lab/shadow-model.glb`)
  const baked = useTex(`${M}/lab/baked.jpg`)
  const shadowTex = useTex(`${M}/lab/shadow-baked.jpg`, { srgb: false })
  const graph = useTex(`${M}/lab/screen-graph.jpg`)
  const bubbleTex = useTex(`${T}/sprites/bubble.png`, { flipY: true })

  const parts = useMemo(() => {
    const model = lab.scene
    const mat = new THREE.MeshBasicMaterial({ map: baked })
    const get = (n: string) => model.getObjectByName(n)!
    ;(get('merged-scene') as THREE.Mesh).material = mat
    ;(get('pc-button') as THREE.Mesh).material = mat
    const drop = get('drop') as THREE.Mesh
    drop.material = mat
    drop.position.x -= 0.055
    const bottom = get('bottom') as THREE.Mesh
    bottom.material = new THREE.MeshBasicMaterial({ color: 'gray' })
    bottom.position.y -= 0.005
    graph.wrapS = THREE.RepeatWrapping
    ;(get('desktop') as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: graph })
    ;(get('test-tubes') as THREE.Mesh).material = new THREE.MeshBasicMaterial({ color: '#004961', transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false })

    const catcher = shadow.scene.getObjectByName('shadowCatcher') as THREE.Mesh
    catcher.material = shadowMaterial(shadowTex, '#00204d')
    catcher.position.y = 0.003
    model.add(catcher)

    // the glass tube (reference: gradient shader cylinder)
    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 3, 32, 1, true),
      new THREE.ShaderMaterial({
        uniforms: { uColorTop: { value: new THREE.Color('#0047d6') }, uColorBottom: { value: new THREE.Color('#70ffff') }, uOpacity: { value: 0.25 } },
        vertexShader: glassVert,
        fragmentShader: glassFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    )
    glass.position.set(-0.08, 2.9, -0.12)
    glass.scale.set(0.92, 1.55, 0.92)
    model.add(glass)

    // bubbles rising in the tube
    const bubbles = Array.from({ length: 11 }, (_, i) => {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthTest: false, opacity: 0 }))
      s.userData = { a: i * 2.1, r: 0.25 + ((i * 37) % 70) / 100, speed: 0.35 + ((i * 13) % 10) / 25, phase: i / 11, size: 0.08 + (i % 3) * 0.04 }
      model.add(s)
      return s
    })
    return { model, drop, bubbles }
  }, [lab, shadow, baked, shadowTex, graph, bubbleTex])

  const self = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!shown(self.current)) return
    const t = reduced ? 0 : clock.elapsedTime
    graph.offset.x -= 0.0015
    // water drop every ~5.8s (reference: dropInterval)
    const k = (t % 5.8) / 1.7
    parts.drop.position.y = k < 1 ? THREE.MathUtils.lerp(2.1, -0.02, easeIn(k)) : -0.035
    parts.drop.scale.y = k < 1 ? Math.min(1, k * 2.8) * (k > 0.97 ? 0 : 1) : 0
    for (const b of parts.bubbles) {
      const u = b.userData
      const p = (t * u.speed * 0.3 + u.phase) % 1
      b.position.set(-0.08 + Math.cos(u.a + t * 0.3) * u.r, 0.4 + p * 3.8, -0.12 + Math.sin(u.a + t * 0.3) * u.r)
      b.scale.setScalar(u.size)
      ;(b.material as THREE.SpriteMaterial).opacity = Math.min(1, p * 6, (1 - p) * 6) * 0.9
    }
  })

  // App logos floating around the tube (Premiere, After Effects, Photoshop)
  const kinds = profile.tools.map((t) => toolLogo[t]).filter(Boolean)
  const spots: [number, number, number][] = [
    [-1.75, 2.6, 1.3],
    [1.8, 3.1, 1.5],
    [-1.6, 1.25, 1.6],
    [1.9, 1.6, 1.8],
  ]

  return (
    <group ref={self}>
      <group position={[0, LAB_Y, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.97}>
        <primitive object={parts.model} />
      </group>
      <group position={[0.12, LAB_Y, -0.08]}>
        {kinds.map((k, i) => (
          <FloatingLogo key={k} kind={k} base={spots[i % spots.length]} i={i} reduced={reduced} />
        ))}
      </group>
    </group>
  )
}

/* ───────────────────────── Contact ───────────────────────── */

export function RefContact() {
  const contact = useGLTF(`${M}/contact/model.glb`)
  const shadow = useGLTF(`${M}/contact/shadow-model.glb`)
  const baked = useTex(`${M}/contact/baked.jpg`)
  const shadowTex = useTex(`${M}/contact/shadow-baked.jpg`, { srgb: false })
  const model = useMemo(() => {
    const m = contact.scene
    ;(m.children[0] as THREE.Mesh).material = new THREE.MeshBasicMaterial({ map: baked, fog: false })
    const catcher = shadow.scene.getObjectByName('shadowCatcher') as THREE.Mesh
    catcher.material = shadowMaterial(shadowTex, '#ac9172')
    m.add(catcher)
    return m
  }, [contact, shadow, baked, shadowTex])
  return (
    <group position={[0, CONTACT_Y, 0]}>
      <primitive object={model} />
    </group>
  )
}

/* ───────────────────────── Character ───────────────────────── */

const WIRE_AT: Record<string, number> = {
  'leg-right': -9.1, 'leg-left': -9.1,
  'shoe-right': -9, 'shoe-left': -9, 'shoe-white-right': -9, 'shoe-white-left': -9,
  'sock-right': -9, 'sock-left': -9,
  'pants-bottom-right': -9.2, 'pants-bottom-left': -9.2,
  'pants-right': -10, 'pants-left': -10,
  chest: -11, 'shoulder-right': -11, 'shoulder-left': -11,
  throat: -11.2, head: -11.5, face: -11.5,
  'arm-right': -11.55, 'arm-left': -11.55,
}

type Clip = 'idle' | 'wave' | 'fall-down' | 'water-idle' | 'standing-idle' | 'contact-animation' | 'left-desktop-action'

export function RefCharacter({ reduced }: { reduced: boolean }) {
  const gltf = useGLTF(`${M}/character/model.glb`)
  const matcap = {
    shirt: useTex(`${T}/matcaps/shirt.jpg`, { flipY: true }),
    skin: useTex(`${T}/matcaps/skin.jpg`, { flipY: true }),
    pants: useTex(`${T}/matcaps/pants.jpg`, { flipY: true }),
    white: useTex(`${T}/matcaps/white.jpg`, { flipY: true }),
  }
  const headBaked = useTex(`${M}/character/head-baked.jpg`)
  const F = `${M}/character/faces`
  const faces = {
    default: useTex(`${F}/default.png`, { flipY: true }),
    blink0: useTex(`${F}/blink-0.png`, { flipY: true }),
    blink1: useTex(`${F}/blink-1.png`, { flipY: true }),
    scared: useTex(`${F}/scared.png`, { flipY: true }),
    sleepy: useTex(`${F}/sleepy.png`, { flipY: true }),
    smile0: useTex(`${F}/smile/0.png`, { flipY: true }),
    smile1: useTex(`${F}/smile/1.png`, { flipY: true }),
    smile2: useTex(`${F}/smile/2.png`, { flipY: true }),
    contact1: useTex(`${F}/contact/1.png`, { flipY: true }),
    contact2: useTex(`${F}/contact/2.png`, { flipY: true }),
  }

  const rig = useMemo(() => {
    const model = gltf.scene
    const armature = model.getObjectByName('armature') ?? model.children[0]
    const mk = (m: THREE.Texture) => new THREE.MeshMatcapMaterial({ matcap: m, transparent: true, fog: false })
    const mats = { shirt: mk(matcap.shirt), skin: mk(matcap.skin), pants: mk(matcap.pants), white: mk(matcap.white), baked: new THREE.MeshBasicMaterial({ map: headBaked, fog: false }) }
    const assign: Record<string, THREE.Material> = {
      'arm-right': mats.skin, 'arm-left': mats.skin, 'leg-right': mats.skin, 'leg-left': mats.skin,
      'shoe-right': mats.shirt, 'shoe-left': mats.shirt, 'shoe-white-right': mats.white, 'shoe-white-left': mats.white,
      'sock-right': mats.white, 'sock-left': mats.white, 'pants-bottom-right': mats.shirt, 'pants-bottom-left': mats.shirt,
      'pants-right': mats.pants, 'pants-left': mats.pants, chest: mats.shirt, 'shoulder-right': mats.shirt, 'shoulder-left': mats.shirt,
      throat: mats.skin, head: mats.baked,
    }
    const faceMat = new THREE.MeshBasicMaterial({ map: faces.default, transparent: true, fog: false })
    const wire = new THREE.MeshBasicMaterial({ color: '#009dff', wireframe: true, transparent: true, opacity: 0.24, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    const pieces: { mesh: THREE.Mesh; at: number; original: THREE.Material }[] = []
    let face: THREE.Mesh | null = null
    armature.children.forEach((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.frustumCulled = false
      if (m.name === 'face') {
        m.material = faceMat
        face = m
      } else if (assign[m.name]) m.material = assign[m.name]
      if (WIRE_AT[m.name] !== undefined) pieces.push({ mesh: m, at: WIRE_AT[m.name], original: m.material as THREE.Material })
    })
    const mixer = new THREE.AnimationMixer(model)
    const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)])) as Record<Clip, THREE.AnimationAction>
    for (const n of ['wave', 'fall-down', 'contact-animation', 'left-desktop-action'] as Clip[]) {
      actions[n].setLoop(THREE.LoopOnce, 1)
      actions[n].clampWhenFinished = true
    }
    const rightHand = model.getObjectByName('rightHandBone') ?? model.getObjectByName('rightHandIndex1Bone')
    return { model, mixer, actions, faceMat, face: face as THREE.Mesh | null, pieces, wire, rightHand }
  }, [gltf, matcap.shirt, matcap.skin, matcap.pants, matcap.white, headBaked, faces.default])

  const root = useRef<THREE.Group>(null)
  const S = useRef({
    current: null as THREE.AnimationAction | null,
    introT0: -1,
    state: 'home' as 'home' | 'fall' | 'lab' | 'contact',
    stateT0: 0,
    leftAt: 14,
    leftUntil: 0,
    blinkAt: 5,
    contactPlayed: false,
    wobbleT0: -10,
    impactDone: true,
  })

  const play = (name: Clip, fade = 0.3) => {
    const s = S.current
    const next = rig.actions[name]
    if (!next || s.current === next) return
    next.reset().play()
    if (s.current) s.current.crossFadeTo(next, fade, false)
    s.current = next
  }

  useEffect(() => {
    play('idle', 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rig])

  const p = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const g = root.current
    if (!g) return
    const now = clock.elapsedTime
    const s = S.current
    const v = trans.value
    const state: typeof s.state = cam.contact ? 'contact' : v <= 0 ? 'home' : v >= 1 ? 'lab' : 'fall'
    if (state !== s.state) {
      s.stateT0 = now
      if (state === 'home') {
        play('idle', 0.6)
        rig.faceMat.map = faces.default
      } else if (state === 'fall') {
        if (trans.target === 1) {
          play('fall-down', 0.25)
          rig.faceMat.map = faces.scared
          blip('typing', 0) // keyboard knocked (subtle)
        } else play('idle', 0.6)
      } else if (state === 'lab') play('water-idle', s.state === 'fall' ? 0.5 : 0)
      else if (state === 'contact') {
        play('standing-idle', 0)
        rig.faceMat.map = faces.sleepy
        s.contactPlayed = false
      }
      s.state = state
    }

    // ── position ──
    let y = ROOM_Y
    if (state === 'home') {
      if (intro.pending) {
        intro.pending = false
        if (!reduced) {
          s.introT0 = now
          s.impactDone = false
          play('wave', 0)
          rig.faceMat.map = faces.scared
        }
      }
      const it = now - s.introT0
      if (s.introT0 > 0 && it < 1.1) y = THREE.MathUtils.lerp(INTRO_FROM_Y, ROOM_Y, easeIn(it / 1.1))
      if (s.introT0 > 0 && !s.impactDone && it >= 1.1) {
        s.impactDone = true
        s.wobbleT0 = now
        blip('chairImpact')
        rig.faceMat.map = faces.default
      }
      // smile after landing, then default (reference: updateFace('smile'))
      if (s.introT0 > 0 && it > 1.37 && it < 1.55) rig.faceMat.map = it < 1.43 ? faces.smile0 : it < 1.49 ? faces.smile1 : faces.smile2
      const waveDur = rig.actions.wave.getClip().duration
      if (s.introT0 > 0 && it > waveDur && s.current === rig.actions.wave) {
        play('idle', 0.4)
        rig.faceMat.map = faces.default
      }
      // working: every ~12–16s he turns to the left screen (reference: leftDesktopInterval)
      if (!reduced && s.current === rig.actions.idle && now > s.leftAt) {
        play('left-desktop-action', 0.3)
        s.leftUntil = now + rig.actions['left-desktop-action'].getClip().duration
        fx.popupT0 = now
        blip('notification')
        blip('typing', 1.7)
      }
      if (s.current === rig.actions['left-desktop-action'] && now > s.leftUntil) {
        play('idle', 0.35)
        s.leftAt = now + 12 + Math.random() * 4
      }
      if (Math.floor(now / 4) !== Math.floor((now - dt) / 4)) desk.frame++
    } else if (state === 'fall') {
      y = THREE.MathUtils.lerp(ROOM_Y, CHAR_LAB_Y, moveProgress(v))
    } else if (state === 'lab') {
      y = CHAR_LAB_Y
      if (s.current === rig.actions['fall-down'] && now - s.stateT0 > 0.65) play('water-idle', 1)
    } else {
      y = CHAR_CONTACT_Y
      if (!s.contactPlayed && now - s.stateT0 > 1.2) {
        s.contactPlayed = true
        rig.faceMat.map = faces.scared
        blip('click')
        play('contact-animation', 0.1)
        setTimeout(() => (rig.faceMat.map = faces.contact1), 350)
        setTimeout(() => (rig.faceMat.map = faces.contact2), 550)
      }
    }
    g.position.y = y

    // chair wobble on landing (reference: chair rotation yoyo)
    if (fx.chair) {
      const w = now - s.wobbleT0
      const k = w >= 0 && w < 0.32 ? Math.sin((w / 0.32) * Math.PI) : 0
      fx.chair.rotation.x = 0.12 * k
      fx.chair.rotation.z = -0.12 * k
    }

    // blink every 5s on calm faces
    if (now > s.blinkAt) {
      const m = rig.faceMat.map
      if (m === faces.default || m === faces.sleepy) {
        const step = Math.floor((now - s.blinkAt) / 0.06)
        if (step === 0) rig.faceMat.map = faces.blink0
        else if (step === 1) rig.faceMat.map = faces.blink1
        else if (step === 2) rig.faceMat.map = faces.blink0
      }
      if (now > s.blinkAt + 0.18) {
        if (rig.faceMat.map === faces.blink0 || rig.faceMat.map === faces.blink1) rig.faceMat.map = state === 'contact' ? faces.sleepy : faces.default
        s.blinkAt = now + 5
      }
    }

    // clay ↔ hologram, part by part as he passes each height (reference: updateWireframe)
    const wireY = state === 'contact' ? 99 : y
    for (const piece of rig.pieces) {
      const wire = wireY < piece.at + ROOM_Y
      if (piece.mesh === rig.face) piece.mesh.visible = !wire
      else piece.mesh.material = wire ? rig.wire : piece.original
    }

    rig.mixer.update(reduced ? 0 : Math.min(dt, 0.05))

    // publish the right hand for the room's mouse sync
    hand.onMouse = state === 'home' && (s.current === rig.actions.idle || s.current === rig.actions['left-desktop-action'])
    if (hand.onMouse && rig.rightHand) {
      rig.rightHand.getWorldPosition(p)
      hand.x = p.x
      hand.y = p.y
      hand.z = p.z
    }
  })

  return (
    <group ref={root} position={[0, ROOM_Y, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={rig.model} />
    </group>
  )
}

for (const f of ['room/model.glb', 'room/shadow-model.glb', 'lab/model.glb', 'lab/shadow-model.glb', 'contact/model.glb', 'contact/shadow-model.glb', 'character/model.glb']) {
  useGLTF.preload(`${M}/${f}`)
}
