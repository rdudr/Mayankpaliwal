// Shared state between the page (scroll) and the 3D scene.

/** s = 0 home · 1 about (lab) · 2 contact — written by the camera rig. */
export const scroll = { s: 0 }

/**
 * Home → About is a triggered transition (like the reference): one scroll
 * gesture sets target = 1 and the scene plays the fall over TRANS_SECONDS.
 * Scrolling back to the top sets target = 0 and it plays in reverse.
 */
export const trans = { value: 0, target: 0 }
export const TRANS_SECONDS = 0.8 // measured from the reference recording: ~0.15s turn, ~0.5s fall, settle
/** First part of the transition: he swivels round in the chair before anything moves. */
export const TURN = 0.18

/** Camera is on the contact scene (switched while the projects page hides the canvas). */
export const cam = { contact: false }

/** Set by the app when the loader finishes: plays the "drop into the chair + wave" intro. */
export const intro = { pending: false }

/** Which of his episodes the desk's Program monitor is showing (he "clicks" through them). */
export const desk = { frame: 0 }

/** Cursor position, -0.5…0.5 from screen centre (desktop only) — drives camera parallax. */
export const cursor = { x: 0, y: 0, active: false }

// The lab sits directly below the room — he falls straight down into the tube.
export const LAB_Y = -14
export const LAB_Z = 0.3
/** He turns from clay into a wireframe hologram as he passes into the top of the tube. */
export const WIRE_Y = LAB_Y + 3.3
export const CONTACT_X = 80

/** The cream "sheet" behind the home page — slides up (hard edge) over the lab's blue. */
export const backdrop = { sheet: null as HTMLDivElement | null }

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const easeIn = (x: number) => x * x * x
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
export const backIn = (x: number) => 2.70158 * x * x * x - 1.70158 * x * x
export const easeInOutQuad = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

/** Camera / cream-sheet / page-slide progress for the home → lab move (0…1). */
export const moveProgress = (v: number) => easeInOutQuad(clamp01((v - TURN) / (1 - TURN)))

/** Staggered "bounce out" scale for room pieces (order 0 goes first). */
export const bounceScale = (v: number, order: number) => 1 - backIn(clamp01((v - 0.06 - order * 0.07) / 0.2))

// Dev-only handle for frame-by-frame comparison against the reference
// (e.g. __mp.trans.value = __mp.trans.target = 0.5 freezes the fall halfway).
if (import.meta.env.DEV) Object.assign(window, { __mp: { trans, cam, intro, desk } })
