// Icone semplici (tracciati SVG, disegnate qui) per le schede del menu e la navigazione.
// Riprendono le forme delle schede della camera: stella, casa, fotocamera, esposizione, messa a fuoco,
// riproduzione, rete, valigetta degli attrezzi.
const PATHS: Record<string, string> = {
  // schede del menu
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17.5a4 4 0 100-8 4 4 0 000 8z',
  exposure: 'M3 3h18v18H3zM7 9h6M10 6v6M14 17h5',
  focus: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M12 14a2 2 0 100-4 2 2 0 000 4z',
  play: 'M4 4h16v16H4zM10 8.5v7l6-3.5z',
  network: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  setup: 'M3 9h18v11H3zM8 9V6h8v3M3 14h18M10 12v4M14 12v4',
  // navigazione e varie
  light: 'M12 3a6 6 0 00-3 11v3h6v-3a6 6 0 00-3-11zM10 21h4',
  book: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11',
  list: 'M4 6h16M4 12h16M4 18h16',
  check: 'M4 12l5 5L20 6',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  dial: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 3v4M12 12l4-4M5 9l2 1M19 9l-2 1',
  lens: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 3v3',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.list} />
    </svg>
  );
}
