# Sony A7R V · Impostazioni

Web app personale (PWA, mobile-first, in italiano) che guida a impostare la Sony A7R V (firmware 4.00) in base alla situazione di ripresa. Non controlla la fotocamera: dice cosa impostare e dove trovarlo nel menu.

La specifica completa è in [SPEC.md](SPEC.md). Stato: **fase 3** (analisi locale della foto di prova: EXIF, anteprima ARW, EV, temperatura colore, tinta, luce mista). Wizard per le situazioni e menu in stile camera. Prossima: regole fisse sulle proposte.

## Comandi

```
npm install
npm run dev      # sviluppo
npm test         # test (integrità dati, e poi EV / temperatura colore / regole)
npm run build    # build in dist/
```

## Dove stanno le cose

- `src/data/*.json` — tutti i dati (menu, basi M1/M2, situazioni e regole, obiettivi, testi della guida).
- `src/theme/tokens.css` — tutti i colori e le dimensioni.
- `src/screens/`, `src/components/` — schermate e componenti piccoli.
- `VERIFY.md` — voci da controllare sulla fotocamera (`verify: true`). Si rigenera con `WRITE_VERIFY=1 npx vitest run`.

## Pubblicazione

GitHub Pages con deploy automatico (`.github/workflows/deploy.yml`) a ogni push su `main`. Va attivato una volta: Settings › Pages › Source = “GitHub Actions”.
