import { useStato } from '../lib/useStato';
import { href } from '../router';

/** Barra in alto: evento corrente (tocca per cambiarlo). */
export function EventoBar() {
  const { evento } = useStato();
  return (
    <a class="eventobar" href={href('/eventi')} aria-label={`Evento corrente: ${evento.nome}. Cambia evento`}>
      <span class="small dim">Evento</span> <b>{evento.nome}</b> <span class="small">Cambia ›</span>
    </a>
  );
}
