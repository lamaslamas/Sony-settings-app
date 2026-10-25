import { useState } from 'preact/hooks';
import { menu } from '../lib/data';
import { href } from '../router';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import type { MenuItem, MenuTab } from '../types';

function ItemLine({ item, indent }: { item: MenuItem; indent?: boolean }) {
  return (
    <div class="entry" style={indent ? { paddingLeft: 32 } : undefined}>
      <span class="name">{item.name}</span> {item.verify && <VerifyBadge />}
      {item.options && <div class="small dim">{item.options.join(' · ')}</div>}
      {item.note && <div class="small dim">{item.note}</div>}
      {item.subItems?.map((s) => <ItemLine item={s} indent key={s.name} />)}
    </div>
  );
}

/** Albero del menu firmware 4.00, con ricerca per nome voce. */
export function MenuTree() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const hits: { tab: MenuTab; group: string; item: MenuItem; sub?: string }[] = [];
  if (needle) {
    for (const tab of menu.tabs) for (const g of tab.groups) for (const item of g.items) {
      if (item.name.toLowerCase().includes(needle)) hits.push({ tab, group: g.name, item });
      for (const s of item.subItems ?? []) if (s.name.toLowerCase().includes(needle)) hits.push({ tab, group: g.name, item, sub: s.name });
    }
  }
  return (
    <div class="page stack">
      <h1>Menu · firmware {menu.firmware}</h1>
      <a class="btn block" href={href('/verifiche')}>Voci da verificare sulla fotocamera</a>
      <input type="search" placeholder="Cerca una voce (es. Zebra)" aria-label="Cerca una voce del menu" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />

      {needle ? (
        <div class="card" style={{ padding: 0 }}>
          {hits.length === 0 && <div class="entry">Nessuna voce trovata.</div>}
          {hits.map((h) => (
            <div class="entry stack" key={`${h.tab.id}${h.group}${h.item.name}${h.sub}`}>
              <div><TabBadge tab={h.tab} /></div>
              <div class="name">{h.sub ? `${h.item.name} › ${h.sub}` : h.item.name}</div>
              <div class="path">MENU › {h.tab.name} › {h.group} › {h.item.name}{h.sub ? ` › ${h.sub}` : ''}</div>
              {h.item.options && !h.sub && <div class="small dim">{h.item.options.join(' · ')}</div>}
            </div>
          ))}
        </div>
      ) : (
        menu.tabs.map((tab) => (
          <details class="tree" key={tab.id}>
            <summary><TabBadge tab={tab} /></summary>
            <div class="inner stack">
              {tab.groups.map((g) => (
                <details class="tree" key={g.name}>
                  <summary><b>{g.name}</b></summary>
                  <div class="inner">{g.items.map((i) => <ItemLine item={i} key={i.name} />)}</div>
                </details>
              ))}
            </div>
          </details>
        ))
      )}
      <p class="small dim">Fonte: {menu.source}</p>
    </div>
  );
}
