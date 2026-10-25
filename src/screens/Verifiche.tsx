import { collectVerify } from '../lib/data';
import { href } from '../router';
import { TabBadge } from '../components/TabBadge';

/** Tutte le voci con verify:true, per scheda: da controllare sulla fotocamera. */
export function Verifiche() {
  const groups = collectVerify();
  return (
    <div class="page stack">
      <a href={href('/menu')}>← Menu</a>
      <h1>Da verificare</h1>
      <p class="dim">Voci non confermate dalla guida Sony: controllale sulla fotocamera.</p>
      {groups.map((g) => (
        <section key={g.title} class="stack">
          <h2>{g.tab ? <TabBadge tab={g.tab} /> : g.title}</h2>
          <div class="card" style={{ padding: 0 }}>
            {g.rows.map((r, i) => (
              <div class="entry stack" key={i}>
                <div><span class="name">{r.label}</span>{r.value && <> → <span class="value">{r.value}</span></>}</div>
                <div class="small dim">{r.where}</div>
                {r.note && <div class="small dim">{r.note}</div>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
