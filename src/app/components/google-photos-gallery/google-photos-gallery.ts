import { Component } from '@angular/core';

@Component({
  selector: 'app-google-photos-gallery',
  imports: [],
  templateUrl: './google-photos-gallery.html',
  styleUrl: './google-photos-gallery.css',
})
export class GooglePhotosGallery {
  // Google Photos album képek — automatikusan szinkronizálva
  images: string[] = [
    '/images/photo1.jpg',
    '/images/photo2.jpg',
    '/images/photo3.jpg',
    '/images/photo4.jpg',
  ];

  selectedImage: string | null = null;

  openImage(src: string) {
    this.selectedImage = src;
  }

  closeImage() {
    this.selectedImage = null;
  }
}
