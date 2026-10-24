import { useState } from 'preact/hooks';
import type { Diff } from '../types';
import { situazioneById, situazioniFile, obiettivi, findMenuItem, tabById, baseVideo, baseFoto } from '../lib/data';
import { href } from '../router';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge, TbdBadge } from '../components/Badges';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';

/** Una riga della checklist: scheda in cima (solo voci di menu), poi voce e valore, poi percorso. */
function DiffRow({ d }: { d: Diff }) {
  const [done, setDone] = useState(false); // fase 2: salvataggio locale per evento
  const tab = d.ref ? tabById(d.ref.tab) : undefined;
  const name =
    d.source === 'menu' && d.ref ? (d.ref.sub ? `${d.ref.item} › ${d.ref.sub}` : d.ref.item)
    : d.source === 'lens' ? `Obiettivo · ${obiettivi.controlli[d.control ?? ''] ?? d.control}`
    : d.label;
  const known = d.source !== 'menu' || (d.ref && !!findMenuItem(d.ref));
  return (
    <label class="entry check">
      <input type="checkbox" checked={done} onChange={(e) => setDone((e.target as HTMLInputElement).checked)} />
      <div class="body stack">
        {tab && <div><TabBadge tab={tab} /></div>}
        <div>
          <span class="name">{name}</span> → <span class="value">{d.value}</span>{' '}
          {d.dynamic && d.example && <span class="small dim">(es. {d.example}, dalla foto di prova)</span>}{' '}
          {(d.verify || !known) && <VerifyBadge />} {d.tbd && <TbdBadge />}
        </div>
        {d.alternatives && <div class="small dim">Alternative: {d.alternatives.join(' · ')}</div>}
        {d.note && <div class="small dim">{d.note}</div>}
        {d.source === 'menu' && d.ref && <MenuPath r={d.ref} />}
      </div>
    </label>
  );
}

export function Checklist({ id }: { id: string }) {
  const s = situazioneById(id);
  const [lensId, setLensId] = useState<string>(''); // fase 2: salvato per evento (obiettivoId)
  const [modo, setModo] = useState<'isoAuto' | 'isoFisso'>(s?.zebre?.modalitaDefault ?? 'isoAuto');
  if (!s) return <div class="page"><h1>Situazione non trovata</h1><a href={href('/luce')}>Torna alle situazioni</a></div>;

  const base = s.base === 'M1' ? baseVideo : baseFoto;
  const lens = obiettivi.obiettivi.find((o) => o.id === lensId);
  // Solo i controlli dell'obiettivo montato; senza scelta si vedono tutti.
  const visible = s.diff.filter((d) => d.source !== 'lens' || !lens || lens.controlli.some((c) => c.id === d.control));
  const salva = situazioniFile.salvataggioEvento[s.tipo];
  const zebre = situazioniFile.metodoZebre;

  return (
    <div class="page stack">
      <a href={href('/luce')}>← Situazioni</a>
      <h1>{s.nome}</h1>
      <p class="dim">Differenze rispetto alla <a href={href(s.base === 'M1' ? '/basi/video' : '/basi/foto')}>{base.titolo}</a> · {s.supporto}</p>

      {s.avvisi.map((a) => <Callout key={a} title="Attenzione" strong>{a}</Callout>)}

      <div class="card stack">
        <label class="small dim" for="lens">Obiettivo montato</label>
        <select id="lens" value={lensId} onChange={(e) => setLensId((e.target as HTMLSelectElement).value)}>
          <option value="">Tutti (nessuno scelto)</option>
          {obiettivi.obiettivi.map((o) => <option value={o.id} key={o.id}>{o.nome}</option>)}
        </select>
      </div>

      <div class="card" style={{ padding: 0 }}>{visible.map((d) => <DiffRow d={d} key={d.id} />)}</div>

      {s.note.map((n) => <Callout key={n}>{n}</Callout>)}

      {s.zebre && (
        <div class="card stack">
          <h2 style={{ marginTop: 0 }}>Zebre</h2>
          <p>Zebra Level <b class="value">{s.zebre.livello}</b>{s.zebre.alternative.length > 0 && <> · alternativa <b>{s.zebre.alternative.join(', ')}</b></>} {s.zebre.verify && <VerifyBadge />}</p>
          {s.tipo === 'video' && (
            <ul>{zebre.comeLeggereZebraVideo.map((t) => <li key={t}>{t}</li>)}</ul>
          )}
          {s.zebre.metodo && (
            <>
              <h3>{zebre.titolo}</h3>
              <p class="dim">{zebre.quando}</p>
              <div class="seg" role="group" aria-label="Modalità zebre">
                {(['isoAuto', 'isoFisso'] as const).map((m) => (
                  <button aria-pressed={modo === m} onClick={() => setModo(m)}>{zebre.modalita[m].nome}</button>
                ))}
              </div>
              <p class="dim">{zebre.modalita[modo].consigliata}</p>
              <p>{zebre.modalita[modo].intro}</p>
              <ol>{zebre.modalita[modo].passi.map((p) => <li key={p}>{p}</li>)}</ol>
              <Callout>{zebre.modalita[modo].nota}</Callout>
            </>
          )}
        </div>
      )}

      <div class="card accent stack">
        <h2 style={{ marginTop: 0 }}>{salva.titolo}</h2>
        {salva.passi.map((p) => (
          <div class="stack" key={p.testo}>
            <div><span class="name">{p.testo}</span> → <span class="value">{p.valore}</span> {p.verify && <VerifyBadge />}</div>
            <MenuPath r={p.menu} />
            {p.note && <div class="small dim">{p.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
