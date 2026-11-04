#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Google Photos album megosztó link
const ALBUM_URL = 'https://photos.google.com/share/AF1QipMUuxEwpkNPkHa7nemhtmMzlx987gDhdTcOH9gROHZ_0Kgk0-OYMLwnl5qyvE_-Mg?key=QmVnUUhUb2JGTnNrN1FZR3lISWRjcHozTktqb2dn';

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const GALLERY_COMPONENT = path.join(__dirname, '..', 'src', 'app', 'components', 'google-photos-gallery', 'google-photos-gallery.ts');

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const doRequest = (requestUrl) => {
      https.get(requestUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doRequest(res.headers.location);
        }
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
      }).on('error', reject);
    };
    doRequest(url);
  });
}

function extractImageUrls(html) {
  const matches = html.match(/https:\/\/lh3\.googleusercontent\.com\/pw\/AP1Gcz[A-Za-z0-9_-]+/g);
  if (!matches) return [];
  return [...new Set(matches.map(u => u.split('=')[0]))];
}

function updateGalleryComponent(imageFiles) {
  const imagesArray = imageFiles.map((f, i) => {
    const comma = i < imageFiles.length - 1 ? ',' : '';
    return `    '/images/${f}'${comma}`;
  }).join('\n');

  const content = `import { Component } from '@angular/core';

@Component({
  selector: 'app-google-photos-gallery',
  imports: [],
  templateUrl: './google-photos-gallery.html',
  styleUrl: './google-photos-gallery.css',
})
export class GooglePhotosGallery {
  // Google Photos album képek — automatikusan szinkronizálva
  images: string[] = [
${imagesArray},
  ];

  selectedImage: string | null = null;

  openImage(src: string) {
    this.selectedImage = src;
  }

  closeImage() {
    this.selectedImage = null;
  }
}
`;

  fs.writeFileSync(GALLERY_COMPONENT, content);
  console.log(`📄 google-photos-gallery.ts frissítve: ${imageFiles.length} képpel.`);
}

async function syncPhotos() {
  console.log('🔍 Google Photos album letöltése...\n');

  try {
    const html = await fetchPage(ALBUM_URL);
    const imageUrls = extractImageUrls(html);

    if (imageUrls.length === 0) {
      console.log('❌ Nem találhatók képek az albumban.');
      process.exit(1);
    }

    console.log(`📷 ${imageUrls.length} kép találva az albumban.\n`);

    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    const existingFiles = fs.readdirSync(IMAGES_DIR).filter(f => f.startsWith('photo') && f.endsWith('.jpg'));
    existingFiles.forEach(f => fs.unlinkSync(path.join(IMAGES_DIR, f)));
    if (existingFiles.length > 0) {
      console.log(`🗑️  ${existingFiles.length} régi kép törölve.`);
    }

    const downloaded = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const filename = `photo${i + 1}.jpg`;
      const filepath = path.join(IMAGES_DIR, filename);
      const url = `${imageUrls[i]}=w1200`;

      process.stdout.write(`⬇️  Letöltés: ${filename}...`);
      try {
        await downloadImage(url, filepath);
        downloaded.push(filename);
        console.log(' ✅');
      } catch (err) {
        console.log(' ⚠️  Sikertelen');
      }
    }

    if (downloaded.length === 0) {
      console.log('\n❌ Egyik kép sem tölthető le.');
      process.exit(1);
    }

    console.log(`\n✅ ${downloaded.length} kép sikeresen letöltve!`);

    updateGalleryComponent(downloaded);

    console.log('\n🚀 Futtasd: npm start\n');

  } catch (error) {
    console.error('❌ Hiba:', error.message);
    process.exit(1);
  }
}

syncPhotos();
