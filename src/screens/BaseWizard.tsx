import type { BaseFile } from '../types';
import { useStato } from '../lib/useStato';
import { azzeraSpunteGlobali, impostaPassoBase, impostaSpunta } from '../lib/storage';
import { chiavePassoBase, passiBase, type PassoBase } from '../lib/wizard';
import { findMenuItem, tabById } from '../lib/data';
import { href } from '../router';
import { WizardShell } from '../components/WizardShell';
import { SelettoreVista } from '../components/SelettoreVista';
import { TabBadge } from '../components/TabBadge';
import { VerifyBadge } from '../components/Badges';
import { MenuPath } from '../components/MenuPath';
import { Callout } from '../components/Callout';
import { CameraMenu } from '../components/CameraMenu';
import { aggiorna as aggiornaStato } from '../lib/useStato';

const titolo = (p: PassoBase): string =>
  p.tipo === 'voce' ? (p.entry.sub ? `${p.entry.item} › ${p.entry.sub}` : p.entry.item)
  : p.tipo === 'intro' ? 'Inizio' : p.tipo === 'salva' ? 'Salva sulla scheda' : 'Fine';

/** Una base (M1/M2) un passo per volta, in ordine di menu: serve a prepararla a casa, una volta sola. */
export function BaseWizard({ base }: { base: BaseFile }) {
  const { stato } = useStato();
  const passi = passiBase(base);
  const n = passi.length;
  const idx = Math.min(stato.globali.passi?.[base.id] ?? 0, n - 1);
  const passo = passi[idx];
  const spunte = stato.globali.spunte;
  const chiave = chiavePassoBase(base.id, idx, passo);
  const fatto = chiave ? !!spunte[chiave] : false;
  const vai = (i: number) => aggiornaStato((s) => impostaPassoBase(s, base.id, Math.min(n - 1, Math.max(0, i))));
  const avanti = (spunta: boolean) => {
    if (chiave && spunta) aggiornaStato((s) => impostaSpunta(s, chiave, true, true));
    vai(idx + 1);
  };
  const operativi = passi.map((p, i) => chiavePassoBase(base.id, i, p)).filter((k): k is string => !!k);
  const nFatti = operativi.filter((k) => spunte[k]).length;

  return (
    <WizardShell
      intestazione={<span class="small dim">{base.id === 'M1' ? 'Video' : 'Foto'}</span>}
      selettore={<SelettoreVista />}
      sottotitolo={`${base.titolo} · una volta sola, a casa`}
      idx={idx} n={n} nFatti={nFatti} onVai={vai}
      elenco={passi.map((p, i) => {
        const k = chiavePassoBase(base.id, i, p);
        return { titolo: titolo(p), stato: k ? (spunte[k] ? '✓' : i < idx ? '–' : '○') : '○' };
      })}
      tipo={passo.tipo === 'intro' ? 'intro' : passo.tipo === 'fine' ? 'fine' : 'normale'}
      fatto={fatto} onAvanti={avanti}
    >
      {passo.tipo === 'intro' && (
        <div class="stack">
          <h1 style={{ marginBottom: 0 }}>{base.titolo}</h1>
          <p class="dim" style={{ margin: 0 }}>{base.descrizione}</p>
          <div class="card stack">
            <h2 style={{ margin: 0 }}>Prima di cominciare</h2>
            <p style={{ margin: 0 }}>Still/Movie/S&amp;Q dial su <b class="value">{base.dials.stillMovieSq}</b>, ghiera dei modi su <b class="value">{base.dials.mode}</b>.</p>
          </div>
          <Callout title="Slot della scheda" strong>Per salvare su M1–M4 la scheda deve essere inserita e lo slot scelto con Memory/Recall Media (Slot 1 / Slot 2).</Callout>
          <p class="dim">{operativi.length} passi, in ordine di menu. Le voci di Setup alla fine non vengono salvate nella memoria.</p>
        </div>
      )}

      {passo.tipo === 'voce' && (() => {
        const e = passo.entry;
        const tab = tabById(e.tab);
        return (
          <div class="stack">
            {tab && <div><TabBadge tab={tab} /></div>}
            {passo.setup && <Callout>Voce di Setup: non viene salvata nella memoria, si imposta una volta sola.</Callout>}
            <h1 style={{ marginBottom: 0 }}>{e.sub ? `${e.item} › ${e.sub}` : e.item}</h1>
            <div class="valore-grande">{e.value}</div>
            {(e.verify || !findMenuItem(e)) && <div><VerifyBadge /></div>}
            <CameraMenu r={e} valore={e.value} />
            {e.note && <Callout>{e.note}</Callout>}
            <MenuPath r={e} />
          </div>
        );
      })()}

      {passo.tipo === 'salva' && (
        <div class="stack">
          <h1 style={{ marginBottom: 0 }}>Salva sulla scheda</h1>
          <div class="valore-grande">{base.salvataggio.valore}</div>
          <CameraMenu r={base.salvataggio.menu} valore={base.salvataggio.valore} />
          <Callout title="Punto dove è più facile sbagliare" strong>
            Scegli direttamente il numero: <b>M1–M4</b> salvano sulla scheda, <b>1–3</b> nella camera. Lo slot si sceglie prima con <b>Memory/Recall Media</b>.
          </Callout>
          <MenuPath r={base.salvataggio.menu} />
        </div>
      )}

      {passo.tipo === 'fine' && (
        <div class="stack">
          <h1>Fatto</h1>
          <p>{nFatti} passi su {operativi.length} completati per la <b>{base.titolo}</b>.</p>
          {nFatti < operativi.length && <Callout>Alcuni passi sono saltati: apri “Tutti i passi” per tornarci.</Callout>}
          <a class="btn primary block" href={href('/guida')}>Vai alla guida inizio evento</a>
          <button class="btn block" onClick={() => aggiornaStato((s) => impostaPassoBase(azzeraSpunteGlobali(s, `base/${base.id}/`), base.id, 0))}>Ricomincia</button>
        </div>
      )}
    </WizardShell>
  );
}
