import { guida } from '../lib/data';
import { useStato } from '../lib/useStato';
import { impostaSpunta } from '../lib/storage';
import { href } from '../router';
import { Callout } from '../components/Callout';
import { MenuPath } from '../components/MenuPath';
import { CheckRow } from '../components/CheckRow';

/** Guida inizio evento: concetti + passo A (a casa, una volta sola), B (inizio evento), C (durante). */
export function Guida() {
  const { evento, stato, aggiorna } = useStato();
  return (
    <div class="page stack">
      <h1>Guida inizio evento</h1>

      <h2>Da capire prima</h2>
      {guida.concetti.map((c) => (
        <Callout key={c.id} title={c.titolo} strong={c.evidenzia}>
          <p style={{ marginBottom: 0 }}>{c.testo}</p>
        </Callout>
      ))}

      {guida.passi.map((blocco) => {
        const globale = blocco.id === 'A'; // il passo A si fa una volta sola, non per evento
        const spunte = globale ? stato.globali.spunte : evento.spunte;
        return (
          <section key={blocco.id} class="card" style={{ padding: 0 }}>
            <div class="entry">
              <h2 style={{ margin: 0 }}>{blocco.titolo}</h2>
              {globale && <p class="small dim" style={{ margin: '6px 0 0' }}>Le spunte di questo passo valgono per tutti gli eventi.</p>}
            </div>
            {blocco.passi.map((p, i) => {
              const chiave = `guida/${blocco.id}/${i}`;
              return (
                <CheckRow key={chiave} checked={!!spunte[chiave]} onChange={(v) => aggiorna((s) => impostaSpunta(s, chiave, v, globale))}>
                  <div>{p.testo} {p.link && <a href={href(p.link)} onClick={(e) => e.stopPropagation()}>Apri</a>}</div>
                  {p.menu && <><div><span class="name">{p.menu.item}</span> → <span class="value">{p.valore}</span></div><MenuPath r={p.menu} /></>}
                  {p.avviso && <Callout strong>{p.avviso}</Callout>}
                </CheckRow>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
