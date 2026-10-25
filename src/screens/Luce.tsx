import { situazioni } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento } from '../lib/storage';
import { Callout } from '../components/Callout';
import { href } from '../router';
import type { Situazione } from '../types';

const Tile = ({ s }: { s: Situazione }) => (
  <a class="tile" href={href(`/situazione/${s.id}`)}>
    {s.nome}
    <span class="small dim">{s.base === 'M1' ? 'Base M1' : 'Base M2'} · {s.supporto}</span>
  </a>
);

/** Lettura luce (dalla foto di prova) e scelta della situazione. */
export function Luce() {
  const { evento, aggiorna } = useStato();
  const l = evento.lettura;
  const cella = (label: string, valore: string, sotto?: string) => (
    <div key={label}>
      <div class="small dim">{label}</div>
      <div class="value" style={{ fontSize: '1.3rem', fontWeight: 700 }}>{valore}</div>
      {sotto && <div class="small dim">{sotto}</div>}
    </div>
  );
  return (
    <div class="page stack">
      <h1>Lettura luce</h1>
      {!l && (
        <div class="card">
          <p style={{ marginBottom: 0 }}>Nessuna foto di prova analizzata. Falla ora, oppure scegli subito la situazione.</p>
          <a class="btn block" style={{ marginTop: 12 }} href={href('/')}>Fai la foto di prova</a>
        </div>
      )}
      {l && !l.valida && (
        <Callout title="Rifai la foto di prova" strong>
          <ul>{l.problemi.map((p) => <li key={p}>{p}</li>)}</ul>
          <a class="btn block" href={href('/')}>Rifai la foto</a>
        </Callout>
      )}
      {l && l.valida && (
        <div class="card stack">
          <div class="grid">
            {cella('Livello EV', String(l.ev), l.evDescrizione ?? undefined)}
            {cella('Temperatura colore', l.temperaturaK ? `${l.temperaturaK} K` : '—', l.dominante ? `luce ${l.dominante}` : undefined)}
            {cella('Tinta', l.tinta ? (l.tinta.etichetta === 'neutra' ? 'Neutra' : l.tinta.etichetta === 'verdastra' ? 'Verdastra' : 'Magenta') : '—', l.tinta && l.tinta.etichetta !== 'neutra' ? 'possibile neon / LED' : undefined)}
            {cella('Luce mista', l.luceMista ? { no: 'No', incerta: 'Incerta', si: 'Sì' }[l.luceMista.livello] : '—', l.luceMista ? `scarto ${l.luceMista.scostoMired} mired tra le zone${l.luceMista.livello === 'incerta' ? ' (legno e superfici colorate possono falsarlo)' : ''}` : undefined)}
          </div>
          <div class="small dim">Calcolo su ISO {l.impostazioni.iso}, 1/{Math.round(1 / l.impostazioni.tempo)}, F{l.impostazioni.diaframma}{l.impostazioni.daExif ? ' (dall\'EXIF)' : ' (assunte)'}.</div>
          {l.affidabilitaColore === 'bassa' && <Callout title="Colore meno affidabile">Foto del telefono: il bilanciamento del bianco è automatico.</Callout>}
          {l.avvisi.map((a) => <Callout key={a}>{a}</Callout>)}
          <p class="small dim" style={{ margin: 0 }}>I valori sono una stima, non una misura. <button class="btn small" onClick={() => aggiorna((s) => aggiornaEvento(s, (e) => ({ ...e, lettura: null })))}>Cancella lettura</button></p>
        </div>
      )}

      <h2>Video</h2>
      <div class="grid">{situazioni.filter((s) => s.tipo === 'video').map((s) => <Tile s={s} key={s.id} />)}</div>

      <h2>Foto</h2>
      <p class="small dim">La foto di prova è facoltativa.</p>
      <div class="grid">{situazioni.filter((s) => s.tipo === 'foto').map((s) => <Tile s={s} key={s.id} />)}</div>
    </div>
  );
}
