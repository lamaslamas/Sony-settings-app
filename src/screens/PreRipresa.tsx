import { useState } from 'preact/hooks';
import { guida, situazioni, situazioneById } from '../lib/data';
import { useStato } from '../lib/useStato';
import { azzeraSpunte, impostaSpunta } from '../lib/storage';
import { VerifyBadge } from '../components/Badges';
import { CheckRow } from '../components/CheckRow';

/** Checklist veloce prima di registrare/scattare. La prima voce è sempre la ghiera di compensazione a 0. */
export function PreRipresa() {
  const { evento, aggiorna } = useStato();
  const iniziale = situazioneById(evento.ultimaSituazione ?? '');
  const [sid, setSid] = useState<string>(iniziale?.id ?? '');
  const sit = situazioneById(sid);
  const [tipoScelto, setTipo] = useState<'video' | 'foto'>(iniziale?.tipo ?? 'video');
  const tipo = sit?.tipo ?? tipoScelto; // con una situazione scelta il tipo è quello della situazione

  const prefisso = `pre/${tipo}/`;
  const comune = guida.preRipresa.comune.map((c) => ({
    ...c,
    // La compensazione dipende dalla situazione: con ISO fisso (interviste) non ha effetto.
    dettaglio: sit ? sit.compensazione.nota : c.dettaglio,
  }));
  const specifiche = guida.preRipresa[tipo].map((v) => {
    if (!sit?.zebre || !v.id.endsWith('zebra')) return v;
    const alt = sit.zebre.alternative.length ? ` (alternativa ${sit.zebre.alternative.join(', ')})` : '';
    return { ...v, dettaglio: `Zebra Level ${sit.zebre.livello}${alt}. ${v.dettaglio ?? ''}` };
  });
  const items = [...comune, ...specifiche] as { id: string; testo: string; dettaglio?: string; verify?: boolean; verifyNota?: string }[];
  const fatte = items.filter((i) => evento.spunte[prefisso + i.id]).length;

  return (
    <div class="page stack">
      <h1>Pre-ripresa</h1>
      <div class="card stack">
        <label class="small dim" for="sit">Situazione</label>
        <select id="sit" value={sid} onChange={(e) => setSid((e.target as HTMLSelectElement).value)}>
          <option value="">Nessuna (solo controlli generali)</option>
          {situazioni.map((s) => <option value={s.id} key={s.id}>{s.nome}</option>)}
        </select>
        {!sit && (
          <div class="seg" role="group" aria-label="Tipo di ripresa">
            <button aria-pressed={tipo === 'video'} onClick={() => setTipo('video')}>Video</button>
            <button aria-pressed={tipo === 'foto'} onClick={() => setTipo('foto')}>Foto</button>
          </div>
        )}
      </div>
      <div class="row">
        <span class="progress" aria-live="polite">{fatte} di {items.length}</span>
        <button class="btn small" onClick={() => aggiorna((s) => azzeraSpunte(s, prefisso))}>Azzera per la prossima ripresa</button>
      </div>
      <div class="card" style={{ padding: 0 }}>
        {items.map((i) => (
          <CheckRow key={i.id} checked={!!evento.spunte[prefisso + i.id]} onChange={(v) => aggiorna((s) => impostaSpunta(s, prefisso + i.id, v))}>
            <div class="name">{i.testo} {i.verify && <VerifyBadge />}</div>
            {i.dettaglio && <div class="small dim">{i.dettaglio}</div>}
            {i.verifyNota && <div class="small dim">{i.verifyNota}</div>}
          </CheckRow>
        ))}
      </div>
    </div>
  );
}
