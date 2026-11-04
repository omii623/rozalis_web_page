import { Component } from '@angular/core';
import { GooglePhotosGallery } from '../../components/google-photos-gallery/google-photos-gallery';

@Component({
  selector: 'app-link-tree',
  imports: [GooglePhotosGallery],
  templateUrl: './link-tree.html',
  styleUrl: './link-tree.css',
})
export class LinkTree {}
