---
name: apple-design
description: Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography, reduced motion, or Apple-style design foundations.
---

# Apple Design

Source: https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md

When this skill is invoked without a specific question, respond only:

> I'm ready to help you build fluid, Apple-style interfaces on the web, my knowledge comes from Apple's WWDC design talks, translated for the web.

## Core idea

An interface should feel like an extension of the user: immediate, continuous, physical, interruptible, and predictable. Align interaction, motion, visual hierarchy, accessibility, and feedback around safety, understanding, achievement, and joy.

## Response and direct manipulation

- Respond on pointer-down; do not wait for release to provide feedback.
- Keep feedback continuous and 1:1 during drags, sliders, and drawers.
- Use Pointer Events and `setPointerCapture` for robust tracking.
- Respect the user's grab offset; never snap an object to its center on grab.
- Track recent pointer positions and timestamps when release velocity matters.
- Avoid unnecessary debounce, transition, and input-path latency.

## Interruptible motion

- Every gesture-driven animation must be interruptible and redirectable.
- Animate from the live presentation value, not a stale logical target.
- Preserve velocity when retargeting; avoid abrupt reversals.
- Decompose two-dimensional movement into independent X and Y motion.
- Prefer springs to fixed-duration transitions for anything users can touch.
- Start with critically damped motion: damping ratio `1.0`, response around `0.3` to `0.4`.
- Use modest bounce only when momentum from a flick or throw justifies it.

## Velocity and momentum

Pass release velocity into the next spring. When an API needs relative velocity:

```js
relativeVelocity = gestureVelocity / (targetValue - currentValue)
```

For momentum projection, use Apple's exponential decay form:

```js
function project(initialVelocity, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

const projectedEndpoint = currentPosition + project(releaseVelocity);
const target = nearestSnapPoint(projectedEndpoint);
animateSpringTo(target, { velocity: releaseVelocity });
```

Use rubber-banding at boundaries instead of hard stops:

```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot));
}
```

## Spatial consistency

- Enter and exit along symmetric paths.
- Anchor popovers and sheets to the element that opened them.
- Mirror easing for reversible transitions.
- Hint the final state through the direction of intermediate motion.
- Keep input available throughout transitions.

## Gesture checklist

- Tap: immediate down-state feedback, commit on release, roughly 10px hysteresis, and cancellation by dragging away.
- Drag/swipe: detect intent early, track 1:1, and hand off release velocity.
- Avoid recognizers that only report a final swipe direction; they discard useful motion data.
- Do not add double-tap latency unless double-tap is genuinely required.

## Smoothness and materials

- Animate compositor-friendly `transform` and `opacity` properties.
- Use `requestAnimationFrame` for display-synchronized custom animation.
- Use translucent functional layers for toolbars, sheets, and navigation when content should remain visible underneath.
- Match blur, opacity, shadow, and material weight to hierarchy; do not stack competing translucent layers.
- Material surfaces should arrive with coordinated blur and scale, not opacity alone.

## Feedback, sound, and haptics

Feedback should have:

1. Causality: it is clear what caused it.
2. Harmony: visual, sound, and haptic feedback happen together.
3. Utility: feedback earns its attention and is not ornamental noise.

## Accessibility

- `prefers-reduced-motion: reduce`: replace springs, slides, and parallax with short opacity fades or static transitions; remove overshoot.
- `prefers-reduced-transparency: reduce`: increase surface opacity and remove blur.
- `prefers-contrast: more`: use near-solid surfaces and defined contrast borders.
- Avoid large moving backgrounds, slow looping motion, abrupt brightness changes, and unreadable translucent text.

## Typography and design foundations

- Treat tracking and leading as size-dependent; large display text can tighten while body text stays near normal tracking.
- Respect user text-size settings with flexible `rem`/`em` layout sizing.
- Prefer platform typography unless a custom face serves a clear purpose.
- Design with purpose, agency, responsibility, familiarity, flexibility, simplicity, craft, and delight.
- Make wayfinding, grouping, labels, status, completion, warnings, and errors explicit through the interface itself.

## Process

Prototype interaction and visuals together. Test on real devices and with real users. Review motion slowly or frame by frame, and remove anything that adds latency or complexity without improving the user's control or understanding.
