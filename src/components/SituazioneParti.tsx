// Parti condivise dalla vista a wizard e dalla vista a lista di una situazione.
import { useState } from 'preact/hooks';
import type { Diff, Situazione } from '../types';
import { situazioniFile, obiettivi } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento, impostaValore } from '../lib/storage';
import { scelteDi, suggerisciLuciArtificiali } from '../lib/useProposte';
import type { PropostaDiff, Proposte } from '../lib/proposte';
import { href } from '../router';
import { VerifyBadge } from './Badges';
import { Callout } from './Callout';

export const nomeDiff = (d: Diff): string =>
  d.source === 'menu' && d.ref ? (d.ref.sub ? `${d.ref.item} › ${d.ref.sub}` : d.ref.item)
  : d.source === 'lens' ? (obiettivi.controlli[d.control ?? ''] ?? d.control ?? '')
  : d.label ?? '';

/** Modifica del valore proposto (resta sempre modificabile). */
export function ModificaValore({ chiave, predefinito }: { chiave: string; predefinito: string }) {
  const { evento, aggiorna } = useStato();
  const modificato = evento.valori[chiave];
  const [edit, setEdit] = useState(false);
  const [bozza, setBozza] = useState(modificato ?? predefinito);
  if (edit) {
    return (
      <div class="valueedit">
        <input aria-label="Nuovo valore" value={bozza} onInput={(e) => setBozza((e.target as HTMLInputElement).value)} />
        <button class="btn small primary" onClick={() => { aggiorna((s) => impostaValore(s, chiave, bozza === predefinito ? undefined : bozza)); setEdit(false); }}>Ok</button>
      </div>
    );
  }
  return (
    <div class="row">
      <button class="btn small" onClick={() => { setBozza(modificato ?? predefinito); setEdit(true); }}>Modifica valore</button>
      {modificato !== undefined && <button class="btn small" onClick={() => aggiorna((s) => impostaValore(s, chiave, undefined))}>Ripristina</button>}
    </div>
  );
}

/** Scrive un valore di regola come si legge sulla camera (1/50, F2.8, …). */
export function mostra(campo: string, v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (campo === 'shutterDenominator') return `1/${v}`;
  if (campo === 'apertureF') return typeof v === 'number' ? `F${v}` : String(v);
  if (campo === 'isoAuto') return v ? 'ISO AUTO' : 'ISO fisso';
  return String(v);
}

/** Spiega cosa ha fatto una regola: corretto, scartato o violato dal valore scelto a mano. */
export function Correzioni({ p }: { p: PropostaDiff }) {
  if (!p.correzioni.length) return null;
  return (
    <div class="stack">
      {p.correzioni.map((c) => (
        <Callout key={c.regolaId + String(c.a)} title={p.origine === 'utente' ? 'Questo valore viola una regola' : c.tipo === 'scartato' ? 'Valore scartato' : 'Valore corretto dalle regole'} strong>
          {p.origine !== 'utente' && <p style={{ margin: '0 0 6px' }}>Calcolato <b>{mostra(c.campo, c.da)}</b> → <b>{c.a === null ? 'nessun valore' : mostra(c.campo, c.a)}</b></p>}
          <p style={{ margin: 0 }}>{c.messaggio}</p>
        </Callout>
      ))}
    </div>
  );
}

export function PassoEsposizione({ s, proposte, compatto }: { s: Situazione; proposte: Proposte; compatto?: boolean }) {
  const { evento, aggiorna } = useStato();
  const zebre = situazioniFile.metodoZebre;
  const modo = evento.modalitaZebre ?? s.zebre?.modalitaDefault ?? 'isoAuto';
  return (
    <div class="stack">
      {compatto ? <h2 style={{ margin: 0 }}>Esposizione</h2> : <h1 style={{ marginBottom: 0 }}>Esposizione</h1>}
      {proposte.previsione.map((t) => <Callout key={t} title="Previsione">{t}</Callout>)}
      <Callout title="Ghiera di compensazione">{s.compensazione.nota}</Callout>
      {s.zebre ? (
        <div class="card stack">
          <p style={{ margin: 0 }}>Zebra Level <b class="value">{s.zebre.livello}</b>{s.zebre.alternative.length > 0 && <> · alternativa <b>{s.zebre.alternative.join(', ')}</b></>} {s.zebre.verify && <VerifyBadge />}</p>
          {s.zebre.nota && <p class="small dim" style={{ margin: 0 }}>{s.zebre.nota}</p>}
          {s.tipo === 'video' && <ul>{zebre.comeLeggereZebraVideo.map((t) => <li key={t}>{t}</li>)}</ul>}
          {s.zebre.metodo && (
            <>
              <h3>{zebre.titolo}</h3>
              <p class="dim">{zebre.quando}</p>
              <div class="seg" role="group" aria-label="Modalità zebre">
                {(['isoAuto', 'isoFisso'] as const).map((m) => (
                  <button key={m} aria-pressed={modo === m} onClick={() => aggiorna((st) => aggiornaEvento(st, (ev) => ({ ...ev, modalitaZebre: m })))}>{zebre.modalita[m].nome}</button>
                ))}
              </div>
              <p class="dim">{zebre.modalita[modo].consigliata}</p>
              <p>{zebre.modalita[modo].intro}</p>
              <ol>{zebre.modalita[modo].passi.map((p) => <li key={p}>{p}</li>)}</ol>
              <Callout>{zebre.modalita[modo].nota}</Callout>
            </>
          )}
        </div>
      ) : (
        <p class="dim">Zebre non previste per questa situazione (le alte luci non sono critiche).</p>
      )}
    </div>
  );
}

/** Riepilogo della lettura della luce e scelte che influenzano le proposte. */
export function LetturaEScelte({ s }: { s: Situazione }) {
  const { evento, aggiorna } = useStato();
  const l = evento.lettura;
  const sc = scelteDi(evento);
  const imposta = (parte: NonNullable<typeof evento.scelte>) => aggiorna((st) => aggiornaEvento(st, (e) => ({ ...e, scelte: { ...e.scelte, ...parte } })));
  const suggerito = suggerisciLuciArtificiali(evento);
  return (
    <div class="card stack">
      <h2 style={{ margin: 0 }}>3. Luce e scelte</h2>
      {!l && <div class="stack"><p style={{ margin: 0 }} class="dim">Nessuna foto di prova: valori fissi della situazione{s.tipo === 'foto' ? ' (la foto è facoltativa)' : ''}.</p><a class="btn small" href={href('/')}>Fai la foto di prova</a></div>}
      {l && !l.valida && <Callout title="Foto di prova da rifare" strong><p>{l.problemi.join(' ')}</p><a class="btn small" href={href('/')}>Rifai la foto</a></Callout>}
      {l && l.valida && <p style={{ margin: 0 }}>EV <b class="value">{l.ev}</b> · {l.evDescrizione}{l.temperaturaK ? <> · {l.temperaturaK} K</> : null}{l.luceMista?.livello === 'si' ? ' · luce mista' : ''}</p>}

      {s.tags.includes('video') && (
        <label class="check" style={{ minHeight: 'var(--hit)' }}>
          <input type="checkbox" checked={sc.nd} onChange={(e) => imposta({ nd: (e.target as HTMLInputElement).checked })} />
          <span class="body">Ho un filtro ND variabile</span>
        </label>
      )}
      {s.tags.includes('wildlife') && (
        <div class="stack">
          <span class="small dim">Soggetto</span>
          <div class="seg" role="group" aria-label="Soggetto">
            {([['fermo', 'Fermo'], ['volo', 'In volo'], ['corsa', 'In corsa']] as const).map(([v, nome]) => (
              <button key={v} aria-pressed={sc.soggetto === v} onClick={() => imposta({ soggetto: v })}>{nome}</button>
            ))}
          </div>
        </div>
      )}
      {s.tags.includes('foto') && (
        <label class="check" style={{ minHeight: 'var(--hit)' }}>
          <input type="checkbox" checked={sc.luciArtificiali} onChange={(e) => imposta({ luciArtificiali: (e.target as HTMLInputElement).checked })} />
          <span class="body">Luci artificiali{evento.scelte?.luciArtificiali === undefined && suggerito ? ' (suggerito dalla foto di prova)' : ''}</span>
        </label>
      )}
    </div>
  );
}

