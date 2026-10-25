import { useEffect } from 'preact/hooks';
import type { Diff, Situazione } from '../types';
import { situazioneById, situazioniFile, obiettivi, tabById, baseVideo, baseFoto } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento, azzeraSpunte, impostaSpunta } from '../lib/storage';
import { proposteDi } from '../lib/useProposte';
import { ordinaDiff, vocePresente } from '../lib/wizard';
import type { PropostaDiff } from '../lib/proposte';
import { href } from '../router';
import { Correzioni, LetturaEScelte, ModificaValore, PassoEsposizione, nomeDiff } from '../components/SituazioneParti';
import { SelettoreVista } from '../components/SelettoreVista';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';
import { CheckRow } from '../components/CheckRow';
import { Icon } from '../components/Icon';

/** Una riga della lista: casella, scheda in cima, voce → valore, spiegazioni, percorso, modifica. */
function RigaDiff({ s, d, p, predefinito }: { s: Situazione; d: Diff; p: PropostaDiff; predefinito: string }) {
  const { evento, aggiorna } = useStato();
  const chiave = `sit/${s.id}/${d.id}`;
  const tab = d.ref ? tabById(d.ref.tab) : undefined;
  return (
    <div>
      <CheckRow checked={!!evento.spunte[chiave]} onChange={(v) => aggiorna((st) => impostaSpunta(st, chiave, v))}>
        {tab ? <div><TabBadge tab={tab} /></div> : (
          <div class="small dim row"><Icon name={d.source === 'lens' ? 'lens' : 'dial'} />{d.source === 'lens' ? 'Sull\'obiettivo' : 'Sul corpo macchina'}</div>
        )}
        <div>
          <span class="name">{nomeDiff(d)}</span> → <span class="value">{p.valore}</span>{' '}
          {p.origine === 'utente' && <span class="badge">modificato</span>}{' '}
          {p.origine === 'calcolato' && <span class="small dim">(calcolato)</span>}{' '}
          {(d.verify || !vocePresente(d)) && <VerifyBadge />}
        </div>
        {d.alternatives && <div class="small dim">Alternative: {d.alternatives.join(' · ')}</div>}
        {d.note && <div class="small dim">{d.note}</div>}
        {d.source === 'menu' && d.ref && <MenuPath r={d.ref} />}
      </CheckRow>
      <div class="entry stack" style={{ paddingTop: 0, borderTop: 0 }}>
        <Correzioni p={p} />
        <ModificaValore chiave={chiave} predefinito={predefinito} />
      </div>
    </div>
  );
}

/** Vista a lista di una situazione: tutte le differenze insieme, in ordine di menu, con caselle da spuntare. */
export function Lista({ id }: { id: string }) {
  const { evento, aggiorna } = useStato();
  const s = situazioneById(id);

  useEffect(() => {
    if (s) aggiorna((st) => aggiornaEvento(st, (e) => (e.ultimaSituazione === s.id ? e : { ...e, ultimaSituazione: s.id })));
  }, [s?.id]);

  if (!s) return <div class="page"><h1>Situazione non trovata</h1><a href={href('/luce')}>Torna alle situazioni</a></div>;

  const base = s.base === 'M1' ? baseVideo : baseFoto;
  const lens = obiettivi.obiettivi.find((o) => o.id === evento.obiettivoId);
  const visibili = ordinaDiff(s.diff.filter((d) => d.source !== 'lens' || !lens || lens.controlli.some((c) => c.id === d.control)));
  const salva = situazioniFile.salvataggioEvento[s.tipo];
  const proposte = proposteDi(s, evento);
  const senzaModifiche = proposteDi(s, { ...evento, valori: {} });
  const prefisso = `sit/${s.id}/`;
  const chiavi = [...visibili.map((d) => `${prefisso}${d.id}`), `${prefisso}esposizione`, ...salva.passi.map((_, i) => `${prefisso}salva/${i}`)];
  const fatte = chiavi.filter((k) => evento.spunte[k]).length;

  return (
    <div class="page stack">
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <a href={href('/luce')}>← Situazioni</a>
      </div>
      <SelettoreVista />
      <h1 style={{ marginBottom: 0 }}>{s.nome}</h1>
      <p class="dim" style={{ margin: 0 }}>Differenze rispetto alla <a href={href(s.base === 'M1' ? '/basi/video' : '/basi/foto')}>{base.titolo}</a> · {s.supporto}</p>
      <div class="row">
        <span class="progress" aria-live="polite">{fatte} di {chiavi.length} fatte</span>
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

      <LetturaEScelte s={s} />
      {proposte.note.map((nota) => <Callout key={nota} title="Dalla foto di prova">{nota}</Callout>)}

      <div class="card" style={{ padding: 0 }}>
        {visibili.map((d) => <RigaDiff key={d.id} s={s} d={d} p={proposte.perDiff[d.id]} predefinito={senzaModifiche.perDiff[d.id].valore} />)}
      </div>

      {s.note.map((nota) => <Callout key={nota}>{nota}</Callout>)}

      <div class="card" style={{ padding: 0 }}>
        <CheckRow checked={!!evento.spunte[`${prefisso}esposizione`]} onChange={(v) => aggiorna((st) => impostaSpunta(st, `${prefisso}esposizione`, v))}>
          <PassoEsposizione s={s} proposte={proposte} compatto />
        </CheckRow>
      </div>

      <div class="card accent" style={{ padding: 0 }}>
        <div class="entry"><h2 style={{ margin: 0 }}>{salva.titolo}</h2></div>
        {salva.passi.map((p, i) => {
          const chiave = `${prefisso}salva/${i}`;
          return (
            <CheckRow key={p.testo} checked={!!evento.spunte[chiave]} onChange={(v) => aggiorna((st) => impostaSpunta(st, chiave, v))}>
              <div><span class="name">{p.testo}</span> → <span class="value">{p.valore}</span></div>
              <MenuPath r={p.menu} />
              {p.note && <div class="small dim">{p.note}</div>}
            </CheckRow>
          );
        })}
      </div>
    </div>
  );
}
