import { useStato } from '../lib/useStato';
import { vistaCorrente } from '../lib/storage';
import { Wizard } from './Wizard';
import { Lista } from './Lista';

/** Una situazione, nella vista scelta: un passo per volta (wizard) o tutta la lista. */
export function Situazione({ id }: { id: string }) {
  const { stato } = useStato();
  return vistaCorrente(stato) === 'wizard' ? <Wizard id={id} /> : <Lista id={id} />;
}
