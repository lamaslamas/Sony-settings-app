import { useState } from 'preact/hooks';
import { menu } from '../lib/data';
import { href } from '../router';
import { ColonnaSchede, spezza } from '../components/CameraMenu';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import type { MenuItem, MenuTab } from '../types';

/** Menu della camera consultabile: schede a sinistra, gruppi numerati, voci. Con ricerca per nome. */
export function MenuTree() {
  const [q, setQ] = useState('');
  const [tabId, setTabId] = useState('shooting');
  const [gruppo, setGruppo] = useState(0);
  const [aperta, setAperta] = useState<string | null>(null);
  const tab = menu.tabs.find((t) => t.id === tabId)!;
  const g = tab.groups[Math.min(gruppo, tab.groups.length - 1)];

  const needle = q.trim().toLowerCase();
  const hits: { tab: MenuTab; group: string; item: MenuItem; sub?: string }[] = [];
  if (needle) {
    for (const t of menu.tabs) for (const gr of t.groups) for (const item of gr.items) {
      if (item.name.toLowerCase().includes(needle)) hits.push({ tab: t, group: gr.name, item });
      for (const s of item.subItems ?? []) if (s.name.toLowerCase().includes(needle)) hits.push({ tab: t, group: gr.name, item, sub: s.name });
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
            <button key={`${h.tab.id}${h.group}${h.item.name}${h.sub}`} class="entry stack" style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer' }}
              onClick={() => { setQ(''); setTabId(h.tab.id); setGruppo(h.tab.groups.findIndex((x) => x.name === h.group)); setAperta(h.item.name); }}>
              <div><TabBadge tab={h.tab} /></div>
              <div class="name">{h.sub ? `${h.item.name} › ${h.sub}` : h.item.name}</div>
              <div class="path">MENU › {h.tab.name} › {h.group} › {h.item.name}{h.sub ? ` › ${h.sub}` : ''}</div>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div><TabBadge tab={tab} /></div>
          <div class="cam">
            <ColonnaSchede attiva={tabId} alta onScegli={(id) => { setTabId(id); setGruppo(0); setAperta(null); }} />
            <div class="cam-gruppi cam-scroll">
              {tab.groups.map((gr, i) => (
                <button key={gr.name} class={`cam-riga${i === gruppo ? ' sel' : ''}`} style={{ justifyContent: 'flex-start' }} onClick={() => { setGruppo(i); setAperta(null); }}>
                  <span class="cam-num">{i + 1}</span><span class="cam-nome">{spezza(gr.name)}</span>
                </button>
              ))}
            </div>
            <div class="cam-voci cam-scroll">
              {g.items.map((it) => (
                <div key={it.name}>
                  <button class={`cam-riga${aperta === it.name ? ' sel' : ''}`} onClick={() => setAperta(aperta === it.name ? null : it.name)} aria-expanded={aperta === it.name}>
                    <span class="cam-nome">{spezza(it.name)}</span>{it.verify && <span class="cam-valore">?</span>}
                  </button>
                  {aperta === it.name && (
                    <div class="cam-dettaglio stack">
                      {it.options && <div><span class="dim">Valori:</span> {it.options.join(' · ')}{it.open && ' · …'}</div>}
                      {it.subItems?.map((s) => <div key={s.name}><b>{s.name}</b>{s.options && <span class="dim"> — {s.options.join(' · ')}</span>}</div>)}
                      {it.note && <div class="dim">{it.note}</div>}
                      {it.verify && <VerifyBadge />}
                      {!it.options && !it.subItems && !it.note && <div class="dim">Valori non elencati in questa guida.</div>}
                      <div class="path">MENU › {tab.name} › {g.name} › {it.name}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <p class="small dim">Fonte: {menu.source}</p>
    </div>
  );
}
