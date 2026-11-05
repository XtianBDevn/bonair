export type Accent = 'coral' | 'lavender' | 'sun' | 'magenta' | 'plum';

export type Action = { label: string; href: string };

/** Opens external links in a new tab. */
export const linkAttrs = (href: string) => (href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {});
