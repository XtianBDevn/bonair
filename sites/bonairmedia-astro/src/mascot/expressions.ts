import { useSyncExternalStore } from 'react';

/**
 * Facial rig targets shared by the Christian avatar (3D island) and Poe
 * (pixel sprite). Sections declare data-expression="happy" and both mascots
 * ease toward these numbers every frame.
 */
export type Expression =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'surprised'
  | 'focused'
  | 'thinking'
  | 'excited'
  | 'wink';

export type FaceTargets = {
  /** brow lift, -1 (furrowed) → 1 (raised) */
  browL: number;
  browR: number;
  /** brow tilt, positive = inner corners up (worried/curious) */
  browTilt: number;
  /** upper lid closure, 0 open → 1 shut */
  lidL: number;
  lidR: number;
  /** mouth curve, -1 frown → 1 smile */
  smile: number;
  /** jaw open, 0 → 1 */
  mouthOpen: number;
  /** gaze bias added on top of pointer tracking */
  lookX: number;
  lookY: number;
  /** head tilt in radians */
  tilt: number;
};

export const EXPRESSIONS: Record<Expression, FaceTargets> = {
  neutral: { browL: 0, browR: 0, browTilt: 0, lidL: 0.15, lidR: 0.15, smile: 0.15, mouthOpen: 0, lookX: 0, lookY: 0, tilt: 0 },
  happy: { browL: 0.35, browR: 0.35, browTilt: 0.05, lidL: 0.3, lidR: 0.3, smile: 1, mouthOpen: 0.25, lookX: 0, lookY: 0, tilt: 0.06 },
  curious: { browL: 0.9, browR: -0.1, browTilt: 0.15, lidL: 0.05, lidR: 0.2, smile: 0.25, mouthOpen: 0.05, lookX: 0.25, lookY: 0.05, tilt: -0.12 },
  surprised: { browL: 1, browR: 1, browTilt: 0.2, lidL: 0, lidR: 0, smile: 0, mouthOpen: 0.85, lookX: 0, lookY: 0.05, tilt: 0 },
  focused: { browL: -0.6, browR: -0.6, browTilt: -0.2, lidL: 0.45, lidR: 0.45, smile: 0, mouthOpen: 0, lookX: 0, lookY: -0.1, tilt: 0 },
  thinking: { browL: 0.5, browR: -0.3, browTilt: 0.1, lidL: 0.2, lidR: 0.25, smile: -0.15, mouthOpen: 0, lookX: 0.45, lookY: 0.4, tilt: 0.1 },
  excited: { browL: 0.8, browR: 0.8, browTilt: 0.15, lidL: 0, lidR: 0, smile: 1, mouthOpen: 0.7, lookX: 0, lookY: 0, tilt: -0.05 },
  wink: { browL: 0.2, browR: -0.3, browTilt: 0, lidL: 0.1, lidR: 1, smile: 0.9, mouthOpen: 0.1, lookX: -0.1, lookY: 0, tilt: 0.12 },
};

type Channel = 'christian' | 'poe';

export type FaceState = {
  christian: Expression;
  poe: Expression;
  poeTalking: boolean;
};

type Store = { state: FaceState; listeners: Set<() => void> };

// Astro bundles islands and page scripts separately; pin the store to
// globalThis so both always talk to the same instance.
const g = globalThis as typeof globalThis & { __bamFace?: Store };
const store: Store = (g.__bamFace ??= {
  state: { christian: 'neutral', poe: 'neutral', poeTalking: false },
  listeners: new Set(),
});

function emit() {
  store.listeners.forEach((l) => l());
}

export function setExpression(channel: Channel, expression: Expression) {
  if (store.state[channel] === expression) return;
  store.state = { ...store.state, [channel]: expression };
  emit();
}

export function setPoeTalking(talking: boolean) {
  if (store.state.poeTalking === talking) return;
  store.state = { ...store.state, poeTalking: talking };
  emit();
}

/** Non-reactive read for animation loops. */
export function getFaceState() {
  return store.state;
}

export function subscribeFace(cb: () => void) {
  store.listeners.add(cb);
  return () => {
    store.listeners.delete(cb);
  };
}

export function useFaceState() {
  return useSyncExternalStore(subscribeFace, getFaceState, getFaceState);
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Watches every [data-expression] element; whichever sits closest to the
 * viewport's reading line drives the avatar. Elements may also set
 * data-poe-expression to steer Poe.
 */
export function initExpressionScroll() {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-expression]'));
  if (!nodes.length) return;

  const visible = new Set<HTMLElement>();
  const pick = () => {
    const line = window.innerHeight * 0.45;
    let best: HTMLElement | undefined;
    let bestDist = Infinity;
    visible.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dist = r.top <= line && r.bottom >= line ? 0 : Math.min(Math.abs(r.top - line), Math.abs(r.bottom - line));
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    });
    if (!best) return;
    setExpression('christian', best.dataset.expression as Expression);
    if (best.dataset.poeExpression) setExpression('poe', best.dataset.poeExpression as Expression);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) visible.add(e.target as HTMLElement);
        else visible.delete(e.target as HTMLElement);
      });
      pick();
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  nodes.forEach((n) => io.observe(n));
  window.addEventListener('scroll', pick, { passive: true });
}
