import { situazioni } from '../lib/data';
import { href } from '../router';
import type { Situazione } from '../types';

const Tile = ({ s }: { s: Situazione }) => (
  <a class="tile" href={href(`/situazione/${s.id}`)}>
    {s.nome}
    <span class="small dim">{s.base === 'M1' ? 'Base M1' : 'Base M2'} · {s.supporto}</span>
  </a>
);

/** Lettura luce (risultati reali dalla fase 3) e scelta della situazione. */
export function Luce() {
  return (
    <div class="page stack">
      <h1>Lettura luce</h1>
      <div class="card">
        <div class="grid">
          {['Livello EV', 'Temperatura colore', 'Dominante', 'Luce mista'].map((l) => (
            <div key={l}><div class="small dim">{l}</div><div class="value" style={{ fontSize: '1.3rem', fontWeight: 700 }}>—</div></div>
          ))}
        </div>
        <p class="small dim" style={{ marginTop: 12, marginBottom: 0 }}>Nessuna foto di prova analizzata (fase 3).</p>
      </div>

      <h2>Video</h2>
      <div class="grid">{situazioni.filter((s) => s.tipo === 'video').map((s) => <Tile s={s} key={s.id} />)}</div>

      <h2>Foto</h2>
      <p class="small dim">La foto di prova è facoltativa.</p>
      <div class="grid">{situazioni.filter((s) => s.tipo === 'foto').map((s) => <Tile s={s} key={s.id} />)}</div>
    </div>
  );
}
