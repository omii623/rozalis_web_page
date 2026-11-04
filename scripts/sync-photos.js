#!/usr/bin/env node
/**
 * Galéria szinkronizálása egy NYILVÁNOS Google Drive mappából — API kulcs nélkül.
 *
 * A mappát "Bárki, aki rendelkezik a linkkel" megosztással kell megosztani.
 * A képek fájlnév szerint rendezve jelennek meg (pl. 01_nyaklanc.jpg, 02_...).
 *
 * Opcionális környezeti változó:
 *   DRIVE_FOLDER_ID – másik Drive mappa azonosítója
 *
 * Megjegyzés: a mappalistát a Drive beágyazható nézetéből (embeddedfolderview)
 * olvassuk ki — ez nem hivatalos API, ha a Google megváltoztatja, a script hibával
 * leáll (a meglévő képek ilyenkor érintetlenek maradnak).
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const GALLERY_DATA = path.join(__dirname, '..', 'src', 'app', 'components', 'gallery', 'gallery-images.ts');
// Rozalis galéria mappa: https://drive.google.com/drive/folders/1uYuICJHMuFbXuVJgSA3HBDxIZ7YUYUaj
const DEFAULT_FOLDER_ID = '1uYuICJHMuFbXuVJgSA3HBDxIZ7YUYUaj';
const MAX_WIDTH = 1200;
const PHOTO_PATTERN = /^photo\d+\.(jpg|jpeg|webp)$/;
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/i;

const decodeHtml = (s) => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function listImages(folderId) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${folderId}`);
  if (!res.ok) throw new Error(`Mappa lekérése sikertelen (HTTP ${res.status}) — publikus a mappa?`);
  const html = await res.text();

  const files = [];
  const entryRe = /id="entry-([A-Za-z0-9_-]+)"[\s\S]*?class="flip-entry-title">([^<]+)</g;
  for (const [, id, rawName] of html.matchAll(entryRe)) {
    const name = decodeHtml(rawName.trim());
    if (IMAGE_EXT.test(name)) files.push({ id, name });
  }
  return files.sort((a, b) => a.name.localeCompare(b.name, 'hu', { numeric: true }));
}

async function downloadAndResize(file, outPath) {
  const res = await fetch(
    `https://drive.usercontent.google.com/download?id=${file.id}&export=download&confirm=t`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`nem kép (${type})`);
  const input = Buffer.from(await res.arrayBuffer());
  await sharp(input)
    .rotate() // EXIF tájolás alkalmazása
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
}

function writeGalleryData(imageFiles) {
  const lines = imageFiles.map((f) => `  '/images/${f}',`).join('\n');
  const content = `// ⚠️ Automatikusan generált fájl — ne szerkeszd kézzel!
// Forrás: Google Drive mappa, frissíti: scripts/sync-photos.js
export const GALLERY_IMAGES: readonly string[] = [
${lines}
];
`;
  fs.writeFileSync(GALLERY_DATA, content);
  console.log(`📄 gallery-images.ts frissítve: ${imageFiles.length} képpel.`);
}

async function syncPhotos() {
  const folderId = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  console.log('🔍 Drive mappa lekérése...');
  const files = await listImages(folderId);
  if (files.length === 0) {
    throw new Error('Nem található kép a mappában (publikus a mappa?).');
  }
  console.log(`📷 ${files.length} kép a mappában.\n`);

  // Letöltés ideiglenes mappába — a régi képek csak siker esetén cserélődnek
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(IMAGES_DIR, '.sync-'));
  try {
    const downloaded = [];
    for (const file of files) {
      const filename = `photo${downloaded.length + 1}.webp`;
      process.stdout.write(`⬇️  ${file.name} → ${filename}...`);
      try {
        await downloadAndResize(file, path.join(tmpDir, filename));
        downloaded.push(filename);
        console.log(' ✅');
      } catch (err) {
        console.log(` ⚠️  kihagyva (${err.message})`);
      }
    }

    if (downloaded.length === 0) throw new Error('Egyik kép sem tölthető le.');

    for (const f of fs.readdirSync(IMAGES_DIR).filter((f) => PHOTO_PATTERN.test(f))) {
      fs.unlinkSync(path.join(IMAGES_DIR, f));
    }
    for (const f of downloaded) {
      fs.renameSync(path.join(tmpDir, f), path.join(IMAGES_DIR, f));
    }

    console.log(`\n✅ ${downloaded.length} kép szinkronizálva.`);
    writeGalleryData(downloaded);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

syncPhotos().catch((err) => {
  console.error('❌ Hiba:', err.message);
  process.exit(1);
});
