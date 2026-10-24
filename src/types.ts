// Tipi dei dati JSON (src/data). Se cambi la forma di un JSON, aggiorna qui.

/** Voce del menu della fotocamera (nomi in inglese come sul display). */
export interface MenuItem {
  name: string;
  options?: string[];
  subItems?: MenuItem[];
  /** true = accetta anche altri valori (es. ISO numerici, Kelvin): options non è esaustivo. */
  open?: boolean;
  verify?: boolean;
  note?: string;
}
export interface MenuGroup { name: string; items: MenuItem[] }
export interface MenuTab {
  id: string;
  name: string;
  icon: string;
  /** Nome della variabile CSS in tokens.css che dà il colore della scheda. */
  colorToken: string;
  groups: MenuGroup[];
}
export interface MenuTree { firmware: string; source: string; note: string; tabs: MenuTab[] }

/** Riferimento a una voce del menu: scheda (id) › gruppo › voce [› sotto-voce]. */
export interface MenuRef { tab: string; group: string; item: string; sub?: string }

export interface BaseEntry extends MenuRef {
  value: string;
  verify?: boolean;
  note?: string;
}
export interface BaseFile {
  id: 'M1' | 'M2';
  titolo: string;
  descrizione: string;
  dials: { stillMovieSq: string; mode: string };
  salvataggio: { dove: string; menu: MenuRef; valore: string };
  entries: BaseEntry[];
  /** Voci di Setup: non vengono salvate nella memoria, si fanno una volta sola. */
  setup: BaseEntry[];
}

export type DiffSource = 'menu' | 'dial' | 'lens';
export interface Diff {
  id: string;
  source: DiffSource;
  ref?: MenuRef;        // source = menu
  label?: string;       // source = dial
  control?: string;     // source = lens (id in obiettivi.json)
  value: string;
  alternatives?: string[];
  /** Valore da proporre dalla foto di prova (fase 3). */
  dynamic?: 'iso' | 'aperture' | 'shutter' | 'wb';
  example?: string;
  note?: string;
  verify?: boolean;
  /** Valore non deciso nella specifica: proposta di partenza. */
  tbd?: boolean;
}

export interface Regola {
  id: string;
  tags: string[];
  campo?: string;
  op?: string;
  valore?: unknown;
  valori?: unknown[];
  quando?: Record<string, unknown>;
  imponi?: Record<string, unknown>;
  messaggio: string;
}

export interface Zebre {
  livello: string;
  alternative: string[];
  metodo: boolean;
  modalitaDefault?: 'isoAuto' | 'isoFisso';
  verify?: boolean;
  nota?: string;
}

export interface Situazione {
  id: string;
  nome: string;
  tipo: 'video' | 'foto';
  base: 'M1' | 'M2';
  tags: string[];
  supporto: string;
  diff: Diff[];
  note: string[];
  avvisi: string[];
  zebre: Zebre | null;
  /** Ghiera di compensazione: attiva solo con ISO AUTO. */
  compensazione: { attiva: boolean; nota: string };
}

export interface PassoSalvataggio {
  testo: string;
  menu: MenuRef;
  valore: string;
  verify?: boolean;
  note?: string;
}
export interface ModalitaZebre {
  nome: string; consigliata: string; intro: string; passi: string[]; nota: string;
}
export interface SituazioniFile {
  regole: Regola[];
  salvataggioEvento: Record<'video' | 'foto', { titolo: string; slot: string; passi: PassoSalvataggio[] }>;
  metodoZebre: {
    titolo: string;
    quando: string;
    modalita: Record<'isoAuto' | 'isoFisso', ModalitaZebre>;
    comeLeggereZebraVideo: string[];
  };
  situazioni: Situazione[];
}

export interface Obiettivo {
  id: string;
  nome: string;
  controlli: { id: string; verify?: boolean; opzioni?: string[] }[];
}
export interface ObiettiviFile { controlli: Record<string, string>; obiettivi: Obiettivo[] }

export interface PassoGuida {
  testo: string;
  menu?: MenuRef;
  valore?: string;
  link?: string;
  avviso?: string;
}
export interface GuidaFile {
  concetti: { id: string; titolo: string; testo: string; evidenzia?: boolean; verify?: boolean; nota?: string }[];
  passi: { id: string; titolo: string; passi: PassoGuida[] }[];
  preRipresa: {
    comune: { id: string; testo: string; dettaglio?: string; verify?: boolean; verifyNota?: string }[];
    video: { id: string; testo: string; dettaglio?: string }[];
    foto: { id: string; testo: string; dettaglio?: string }[];
  };
  fotoDiProva: { titolo: string; voci: { label: string; value: string }[] };
}
