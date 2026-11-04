import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { GALLERY_IMAGES } from './gallery-images';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  protected readonly images = GALLERY_IMAGES;
  protected readonly selectedIndex = signal<number | null>(null);

  open(index: number) {
    this.selectedIndex.set(index);
  }

  close() {
    this.selectedIndex.set(null);
  }

  step(delta: number) {
    const i = this.selectedIndex();
    if (i === null) return;
    const n = this.images.length;
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
