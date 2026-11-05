import { EXPRESSIONS, getFaceState, type Expression, type FaceTargets } from './expressions';

/** Window-wide pointer + scroll velocity, shared by every mascot on the page. */
const look = { x: 0, y: 0, scrollV: 0 };
let listening = 0;
let lastY = 0;
let lastT = 0;

function onMove(e: PointerEvent) {
  look.x = (e.clientX / window.innerWidth) * 2 - 1;
  look.y = -((e.clientY / window.innerHeight) * 2 - 1);
}

function onScroll() {
  const now = performance.now();
  const dt = Math.max(16, now - lastT);
  look.scrollV = Math.max(-1, Math.min(1, ((window.scrollY - lastY) / dt) * 0.6));
  lastY = window.scrollY;
  lastT = now;
}

export type FaceFrame = FaceTargets & {
  /** 0 → 1 while a blink is in flight */
  blink: number;
  /** final gaze after pointer, scroll and expression bias, -1 → 1 */
  gazeX: number;
  gazeY: number;
  /** seconds since start, for idle motion */
  time: number;
};

/**
 * Eases a face toward its channel's expression on every step(), layering
 * random blinks and gaze (pointer + scroll direction) on top. Renderer-agnostic:
 * the SVG avatar steps it from rAF, the pixel sprite from a 12fps timer.
 * `pick` overrides the shared store, e.g. for a demo that cycles moods on its own.
 */
export function createFaceDriver(channel: 'christian' | 'poe', reducedMotion = false, pick?: () => Expression) {
  const face: FaceFrame = { ...EXPRESSIONS.neutral, blink: 0, gazeX: 0, gazeY: 0, time: 0 };
  let blinkStart = -1;
  let nextBlink = 1.5;

  if (listening++ === 0) {
    lastY = window.scrollY;
    lastT = performance.now();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function step(dt: number) {
    const target = EXPRESSIONS[pick ? pick() : getFaceState()[channel]];
    const k = 1 - Math.exp(-dt * 7);
    (Object.keys(target) as (keyof FaceTargets)[]).forEach((key) => {
      face[key] += (target[key] - face[key]) * k;
    });

    const t = (face.time += dt);
    if (blinkStart < 0 && t > nextBlink) blinkStart = t;
    if (blinkStart >= 0) {
      const p = (t - blinkStart) / 0.16;
      face.blink = p >= 1 ? 0 : Math.sin(p * Math.PI);
      if (p >= 1) {
        blinkStart = -1;
        // occasional double-blink feels alive
        nextBlink = t + (Math.random() < 0.2 ? 0.25 : 2 + Math.random() * 3.5);
      }
    }

    look.scrollV *= 1 - Math.min(1, dt * 3);
    const gx = (reducedMotion ? 0 : look.x * 0.6) + face.lookX;
    const gy = (reducedMotion ? 0 : look.y * 0.45 - look.scrollV * 0.6) + face.lookY;
    const g = 1 - Math.exp(-dt * 12);
    face.gazeX += (Math.max(-1, Math.min(1, gx)) - face.gazeX) * g;
    face.gazeY += (Math.max(-1, Math.min(1, gy)) - face.gazeY) * g;
    return face;
  }

  function dispose() {
    if (--listening === 0) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
    }
  }

  return { face, step, dispose };
}
