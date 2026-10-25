import { useEffect } from 'preact/hooks';
import type { Diff, Situazione } from '../types';
import { situazioneById, situazioniFile, obiettivi, tabById, baseVideo, baseFoto } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento, azzeraSpunte, impostaPasso, impostaSpunta } from '../lib/storage';
import { Correzioni, LetturaEScelte, ModificaValore, PassoEsposizione, nomeDiff } from '../components/SituazioneParti';
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
import { WizardShell } from '../components/WizardShell';
import { SelettoreVista } from '../components/SelettoreVista';

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
    <WizardShell
      intestazione={<a href={href('/luce')}>← Situazioni</a>}
      selettore={<SelettoreVista />}
      sottotitolo={`${s.nome} · ${base.titolo} · ${s.supporto}`}
      idx={idx} n={n} nFatti={nFatti} onVai={vai}
      elenco={passi.map((p, i) => {
        const k = chiavePasso(s.id, p);
        return { titolo: titoloPasso(p, s), stato: k ? (evento.spunte[k] ? '✓' : i < idx ? '–' : '○') : '○' };
      })}
      tipo={passo.tipo === 'intro' ? 'intro' : passo.tipo === 'fine' ? 'fine' : 'normale'}
      fatto={fatto} onAvanti={avanti}
    >
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

    </WizardShell>
  );
}
