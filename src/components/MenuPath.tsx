import type { MenuRef } from '../types';
import { menuPath } from '../lib/data';

/** Percorso completo: MENU › Scheda › Gruppo › Voce. */
export const MenuPath = ({ r }: { r: MenuRef }) => <div class="path">{menuPath(r)}</div>;
