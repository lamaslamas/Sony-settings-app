import { useEffect, useState } from 'preact/hooks';
import type { Diff, Situazione } from '../types';
import { situazioneById, situazioniFile, obiettivi, tabById, baseVideo, baseFoto } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento, azzeraSpunte, impostaPasso, impostaSpunta, impostaValore } from '../lib/storage';
import { chiavePasso, costruisciPassi, vocePresente, type Passo } from '../lib/wizard';
import { proposteDi, scelteDi, suggerisciLuciArtificiali } from '../lib/useProposte';
import type { PropostaDiff, Proposte } from '../lib/proposte';
import { href } from '../router';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';
import { CameraMenu } from '../components/CameraMenu';
import { Icon } from '../components/Icon';

const nomeDiff = (d: Diff): string =>
  d.source === 'menu' && d.ref ? (d.ref.sub ? `${d.ref.item} › ${d.ref.sub}` : d.ref.item)
  : d.source === 'lens' ? (obiettivi.controlli[d.control ?? ''] ?? d.control ?? '')
  : d.label ?? '';

/** Modifica del valore proposto (resta sempre modificabile). */
function ModificaValore({ chiave, predefinito }: { chiave: string; predefinito: string }) {
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
function mostra(campo: string, v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (campo === 'shutterDenominator') return `1/${v}`;
  if (campo === 'apertureF') return typeof v === 'number' ? `F${v}` : String(v);
  if (campo === 'isoAuto') return v ? 'ISO AUTO' : 'ISO fisso';
  return String(v);
}

/** Spiega cosa ha fatto una regola: corretto, scartato o violato dal valore scelto a mano. */
function Correzioni({ p }: { p: PropostaDiff }) {
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

function PassoDiff({ sid, d, p, predefinito }: { sid: string; d: Diff; p: PropostaDiff; predefinito: string }) {
  const { evento } = useStato();
  const chiave = `sit/${sid}/${d.id}`;
  const valore = p.valore;
  const tab = d.ref ? tabById(d.ref.tab) : undefined;
  const lens = obiettivi.obiettivi.find((o) => o.id === evento.obiettivoId);
  return (
    <div class="stack">
      {tab ? <div><TabBadge tab={tab} /></div> : (
        <div class="small dim row"><Icon name={d.source === 'lens' ? 'lens' : 'dial'} />{d.source === 'lens' ? `Sull'obiettivo${lens ? ` · ${lens.nome}` : ''}` : 'Sul corpo macchina'}</div>
      )}
      <h1 style={{ marginBottom: 0 }}>{nomeDiff(d)}</h1>
      <div class="valore-grande">{valore}{evento.valori[chiave] !== undefined && <span class="badge" style={{ marginLeft: 10 }}>modificato</span>}</div>
      {p.origine === 'calcolato' && <div class="small dim">Calcolato dalla foto di prova. Puoi cambiarlo.</div>}
      {p.origine === 'fisso' && d.dynamic && <div class="small dim">Fai la foto di prova per un valore calcolato{d.example ? ` (esempio: ${d.example})` : ''}.</div>}
      <Correzioni p={p} />
      {(d.verify || !vocePresente(d)) && <div><VerifyBadge /></div>}

      {d.source === 'menu' && d.ref && <CameraMenu r={d.ref} valore={valore} />}
      {d.source !== 'menu' && (
        <div class="card dialcard"><Icon name={d.source === 'lens' ? 'lens' : 'dial'} /><div><div class="small dim">{d.source === 'lens' ? 'Controllo dell\'obiettivo' : 'Comando'}</div><b>{nomeDiff(d)}</b> → <span class="value">{valore}</span></div></div>
      )}

      {d.alternatives && <div class="small dim">Alternative: {d.alternatives.join(' · ')}</div>}
      {d.note && <Callout>{d.note}</Callout>}
      {d.source === 'menu' && d.ref && <MenuPath r={d.ref} />}
      <ModificaValore chiave={chiave} predefinito={predefinito} />
    </div>
  );
}

function PassoEsposizione({ s, proposte }: { s: Situazione; proposte: Proposte }) {
  const { evento, aggiorna } = useStato();
  const zebre = situazioniFile.metodoZebre;
  const modo = evento.modalitaZebre ?? s.zebre?.modalitaDefault ?? 'isoAuto';
  return (
    <div class="stack">
      <h1 style={{ marginBottom: 0 }}>Esposizione</h1>
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
function LetturaEScelte({ s }: { s: Situazione }) {
  const { evento, aggiorna } = useStato();
  const l = evento.lettura;
  const sc = scelteDi(evento);
  const imposta = (parte: NonNullable<typeof evento.scelte>) => aggiorna((st) => aggiornaEvento(st, (e) => ({ ...e, scelte: { ...e.scelte, ...parte } })));
  const suggerito = suggerisciLuciArtificiali(evento);
  return (
    <div class="card stack">
      <h2 style={{ margin: 0 }}>3. Luce e scelte</h2>
      {!l && <p style={{ margin: 0 }} class="dim">Nessuna foto di prova: valori fissi della situazione. <a href={href('/')}>Fai la foto di prova</a>{s.tipo === 'foto' ? ' (facoltativa per le foto)' : ''}.</p>}
      {l && !l.valida && <Callout title="Foto di prova da rifare" strong>{l.problemi.join(' ')} <a href={href('/')}>Rifai la foto</a></Callout>}
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

function titoloPasso(p: Passo, s: Situazione): string {
  switch (p.tipo) {
    case 'intro': return 'Inizio';
    case 'diff': return nomeDiff(p.diff);
    case 'esposizione': return 'Esposizione';
    case 'salva': return `Salva per l'evento`;
    case 'fine': return 'Fine';
  }
  return s.nome;
}

export function Wizard({ id }: { id: string }) {
  const { evento, aggiorna } = useStato();
  const s = situazioneById(id);
  const [elenco, setElenco] = useState(false);

  useEffect(() => {
    if (s) aggiorna((st) => aggiornaEvento(st, (e) => (e.ultimaSituazione === s.id ? e : { ...e, ultimaSituazione: s.id })));
  }, [s?.id]);

  if (!s) return <div class="page"><h1>Situazione non trovata</h1><a href={href('/luce')}>Torna alle situazioni</a></div>;

  const base = s.base === 'M1' ? baseVideo : baseFoto;
  const lens = obiettivi.obiettivi.find((o) => o.id === evento.obiettivoId);
  // Solo i controlli dell'obiettivo montato; senza scelta si vedono tutti.
  const visibili = s.diff.filter((d) => d.source !== 'lens' || !lens || lens.controlli.some((c) => c.id === d.control));
  const salva = situazioniFile.salvataggioEvento[s.tipo];
  const proposte = proposteDi(s, evento);
  const senzaModifiche = proposteDi(s, { ...evento, valori: {} }); // proposta calcolata, per “Ripristina”
  const passi = costruisciPassi(s, visibili, salva.passi.length);
  const n = passi.length;
  const idx = Math.min(evento.passi?.[s.id] ?? 0, n - 1);
  const passo = passi[idx];
  const prefisso = `sit/${s.id}/`;
  const vai = (i: number) => aggiorna((st) => impostaPasso(st, s.id, Math.min(n - 1, Math.max(0, i))));
  const chiave = chiavePasso(s.id, passo);
  const fatto = chiave ? !!evento.spunte[chiave] : false;
  const avanti = (spunta: boolean) => {
    if (chiave && spunta) aggiorna((st) => impostaSpunta(st, chiave, true));
    vai(idx + 1);
  };
  const operativi = passi.filter((p) => chiavePasso(s.id, p));
  const nFatti = operativi.filter((p) => evento.spunte[chiavePasso(s.id, p)!]).length;

  return (
    <div class="page stack wizard">
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <a href={href('/luce')}>← Situazioni</a>
        <button class="btn small" onClick={() => setElenco(!elenco)} aria-expanded={elenco}>{elenco ? 'Chiudi elenco' : 'Tutti i passi'}</button>
      </div>
      <div>
        <div class="small dim">{s.nome} · {base.titolo} · {s.supporto}</div>
        <div class="progress" aria-live="polite">Passo {idx + 1} di {n} · {nFatti} fatti</div>
        <div class="bar" role="progressbar" aria-valuemin={1} aria-valuemax={n} aria-valuenow={idx + 1}><div style={{ width: `${((idx + 1) / n) * 100}%` }} /></div>
      </div>

      {elenco && (
        <div class="card" style={{ padding: 0 }}>
          {passi.map((p, i) => {
            const k = chiavePasso(s.id, p);
            const stato = k ? (evento.spunte[k] ? '✓' : i < idx ? '–' : '○') : '○';
            return (
              <button key={i} class={`cam-riga${i === idx ? ' sel' : ''}`} onClick={() => { vai(i); setElenco(false); }}>
                <span class="cam-nome">{i + 1}. {titoloPasso(p, s)}</span><span class="cam-valore">{stato}</span>
              </button>
            );
          })}
        </div>
      )}

      {passo.tipo === 'intro' && (
        <div class="stack">
          <h1 style={{ marginBottom: 0 }}>{s.nome}</h1>
          {s.avvisi.map((a) => <Callout key={a} title="Attenzione" strong>{a}</Callout>)}
          <div class="card stack">
            <h2 style={{ margin: 0 }}>1. Richiama la {base.titolo}</h2>
            <p style={{ margin: 0 }}>Still/Movie/S&amp;Q su <b>{base.dials.stillMovieSq}</b>, ghiera dei modi su 1/2/3, poi:</p>
            <CameraMenu r={{ tab: 'shooting', group: 'Shooting Mode', item: 'Recall Camera Setting' }} valore={base.id} />
            <Callout title="Slot della scheda" strong>Se M1/M2 non compaiono, controlla Memory/Recall Media (Slot 1 / Slot 2).</Callout>
          </div>
          <div class="card stack">
            <label for="lens"><b>2. Obiettivo montato</b></label>
            <select id="lens" value={evento.obiettivoId ?? ''} onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value || null;
              aggiorna((st) => aggiornaEvento(st, (ev) => ({ ...ev, obiettivoId: v })));
            }}>
              <option value="">Tutti (nessuno scelto)</option>
              {obiettivi.obiettivi.map((o) => <option value={o.id} key={o.id}>{o.nome}</option>)}
            </select>
          </div>
          <LetturaEScelte s={s} />
          {proposte.note.map((nota) => <Callout key={nota} title="Dalla foto di prova">{nota}</Callout>)}
          {s.note.map((nota) => <Callout key={nota}>{nota}</Callout>)}
          <p class="dim">{operativi.length} passi da fare, in ordine di menu.</p>
        </div>
      )}

      {passo.tipo === 'diff' && <PassoDiff sid={s.id} d={passo.diff} p={proposte.perDiff[passo.diff.id]} predefinito={senzaModifiche.perDiff[passo.diff.id].valore} />}
      {passo.tipo === 'esposizione' && <PassoEsposizione s={s} proposte={proposte} />}

      {passo.tipo === 'salva' && (() => {
        const p = salva.passi[passo.indice];
        return (
          <div class="stack">
            <h1 style={{ marginBottom: 0 }}>{salva.titolo}</h1>
            <div class="valore-grande">{p.valore}</div>
            <CameraMenu r={p.menu} valore={p.valore} />
            <Callout title={p.testo}>{p.note}</Callout>
            <MenuPath r={p.menu} />
          </div>
        );
      })()}

      {passo.tipo === 'fine' && (
        <div class="stack">
          <h1>Fatto</h1>
          <p>{nFatti} passi su {operativi.length} completati per <b>{s.nome}</b>.</p>
          {nFatti < operativi.length && <Callout>Alcuni passi sono saltati: apri “Tutti i passi” per tornarci.</Callout>}
          <a class="btn primary block" href={href('/pre-ripresa')}>Vai alla pre-ripresa</a>
          <a class="btn block" href={href('/luce')}>Altra situazione</a>
          <button class="btn block" onClick={() => { aggiorna((st) => impostaPasso(azzeraSpunte(st, prefisso), s.id, 0)); }}>Ricomincia questa situazione</button>
        </div>
      )}

      <div class="wizbar">
        <button class="btn" disabled={idx === 0} onClick={() => vai(idx - 1)} aria-label="Passo precedente"><Icon name="back" />Indietro</button>
        {passo.tipo === 'fine' ? null : passo.tipo === 'intro' ? (
          <button class="btn primary" onClick={() => avanti(false)}>Inizia<Icon name="next" /></button>
        ) : (
          <>
            {!fatto && <button class="btn" onClick={() => avanti(false)}>Salta</button>}
            <button class="btn primary" onClick={() => avanti(true)}>{fatto ? 'Avanti' : 'Fatto'}<Icon name="next" /></button>
          </>
        )}
      </div>
    </div>
  );
}
