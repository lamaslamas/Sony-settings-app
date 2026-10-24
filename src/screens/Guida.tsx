import { guida } from '../lib/data';
import { href } from '../router';
import { Callout } from '../components/Callout';
import { MenuPath } from '../components/MenuPath';
import { VerifyBadge } from '../components/Badges';

/** Guida inizio evento: concetti + passo A (a casa), B (inizio evento), C (durante). */
export function Guida() {
  return (
    <div class="page stack">
      <h1>Guida inizio evento</h1>

      <h2>Da capire prima</h2>
      {guida.concetti.map((c) => (
        <Callout key={c.id} title={c.titolo} strong={c.evidenzia}>
          <p>{c.testo} {c.verify && <VerifyBadge />}</p>
          {c.nota && <p class="small dim">{c.nota}</p>}
        </Callout>
      ))}

      {guida.passi.map((blocco) => (
        <section key={blocco.id} class="card stack">
          <h2 style={{ marginTop: 0 }}>{blocco.titolo}</h2>
          <ol>
            {blocco.passi.map((p) => (
              <li key={p.testo} class="stack" style={{ marginBottom: 14 }}>
                <div>{p.testo} {p.link && <a href={href(p.link)}>Apri</a>}</div>
                {p.menu && <><div><span class="name">{p.menu.item}</span> → <span class="value">{p.valore}</span></div><MenuPath r={p.menu} /></>}
                {p.avviso && <Callout strong>{p.avviso}</Callout>}
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
