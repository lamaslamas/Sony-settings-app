import type { MenuTab } from '../types';
import { Icon } from './Icon';

/** Etichetta di scheda: icona + nome + colore insieme (mai il solo colore). */
export function TabBadge({ tab }: { tab: MenuTab }) {
  return (
    <span class="tabbadge" style={{ '--tab-color': `var(${tab.colorToken})` } as never}>
      <Icon name={tab.icon} />
      {tab.name}
    </span>
  );
}
