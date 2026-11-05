import { useEffect, useRef, useState } from 'react';
import AnimeAvatar from './AnimeAvatar';
import { useFaceState } from './expressions';

const MOOD_LABEL: Record<string, string> = {
  neutral: 'reading along',
  happy: 'stoked',
  curious: 'hmm, curious',
  surprised: 'whoa',
  focused: 'locked in',
  thinking: 'thinking…',
  excited: 'lets gooo',
  wink: 'say hi 👋',
};

const DOCK = 168;
const DOCK_MOBILE = 112;
/** room for the bottom edge of the viewport */
const DOCK_BOTTOM = 24;

/**
 * One avatar for the whole page: it sits on the hero slot, then glides to a
 * bottom-right dock as the hero scrolls away, staying alive so the face can
 * react to every section below.
 */
export default function AvatarDock({ slotSelector }: { slotSelector: string }) {
  const floating = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const [docked, setDocked] = useState(false);
  const { christian } = useFaceState();

  useEffect(() => {
    const slot = document.querySelector<HTMLElement>(slotSelector);
    const el = floating.current;
    if (!slot || !el) return;

    let raf = 0;
    const place = () => {
      raf = 0;
      const r = slot.getBoundingClientRect();
      const dock = window.innerWidth < 640 ? DOCK_MOBILE : DOCK;
      const raw = Math.min(1, Math.max(0, -r.top / (r.height * 0.85)));
      const t = raw * raw * (3 - 2 * raw);
      const scale = 1 + (dock / r.width - 1) * t;
      const x = r.left + (window.innerWidth - dock - 16 - r.left) * t;
      const y = r.top + (window.innerHeight - dock - DOCK_BOTTOM - r.top) * t;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      setDocked(t > 0.98);
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };
    const ro = new ResizeObserver(() => {
      setSize(slot.getBoundingClientRect().width);
      queue();
    });
    ro.observe(slot);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    queue();
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slotSelector]);

  return (
    <>
      <div ref={floating} className="avatar-floating" style={{ width: size, height: size }} aria-hidden="true">
        {size > 0 && <AnimeAvatar />}
      </div>
      <span className={`avatar-mood${docked ? ' is-docked' : ''}`} aria-hidden="true">
        {MOOD_LABEL[christian]}
      </span>
    </>
  );
}
