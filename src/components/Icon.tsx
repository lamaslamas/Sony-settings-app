// Icone semplici (tracciati SVG) per le schede del menu e la navigazione.
const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v10h-6v-6H9v6H3z',
  camera: 'M4 7h3l2-3h6l2 3h3v13H4zM12 17a4 4 0 100-8 4 4 0 000 8z',
  exposure: 'M4 4h16v16H4zM8 9h8M12 5v8M8 17h8',
  focus: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M12 14a2 2 0 100-4 2 2 0 000 4z',
  play: 'M5 4l15 8-15 8z',
  network: 'M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a10 10 0 0114 0M2 9.5a15 15 0 0120 0',
  setup: 'M14 6a4 4 0 00-5 5L3 17l4 4 6-6a4 4 0 005-5l-3 3-3-1-1-3z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  light: 'M12 3a6 6 0 00-3 11v3h6v-3a6 6 0 00-3-11zM10 21h4',
  book: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11',
  list: 'M4 6h16M4 12h16M4 18h16',
  check: 'M4 12l5 5L20 6',
  alert: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
};

export function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.list} />
    </svg>
  );
}
