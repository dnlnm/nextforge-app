# Motion Guidelines

This document extracts the motion system used by `interior.dev` into a portable
standard for other interface projects. It describes the intended system rather
than blindly reproducing every existing component. Where an implementation has
drifted from `DESIGN.md`, the documented design rule wins.

The examples use Motion for React, but the principles apply to any animation
library that supports interruptible springs, gesture velocity, and reduced
motion.

## 1. Motion principles

Motion must explain one of four things:

1. **Arrival and departure:** what entered, what left, and where it came from.
2. **Continuity:** how one state, position, or owner became another.
3. **Cause and effect:** what a press, drag, hold, or selection changed.
4. **Process:** whether work is waiting, progressing, succeeding, or failing.

If an animation explains none of these, remove it. Motion is not ambient
decoration.

Every animated interaction must satisfy these invariants:

- **No surprise layout shift.** Reserve every reachable state where practical.
- **Interruptible.** Retarget from the element's current rendered position.
- **Reduced-motion safe.** Deliver the final information and skip the trip.
- **Input complete.** Pointer, touch, keyboard, cancellation, and focus paths
  reach equivalent outcomes.
- **Semantically announced.** Assistive technology receives the settled outcome,
  not frame-by-frame updates.
- **Frame-budget aware.** React does not render at 60fps to move a value.
- **Physically coherent.** Distance and physical meaning choose the motion.

## 2. The decision model

Choose motion in this order.

### 2.1 Is timing itself the information?

Use a fixed-duration tween when the duration or constant rate is part of the
meaning:

- a hold-to-confirm sweep promises a known hold duration;
- a countdown represents elapsed seconds;
- a ripple models a wave moving at constant speed;
- a spinner reports an unknown wait at a constant rate;
- a marquee models a belt moving at a constant rate;
- a page entrance should have predictable timing;
- a count-up must finish when its contract says it will.

Use `linear` for constant-rate physical processes. Use the arrival and departure
curves below for fixed-time UI entrances and exits.

### 2.2 Is the movement caused by user or interface intent?

Use a spring for a panel arriving, a row moving, a thumb changing position, an
icon settling, or a dragged surface returning home. Springs preserve velocity,
retarget naturally, and do not require guessing a duration for every distance.

### 2.3 How far does it travel?

Distance chooses the spring:

| Travel | Default spring | Typical use |
|---|---|---|
| Over 200px | `DISCLOSE` | Drawer, sheet, card returning across a surface |
| 20-200px | `CELL` | Row, thumb, tick, selected item, slot change |
| Under 20px | `SMALL` | Caret, label, chip, grip, icon nudge |

Do not use a soft surface spring for a tiny movement. It reaches the area quickly
then crawls through the final pixels, which reads as input lag. Small movements
need high stiffness, low mass, and no visible tail.

### 2.4 Is content being replaced without meaningful travel?

Use `CROSSFADE`. Keep both faces in the same layout cell so replacement does not
change dimensions.

### 2.5 Is the change only a discrete color state?

CSS transitions are allowed only for non-dragged, discrete color changes:

```css
/* Hover and focus tint */
transition: color 150ms, background-color 150ms;

/* Field or button state */
transition: border-color 150ms, box-shadow 150ms;

/* Semantic threshold such as danger to safe */
transition: background-color 200ms, border-color 200ms, color 200ms;
```

Do not mix CSS transform transitions with Motion-driven gesture transforms.

## 3. Canonical tokens

Keep the catalogue small. A new spring requires a measurable reason that the
existing distance classes cannot express.

```ts
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
```

### Token semantics

| Token | Purpose |
|---|---|
| `EASE` | Fast start and soft landing for arrivals and development |
| `LEAVE` | Slow start and accelerated departure; signals that the user need not wait |
| `INSTANT` | Resolve at the destination without a visible trip |
| `CELL` | Default medium-distance, intent-driven movement; about 180ms with no tail |
| `CROSSFADE` | Whole-content or face replacement |
| `SMALL` | Tight sub-20px movement; about 170ms with no tail |
| `DISCLOSE` | Long-distance travel by a drawer, sheet, or card |
| `SURFACE` | Modal-sized surface arrival; alive but not bouncy |
| `FILL` | Determinate progress that must never visually overshoot its value |

The canonical system is deliberately overdamped or near critical. Overshoot
usually reads as correction, error, or imprecision. The one justified
underdamped exception is a hard boundary response, such as a carousel hitting a
wall:

```ts
export const WALL = {
  type: "spring",
  stiffness: 700,
  damping: 30,
  mass: 0.5,
} as const;
```

Do not use `WALL` for ordinary entrances, selections, or progress.

### Naming rules

- Use `EASE`, never a mixture of `ENTER`, `EASE_IN`, or other aliases.
- Use `LEAVE`, never a mixture of `EXIT`, `EXIT_EASE`, or `EASE_OUT`.
- Use `INSTANT`, not `NONE` or `STILL`.
- Name an exceptional spring after its semantic role, such as `INDICATOR` or
  `RAIL`, and document why a catalogue spring failed.
- Keep values synchronized wherever constants are duplicated for copy-paste
  components.

## 4. Timing and choreography

### 4.1 Arrivals and departures

A departure is always shorter than its corresponding arrival. Typical ranges:

| Phase | Duration | Curve |
|---|---:|---|
| Entrance | 200-280ms | `EASE` or an appropriate spring |
| Exit | 110-180ms | `LEAVE` |
| Hover/focus color | 150ms | CSS |
| Semantic color threshold | 200ms | CSS |

Long exits create either a delay before replacement or a muddy crossfade. Make
the leaving content clear the visual band before the next content arrives.

### 4.2 Entrance shape

Use small, credible distances:

```ts
const enter = {
  opacity: 0,
  scale: 0.97,
  y: 10,
  filter: "blur(6px)",
};

const exit = {
  opacity: 0,
  scale: 0.98,
  y: 6,
  filter: "blur(3px)",
};
```

- Never begin a normal object at `scale: 0`; physical objects do not begin as
  points. Use `0.9-0.97` depending on size and distance.
- Pin `transformOrigin` to the edge or contact point from which the object came.
- Use more blur on arrival and less on departure when blur is justified.
- Prefer opacity and transform. Blur is paint-heavy and should be limited to
  short, bounded entrances, not continuous interaction.
- Avoid scaling text. Below roughly `0.9`, font hinting visibly softens. Prefer
  moving the label without resizing it; treat `0.92` as the floor when scaling
  is unavoidable.

### 4.3 Modal and overlay recipe

Use separate motion for the veil and the surface:

```ts
const backdrop = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.2, ease: EASE } },
  gone: { opacity: 0, transition: { duration: 0.15, ease: LEAVE } },
};

const panel = {
  closed: { opacity: 0, scale: 0.96, y: 12 },
  open: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { ...SURFACE, opacity: { duration: 0.16, ease: EASE } },
  },
  gone: {
    opacity: 0,
    scale: 0.98,
    y: 6,
    transition: { duration: 0.15, ease: LEAVE },
  },
};
```

Let geometry settle on the surface spring while opacity reaches legibility
sooner. Compensate for the removed scrollbar when locking document scroll, or
the page will shift horizontally as the overlay opens.

### 4.4 Disclosure recipe

Animate structural size and content opacity independently:

- height uses an interruptible disclosure spring;
- opacity enters in about `180ms` with `EASE`;
- opacity exits in about `140ms` with `LEAVE`;
- on opening, do not show text before its box has begun to open;
- on closing, fade content before the structure finishes collapsing;
- use `ResizeObserver` when open content may change size;
- cap large disclosures and scroll internally instead of making the whole page
  chase a changing target.

### 4.5 List recipe

For insertion, removal, and filtering:

- enter from `opacity: 0` and `scale: 0.97`;
- exit to `opacity: 0` and `scale: 0.98` over `LEAVE`;
- use `layout="position"` so surviving siblings close the gap with transforms;
- pop the leaving item out of layout while its visual exit completes;
- do not animate every removed row's height to zero.

### 4.6 Staggering

Staggering must have a total time cap. Data length must never turn animation
into waiting.

```ts
const effectiveStagger = Math.min(requestedStagger, maxDuration / Math.max(1, count - 1));
```

Use deterministic delays. Never use `Math.random()` during rendering because
server and client markup must agree.

## 5. Layout continuity

The best layout animation is often layout that never changes unexpectedly.

### 5.1 Reserve reachable states

Use one of these patterns:

- **Invisible twin:** render the widest label invisibly to establish width.
- **Shared grid cell:** stack idle, loading, success, and error faces in the
  same row and column, then crossfade them.
- **Fixed or bounded frame:** calculate the maximum useful list or deck height.
- **Intrinsic media ratio:** provide image width and height before loading.
- **Spacer plus transform:** reserve a header's height while translating the
  visible header away.
- **Destination padding:** reserve the line on which a floating label will land.
- **Stable scrollbar gutter:** reserve scrollbars where overflow can appear.
- **Scroll-lock compensation:** add the removed scrollbar width to existing
  document padding while a modal surface is open.

An exception is allowed when changing geometry is itself the information, such
as an avatar rail communicating the number of present people. In that case,
animate the container and its contents on the same spring so they read as one
event. Document the exception.

### 5.2 Choose the layout primitive semantically

| Primitive | Use when |
|---|---|
| `layout` | One box changes size and direct width/height animation is undesirable |
| `layout="position"` | Siblings move because a list gap closes |
| `layoutId` | One visual object travels between mount points |
| Neither | One always-mounted object can move using a known transform |

Do not use `layoutId` merely because two objects look alike. For a dropdown
highlight, one always-mounted element translated by a known row height preserves
travel without flying in from a stale mount point when the menu reopens.

Measure expensive geometry once per gesture. Cache all required rectangles at
lift, then use arithmetic and one transform during movement.

## 6. Gesture physics

### 6.1 Never drop release velocity

When a gesture ends, pass its velocity to the settling spring:

```ts
function glide(to: number, velocity = 0) {
  controls.current?.stop();
  controls.current = animate(
    x,
    to,
    reduced ? INSTANT : { ...DISCLOSE, velocity },
  );
}
```

Starting the post-drag animation at zero velocity creates a visible seam between
the finger and the interface.

### 6.2 Distance and velocity both decide commitment

A flick may commit without crossing the full distance threshold. Require a
small minimum distance as well as high velocity to reject accidental tremors.

Reference thresholds from the source system:

| Interaction | Commitment rule |
|---|---|
| Drawer | travel `> width * 0.38` or outward speed `> 520px/s` |
| Swipe card | `abs(dx) >= 92px`, or speed `>= 520px/s` and travel `>= 32px` |
| Toast dismiss | `abs(dx) > 72px`, or speed `> 460px/s` and travel `> 20px` |
| Carousel | project by `velocity * 0.14`, capped to one slide by default |

Tune thresholds to control size and consequence, but preserve the two-part
shape: distance commits deliberate travel; velocity commits a deliberate flick.

Momentum decides whether to move, not how far. Cap projected carousel movement
to one item by default so a hard flick does not skip several pieces of content.

### 6.3 Interrupt from the current frame

- Stop the running animation when a new drag begins.
- Read the current `MotionValue`, not stale React state.
- Retarget the existing element; do not remount it to replay an entrance.
- Stop imperative animation controls on unmount.
- Preserve velocity when control passes from pointer to spring.

### 6.4 Model boundaries physically, sparingly

A hard carousel end may yield and return using the underdamped `WALL` spring.
This communicates a boundary. Ordinary surfaces must not bounce because
overshoot there reads as a correction or mistake.

## 7. Complete cancellation

A gesture is incomplete until every abandonment path is handled.

For pointer interactions, consider all of:

- `pointerup`;
- `pointercancel`;
- `lostpointercapture`;
- movement beyond tolerance;
- pointer leaving the valid region when relevant;
- window `blur`;
- `visibilitychange` when the document becomes hidden;
- element blur;
- Escape;
- an incoming disabled state;
- component unmount.

Capture the active pointer when ownership must survive leaving the element.
Track pointer IDs for multi-pointer interactions. Release timers, animation
frames, observers, listeners, and imperative animations during cleanup.

For a hold gesture:

- reject non-primary mouse buttons;
- ignore repeated keyboard events;
- make Space and Enter complete alternatives;
- cancel when movement exceeds a small tolerance, such as `8-10px`;
- do not commit after focus, window, or document ownership is lost;
- prevent the compatibility click after a committed long press from firing the
  short-click action too.

For backdrop dismissal, record whether pointer down began outside the panel and
close only when activation also ends outside. A text selection or drag that
starts inside and ends on the veil is not a backdrop click.

Async completion follows the same ownership rule: abort work where possible and
use run IDs or sequence numbers so stale promises cannot update a newer state.

## 8. Reduced motion

Reduced motion means **the information arrives; the trip is skipped**.

```ts
const reduced = useReducedMotion();
const move = reduced ? INSTANT : CELL;
```

Use `{ duration: 0 }` rather than deleting destination styles. The element must
still reach the correct state.

### Required adaptations

- Use `initial={false}` where mount animation would otherwise play without user
  intent.
- Replace spring or tween transitions with `INSTANT`.
- Disable shared layout with `layoutId={reduced ? undefined : id}`; shared-layout
  travel cannot always be made instant through a transition override.
- Change smooth scrolling to `behavior: reduced ? "auto" : "smooth"`.
- Show streaming content immediately in its final state.
- Stop marquees and other transport loops, then expose a real scroll container
  so no content becomes unreachable.
- Replace rotating spinners with a still waiting indicator where possible.
- Preserve functional safety timing. A hold-to-confirm can still require the
  full hold while its visual sweep resolves without continuous travel.
- For scroll-linked effects, preserve direct mapping if every value simply
  follows the scroll frame; remove optional spring smoothing or lag.

Reduced motion is not `display: none`, and it is not a reason to omit success,
error, progress, or destination state.

## 9. Progress, waiting, and loops

### 9.1 Be honest about certainty

- Known progress gets a determinate fill and numeric or discrete value.
- Unknown duration gets a spinner or clearly indeterminate treatment.
- Never animate a guessed percentage as though it were measured progress.
- A determinate fill must not overshoot the value it reports; use `FILL`.
- When switching from indeterminate to determinate, do not visibly move backward.

Prefer transforms or clip paths over width for a high-frequency fill:

```tsx
<motion.div
  style={{ originX: 0 }}
  animate={{ scaleX: progress }}
  transition={reduced ? INSTANT : FILL}
/>
```

### 9.2 Discrete cells and quantization

If a quantity naturally divides into units, draw units. Quantization is also a
render budget:

```ts
const next = Math.floor(progress * steps);
setStep((previous) => (previous === next ? previous : next));
```

The visual material may still move continuously through a `MotionValue` or
clipped overlay while React receives only meaningful steps. Example budgets:

| Interaction | Steps |
|---|---:|
| Long press | 12 |
| Hold to confirm | 20 |
| Reading progress | 24 |
| Pinch zoom readout | 8 |
| Swipe commitment | 6 |

### 9.3 Loop policy

Infinite idle loops are banned by default. A loop is allowed only when constant
motion truthfully represents an active process, such as an unknown wait or a
conveyor, and it must:

- stop under reduced motion;
- stop or unsubscribe when off-screen;
- pause when the user asks or interaction requires it;
- use elapsed time rather than assuming a frame rate;
- clamp large frame deltas so a background tab does not cause a jump;
- clean up its animation frame on unmount.

```ts
const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
position += pixelsPerSecond * dt;
```

No decorative pulsing or looping flourishes.

## 10. Performance architecture

Separate three update channels:

| Channel | Cadence | Mechanism |
|---|---|---|
| Visual transport | Every frame | `MotionValue`, transform, direct DOM/CSS variable |
| Application state | Threshold or commit | React state |
| Accessibility | Settled outcome | Debounced live region or one final update |

### 10.1 Per-frame rules

- Do not call React state setters on every animation frame.
- Use MotionValues for drag position, scale, rotation, opacity, and derived
  transforms.
- Write CSS custom properties directly when layout reads a live value.
- Update a visual text node directly if it must remain synchronized every frame;
  update ARIA only at a lower semantic cadence.
- Coalesce scroll and resize work to one `requestAnimationFrame`.
- Use passive scroll listeners where no cancellation is required.
- Read geometry before writing styles; do not alternate reads and writes in a
  loop.
- Set `will-change` statically and sparingly. Do not toggle React state from
  animation callbacks to add it mid-flight.

### 10.2 Properties

Prefer compositor-friendly properties:

- `transform`;
- `opacity`;
- a clipped or transformed overlay when appropriate.

Avoid continuous animation of:

- `height` or `width` when transform or Motion layout can express the result;
- `mask-image`;
- large blur filters;
- box shadows across large surfaces;
- properties that force whole-subtree layout or paint every frame.

A static mask is fine. To animate an edge fade, keep the gradient static and
animate the overlay's opacity.

## 11. Accessibility contract

Keyboard is a second complete implementation, not a fallback.

- Every drag or gesture has keyboard controls that can reach the same states.
- Focus remains visible and follows the semantic result, not intermediate
  animation frames.
- `aria-valuenow` and similar attributes report useful, bounded values.
- A permanent `aria-describedby` hint teaches non-obvious controls when focused.
- A live region announces a sentence describing the outcome, not the animation
  mechanism.
- Stream-driven values are announced after settling, not on every event.

Examples of good announcements:

- `Sorted by Revenue, descending. 24 rows.`
- `Design removed, 4 left.`
- `Zoom 2.4 times.`

Debounce changing summaries according to their interaction, commonly
`420-900ms`. Announce once for one outcome. Never turn a drag into dozens of
screen-reader interruptions.

Do not make reduced motion remove content or status. Do not announce a spinner's
rotation, a spring's intermediate values, or every percentage point unless each
point is independently meaningful.

## 12. Async timing

Use timing to prevent flicker and preserve causality:

- **Grace:** wait about `220ms` before showing an empty state that may be
  immediately replaced by data.
- **Delayed loading indicator:** do not show a skeleton for very fast work.
- **Minimum visible duration:** once a skeleton or ripple appears, keep it long
  enough to be perceived rather than strobing.
- **Settle window:** combine a burst of optimistic actions into one server commit.
- **Rollback:** restore the last known truth when the latest request fails.
- **Visible, interruptible backoff:** show retry timing and keep manual retry
  available.

These are behavioral timings, not decorative animations. Reduced motion does not
remove required waits, retry schedules, or safety durations; it removes visual
travel and looping.

## 13. Reference component pattern

```tsx
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const EASE = [0.23, 1, 0.32, 1] as const;
const LEAVE = [0.4, 0, 1, 1] as const;
const CELL = {
  type: "spring",
  stiffness: 520,
  damping: 34,
  mass: 0.45,
} as const;
const INSTANT = { duration: 0 } as const;

export function Example({ open, children }: ExampleProps) {
  const reduced = useReducedMotion();
  const move = reduced ? INSTANT : CELL;

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {open ? (
        <motion.div
          key="content"
          initial={reduced ? false : { opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            y: 4,
            scale: 0.98,
            transition: reduced
              ? INSTANT
              : { duration: 0.14, ease: LEAVE },
          }}
          transition={{ ...move, opacity: reduced ? INSTANT : { duration: 0.18, ease: EASE } }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
```

Adapt the geometry to the component. Do not copy the entrance shape into every
interaction without asking what arrived, how far it moved, and whether motion is
actually needed.

## 14. Review checklist

### Purpose

- Does every animation communicate arrival, continuity, causality, or process?
- Would removing it lose information? If not, should it be removed?
- Is a fixed duration used only when timing itself is meaningful?

### Physics

- Did distance choose `DISCLOSE`, `CELL`, or `SMALL`?
- Are entrances soft and departures shorter and accelerating?
- Is overshoot avoided unless a physical boundary justifies it?
- Does a released drag hand velocity into the settling spring?
- Can a new interaction interrupt from the currently rendered frame?

### Layout

- Is every reachable label, icon, image, and panel size reserved where practical?
- Are mutually exclusive faces stacked in one grid cell?
- Is scrollbar space stable when overflow or scroll lock changes?
- Is `layout`, `layout="position"`, or `layoutId` being used for the correct
  semantic reason?
- Are expensive measurements cached once per gesture rather than repeated per
  frame?

### Input and cancellation

- Is there a complete keyboard path?
- Are pointer cancel, lost capture, blur, hidden document, Escape, movement
  tolerance, disabled-state changes, and unmount handled where relevant?
- Can stale asynchronous work update a newer interaction?

### Reduced motion

- Does the final information still appear?
- Are transitions instant rather than destination styles removed?
- Are shared-layout travel, smooth scrolling, streaming, spinners, and loops
  behaviorally adapted?
- Are functional timings preserved?

### Performance

- Is per-frame visual work outside React state?
- Are scroll and resize events coalesced?
- Are transform and opacity used instead of layout-heavy properties where
  possible?
- Are loops elapsed-time based, off-screen aware, delta-clamped, and cleaned up?
- Are visual, application, and accessibility update cadences separated?

### Accessibility

- Does assistive technology receive a settled sentence once rather than a stream
  of intermediate values?
- Is the interaction model described for non-obvious controls?
- Do focus and ARIA reflect semantic state independently of animation?

## 15. Known source-system drift

Do not adopt these as standards without first resolving them:

- The same departure curve is named `LEAVE`, `EXIT`, `EXIT_EASE`, and other
  aliases. Standardize on `LEAVE`.
- The small spring appears with slightly different values. Standardize on
  `700 / 46 / 0.5` unless measurement proves a distinct need.
- The current drawer uses release velocity to decide dismissal but does not pass
  it to the settling spring. Follow the velocity-handoff rule instead.
- Some hold-to-confirm face crossfades still spring under reduced motion. Every
  visible transition must use `INSTANT` in that mode.
- Some progress and loading metadata describes behavior that differs from the
  current runtime source. Treat measured progress as determinate and unknown
  duration as indeterminate; do not reproduce an undocumented guessed crawl.
- Avoid animating image blur continuously even if an existing example does so;
  prefer a static blurred placeholder and an opacity/scale reveal.

## 16. Source basis

This guide was synthesized from the project's motion catalogue and invariants in
`DESIGN.md`, then checked against representative implementations including:

- `components/interior/accordion.tsx`
- `components/interior/modal.tsx`
- `components/interior/drawer.tsx`
- `components/interior/snap-carousel.tsx`
- `components/interior/swipe-deck.tsx`
- `components/interior/hold-to-confirm.tsx`
- `components/interior/filter-grid.tsx`
- `components/interior/progress-bar.tsx`
- `components/interior/poll-results.tsx`
- `components/interior/logo-marquee.tsx`
- `components/interior/sticky-header.tsx`
- `components/interior/ripple.tsx`

The shortest summary is: **spring intentional movement, tween meaningful time,
preserve velocity and space, skip travel rather than information, and keep
frame-rate work out of React.**
