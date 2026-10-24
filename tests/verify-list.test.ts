import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { collectVerify } from '../src/lib/data';

// Rigenera VERIFY.md: WRITE_VERIFY=1 npx vitest run tests/verify-list.test.ts
it.runIf(process.env.WRITE_VERIFY)('scrive VERIFY.md', () => {
  const lines = ['# Voci da verificare sulla fotocamera', '', 'Generato dai dati (`verify: true`). Stessa lista nell’app: Menu › “Voci da verificare”.', ''];
  for (const g of collectVerify()) {
    lines.push(`## ${g.title}`, '');
    for (const r of g.rows) {
      lines.push(`- [ ] **${r.label}**${r.value ? ` → \`${r.value}\`` : ''} — _${r.where}_${r.note ? `. ${r.note}` : ''}`);
    }
    lines.push('');
  }
  writeFileSync('VERIFY.md', lines.join('\n'));
});
