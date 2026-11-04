# ROZALIS – link-tree oldal

Egyoldalas „linkfa” a ROZALIS ékszermárkának: borítókép, logó, Instagram / Facebook / Etsy linkek és egy képgaléria.
Angular 21, standalone komponensek, Vitest.

## Fejlesztés

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tesztek (Vitest)
npm run build      # éles build → dist/link-tree/browser
```

## Galéria – Google Drive szinkron

A galéria képei egy **nyilvános** Google Drive mappából jönnek
(„Bárki, aki rendelkezik a linkkel”). Új kép felvétele: töltsd fel a mappába.

- A sorrend a **fájlnév** szerinti (pl. `01_nyaklanc.jpg`, `02_fulbevalo.jpg`).
- `npm run sync-photos` letölti a képeket, 1200 px szélesre méretezi, WebP-be konvertálja
  (`public/images/photo-<hash>.webp`), és megírja a `public/images/gallery.json` listát.
  Az oldal ezt a JSON-t **futásidőben** tölti be, így a kész buildben újrafordítás nélkül cserélhetők a képek.
- Másik mappa: `DRIVE_FOLDER_ID=<id> npm run sync-photos`. Másik célmappa: `-- --out <mappa>`.

## Kész oldal – `auto-sync/photos` branch

Az `auto-sync/photos` branch **csak a buildelt oldalt** tartalmazza (a `dist/link-tree/browser` tartalmát a gyökérben),
ezt a `.github/workflows/sync-photos.yml` tartja karban:

| Esemény | Mi történik |
|---|---|
| push a `master`-re | teljes build + friss képek a Drive-ról → commit a branchre |
| naponta 6:00 UTC | gyors ellenőrzés (`--check`, pár mp); ha a Drive mappa változott, **csak** az `images/photo-*.webp` és `images/gallery.json` cserélődik |
| kézi indítás (Actions fül) | mint a napi; „force”: képcsere változás nélkül is, „rebuild”: teljes build |

A változást a mappa tartalmából (fájl azonosítók + nevek) számolt ujjlenyomat jelzi, amit a `gallery.json` tárol.
Egy kép tartalmának cseréje azonos névvel (Drive „Verziók kezelése”) ebből nem látszik – ilyenkor „force”.

## Szerkezet

```
src/app/
  pages/link-tree/       főoldal (borító, logó, linkek)
  pages/not-found/       404
  components/gallery/    galéria + lightbox (Esc, ←/→ billentyűk), a képlistát a gallery.json-ból tölti
public/images/           borító, logó + szinkronizált galéria képek és gallery.json (generált)
scripts/sync-photos.js   Drive → images mappa szinkron
```
