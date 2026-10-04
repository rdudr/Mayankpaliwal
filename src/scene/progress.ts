// Shared state between the page (scroll) and the 3D scene.

/** s = 0 home · 1 about (lab) · 2 contact — written by the camera rig. */
export const scroll = { s: 0 }

/**
 * Home → About is a triggered transition (like the reference): one scroll
 * gesture sets target = 1 and the scene plays the fall over TRANS_SECONDS.
 * Scrolling back to the top sets target = 0 and it plays in reverse.
 */
export const trans = { value: 0, target: 0 }
export const TRANS_SECONDS = 1.6

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
/** Height at which he turns from clay into a wireframe hologram. */
export const WIRE_Y = -6.2
export const CONTACT_X = 80

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
export const easeIn = (x: number) => x * x * x
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)
export const backIn = (x: number) => 2.70158 * x * x * x - 1.70158 * x * x
