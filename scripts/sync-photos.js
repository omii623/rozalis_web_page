#!/usr/bin/env node
/**
 * Galéria szinkronizálása egy NYILVÁNOS Google Drive mappából — API kulcs nélkül.
 *
 * A mappát "Bárki, aki rendelkezik a linkkel" megosztással kell megosztani.
 * A képek fájlnév szerint rendezve jelennek meg (pl. 01_nyaklanc.jpg, 02_...).
 *
 * Kimenet (alapból public/images/, --out-tal bármely mappa, pl. a buildelt oldal images/ mappája):
 *   photo-<hash>.webp  1200 px széles WebP képek; a név a tartalomból jön, így a böngésző
 *                      sosem mutat régi, gyorsítótárazott képet
 *   gallery.json       { fingerprint, images: [...] } — ezt tölti be az oldal futásidőben
 *
 * Kapcsolók:
 *   --out <mappa>  a kimeneti images mappa (alap: public/images)
 *   --check        csak azt nézi meg, változott-e a mappa (új / törölt / átnevezett kép) a
 *                  <mappa>/gallery.json-ban tárolt ujjlenyomathoz képest. Nem tölt le semmit,
 *                  kiírja: changed=true|false (GitHub Actions alatt a GITHUB_OUTPUT-ba is).
 *
 * Opcionális környezeti változó:
 *   DRIVE_FOLDER_ID – másik Drive mappa azonosítója
 *
 * Megjegyzés: a mappalistát a Drive beágyazható nézetéből (embeddedfolderview)
 * olvassuk ki — ez nem hivatalos API, ha a Google megváltoztatja, a script hibával
 * leáll (a meglévő képek ilyenkor érintetlenek maradnak).
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Rozalis galéria mappa: https://drive.google.com/drive/folders/1uYuICJHMuFbXuVJgSA3HBDxIZ7YUYUaj
const DEFAULT_FOLDER_ID = '1uYuICJHMuFbXuVJgSA3HBDxIZ7YUYUaj';
const DEFAULT_OUT_DIR = path.join(__dirname, '..', 'public', 'images');
const MANIFEST_NAME = 'gallery.json';
const PUBLIC_PREFIX = '/images/';
const MAX_WIDTH = 1200;
const PHOTO_PATTERN = /^photo[-\d].*\.(jpe?g|webp)$/; // régi (photo1.jpg) és új (photo-<hash>.webp) nevek
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/i;

function parseArgs(argv) {
  const outIdx = argv.indexOf('--out');
  return {
    checkOnly: argv.includes('--check'),
    outDir: outIdx >= 0 ? path.resolve(argv[outIdx + 1]) : DEFAULT_OUT_DIR,
  };
}

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

/** Letölti és WebP-re konvertálja a képet; visszaadja a kész kép bájtjait. */
async function downloadAndConvert(file) {
  const res = await fetch(
    `https://drive.usercontent.google.com/download?id=${file.id}&export=download&confirm=t`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error(`nem kép (${type})`);
  const input = Buffer.from(await res.arrayBuffer());
  const sharp = require('sharp'); // csak letöltéskor kell, a --check módhoz nem
  return sharp(input)
    .rotate() // EXIF tájolás alkalmazása
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

const sha = (data) => crypto.createHash('sha256').update(data).digest('hex');

/** A mappa tartalmának ujjlenyomata: fájl azonosítók + nevek, sorrendben. */
const fingerprint = (files) => sha(files.map((f) => `${f.id}\t${f.name}`).join('\n')).slice(0, 16);

function readManifest(outDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(outDir, MANIFEST_NAME), 'utf8'));
  } catch {
    return null;
  }
}

async function syncPhotos({ checkOnly, outDir }) {
  const folderId = process.env.DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  console.log('🔍 Drive mappa lekérése...');
  const files = await listImages(folderId);
  if (files.length === 0) {
    throw new Error('Nem található kép a mappában (publikus a mappa?).');
  }
  console.log(`📷 ${files.length} kép a mappában.`);

  const fp = fingerprint(files);
  if (checkOnly) {
    const changed = fp !== readManifest(outDir)?.fingerprint;
    console.log(changed ? '🆕 A mappa változott.' : '✅ Nincs változás a legutóbbi szinkron óta.');
    console.log(`changed=${changed}`);
    if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
    return;
  }
  console.log(`📁 Cél: ${outDir}\n`);

  // Előbb minden képet a memóriába töltünk — a régi képek csak siker esetén cserélődnek.
  const converted = [];
  for (const file of files) {
    process.stdout.write(`⬇️  ${file.name}...`);
    try {
      const data = await downloadAndConvert(file);
      const filename = `photo-${sha(data).slice(0, 10)}.webp`;
      converted.push({ filename, data });
      console.log(` ✅ ${filename}`);
    } catch (err) {
      console.log(` ⚠️  kihagyva (${err.message})`);
    }
  }
  if (converted.length === 0) throw new Error('Egyik kép sem tölthető le.');

  fs.mkdirSync(outDir, { recursive: true });
  const keep = new Set(converted.map((c) => c.filename));
  for (const f of fs.readdirSync(outDir).filter((f) => PHOTO_PATTERN.test(f) && !keep.has(f))) {
    fs.unlinkSync(path.join(outDir, f));
  }
  for (const { filename, data } of converted) {
    fs.writeFileSync(path.join(outDir, filename), data);
  }

  const manifest = { fingerprint: fp, images: converted.map((c) => PUBLIC_PREFIX + c.filename) };
  fs.writeFileSync(path.join(outDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n✅ ${converted.length} kép szinkronizálva, ${MANIFEST_NAME} frissítve.`);
}

syncPhotos(parseArgs(process.argv)).catch((err) => {
  console.error('❌ Hiba:', err.message);
  process.exit(1);
});
