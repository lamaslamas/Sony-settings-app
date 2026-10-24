# Prompt per Claude Code — App impostazioni Sony A7R V

Costruisci una web app personale, mobile-first e installabile (PWA, funzionante offline sul set), che mi guida a impostare la mia Sony A7R V (firmware 4.00) in base alla situazione di ripresa. L'app non controlla la fotocamera: mi dice cosa impostare e dove trovarlo nel menu. Interfaccia in italiano; nomi di schede, gruppi, voci e valori del menu della fotocamera sempre in inglese, esattamente come compaiono sulla fotocamera.

Prima di scrivere codice, proponimi struttura del progetto, stack e modello dati, e aspetta il mio ok.

## Chi la usa e come

- Uso solo personale, dal telefono, spesso in sale poco illuminate e di fretta.
- Ho difficoltà di vista: testo grande (corpo minimo 16 px), alto contrasto, aree tattili ampie (min 48 px). Le schede del menu si riconoscono sempre da **icona + nome + colore insieme**, mai dal solo colore.
- Colori e stile grafico li definisco io in seguito: per ora tema scuro neutro con un solo colore d'accento, e tutti i colori centralizzati in variabili/token facili da cambiare (anche un colore per scheda, configurabile).

## Il metodo (logica centrale dell'app)

Due basi salvate sulla scheda di memoria, mai modificate durante gli eventi:
- **Base video → M1** (scheda di memoria)
- **Base foto → M2** (scheda di memoria)

A ogni evento le carico, le adatto alla sala e le salvo sulla ghiera dei modi:
- **Ghiera 1** = video dell'evento
- **Ghiera 2** = foto dell'evento
- Ghiera 3 e M3–M4 restano libere.

Concetti da spiegare chiaramente nell'app:
- Girare la ghiera **carica** una posizione, non salva mai nulla. Si salva solo con `Camera Set. Memory`.
- Le modifiche fatte a mano su una posizione si perdono quando giri la ghiera e torni: per tenerle bisogna risalvarle su quella posizione.
- **Salvare**: in `MENU › Shooting › Shooting Mode › Camera Set. Memory` si sceglie direttamente la destinazione: `1`, `2`, `3` salvano nella camera (una serie per ciascuna posizione del selettore Still/Movie/S&Q), `M1`–`M4` salvano sulla scheda di memoria.
- **Richiamare**: `1`, `2`, `3` si richiamano girando la ghiera dei modi su quella posizione. `M1`–`M4` si richiamano con la ghiera su 1/2/3 (posizione *Recall Camera Setting*) e poi `MENU › Shooting › Shooting Mode › Recall Camera Setting` scegliendo il numero. Prima si imposta Still/Movie/S&Q, poi si richiama; le regolazioni fatte dopo il richiamo prevalgono.
- **Slot della scheda** per M1–M4: `MENU › Shooting › Shooting Mode › Memory/Recall Media` (`Slot 1` / `Slot 2`). Non esiste un interruttore `Select Media` Memory Card/Camera (verificato sulla guida Sony 4.00). È il punto dove è più facile sbagliare (slot sbagliato, numero sbagliato): evidenzialo.

## Schermate

1. **Home / Foto di prova** — impostazioni fisse da usare per lo scatto di prova (Mode dial M, ISO 800, 1/50, F4, White Balance 5500K, Creative Look ST), pulsanti "Carica foto dalla fotocamera" e "Scatta col telefono", e link "Solo foto? Salta la foto di prova".
2. **Lettura luce e scelta situazione** — risultato dell'analisi (livello EV, temperatura colore stimata, dominante, luce mista sì/no) e griglia delle situazioni. Per le situazioni foto la foto di prova è facoltativa.
3. **Checklist della situazione** — solo le differenze rispetto alla base, con caselle da spuntare. Ogni voce mostra **in cima l'etichetta della scheda** (icona + nome), poi nome voce e valore, poi il percorso completo (`MENU › Scheda › Gruppo › Voce`). Voci da ghiere o obiettivo senza etichetta di scheda. Ultimo passo: "Salva per l'evento" (`Camera Set. Memory` → `1` per il video, `2` per le foto: salvataggio nella camera, lo slot non serve).
4. **Base video · M1** e **Base foto · M2** — tutte le voci in ordine di menu, raggruppate per scheda e gruppo, con istruzioni per salvarle sulla scheda.
5. **Guida inizio evento** — passo A (a casa, una volta sola: controllare lo slot con `Memory/Recall Media`, applicare e salvare la base video con `Camera Set. Memory` → `M1` e la base foto → `M2`, backup con `Setup › Reset/Save Settings › Save/Load Settings`), passo B (inizio evento: controllare lo slot; Movie + ghiera 1, `Recall Camera Setting` → `M1`, foto di prova, regolare, `Camera Set. Memory` → `1`; Still + ghiera 2, `Recall Camera Setting` → `M2`, ritoccare, `Camera Set. Memory` → `2`), passo C (durante: Movie + 1 per il video, Still + 2 per le foto).
6. **Menu navigabile** — l'albero del menu firmware 4.00 consultabile e con ricerca per nome voce.
7. **Pre-ripresa** — checklist veloce "prima di registrare/scattare" (vedi sotto zebra e ghiera di compensazione).

## Situazioni

Video: Intervista chiuso · Intervista aperto · B-roll chiuso · B-roll aperto.
Foto: Conferenza con persone · Foto di gruppo aperto · Foto di gruppo chiuso · Wildlife aperto · Paesaggio.

Ogni situazione = elenco di differenze rispetto alla base giusta (video → M1, foto → M2), più note e avvisi. Le interviste sono sempre su cavalletto; B-roll, foto, wildlife e paesaggio sempre a mano libera.

Decisioni sui valori:
- **B-roll (chiuso e aperto)**, a mano libera: `SteadyShot` On (la base M1 lo ha Off per il cavalletto), obiettivo AF e OSS on; ISO AUTO consentito, tempo 1/50 o 1/100, diaframma fisso, compensazione + zebre.
- **Conferenza con persone**: Mode dial M, 1/200, F2.8, ISO AUTO (compensazione attiva).
- **Foto di gruppo aperto**: diaframma F5.6–F8.
- **Foto di gruppo chiuso**: Mode dial M, 1/125, F4–F5.6 (F5.6 con più file), ISO AUTO (compensazione attiva).

Esempi già decisi:
- **Intervista chiuso**: `White Balance` → `Custom 1` misurato su cartoncino grigio; ISO e Aperture in base alla foto di prova (es. ISO 3200, F2.8); Shutter 1/50 (alternativa 1/100 con luci artificiali); `Audio Rec Level` manuale, picchi ~−12 dB; obiettivo: AF, OSS off; avviso neon/sfarfallio; registra il cartoncino grigio a inizio ripresa.
- **Wildlife**: Mode dial M con ISO AUTO; `ISO Range Limit` massimo 6400; 1/1000 (volo 1/2000–1/3200); diaframma tutta apertura; zebre attive per le alte luci con il metodo "zebre + compensazione" (vedi sezione dedicata); `Drive Mode` → `Cont. Shooting: Hi`; `Focus Area` → `Tracking: Zone`; `Recognition Target` → `Animal/Bird`; `AF Illuminator` → `Off`; obiettivo: limitatore lontano, OSS on (Mode 2 per il volo, se presente).
- **Paesaggio**: F8 (F5.6 con poca luce); `Focus Mode` → `Single-shot AF`; `Focus Area` → `Spot: M`; `Subject Recog in AF` → `Off`; `Drive Mode` → `Single Shooting` (con forti contrasti `Cont. Bracket`); OSS on.
- **Interviste/B-roll aperto senza ND**: piano B 1/100 e diaframma più chiuso, cercare l'ombra; con filtro ND variabile tenere 1/50 e regolare il filtro (l'ND è opzionale, va proposto come alternativa).

## Regole fisse

Le regole sono una rete di sicurezza: il calcolo dalla foto di prova propone i valori, ma solo dentro questi vincoli. Mettile in `situazioni.json` e applicale nel codice **dopo** il calcolo: un valore che le viola viene corretto o scartato, e l'app mostra perché.

**Interviste (chiuso e aperto)**
- Tempo solo 1/50 o 1/100 (luci a 50 Hz: altri valori causano sfarfallio).
- ISO manuale, **mai ISO AUTO**: l'esposizione non deve cambiare durante la ripresa né tra un'intervista e l'altra.
- White Balance mai `Auto`: sempre `Custom 1` o Kelvin fissi.
- SteadyShot `Off` (sempre su cavalletto).
- Senza ND con troppa luce, unico piano B ammesso: 1/100 + diaframma più chiuso.

**Tutto il video (interviste e B-roll)**
- Frequenza sempre 25p.
- Picture Profile sempre `PP11 (S-Cinetone)`.
- White Balance mai `Auto`.

**B-roll (chiuso e aperto)**
- ISO AUTO **consentito** (utile in movimento o passando da dentro a fuori): tempo e diaframma fissi, correzione con la compensazione guardando le zebre, come nel metodo per gli animali. Tempo sempre 1/50 o 1/100.

**Foto in generale**
- ISO AUTO mai oltre il limite della base (12800).
- SteadyShot sempre `On` (sempre a mano libera).
- Sotto luci artificiali, `Shutter Type` → `Mechanical Shutter`.

**Wildlife**
- Tempo mai sotto 1/1000; almeno 1/2000 con soggetto in volo o in corsa.
- ISO AUTO con massimo 6400.
- `AF Illuminator` sempre `Off`.

**Paesaggio**
- Diaframma tra F5.6 e F8.
- `Subject Recog in AF` → `Off`.

**Per tutte le situazioni**
- L'app propone solo voci e valori presenti in `menu-fw400.json`: niente di inventato.
- Se la foto di prova è troppo scura, mossa o illeggibile, l'app non indovina: chiede di rifarla.
- Ogni valore proposto resta modificabile da me.

## Zebra e ghiera di compensazione

Integra questi due controlli in tutte le situazioni e nella checklist pre-ripresa:

- **Zebra (video)**: base `Zebra Display` → `On`, `Zebra Level` → `70` per la pelle (zebre leggere sul volto ben esposto). L'app deve spiegare come leggerle: niente zebre sul volto = probabilmente sottoesposto; zebre su gran parte del volto = troppo. Prevedi anche l'uso alternativo `100+` per controllare le alte luci bruciate (finestre, lampade) e lascia scegliere quale usare per situazione.
- **Zebra (foto, alte luci)**: nelle situazioni con alte luci critiche (wildlife, paesaggio, sfondi chiari) proponi `Zebra Display` → `On` con un livello per le alte luci (es. `100+`; valore da verificare): le strisce indicano le zone che stanno per bruciarsi sulla parte più chiara del soggetto.
- **Ghiera di compensazione**: nella checklist pre-ripresa la prima voce è "ghiera di compensazione a 0", perché dimenticarla girata è un errore tipico. In M **funziona solo con ISO AUTO**: con ISO fisso girarla non cambia niente (è il caso del video delle interviste, dove l'esposizione si regola con ISO/diaframma e si controlla con le zebre). Verifica sulla A7R V com'è fatta la ghiera (con o senza numeri) e chiamala nell'app come compare sul corpo macchina.

### Metodo zebre per gli animali (da implementare come guida passo passo nella situazione Wildlife)

L'app deve offrire due modalità, con una spiegazione breve di quando scegliere l'una o l'altra:

**M + ISO AUTO (consigliata per gli animali, con la luce che cambia di continuo).** Tempo e diaframma li scelgo io, gli ISO la fotocamera. La fotocamera però cerca un'esposizione "media" e tende a schiarire lo sfondo scuro, bruciando le parti chiare del soggetto: si corregge con la compensazione.
1. Imposta tempo e diaframma come sempre, e ISO su ISO AUTO (con limite massimo 6400, così il rumore resta gestibile: `Exposure/Color › Exposure › ISO Range Limit`).
2. Inquadra l'animale.
3. Se vedi le strisce sulla parte più chiara, gira la ghiera della compensazione verso il meno: −0,3, −0,7, −1…
4. Fermati appena le strisce spariscono.
5. Scatta.
Nota da mostrare: con sfondo scuro di solito si finisce tra −1 e −2; è la sottoesposizione voluta, si recupera in Lightroom.

**M con ISO fisso (quando la luce è stabile e voglio il controllo completo).** Gli ISO li scelgo io: giro la ghiera di controllo sugli ISO finché le strisce spariscono dal soggetto. La compensazione qui non ha effetto.

## Analisi della foto di prova

- Accetta JPEG/HEIF e RAW Sony (ARW) dalla fotocamera e foto del telefono.
- Tutto in locale nel browser: leggi EXIF (es. con exifr) e, per gli ARW, estrai l'anteprima JPEG incorporata; il file RAW non va mai caricato su un server.
- Con la foto di prova fatta alle impostazioni fisse note (ISO 800, 1/50, F4, 5500K): calcola la luminosità media/istogramma e stima l'EV della scena; dalla dominante RGB a bilanciamento fisso stima temperatura colore e tinta (verde/magenta = neon/LED). Per le foto del telefono usa i suoi EXIF (esposizione automatica) per stimare l'EV; il colore è meno affidabile: dillo nell'interfaccia.
- **Niente AI nella prima versione**: l'analisi è interamente locale, offline e gratuita. Dai valori calcolati (EV, temperatura colore, tinta, luce mista sì/no dal confronto tra zone dell'immagine) e da `situazioni.json` l'app ricava le proposte; poi applica le regole fisse. Mostra sempre i valori come proposta modificabile.
- Tieni il codice predisposto per aggiungere in futuro un'analisi AI opzionale (una funzione con la stessa interfaccia del calcolo locale), ma non implementarla.

## Dati

Metti tutto in file JSON versionati, separati dal codice:
- `menu-fw400.json`: albero Scheda › Gruppo › Voce › opzioni, nomi in inglese come sulla fotocamera.
- `base-video-m1.json`, `base-foto-m2.json`: valori delle basi.
- `situazioni.json`: differenze, note, avvisi, regole.
- `obiettivi.json`: i miei obiettivi con i controlli fisici che hanno davvero (da verificare uno per uno): Sigma 24-70mm F2.8, Sony 70-200mm, Sony 50mm F1.2, 40mm F2.5. Nella checklist mostra solo i controlli dell'obiettivo montato (ghiera diaframma, click on/off, AF/MF, limitatore, OSS e modi OSS).

Ogni voce può avere `verify: true`; nell'interfaccia mostra un badge "da verificare". Fonte per nomi e struttura: guida ufficiale Sony online della ILCE-7RM5 in inglese, aggiornata alla 4.00. Se una voce non è confermata dalla guida, non inventarla: segnala `verify: true`.

### Base video · M1 (Still/Movie/S&Q dial: Movie · Mode dial: M)

- Shooting › Image Quality/Rec: File Format `XAVC S 4K` · Movie Settings › Rec Frame Rate `25p` · Movie Settings › Record Setting `140M 4:2:2 10bit` (verify) · APS-C S35 Shooting `Off` · Lens Compensation `Auto`
- Shooting › Media: Recording Media `Simult. Rec.` (verify)
- Shooting › Shooting Mode: Exposure Ctrl Type `P/A/S/M Mode`
- Shooting › Shutter/Silent: Anti-flicker Settings › Variable Shutter `Off` (on solo con bande da LED)
- Shooting › Audio Recording: Audio Recording `On` · Audio Rec Level `Manual` · Audio Out Timing `Live` · Wind Noise Reduct. `Off`
- Shooting › TC/UB: TC Run `Rec Run`
- Shooting › Image Stabilization: SteadyShot `Off` (cavalletto)
- Shooting › Shooting Display: Grid Line Display `On` · Grid Line Type `Rule of 3rds Grid` · Emphasized REC Display `On` (verify)
- Exposure/Color › Exposure: ISO `800` (base) · Auto Slow Shutter `Off`
- Exposure/Color › Metering: Metering Mode `Multi` · Face Prty in Mlti Mtr `On`
- Exposure/Color › White Balance: White Balance `Custom 1`
- Exposure/Color › Color/Tone: Dynamic Range Opt. `Off` (verify) · Picture Profile `PP11 (S-Cinetone)` · Soft Skin Effect `Off`
- Exposure/Color › Zebra Display: Zebra Display `On` · Zebra Level `70`
- Focus › AF/MF: Focus Mode `Continuous AF` · AF Transition Speed `3` · AF Subj. Shift Sens. `2` · AF Assist `On`
- Focus › Focus Area: Focus Area `Wide`
- Focus › Subject Recognition: Subject Recog in AF `On` · Recognition Target `Human` · Right/Left Eye Select `Auto`
- Setup (non salvate nella memoria, una volta sola): Different Set for Still/Mv (ISO, WB, Aperture, Shutter) · Monitor Brightness `Manual ±0` · NTSC/PAL Selector `PAL` (verify gruppo) · Auto Pwr OFF Temp. `High` (verify gruppo)

### Base foto · M2 (Still/Movie/S&Q dial: Still · Mode dial: A)

- Shooting › Image Quality/Rec: JPEG/HEIF Switch `JPEG` · File Format `RAW & JPEG` · RAW File Type `Lossless Comp (L)` (verify) · JPEG Quality `Fine` · Aspect Ratio `3:2` · Lens Compensation `Auto`
- Shooting › Media: Recording Media `Simult. Rec.` (verify)
- Shooting › Drive Mode: `Cont. Shooting: Lo`
- Shooting › Shutter/Silent: Shutter Type `Mechanical Shutter` · Anti-flicker Shoot. `On`
- Shooting › Image Stabilization: SteadyShot `On`
- Exposure/Color › Exposure: ISO `ISO AUTO` · ISO Range Limit `100–12800` · ISO AUTO Min. SS `Faster`
- Exposure/Color › Metering: Metering Mode `Multi` · Face Prty in Mlti Mtr `On`
- Exposure/Color › White Balance: `Auto` (RAW, correzione in Lightroom)
- Exposure/Color › Color/Tone: Dynamic Range Opt. `Auto` (verify) · Creative Look `ST` · Picture Profile `Off`
- Focus › AF/MF: Focus Mode `Continuous AF` · Priority Set in AF-C `Balanced Emphasis`
- Focus › Focus Area: `Wide`
- Focus › Subject Recognition: Subject Recog in AF `On` · Recognition Target `Human` · Right/Left Eye Select `Auto`

## Requisiti tecnici

- PWA installabile e completamente offline: dati, checklist e analisi della foto funzionano senza rete.
- Hosting gratuito su GitHub Pages dal repository `lamaslamas/sony-settings-app`, con deploy automatico tramite GitHub Actions.
- Stack confermato: Vite + TypeScript + Preact, CSS con variabili in `src/theme/tokens.css`, `vite-plugin-pwa`, `localStorage`, `exifr`, Vitest.
- Stato delle checklist salvato in locale per evento (posso riprendere dove ero), compresi l'obiettivo montato (`obiettivoId`) e la modalità zebre scelta (`modalitaZebre`: `isoAuto` | `isoFisso`) per wildlife e B-roll.
- Codice semplice e commentato, perché lo modificherò io: componenti piccoli, dati fuori dal codice, colori in un unico file di token.
- Test minimi su: calcolo EV, stima temperatura colore, applicazione delle regole fisse.

## Ordine di lavoro

1. Struttura + dati JSON (menu, basi, situazioni, obiettivi) + navigazione statica di tutte le schermate. Alla fine dammi l'elenco completo delle voci con `verify: true`, raggruppate per scheda, così le controllo sulla fotocamera.
2. Checklist con salvataggio locale, guida inizio evento, pre-ripresa con zebra e ghiera di compensazione.
3. Analisi locale della foto (EXIF, anteprima ARW, EV, dominante). Come prima cosa verifica con un vero ARW della A7R V che `exifr` estragga l'anteprima JPEG grande e non solo la miniatura; se non ci riesce, proponimi un'alternativa prima di andare avanti.
4. Regole fisse applicate alle proposte, con spiegazione delle correzioni.
5. PWA/offline e rifiniture di accessibilità.

Fermati alla fine di ogni fase e mostrami cosa hai fatto prima di passare alla successiva.
