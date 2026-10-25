import { useState } from 'preact/hooks';
import { useStato } from '../lib/useStato';
import { aggiungiEvento, eliminaEvento, rinominaEvento, selezionaEvento, contaSpunte } from '../lib/storage';
import { href } from '../router';

/** Elenco eventi: crea, scegli, rinomina, elimina. Ogni evento ha le sue spunte e i suoi valori. */
export function Eventi() {
  const { stato, aggiorna } = useStato();
  const [nuovo, setNuovo] = useState('');
  const [modifica, setModifica] = useState<{ id: string; nome: string } | null>(null);
  const [conferma, setConferma] = useState<string | null>(null);
  const eventi = Object.values(stato.eventi).sort((a, b) => b.creatoIl - a.creatoIl);

  return (
    <div class="page stack">
      <h1>Eventi</h1>
      <p class="dim">Le spunte, l'obiettivo e i valori modificati si salvano per evento, in questo telefono.</p>

      <div class="card stack">
        <label class="small dim" for="nuovo">Nuovo evento</label>
        <div class="valueedit">
          <input id="nuovo" placeholder="Nome (facoltativo)" value={nuovo} onInput={(e) => setNuovo((e.target as HTMLInputElement).value)} />
          <button class="btn primary" onClick={() => { aggiorna((s) => aggiungiEvento(s, nuovo)); setNuovo(''); }}>Crea</button>
        </div>
      </div>

      {eventi.map((e) => {
        const attivo = e.id === stato.eventoId;
        return (
          <div class={`card stack${attivo ? ' accent' : ''}`} key={e.id}>
            {modifica?.id === e.id ? (
              <div class="valueedit">
                <input aria-label="Nome evento" value={modifica.nome} onInput={(ev) => setModifica({ id: e.id, nome: (ev.target as HTMLInputElement).value })} />
                <button class="btn primary" onClick={() => { aggiorna((s) => rinominaEvento(s, e.id, modifica.nome)); setModifica(null); }}>Salva</button>
              </div>
            ) : (
              <div><b>{e.nome}</b> {attivo && <span class="badge">in uso</span>}
                <div class="small dim">{new Date(e.creatoIl).toLocaleDateString('it-IT')} · {contaSpunte(e, '')} voci spuntate</div></div>
            )}
            <div class="row">
              {!attivo && <button class="btn small primary" onClick={() => aggiorna((s) => selezionaEvento(s, e.id))}>Usa</button>}
              {attivo && <a class="btn small primary" href={href('/luce')}>Continua</a>}
              <button class="btn small" onClick={() => setModifica({ id: e.id, nome: e.nome })}>Rinomina</button>
              {conferma === e.id
                ? <button class="btn small" onClick={() => { aggiorna((s) => eliminaEvento(s, e.id)); setConferma(null); }}>Conferma: elimina</button>
                : <button class="btn small" onClick={() => setConferma(e.id)}>Elimina</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
