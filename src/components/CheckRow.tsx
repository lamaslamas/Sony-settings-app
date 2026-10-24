import type { ComponentChildren } from 'preact';

/** Riga con casella grande (min 48 px) da spuntare. */
export function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ComponentChildren }) {
  return (
    <label class="entry check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange((e.target as HTMLInputElement).checked)} />
      <div class="body stack">{children}</div>
    </label>
  );
}
