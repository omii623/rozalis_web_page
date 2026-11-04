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
- `npm run sync-photos` letölti a képeket, 1200 px szélesre méretezi és WebP-be konvertálja
  (`public/images/photoN.webp`), majd újragenerálja a `src/app/components/gallery/gallery-images.ts` fájlt.
- Másik mappa: `DRIVE_FOLDER_ID=<id> npm run sync-photos`.

A `.github/workflows/sync-photos.yml` (a repó gyökerében) naponta 6:00 UTC-kor lefuttatja a szinkront,
és változás esetén PR-t nyit az `auto-sync/photos` branchről. Kézzel is indítható az Actions fülön.
Ehhez a repóban engedélyezni kell: *Settings → Actions → General → Allow GitHub Actions to create and approve pull requests*.

## Szerkezet

```
src/app/
  pages/link-tree/       főoldal (borító, logó, linkek)
  pages/not-found/       404
  components/gallery/    galéria + lightbox (Esc, ←/→ billentyűk)
    gallery-images.ts    ⚠️ generált fájl – ne szerkeszd kézzel
scripts/sync-photos.js   Drive → public/images szinkron
```
