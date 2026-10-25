import type { MenuRef, MenuTab } from '../types';
import { menu } from '../lib/data';
import { Icon } from './Icon';

/** Permette di andare a capo dopo la barra (es. “Shutter/Silent”) senza spezzare le parole. */
export const spezza = (nome: string): string => nome.replace(/\//g, '/\u200b');

/** Ordine delle schede nella colonna di sinistra della camera: My Menu, Main, Shooting, … Setup. */
export const ORDINE_SCHEDE = ['mymenu', 'main', 'shooting', 'exposure', 'focus', 'playback', 'network', 'setup'];
export const schedeInOrdineCamera = (): MenuTab[] =>
  ORDINE_SCHEDE.map((id) => menu.tabs.find((t) => t.id === id)).filter((t): t is MenuTab => !!t);

/** Colonna delle icone delle schede; la scheda attiva ha il suo colore. */
export function ColonnaSchede({ attiva, onScegli, alta }: { attiva: string; onScegli?: (id: string) => void; alta?: boolean }) {
  return (
    <div class={`cam-tabs${alta ? ' alta' : ''}`}>
      {schedeInOrdineCamera().map((t) => {
        const on = t.id === attiva;
        const stile = on ? ({ '--tab-color': `var(${t.colorToken})` } as never) : undefined;
        const inner = <Icon name={t.icon} />;
        return onScegli ? (
          <button key={t.id} class={`cam-tab${on ? ' on' : ''}`} style={stile} aria-label={t.name} aria-pressed={on} onClick={() => onScegli(t.id)}>{inner}</button>
        ) : (
          <div key={t.id} class={`cam-tab${on ? ' on' : ''}`} style={stile} aria-hidden="true">{inner}</div>
        );
      })}
    </div>
  );
}

/** Finestra di `n` elementi che contiene l'indice `i`, centrata quando possibile. */
export function finestra<T>(lista: T[], i: number, n: number): { da: number; elementi: T[] } {
  const da = Math.max(0, Math.min(Math.max(0, lista.length - n), i - Math.floor(n / 2)));
  return { da, elementi: lista.slice(da, da + n) };
}

/**
 * Riproduzione dello schermo del menu della camera: colonna delle schede, gruppi numerati, voci
 * con il valore a destra. Evidenzia dove andare e quale valore impostare.
 */
export function CameraMenu({ r, valore }: { r: MenuRef; valore: string }) {
  const tab = menu.tabs.find((t) => t.id === r.tab);
  if (!tab) return null;
  const gi = Math.max(0, tab.groups.findIndex((g) => g.name === r.group));
  const gruppo = tab.groups[gi];
  const ii = Math.max(0, gruppo.items.findIndex((i) => i.name === r.item));
  const gruppi = finestra(tab.groups, gi, 5);
  const voci = finestra(gruppo.items, ii, 5);
  const voce = gruppo.items[ii];
  const sotto = r.sub ? voce.subItems ?? [] : [];

  return (
    <div class="cam" role="img" aria-label={`Sulla camera: ${tab.name}, gruppo ${gi + 1} ${r.group}, voce ${r.sub ? `${r.item}, ${r.sub}` : r.item}, valore ${valore}`}>
      <ColonnaSchede attiva={tab.id} />
      <div class="cam-gruppi">
        {gruppi.elementi.map((g, k) => (
          <div key={g.name} class={`cam-riga${g.name === r.group ? ' sel' : ''}`}>
            <span class="cam-num">{gruppi.da + k + 1}</span>
            <span class="cam-nome">{spezza(g.name)}</span>
          </div>
        ))}
      </div>
      <div class="cam-voci">
        {voci.elementi.map((v) => {
          const sel = v.name === r.item;
          return (
            <div key={v.name}>
              <div class={`cam-riga${sel && !r.sub ? ' sel' : ''}`}>
                <span class="cam-nome">{spezza(v.name)}</span>
                {sel && !r.sub && <span class="cam-valore">{valore}</span>}
              </div>
              {sel && r.sub && sotto.map((s) => (
                <div key={s.name} class={`cam-riga sotto${s.name === r.sub ? ' sel' : ''}`}>
                  <span class="cam-nome">{spezza(s.name)}</span>
                  {s.name === r.sub && <span class="cam-valore">{valore}</span>}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
