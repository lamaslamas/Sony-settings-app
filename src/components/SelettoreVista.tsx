import { useStato } from '../lib/useStato';
import { impostaVista, vistaCorrente } from '../lib/storage';

/** Interruttore Wizard / Lista: la scelta si ricorda e vale per situazioni e basi. */
export function SelettoreVista() {
  const { stato, aggiorna } = useStato();
  const v = vistaCorrente(stato);
  return (
    <div class="seg" role="group" aria-label="Come vuoi vedere le impostazioni">
      <button aria-pressed={v === 'wizard'} onClick={() => aggiorna((s) => impostaVista(s, 'wizard'))}>Wizard</button>
      <button aria-pressed={v === 'lista'} onClick={() => aggiorna((s) => impostaVista(s, 'lista'))}>Lista</button>
    </div>
  );
}
