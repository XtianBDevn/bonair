import { getFaceState, prefersReducedMotion, type FaceTargets } from './expressions';
import { createFaceDriver } from './faceDriver';

/**
 * Poe as a 16-bit console sprite: a 64×64 indexed framebuffer redrawn at
 * 12fps, scaled up with nearest-neighbour. Shapes are rasterised by hand
 * so the face rig (brows, lids, gaze, beak) moves in whole pixels.
 */
const W = 64;
const H = 64;
const FPS = 12;

// SNES-ish palette — every channel snapped to 5 bits (multiples of 8)
const PALETTE: [number, number, number][] = [
  [0, 0, 0], // 0 transparent
  [8, 8, 16], // 1 outline
  [24, 32, 64], // 2 feather
  [48, 64, 112], // 3 feather highlight
  [16, 16, 40], // 4 feather shadow
  [248, 248, 232], // 5 eye white
  [248, 184, 40], // 6 amber iris
  [232, 168, 48], // 7 beak
  [168, 104, 16], // 8 beak shadow
  [248, 112, 96], // 9 cravat — sunset coral
  [56, 8, 8], // 10 mouth
  [64, 80, 136], // 11 belly
  [248, 248, 248], // 12 glint
];

const T = 0;
const OUT = 1;
const F = 2;
const FHI = 3;
const FLO = 4;
const WHITE = 5;
const IRIS = 6;
const BEAK = 7;
const BEAK_LO = 8;
const CRAVAT = 9;
const MOUTH = 10;
const BELLY = 11;
const GLINT = 12;

type Buf = Uint8Array;

function px(b: Buf, x: number, y: number, c: number) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  b[y * W + x] = c;
}

function get(b: Buf, x: number, y: number) {
  if (x < 0 || y < 0 || x >= W || y >= H) return T;
  return b[y * W + x];
}

/** Filled ellipse with optional 2-tone dither: lighter toward the top-left light source. */
function ellipse(b: Buf, cx: number, cy: number, rx: number, ry: number, c: number, hi?: number, lo?: number) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1) continue;
      let col = c;
      const light = -dx * 0.6 - dy * 0.8; // >0 facing the light
      const checker = (x + y) % 2 === 0;
      if (hi !== undefined && (light > 0.55 || (light > 0.3 && checker))) col = hi;
      if (lo !== undefined && (light < -0.6 || (light < -0.35 && checker))) col = lo;
      px(b, x, y, col);
    }
  }
}

function line(b: Buf, x0: number, y0: number, x1: number, y1: number, c: number) {
  x0 = Math.round(x0);
  y0 = Math.round(y0);
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(b, x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

/** 1px outline around everything opaque — the classic sprite edge. */
function outline(b: Buf) {
  const src = b.slice();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (src[y * W + x] !== T) continue;
      if (get(src, x + 1, y) || get(src, x - 1, y) || get(src, x, y + 1) || get(src, x, y - 1)) b[y * W + x] = OUT;
    }
  }
}

type Pose = FaceTargets & { blink: number; beak: number; bob: number; flap: number };

function eye(b: Buf, cx: number, cy: number, lid: number, gx: number, gy: number) {
  ellipse(b, cx, cy, 3.6, 3.6, WHITE);
  const ix = cx + Math.round(gx * 1.5);
  const iy = cy + Math.round(-gy * 1.5);
  ellipse(b, ix, iy, 1.6, 1.6, IRIS);
  px(b, ix, iy, OUT);
  px(b, ix - 1, iy - 1, GLINT);
  // upper lid: fill rows from the top of the eye down
  const rows = Math.round(Math.min(1, lid) * 8);
  for (let r = 0; r < rows; r++) {
    for (let x = cx - 4; x <= cx + 4; x++) {
      const y = cy - 4 + r;
      const dx = (x - cx) / 3.6;
      const dy = (y - cy) / 3.6;
      if (dx * dx + dy * dy <= 1) px(b, x, y, r === rows - 1 ? OUT : FHI);
    }
  }
}

function draw(b: Buf, p: Pose) {
  b.fill(T);
  const bob = Math.round(p.bob);
  const hy = 19 + bob;

  // tail + feet first so the body overlaps them
  for (let i = 0; i < 6; i++) line(b, 32 - 4 + i, 54, 32 - 6 + i * 2, 61, FLO);
  line(b, 27, 58, 27, 61, BEAK_LO);
  line(b, 37, 58, 37, 61, BEAK_LO);
  line(b, 25, 61, 29, 61, BEAK_LO);
  line(b, 35, 61, 39, 61, BEAK_LO);

  // wings: lift raises the tips, flap jitters them
  const lift = Math.round(p.flap);
  ellipse(b, 17 - Math.max(0, lift) * 0.4, 42 + bob - lift, 4.5, 10, F, FHI, FLO);
  ellipse(b, 47 + Math.max(0, lift) * 0.4, 42 + bob - lift, 4.5, 10, F, FHI, FLO);

  // body + belly
  ellipse(b, 32, 43 + bob, 14, 15, F, FHI, FLO);
  ellipse(b, 32, 46 + bob, 8, 10, BELLY, FHI);
  for (let y = 40; y < 56; y += 3) line(b, 29, y + bob, 35, y + bob + 1, F);

  // cravat
  const cy = 31 + bob;
  for (let i = 0; i < 4; i++) {
    line(b, 31 - i, cy - i, 31 - i, cy + i, CRAVAT);
    line(b, 33 + i, cy - i, 33 + i, cy + i, CRAVAT);
  }
  px(b, 32, cy, BEAK_LO);

  // head — tilt nudges it a pixel or two sideways
  const hx = 32 + Math.round(p.tilt * 12) + Math.round(p.lookX * 1.5);
  ellipse(b, hx, hy, 12, 11, F, FHI, FLO);
  // scruffy crest
  line(b, hx - 3, hy - 10, hx - 5, hy - 15, F);
  line(b, hx, hy - 11, hx, hy - 17, F);
  line(b, hx + 3, hy - 10, hx + 6, hy - 14, F);
  px(b, hx, hy - 16, FHI);

  const lidL = Math.max(p.lidL, p.blink);
  const lidR = Math.max(p.lidR, p.blink);
  eye(b, hx - 5, hy - 1, lidL, p.lookX, p.lookY);
  eye(b, hx + 5, hy - 1, lidR, p.lookX, p.lookY);

  // brows: lift moves them, tilt angles the inner ends
  const bl = Math.round(-p.browL * 2);
  const br = Math.round(-p.browR * 2);
  const tilt = Math.round(p.browTilt * 6);
  line(b, hx - 8, hy - 6 + bl, hx - 2, hy - 6 + bl - tilt + 1, OUT);
  line(b, hx - 8, hy - 7 + bl, hx - 2, hy - 7 + bl - tilt + 1, OUT);
  line(b, hx + 2, hy - 6 + br - tilt + 1, hx + 8, hy - 6 + br, OUT);
  line(b, hx + 2, hy - 7 + br - tilt + 1, hx + 8, hy - 7 + br, OUT);

  // beak: upper wedge, mouth gap, lower wedge drops with `beak`
  const by = hy + 4;
  const gap = Math.round(p.beak * 4);
  for (let r = 0; r < 4; r++) line(b, hx - 3 + r, by + r, hx + 3 - r, by + r, r === 0 ? BEAK : r === 3 ? BEAK_LO : BEAK);
  px(b, hx - 1, by, GLINT);
  if (gap > 0) for (let r = 0; r < gap; r++) line(b, hx - 2, by + 3 + r, hx + 2, by + 3 + r, MOUTH);
  for (let r = 0; r < 2; r++) line(b, hx - 2 + r, by + 3 + gap + r, hx + 2 - r, by + 3 + gap + r, BEAK_LO);

  outline(b);
}

/** Mounts the sprite into a canvas and animates it from the shared face store. Returns a stop fn. */
export function mountPixelPoe(canvas: HTMLCanvasElement) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const img = ctx.createImageData(W, H);
  const buf: Buf = new Uint8Array(W * H);
  const reduced = prefersReducedMotion();

  const driver = createFaceDriver('poe', reduced);
  let beak = 0;
  let nextChatter = 0;

  const tick = () => {
    const f = driver.step(1 / FPS);
    const t = f.time;
    const talking = getFaceState().poeTalking;

    if (talking) {
      if (t > nextChatter) {
        beak = beak > 0.3 ? 0 : 0.5 + Math.random() * 0.5;
        nextChatter = t + 0.08 + Math.random() * 0.1;
      }
    } else {
      beak = f.mouthOpen * 0.8;
    }

    const bob = reduced ? 0 : Math.sin(t * 2.4) > 0.6 ? -1 : 0;
    const flap = Math.max(0, f.smile) * 3 + f.mouthOpen * 2 + (reduced ? 0 : talking ? (Math.sin(t * 20) > 0 ? 1 : 0) : 0);

    draw(buf, {
      ...f,
      // sprite eyes move in whole pixels, so a blink is either open or shut
      blink: f.blink > 0.3 ? 1 : 0,
      lookX: f.gazeX,
      lookY: f.gazeY,
      beak,
      bob,
      flap,
    });

    const d = img.data;
    for (let i = 0; i < buf.length; i++) {
      const c = buf[i];
      const [r, g, bl] = PALETTE[c];
      d[i * 4] = r;
      d[i * 4 + 1] = g;
      d[i * 4 + 2] = bl;
      d[i * 4 + 3] = c === T ? 0 : 255;
    }
    ctx.putImageData(img, 0, 0);
  };

  tick();
  const id = window.setInterval(tick, 1000 / FPS);
  return () => {
    window.clearInterval(id);
    driver.dispose();
  };
}
