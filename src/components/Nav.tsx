import { href } from '../router';
import { Icon } from './Icon';

const ITEMS = [
  { to: '/', label: 'Home', icon: 'home', match: (p: string) => p === '/' },
  { to: '/luce', label: 'Situazione', icon: 'light', match: (p: string) => p.startsWith('/luce') || p.startsWith('/situazione') },
  { to: '/basi/video', label: 'Basi', icon: 'layers', match: (p: string) => p.startsWith('/basi') },
  { to: '/guida', label: 'Guida', icon: 'book', match: (p: string) => p.startsWith('/guida') },
  { to: '/pre-ripresa', label: 'Pre', icon: 'check', match: (p: string) => p.startsWith('/pre-ripresa') },
  { to: '/menu', label: 'Menu', icon: 'list', match: (p: string) => p.startsWith('/menu') || p.startsWith('/verifiche') },
];

export function Nav({ path }: { path: string }) {
  return (
    <nav class="nav" aria-label="Navigazione principale">
      {ITEMS.map((i) => (
        <a href={href(i.to)} aria-current={i.match(path) ? 'page' : undefined}>
          <Icon name={i.icon} />
          {i.label}
        </a>
      ))}
    </nav>
  );
}
