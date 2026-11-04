import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';

/** A sync-photos.js által generált lista (public/images/gallery.json). */
export interface GalleryManifest {
  fingerprint?: string;
  images: string[];
}

export const GALLERY_MANIFEST_URL = '/images/gallery.json';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  protected readonly images = signal<readonly string[]>([]);
  protected readonly loaded = signal(false);
  protected readonly selectedIndex = signal<number | null>(null);

  constructor() {
    // Futásidőben töltjük be, így a buildelt oldalon újrafordítás nélkül cserélhetők a képek.
    fetch(GALLERY_MANIFEST_URL, { cache: 'no-cache' })
      .then((res) => (res.ok ? (res.json() as Promise<GalleryManifest>) : { images: [] }))
      .then((manifest) => this.images.set(manifest.images ?? []))
      .catch(() => this.images.set([]))
      .finally(() => this.loaded.set(true));
  }

  open(index: number) {
    this.selectedIndex.set(index);
  }

  close() {
    this.selectedIndex.set(null);
  }

  step(delta: number) {
    const i = this.selectedIndex();
    const n = this.images().length;
    if (i === null || n === 0) return;
    this.selectedIndex.set((i + delta + n) % n);
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.selectedIndex() === null) return;
    if (event.key === 'Escape') this.close();
    else if (event.key === 'ArrowRight') this.step(1);
    else if (event.key === 'ArrowLeft') this.step(-1);
  }
}
