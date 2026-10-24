import { useState } from 'preact/hooks';
import { guida } from '../lib/data';
import { VerifyBadge } from '../components/Badges';

/** Checklist veloce prima di registrare/scattare. La prima voce è sempre la ghiera di compensazione a 0. */
export function PreRipresa() {
  const [tipo, setTipo] = useState<'video' | 'foto'>('video');
  const [done, setDone] = useState<Record<string, boolean>>({}); // fase 2: salvataggio locale
  const items = [...guida.preRipresa.comune, ...guida.preRipresa[tipo]] as { id: string; testo: string; dettaglio?: string; verify?: boolean; verifyNota?: string }[];
  return (
    <div class="page stack">
      <h1>Pre-ripresa</h1>
      <div class="seg" role="group" aria-label="Tipo di ripresa">
        <button aria-pressed={tipo === 'video'} onClick={() => setTipo('video')}>Video</button>
        <button aria-pressed={tipo === 'foto'} onClick={() => setTipo('foto')}>Foto</button>
      </div>
      <div class="card" style={{ padding: 0 }}>
        {items.map((i) => (
          <label class="entry check" key={i.id}>
            <input type="checkbox" checked={!!done[i.id]} onChange={(e) => setDone({ ...done, [i.id]: (e.target as HTMLInputElement).checked })} />
            <div class="body stack">
              <div class="name">{i.testo} {i.verify && <VerifyBadge />}</div>
              {i.dettaglio && <div class="small dim">{i.dettaglio}</div>}
              {i.verifyNota && <div class="small dim">{i.verifyNota}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
