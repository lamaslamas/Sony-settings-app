import { describe, expect, it } from 'vitest';
import {
  STORAGE_KEY, aggiornaEvento, aggiungiEvento, azzeraSpunte, carica, contaSpunte, eliminaEvento, eventoCorrente,
  impostaSpunta, impostaValore, nuovoStato, rinominaEvento, salva, selezionaEvento,
} from '../src/lib/storage';

const finto = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('stato per evento', () => {
  it('parte con un evento', () => {
    const s = nuovoStato();
    expect(Object.keys(s.eventi)).toHaveLength(1);
    expect(eventoCorrente(s).nome).toBe('Evento 1');
  });

  it('le spunte sono separate per evento', () => {
    let s = impostaSpunta(nuovoStato(), 'sit/wildlife/iso', true);
    const primo = s.eventoId;
    s = aggiungiEvento(s, 'Convegno');
    expect(eventoCorrente(s).spunte).toEqual({});
    s = selezionaEvento(s, primo);
    expect(eventoCorrente(s).spunte['sit/wildlife/iso']).toBe(true);
  });

  it('toglie una spunta e azzera per prefisso', () => {
    let s = nuovoStato();
    s = impostaSpunta(s, 'pre/video/a', true);
    s = impostaSpunta(s, 'pre/video/b', true);
    s = impostaSpunta(s, 'sit/x/y', true);
    s = impostaSpunta(s, 'pre/video/a', false);
    expect(contaSpunte(eventoCorrente(s), 'pre/video/')).toBe(1);
    s = azzeraSpunte(s, 'pre/');
    expect(eventoCorrente(s).spunte).toEqual({ 'sit/x/y': true });
  });

  it('le spunte globali (passo A) valgono per tutti gli eventi', () => {
    let s = impostaSpunta(nuovoStato(), 'guida/A/0', true, true);
    s = aggiungiEvento(s);
    expect(s.globali.spunte['guida/A/0']).toBe(true);
  });

  it('salva obiettivo, modalità zebre e valori modificati', () => {
    let s = aggiornaEvento(nuovoStato(), (e) => ({ ...e, obiettivoId: 'sony-70-200', modalitaZebre: 'isoFisso' }));
    s = impostaValore(s, 'sit/wildlife/shutter', '1/2000');
    expect(eventoCorrente(s)).toMatchObject({ obiettivoId: 'sony-70-200', modalitaZebre: 'isoFisso', valori: { 'sit/wildlife/shutter': '1/2000' } });
    s = impostaValore(s, 'sit/wildlife/shutter', undefined);
    expect(eventoCorrente(s).valori).toEqual({});
  });

  it('rinomina ed elimina, lasciando sempre un evento', () => {
    let s = rinominaEvento(nuovoStato(), nuovoStato().eventoId, 'x');
    const id = Object.keys(s.eventi)[0];
    s = rinominaEvento(s, id, 'Gala');
    expect(s.eventi[id].nome).toBe('Gala');
    s = eliminaEvento(s, id);
    expect(Object.keys(s.eventi)).toHaveLength(1);
    expect(eventoCorrente(s).nome).toBe('Evento 1');
  });

  it('salva e ricarica; stato rovinato o assente → ripartenza pulita', () => {
    const st = finto();
    const s = impostaSpunta(nuovoStato(), 'k', true);
    salva(s, st);
    expect(carica(st)).toEqual(s);
    st.setItem(STORAGE_KEY, '{non json');
    expect(Object.keys(carica(st).eventi)).toHaveLength(1);
    expect(Object.keys(carica(undefined).eventi)).toHaveLength(1);
  });
});
