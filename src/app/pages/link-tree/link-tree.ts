import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Gallery } from '../../components/gallery/gallery';

@Component({
  selector: 'app-link-tree',
  imports: [Gallery],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './link-tree.html',
  styleUrl: './link-tree.css',
})
export class LinkTree {}
