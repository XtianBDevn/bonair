import { useEffect, useRef, useState } from 'react';
import AnimeAvatar from './AnimeAvatar';
import type { Expression } from './expressions';

const MOODS: Expression[] = ['happy', 'curious', 'surprised', 'focused', 'thinking', 'excited', 'wink', 'neutral'];

/**
 * "Characters that react" demo: a second avatar that cycles moods on its
 * own. Respects the surrounding demo window's play/pause button, which
 * flips data-paused on the .demo-stage element.
 */
export default function MoodDemo() {
  const root = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const stage = root.current?.closest<HTMLElement>('.demo-stage');
    if (!stage) return;
    const sync = () => setAuto(!stage.hasAttribute('data-paused'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(stage, { attributes: true, attributeFilter: ['data-paused'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % MOODS.length), 1800);
    return () => window.clearInterval(id);
  }, [auto]);

  return (
    <div ref={root} className="mood-demo">
      <div className="mood-demo-face">
        <AnimeAvatar expression={MOODS[i]} />
      </div>
      <div className="mood-demo-picks" role="group" aria-label="Pick a mood">
        {MOODS.map((m, n) => (
          <button key={m} type="button" aria-pressed={n === i} onClick={() => setI(n)}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
