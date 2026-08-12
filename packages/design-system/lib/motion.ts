/**
 * Canonical motion tokens, per `docs/MOTION.md`.
 *
 * Keep the catalogue small. A new spring requires a measurable reason that the
 * existing distance classes cannot express. Overshoot is avoided for ordinary
 * motion; it reads as correction or imprecision.
 */
export const EASE = [0.23, 1, 0.32, 1] as const;
export const LEAVE = [0.4, 0, 1, 1] as const;

export const INSTANT = { duration: 0 } as const;

export const CELL = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.45,
} as const;

export const CROSSFADE = {
  type: "spring",
  stiffness: 260,
  damping: 34,
  mass: 0.8,
} as const;

export const SMALL = {
  type: "spring",
  stiffness: 700,
  damping: 46,
  mass: 0.5,
} as const;

export const DISCLOSE = {
  type: "spring",
  stiffness: 150,
  damping: 27,
  mass: 1,
} as const;

export const SURFACE = {
  type: "spring",
  stiffness: 420,
  damping: 36,
  mass: 0.9,
} as const;

export const FILL = {
  type: "spring",
  stiffness: 210,
  damping: 34,
  mass: 0.9,
} as const;
