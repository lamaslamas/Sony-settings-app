// Router minimale basato sull'hash (#/percorso): funziona su GitHub Pages senza configurazione.
import { useEffect, useState } from 'preact/hooks';

const current = () => (location.hash.replace(/^#/, '') || '/').split('?')[0];

export function usePath(): string {
  const [path, setPath] = useState(current);
  useEffect(() => {
    const on = () => { setPath(current()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const href = (p: string) => `#${p}`;
