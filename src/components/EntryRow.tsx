import type { BaseEntry } from '../types';
import { findMenuItem, tabById } from '../lib/data';
import { TabBadge } from './TabBadge';
import { VerifyBadge } from './Badges';
import { MenuPath } from './MenuPath';

/** Una voce di base: etichetta di scheda in cima, poi voce e valore, poi il percorso. */
export function EntryRow({ e, hideTab }: { e: BaseEntry; hideTab?: boolean }) {
  const tab = tabById(e.tab);
  const known = !!findMenuItem(e);
  return (
    <div class="entry stack">
      {tab && !hideTab && <div><TabBadge tab={tab} /></div>}
      <div>
        <span class="name">{e.sub ? `${e.item} › ${e.sub}` : e.item}</span>
        {' → '}
        <span class="value">{e.value}</span>{' '}
        {(e.verify || !known) && <VerifyBadge />}
      </div>
      {e.note && <div class="small dim">{e.note}</div>}
      <MenuPath r={e} />
    </div>
  );
}
