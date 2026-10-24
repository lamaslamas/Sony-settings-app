import { guida, situazioneById } from '../lib/data';
import { useStato } from '../lib/useStato';
import { href } from '../router';
import { Callout } from '../components/Callout';

/** Home: impostazioni fisse per lo scatto di prova. L'analisi arriva nella fase 3. */
export function Home() {
  const { titolo, voci } = guida.fotoDiProva;
  const { evento } = useStato();
  const ultima = situazioneById(evento.ultimaSituazione ?? '');
  const fatte = ultima ? Object.keys(evento.spunte).filter((k) => k.startsWith(`sit/${ultima.id}/`)).length : 0;
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
        <button class="btn primary block" disabled aria-disabled="true">Carica foto dalla fotocamera</button>
        <button class="btn block" disabled aria-disabled="true">Scatta col telefono</button>
        <Callout>Il caricamento e l'analisi della foto arrivano nella fase 3.</Callout>
        <a class="btn block" href={href('/luce')}>Solo foto? Salta la foto di prova</a>
      </div>
    </div>
  );
}
