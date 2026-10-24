import type { ComponentChildren } from 'preact';
import { Icon } from './Icon';

/** Riquadro di avviso/nota. strong = evidenziato (punti dove è facile sbagliare). */
export function Callout({ title, strong, children }: { title?: string; strong?: boolean; children: ComponentChildren }) {
  return (
    <div class={`callout${strong ? ' strong' : ''}`} role="note">
      {title && <div class="title"><Icon name="alert" /> {title}</div>}
      {children}
    </div>
  );
}
