import { useEffect, useId, useRef } from 'react';
import { getFaceState, prefersReducedMotion, type Expression } from './expressions';
import { createFaceDriver, type FaceFrame } from './faceDriver';

/**
 * Christian as an anime bust: SVG line art with cel shading. Every moving
 * part is a ref the rAF loop rewrites directly, so React never re-renders
 * per frame. Coordinates live in a 400×400 viewBox.
 */

const LINE = '#1d1714';
const SKIN = '#f3d2bb';
const SKIN_SHADE = '#e0ad92';
const HAIR = '#5b4c42';
const HAIR_SHADE = '#3d322c';
const HAIR_STREAK = '#c9c3bb';
const IRIS_TOP = '#3f5d78';
const IRIS_BOTTOM = '#9ec3dc';
const ARMOR = '#f4f1ea';
const ARMOR_SHADE = '#cfc9bd';
const GREEN = '#43a047';
const GREEN_SHADE = '#2e7d32';
const SUIT = '#202326';
const GLOW = '#40f0e4';

/** Upper-left eye outline in eye-local coords; the right eye mirrors it. */
const EYE_SHAPE = 'M -24 4 Q -14 -17 8 -16 Q 21 -15 25 -4 Q 23 9 12 13 Q -6 17 -20 10 Z';
const LASH = 'M -27 6 Q -15 -19 9 -18 Q 23 -17 28 -5 L 33 -9';
const LOWER_LASH = 'M -16 12 Q -2 17 14 12';

function mouthPath(smile: number, open: number) {
  // corners lift with the smile; the lower lip drops as the jaw opens
  const w = 17 + open * 3 + Math.max(0, smile) * 5;
  const cornerL = -smile * 7;
  const cornerR = -smile * 7 - 2.5; // portrait's smirk: right corner sits a touch higher
  const upper = smile * 2.5 - open * 2;
  const lower = 1 + open * 26 + Math.max(0, smile) * 5;
  return `M ${-w} ${cornerL} Q 0 ${upper} ${w} ${cornerR} Q 0 ${lower} ${-w} ${cornerL} Z`;
}

function browPath() {
  return 'M -22 3 Q -4 -9 22 -4 Q 4 -3 -22 6 Z';
}

type Refs = {
  head: SVGGElement | null;
  hairFront: SVGGElement | null;
  features: SVGGElement | null;
  irisL: SVGGElement | null;
  irisR: SVGGElement | null;
  lidL: SVGRectElement | null;
  lidR: SVGRectElement | null;
  lashL: SVGGElement | null;
  lashR: SVGGElement | null;
  browL: SVGPathElement | null;
  browR: SVGPathElement | null;
  mouth: SVGPathElement | null;
  mouthLine: SVGPathElement | null;
  tongue: SVGEllipseElement | null;
  blush: SVGGElement | null;
  glow: SVGPathElement | null;
  root: SVGSVGElement | null;
};

function apply(r: Refs, f: FaceFrame, reduced: boolean) {
  const t = f.time;
  const sway = reduced ? 0 : Math.sin(t * 0.8) * 1.5;
  const bob = reduced ? 0 : Math.sin(t * 1.6) * 2;
  const tiltDeg = (f.tilt * 180) / Math.PI;

  r.head?.setAttribute('transform', `translate(${f.gazeX * 6} ${-f.gazeY * 4 + bob}) rotate(${tiltDeg + sway} 200 300)`);
  // features slide a little further than the skull — a cheap 3/4-turn illusion
  r.features?.setAttribute('transform', `translate(${f.gazeX * 5} ${-f.gazeY * 4})`);
  const hairSway = reduced ? 0 : Math.sin(t * 1.3 + 0.6) * 1.2;
  r.hairFront?.setAttribute('transform', `translate(${f.gazeX * 3} ${-f.gazeY * 2}) rotate(${hairSway - f.gazeX * 2} 200 150)`);

  // surprised eyes shrink the iris; happy ones get a bit bigger
  const irisScale = 1 - Math.max(0, f.mouthOpen - 0.5) * 0.5 + Math.max(0, f.smile) * 0.04;
  const ix = f.gazeX * 7;
  const iy = -f.gazeY * 5;
  r.irisL?.setAttribute('transform', `translate(${ix} ${iy}) scale(${irisScale})`);
  r.irisR?.setAttribute('transform', `translate(${ix} ${iy}) scale(${irisScale})`);

  const lids: [SVGRectElement | null, SVGGElement | null, number][] = [
    [r.lidL, r.lashL, Math.max(f.lidL, f.blink)],
    [r.lidR, r.lashR, Math.max(f.lidR, f.blink)],
  ];
  for (const [lid, lash, amount] of lids) {
    const a = Math.min(1, amount);
    // lid rect's bottom edge travels from above the eye to its lower rim
    lid?.setAttribute('height', String(10 + a * 31));
    lash?.setAttribute('transform', `translate(0 ${a * 23}) scale(1 ${1 - a * 0.85})`);
  }

  r.browL?.setAttribute('transform', `translate(158 ${152 - f.browL * 9}) rotate(${-f.browTilt * 30 - f.browL * 4})`);
  r.browR?.setAttribute('transform', `translate(242 ${152 - f.browR * 9}) scale(-1 1) rotate(${-f.browTilt * 30 - f.browR * 4})`);

  const open = Math.max(0, f.mouthOpen);
  r.mouth?.setAttribute('d', mouthPath(f.smile, open));
  r.mouth?.setAttribute('fill-opacity', String(Math.min(1, open * 4)));
  r.mouthLine?.setAttribute('d', mouthPath(f.smile, open));
  r.tongue?.setAttribute('opacity', String(Math.max(0, (open - 0.3) * 2)));
  r.tongue?.setAttribute('cy', String(6 + open * 16));
  r.blush?.setAttribute('opacity', String(Math.max(0, f.smile - 0.4) * 1.4));
  if (r.glow && !reduced) r.glow.setAttribute('opacity', String(0.7 + Math.sin(t * 3) * 0.25));
}

/** With `expression` the avatar shows that mood instead of following the page scroll. */
export default function AnimeAvatar({ expression }: { expression?: Expression }) {
  const uid = useId().replace(/:/g, '');
  const pinned = useRef(expression);
  pinned.current = expression;
  const refs = useRef<Refs>({
    head: null,
    hairFront: null,
    features: null,
    irisL: null,
    irisR: null,
    lidL: null,
    lidR: null,
    lashL: null,
    lashR: null,
    browL: null,
    browR: null,
    mouth: null,
    mouthLine: null,
    tongue: null,
    blush: null,
    glow: null,
    root: null,
  });

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const pick = () => pinned.current ?? getFaceState().christian;
    const driver = createFaceDriver('christian', reduced, pick);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      apply(refs.current, driver.step(dt), reduced);
      refs.current.root?.setAttribute('data-mood', pick());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      driver.dispose();
    };
  }, []);

  const r = refs.current;
  const eye = (side: 1 | -1) => {
    const cx = side === -1 ? 166 : 234;
    const clip = `${uid}-eye${side}`;
    return (
      <g transform={`translate(${cx} 196) scale(${side === -1 ? 1 : -1} 1)`}>
        <clipPath id={clip}>
          <path d={EYE_SHAPE} />
        </clipPath>
        <g clipPath={`url(#${clip})`}>
          <path d={EYE_SHAPE} fill="#fdfcfa" />
          <path d="M -26 -20 L 28 -20 L 28 -2 Q 0 -10 -26 0 Z" fill="#dfe4ea" />
          <g ref={(el) => void (side === -1 ? (r.irisL = el) : (r.irisR = el))}>
            <ellipse cx="0" cy="0" rx="12" ry="16" fill={`url(#${uid}-iris)`} stroke={LINE} strokeWidth="1.5" />
            <ellipse cx="0" cy="1" rx="5.5" ry="8.5" fill={LINE} />
            {/* highlights stay on the viewer's side even on the mirrored eye */}
            <g transform={`scale(${side} 1)`}>
              <ellipse cx="-4.5" cy="-6.5" rx="4.2" ry="5" fill="#fff" />
              <circle cx="5" cy="7" r="2" fill="#fff" />
            </g>
          </g>
          <rect
            ref={(el) => void (side === -1 ? (r.lidL = el) : (r.lidR = el))}
            x="-30"
            y="-24"
            width="62"
            height="10"
            fill={SKIN_SHADE}
          />
        </g>
        <g ref={(el) => void (side === -1 ? (r.lashL = el) : (r.lashR = el))}>
          <path d={LASH} fill="none" stroke={LINE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <path d={LOWER_LASH} fill="none" stroke={LINE} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      </g>
    );
  };

  return (
    <svg
      ref={(el) => void (r.root = el)}
      className="anime-avatar"
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-iris`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={IRIS_TOP} />
          <stop offset="1" stopColor={IRIS_BOTTOM} />
        </linearGradient>
      </defs>

      {/* armor bust — stays put while the head moves */}
      <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
        <path d="M 172 262 L 228 262 L 232 330 L 168 330 Z" fill={SUIT} />
        <path d="M 30 400 Q 44 336 128 318 L 150 400 Z" fill={GREEN} />
        <path d="M 370 400 Q 356 336 272 318 L 250 400 Z" fill={GREEN} />
        <path d="M 54 400 Q 66 352 126 336" fill="none" stroke={GREEN_SHADE} strokeWidth="6" />
        <path d="M 112 400 L 128 316 L 168 300 L 200 322 L 232 300 L 272 316 L 288 400 Z" fill={ARMOR} />
        <path d="M 128 316 L 168 300 L 172 316 L 140 330 Z" fill={ARMOR_SHADE} />
        <path d="M 160 352 L 200 386 L 240 352 L 240 372 L 200 400 L 160 372 Z" fill={GREEN} />
        <path
          ref={(el) => void (r.glow = el)}
          d="M 240 318 L 270 334"
          stroke={GLOW}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      <g ref={(el) => void (r.head = el)}>
        {/* back hair */}
        <path
          d="M 120 200 Q 104 140 128 100 Q 200 52 272 100 Q 296 140 280 200 L 270 150 L 130 150 Z"
          fill={HAIR_SHADE}
          stroke={LINE}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* ears + hoop on his left */}
        <g stroke={LINE} strokeWidth="3" strokeLinejoin="round">
          <path d="M 132 186 Q 112 178 114 202 Q 118 226 138 226 Z" fill={SKIN} />
          <path d="M 268 186 Q 288 178 286 202 Q 282 226 262 226 Z" fill={SKIN} />
        </g>
        <path d="M 124 194 Q 120 206 128 216" fill="none" stroke={SKIN_SHADE} strokeWidth="3" />
        <path d="M 276 194 Q 280 206 272 216" fill="none" stroke={SKIN_SHADE} strokeWidth="3" />
        <circle cx="282" cy="223" r="5" fill="none" stroke={LINE} strokeWidth="2.5" />

        {/* face: soft cranium tapering to a defined anime chin */}
        <path
          d="M 130 150 C 130 104, 270 104, 270 150 L 268 206 C 264 248, 232 280, 200 290 C 168 280, 136 248, 132 206 Z"
          fill={SKIN}
          stroke={LINE}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* cel shadow down the far cheek and under the hairline */}
        <path d="M 262 160 L 266 208 C 262 246, 234 274, 204 286 C 236 262, 252 232, 256 200 Z" fill={SKIN_SHADE} />
        <path d="M 134 150 L 266 150 L 264 166 Q 200 152 136 166 Z" fill={SKIN_SHADE} opacity="0.8" />
        {/* stubble: a light cool tint on the jaw, hatched */}
        <path
          d="M 150 236 C 160 268, 182 284, 200 288 C 218 284, 240 268, 250 236 Q 226 262 200 264 Q 174 262 150 236 Z"
          fill="#9a8f99"
          opacity="0.18"
        />

        <g ref={(el) => void (r.features = el)}>
          <g ref={(el) => void (r.blush = el)} opacity="0">
            <ellipse cx="150" cy="232" rx="16" ry="7" fill="#f07c86" opacity="0.45" />
            <ellipse cx="250" cy="232" rx="16" ry="7" fill="#f07c86" opacity="0.45" />
            <path d="M 142 230 l 4 -5 M 150 231 l 4 -5 M 242 230 l 4 -5 M 250 231 l 4 -5" stroke="#d9606c" strokeWidth="1.5" />
          </g>

          {eye(-1)}
          {eye(1)}

          <path ref={(el) => void (r.browL = el)} d={browPath()} fill={HAIR} stroke={LINE} strokeWidth="1.5" />
          <path ref={(el) => void (r.browR = el)} d={browPath()} fill={HAIR} stroke={LINE} strokeWidth="1.5" />

          {/* nose: just a shadow tick, anime-style */}
          <path d="M 204 214 L 209 230 L 201 232" fill="none" stroke={SKIN_SHADE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 207 229 L 201 232" fill="none" stroke={LINE} strokeWidth="1.8" strokeLinecap="round" />

          <g transform="translate(200 256)">
            <path ref={(el) => void (r.mouth = el)} d={mouthPath(0.15, 0)} fill="#7a2632" fillOpacity="0" />
            <ellipse ref={(el) => void (r.tongue = el)} cx="0" cy="8" rx="9" ry="5" fill="#e9707c" opacity="0" />
            <path
              ref={(el) => void (r.mouthLine = el)}
              d={mouthPath(0.15, 0)}
              fill="none"
              stroke={LINE}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* front hair: big swept-up clumps with grey streaks */}
        <g ref={(el) => void (r.hairFront = el)}>
          <path
            d="M 122 176 L 112 128 L 88 120 L 116 106 L 96 76 L 134 82 L 128 44 L 162 68 L 172 26 L 196 62 L 220 22 L 232 64 L 266 38 L 266 82 L 306 72 L 286 106 L 314 120 L 288 130 L 278 176 L 268 150 L 256 124 L 244 148 L 226 118 L 212 144 L 198 116 L 184 144 L 168 120 L 156 148 L 142 126 L 132 152 Z"
            fill={HAIR}
            stroke={LINE}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* cel shadow along the hairline */}
          <path
            d="M 132 152 L 142 126 L 156 148 L 168 120 L 184 144 L 198 116 L 212 144 L 226 118 L 244 148 L 256 124 L 268 150 L 262 120 Q 200 100 138 120 Z"
            fill={HAIR_SHADE}
          />
          {/* salt-and-pepper streaks + shine */}
          <g fill="none" stroke={HAIR_STREAK} strokeWidth="3" strokeLinecap="round">
            <path d="M 172 34 L 178 70" />
            <path d="M 219 30 L 214 66" />
            <path d="M 136 54 L 150 84" />
            <path d="M 262 46 L 250 80" />
            <path d="M 104 82 L 128 98" />
            <path d="M 298 78 L 276 96" />
          </g>
          <path d="M 150 96 Q 200 78 252 96" fill="none" stroke="#8a7a6e" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          {/* greying temples */}
          <path d="M 122 176 L 116 140 L 130 150 Z" fill={HAIR_STREAK} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 278 176 L 284 140 L 270 150 Z" fill={HAIR_STREAK} stroke={LINE} strokeWidth="2" strokeLinejoin="round" />
        </g>
      </g>

      {/* manga emotes, shown per mood via CSS */}
      <g className="emote emote--surprised" transform="translate(316 92)">
        <path d="M -6 -34 L 6 -34 L 3 4 L -3 4 Z" fill={LINE} />
        <circle cx="0" cy="14" r="5" fill={LINE} />
      </g>
      <g className="emote emote--excited" fill="#f6c343" stroke={LINE} strokeWidth="2" strokeLinejoin="round">
        <path d="M 318 70 l 6 14 l 14 6 l -14 6 l -6 14 l -6 -14 l -14 -6 l 14 -6 Z" />
        <path d="M 84 96 l 4 9 l 9 4 l -9 4 l -4 9 l -4 -9 l -9 -4 l 9 -4 Z" />
      </g>
      <g className="emote emote--thinking" fill={LINE}>
        <circle cx="300" cy="96" r="4" />
        <circle cx="314" cy="90" r="4" />
        <circle cx="328" cy="84" r="4" />
      </g>
      <g className="emote emote--focused" transform="translate(304 112)" stroke="#e5484d" strokeWidth="4" strokeLinecap="round">
        <path d="M -10 -4 Q -4 -4 -4 -10 M 4 -10 Q 4 -4 10 -4 M 10 4 Q 4 4 4 10 M -4 10 Q -4 4 -10 4" fill="none" />
      </g>
      <g className="emote emote--wink" transform="translate(312 104)">
        <path
          d="M 0 8 C -14 -2 -10 -14 0 -6 C 10 -14 14 -2 0 8 Z"
          fill="#f07c86"
          stroke={LINE}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
