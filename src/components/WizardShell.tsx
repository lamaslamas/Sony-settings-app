import { useEffect, useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Icon } from './Icon';

export interface VoceElenco { titolo: string; stato: string }

/**
 * Cornice comune dei wizard (situazioni e basi): barra di avanzamento, elenco dei passi per saltare,
 * pulsanti Indietro / Salta / Fatto sempre raggiungibili in basso.
 */
export function WizardShell(p: {
  intestazione: ComponentChildren;   // link “indietro”
  selettore: ComponentChildren;      // interruttore Wizard / Lista
  sottotitolo: string;
  idx: number;
  n: number;
  nFatti: number;
  elenco: VoceElenco[];
  onVai: (i: number) => void;
  /** intro = pulsante “Inizia”; fine = nessun pulsante avanti. */
  tipo: 'intro' | 'normale' | 'fine';
  fatto: boolean;
  onAvanti: (spunta: boolean) => void;
  children: ComponentChildren;
}) {
  const [aperto, setAperto] = useState(false);
  const barra = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barra.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--wizh', `${Math.ceil(el.getBoundingClientRect().height)}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div class="page stack wizard">
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <div>{p.intestazione}</div>
        <button class="btn small" onClick={() => setAperto(!aperto)} aria-expanded={aperto}>{aperto ? 'Chiudi elenco' : 'Tutti i passi'}</button>
      </div>
      {p.selettore}
      <div>
        <div class="small dim">{p.sottotitolo}</div>
        <div class="progress" aria-live="polite">Passo {p.idx + 1} di {p.n} · {p.nFatti} fatti</div>
        <div class="bar" role="progressbar" aria-valuemin={1} aria-valuemax={p.n} aria-valuenow={p.idx + 1}><div style={{ width: `${((p.idx + 1) / p.n) * 100}%` }} /></div>
      </div>

      {aperto && (
        <div class="card" style={{ padding: 0 }}>
          {p.elenco.map((v, i) => (
            <button key={i} class={`cam-riga${i === p.idx ? ' sel' : ''}`} onClick={() => { p.onVai(i); setAperto(false); }}>
              <span class="cam-nome">{i + 1}. {v.titolo}</span><span class="cam-valore">{v.stato}</span>
            </button>
          ))}
        </div>
      )}

      {p.children}

      <div class="wizbar" ref={barra}>
        <button class="btn" disabled={p.idx === 0} onClick={() => p.onVai(p.idx - 1)} aria-label="Passo precedente"><Icon name="back" />Indietro</button>
        {p.tipo === 'fine' ? null : p.tipo === 'intro' ? (
          <button class="btn primary" onClick={() => p.onAvanti(false)}>Inizia<Icon name="next" /></button>
        ) : (
          <>
            {!p.fatto && <button class="btn" onClick={() => p.onAvanti(false)}>Salta</button>}
            <button class="btn primary" onClick={() => p.onAvanti(true)}>{p.fatto ? 'Avanti' : 'Fatto'}<Icon name="next" /></button>
          </>
        )}
      </div>
    </div>
  );
}
