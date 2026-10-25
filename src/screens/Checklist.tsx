import { useEffect, useState } from 'preact/hooks';
import type { Diff } from '../types';
import { situazioneById, situazioniFile, obiettivi, findMenuItem, tabById, baseVideo, baseFoto } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento, azzeraSpunte, impostaSpunta, impostaValore } from '../lib/storage';
import { href } from '../router';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';
import { CheckRow } from '../components/CheckRow';

/** Una riga della checklist: scheda in cima (solo voci di menu), poi voce e valore, poi percorso. */
function DiffRow({ sid, d }: { sid: string; d: Diff }) {
  const { evento, aggiorna } = useStato();
  const chiave = `sit/${sid}/${d.id}`;
  const modificato = evento.valori[chiave];
  const valore = modificato ?? d.value;
  const [edit, setEdit] = useState(false);
  const [bozza, setBozza] = useState(valore);

  const tab = d.ref ? tabById(d.ref.tab) : undefined;
  const name =
    d.source === 'menu' && d.ref ? (d.ref.sub ? `${d.ref.item} › ${d.ref.sub}` : d.ref.item)
    : d.source === 'lens' ? `Obiettivo · ${obiettivi.controlli[d.control ?? ''] ?? d.control}`
    : d.label;
  const known = d.source !== 'menu' || (d.ref && !!findMenuItem(d.ref));

  return (
    <div>
      <CheckRow checked={!!evento.spunte[chiave]} onChange={(v) => aggiorna((s) => impostaSpunta(s, chiave, v))}>
        {tab && <div><TabBadge tab={tab} /></div>}
        <div>
          <span class="name">{name}</span> → <span class="value">{valore}</span>{' '}
          {modificato !== undefined && <span class="badge">modificato</span>}{' '}
          {d.dynamic && d.example && <span class="small dim">(es. {d.example}, dalla foto di prova)</span>}{' '}
          {(d.verify || !known) && <VerifyBadge />}
        </div>
        {d.alternatives && <div class="small dim">Alternative: {d.alternatives.join(' · ')}</div>}
        {d.note && <div class="small dim">{d.note}</div>}
        {d.source === 'menu' && d.ref && <MenuPath r={d.ref} />}
      </CheckRow>
      <div class="entry" style={{ paddingTop: 0, borderTop: 0 }}>
        {edit ? (
          <div class="valueedit">
            <input aria-label={`Valore di ${name}`} value={bozza} onInput={(e) => setBozza((e.target as HTMLInputElement).value)} />
            <button class="btn small primary" onClick={() => { aggiorna((s) => impostaValore(s, chiave, bozza === d.value ? undefined : bozza)); setEdit(false); }}>Ok</button>
          </div>
        ) : (
          <div class="row">
            <button class="btn small" onClick={() => { setBozza(valore); setEdit(true); }}>Modifica valore</button>
            {modificato !== undefined && <button class="btn small" onClick={() => aggiorna((s) => impostaValore(s, chiave, undefined))}>Ripristina</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export function Checklist({ id }: { id: string }) {
  const { evento, aggiorna } = useStato();
  const s = situazioneById(id);

  // Ricorda l'ultima situazione aperta, per “riprendi dove ero”.
  useEffect(() => {
    if (s) aggiorna((st) => aggiornaEvento(st, (e) => (e.ultimaSituazione === s.id ? e : { ...e, ultimaSituazione: s.id })));
  }, [s?.id]);

  if (!s) return <div class="page"><h1>Situazione non trovata</h1><a href={href('/luce')}>Torna alle situazioni</a></div>;

  const base = s.base === 'M1' ? baseVideo : baseFoto;
  const lens = obiettivi.obiettivi.find((o) => o.id === evento.obiettivoId);
  // Solo i controlli dell'obiettivo montato; senza scelta si vedono tutti.
  const visible = s.diff.filter((d) => d.source !== 'lens' || !lens || lens.controlli.some((c) => c.id === d.control));
  const salva = situazioniFile.salvataggioEvento[s.tipo];
  const zebre = situazioniFile.metodoZebre;
  const modo = evento.modalitaZebre ?? s.zebre?.modalitaDefault ?? 'isoAuto';

  const prefisso = `sit/${s.id}/`;
  const chiavi = [...visible.map((d) => `${prefisso}${d.id}`), ...salva.passi.map((_, i) => `${prefisso}salva/${i}`)];
  const totale = chiavi.length;
  const fatte = chiavi.filter((k) => evento.spunte[k]).length;

  return (
    <div class="page stack">
      <a href={href('/luce')}>← Situazioni</a>
      <h1>{s.nome}</h1>
      <p class="dim">Differenze rispetto alla <a href={href(s.base === 'M1' ? '/basi/video' : '/basi/foto')}>{base.titolo}</a> · {s.supporto}</p>
      <div class="row">
        <span class="progress" aria-live="polite">{fatte} di {totale} fatte</span>
        <button class="btn small" onClick={() => aggiorna((st) => azzeraSpunte(st, prefisso))}>Azzera spunte</button>
      </div>

      {s.avvisi.map((a) => <Callout key={a} title="Attenzione" strong>{a}</Callout>)}

      <div class="card stack">
        <label class="small dim" for="lens">Obiettivo montato</label>
        <select id="lens" value={evento.obiettivoId ?? ''} onChange={(e) => {
          const v = (e.target as HTMLSelectElement).value || null;
          aggiorna((st) => aggiornaEvento(st, (ev) => ({ ...ev, obiettivoId: v })));
        }}>
          <option value="">Tutti (nessuno scelto)</option>
          {obiettivi.obiettivi.map((o) => <option value={o.id} key={o.id}>{o.nome}</option>)}
        </select>
      </div>

      <div class="card" style={{ padding: 0 }}>{visible.map((d) => <DiffRow sid={s.id} d={d} key={d.id} />)}</div>

      {s.note.map((n) => <Callout key={n}>{n}</Callout>)}

      <div class="card stack">
        <h2 style={{ marginTop: 0 }}>Esposizione</h2>
        <Callout title="Ghiera di compensazione">{s.compensazione.nota}</Callout>
        {s.zebre ? (
          <>
            <p>Zebra Level <b class="value">{s.zebre.livello}</b>{s.zebre.alternative.length > 0 && <> · alternativa <b>{s.zebre.alternative.join(', ')}</b></>} {s.zebre.verify && <VerifyBadge />}</p>
            {s.zebre.nota && <p class="small dim">{s.zebre.nota}</p>}
            {s.tipo === 'video' && <ul>{zebre.comeLeggereZebraVideo.map((t) => <li key={t}>{t}</li>)}</ul>}
            {s.zebre.metodo && (
              <>
                <h3>{zebre.titolo}</h3>
                <p class="dim">{zebre.quando}</p>
                <div class="seg" role="group" aria-label="Modalità zebre">
                  {(['isoAuto', 'isoFisso'] as const).map((m) => (
                    <button aria-pressed={modo === m} onClick={() => aggiorna((st) => aggiornaEvento(st, (ev) => ({ ...ev, modalitaZebre: m })))}>{zebre.modalita[m].nome}</button>
                  ))}
                </div>
                <p class="dim">{zebre.modalita[modo].consigliata}</p>
                <p>{zebre.modalita[modo].intro}</p>
                <ol>{zebre.modalita[modo].passi.map((p) => <li key={p}>{p}</li>)}</ol>
                <Callout>{zebre.modalita[modo].nota}</Callout>
              </>
            )}
          </>
        ) : (
          <p class="dim">Zebre non previste per questa situazione (le alte luci non sono critiche).</p>
        )}
      </div>

      <div class="card accent" style={{ padding: 0 }}>
        <div class="entry"><h2 style={{ margin: 0 }}>{salva.titolo}</h2></div>
        {salva.passi.map((p, i) => {
          const chiave = `${prefisso}salva/${i}`;
          return (
            <CheckRow key={p.testo} checked={!!evento.spunte[chiave]} onChange={(v) => aggiorna((st) => impostaSpunta(st, chiave, v))}>
              <div><span class="name">{p.testo}</span> → <span class="value">{p.valore}</span> {p.verify && <VerifyBadge />}</div>
              <MenuPath r={p.menu} />
              {p.note && <div class="small dim">{p.note}</div>}
            </CheckRow>
          );
        })}
      </div>
    </div>
  );
}
