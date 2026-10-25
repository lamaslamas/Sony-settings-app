import { baseVideo, baseFoto, groupEntries, findMenuItem } from '../lib/data';
import { href } from '../router';
import { EntryRow } from '../components/EntryRow';
import { TabBadge } from '../components/TabBadge';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';
import type { BaseFile } from '../types';

/** Base video (M1) o base foto (M2): tutte le voci in ordine di menu, per scheda e gruppo. */
export function Base({ tipo }: { tipo: 'video' | 'foto' }) {
  const base: BaseFile = tipo === 'video' ? baseVideo : baseFoto;
  const grouped = groupEntries(base.entries);
  const setup = groupEntries(base.setup);
  return (
    <div class="page stack">
      <div class="seg" role="tablist" aria-label="Scegli la base">
        <a href={href('/basi/video')} aria-current={tipo === 'video' ? 'page' : undefined}>Video · M1</a>
        <a href={href('/basi/foto')} aria-current={tipo === 'foto' ? 'page' : undefined}>Foto · M2</a>
      </div>
      <h1>{base.titolo}</h1>
      <p class="dim">{base.descrizione}</p>
      <div class="card">
        <div><span class="name">Still/Movie/S&amp;Q dial</span> → <span class="value">{base.dials.stillMovieSq}</span></div>
        <div><span class="name">Mode dial</span> → <span class="value">{base.dials.mode}</span></div>
      </div>

      {grouped.map(({ tab, groups }) => (
        <section key={tab.id} class="stack">
          <h2><TabBadge tab={tab} /></h2>
          {groups.map((g) => (
            <div class="card" style={{ padding: 0 }} key={g.name}>
              <div class="entry"><b>{g.name}</b></div>
              {g.entries.map((e) => <EntryRow e={e} hideTab key={`${e.item}${e.sub}`} />)}
            </div>
          ))}
        </section>
      ))}

      {setup.length > 0 && (
        <section class="stack">
          <h2>Setup · una volta sola</h2>
          <Callout>Queste voci non vengono salvate nella memoria (M1/M2): si impostano una volta sola.</Callout>
          {setup.map(({ tab, groups }) => groups.map((g) => (
            <div class="card" style={{ padding: 0 }} key={tab.id + g.name}>
              <div class="entry"><TabBadge tab={tab} /> <b>{g.name}</b></div>
              {g.entries.map((e) => <EntryRow e={e} hideTab key={`${e.item}${e.sub}`} />)}
            </div>
          )))}
        </section>
      )}

      <div class="card accent stack">
        <h2 style={{ marginTop: 0 }}>Salvala sulla scheda</h2>
        <p>Imposta Still/Movie/S&amp;Q su <b>{base.dials.stillMovieSq}</b> e la ghiera dei modi su <b>{base.dials.mode}</b>, poi:</p>
        <div><span class="name">{base.salvataggio.menu.item}</span> → <span class="value">{base.salvataggio.valore}</span> {!findMenuItem(base.salvataggio.menu) && <b>?</b>}</div>
        <MenuPath r={base.salvataggio.menu} />
        <Callout title="Punto dove è più facile sbagliare" strong>
          Scegli direttamente il numero: <b>M1–M4</b> salvano sulla scheda di memoria, <b>1–3</b> nella camera. Lo slot della scheda si sceglie prima con <b>Memory/Recall Media</b> (Slot 1 / Slot 2).
        </Callout>
      </div>
    </div>
  );
}
