import { describe, expect, it } from 'vitest';
import { FISSE, descriviEv, ev100Impostazioni, evScena, RIFLESSIONE_MEDIA } from '../src/lib/ev';

describe('calcolo EV', () => {
  it('ISO 100, 1 s, F1 → EV 0', () => expect(ev100Impostazioni(1, 1, 100)).toBeCloseTo(0));
  it('regola del “sunny 16”: ISO 100, 1/100, F16 → EV ≈ 14,6', () => expect(ev100Impostazioni(16, 1 / 100, 100)).toBeCloseTo(14.64, 1));
  it('impostazioni fisse della foto di prova → EV100 ≈ 6,64', () => {
    expect(ev100Impostazioni(FISSE.diaframma, FISSE.tempo, FISSE.iso)).toBeCloseTo(6.64, 2);
  });
  it('raddoppiare ISO abbassa l’EV di uno stop', () => {
    expect(ev100Impostazioni(4, 1 / 50, 1600)).toBeCloseTo(ev100Impostazioni(4, 1 / 50, 800) - 1);
  });
  it('immagine a grigio medio → EV della scena = EV delle impostazioni', () => {
    expect(evScena(6.64, RIFLESSIONE_MEDIA)).toBeCloseTo(6.64);
  });
  it('immagine due stop più scura → scena due stop più scura', () => {
    expect(evScena(6.64, RIFLESSIONE_MEDIA / 4)).toBeCloseTo(4.64);
  });
  it('descrive i livelli', () => {
    expect(descriviEv(3)).toBe('Molto scura');
    expect(descriviEv(6)).toBe('Interno poco illuminato');
    expect(descriviEv(14)).toBe('Pieno sole');
  });
});
