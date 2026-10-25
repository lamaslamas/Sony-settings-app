import { useRef, useState } from 'preact/hooks';
import { guida, situazioneById } from '../lib/data';
import { useStato } from '../lib/useStato';
import { aggiornaEvento } from '../lib/storage';
import { analizzaFile } from '../lib/foto';
import { href } from '../router';
import { Callout } from '../components/Callout';

/** Home: impostazioni fisse per lo scatto di prova, caricamento e analisi (tutto in locale). */
export function Home() {
  const { titolo, voci } = guida.fotoDiProva;
  const { evento, aggiorna } = useStato();
  const ultima = situazioneById(evento.ultimaSituazione ?? '');
  const fatte = ultima ? Object.keys(evento.spunte).filter((k) => k.startsWith(`sit/${ultima.id}/`)).length : 0;
  const [stato, setStato] = useState<'fermo' | 'lavoro' | 'errore'>('fermo');
  const [errore, setErrore] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);

  async function scegli(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setStato('lavoro');
    try {
      const lettura = await analizzaFile(file);
      aggiorna((s) => aggiornaEvento(s, (ev) => ({ ...ev, lettura })));
      setStato('fermo');
      location.hash = '/luce';
    } catch (err) {
      setErrore(err instanceof Error ? err.message : 'Errore nella lettura della foto.');
      setStato('errore');
    }
  }

  return (
    <div class="page stack">
      {ultima && (
        <a class="btn primary block" href={href(`/situazione/${ultima.id}`)}>
          Riprendi: {ultima.nome} ({fatte} fatte)
        </a>
      )}
      <h1>Foto di prova</h1>
      <div class="card">
        <h2 style={{ marginTop: 0 }}>{titolo}</h2>
        {voci.map((v) => (
          <div class="entry" key={v.label}>
            <span class="name">{v.label}</span> → <span class="value">{v.value}</span>
          </div>
        ))}
      </div>

      <div class="stack">
        <input ref={cameraRef} type="file" hidden accept="image/*,.arw,.ARW" onChange={scegli} />
        <input ref={telefonoRef} type="file" hidden accept="image/*" capture="environment" onChange={scegli} />
        <button class="btn primary block" disabled={stato === 'lavoro'} onClick={() => cameraRef.current?.click()}>Carica foto dalla fotocamera</button>
        <button class="btn block" disabled={stato === 'lavoro'} onClick={() => telefonoRef.current?.click()}>Scatta col telefono</button>
        {stato === 'lavoro' && <Callout>Analisi in corso… Il file resta nel telefono.</Callout>}
        {stato === 'errore' && <Callout title="Non riesco a leggere la foto" strong>{errore}</Callout>}
        <p class="small dim">JPEG, HEIF o RAW Sony (ARW). Tutto avviene sul telefono, anche senza rete. Il RAW non viene mai caricato: ne leggo solo l'anteprima.</p>
        <a class="btn block" href={href('/luce')}>Solo foto? Salta la foto di prova</a>
      </div>
    </div>
  );
}
