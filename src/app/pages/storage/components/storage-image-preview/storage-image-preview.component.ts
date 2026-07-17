import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StorageImageVariantType, StorageMediaLike } from '../../models/storage.models';
import {
  resolveStorageImageUrl,
  STORAGE_IMAGE_PLACEHOLDER,
} from '../../utils/storage-media-url.util';

@Component({
  selector: 'app-storage-image-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <img
      class="storage-image-preview"
      [src]="src"
      [alt]="alt"
      [attr.width]="width || null"
      [attr.height]="height || null"
      loading="lazy"
      decoding="async"
      (error)="onError($event)"
    />
  `,
  styles: [`
    .storage-image-preview {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e5eaef;
      display: block;
    }
  `],
})
export class StorageImagePreviewComponent {
  @Input() media?: StorageMediaLike | null;
  @Input() variant: StorageImageVariantType = 'CARD';
  @Input() alt = 'Arquivo';
  @Input() width?: number | null;
  @Input() height?: number | null;

  get src(): string {
    return resolveStorageImageUrl(this.media, this.variant);
  }

  onError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img || img.dataset['fallbackApplied'] === 'true') {
      return;
    }

    img.dataset['fallbackApplied'] = 'true';
    img.src = STORAGE_IMAGE_PLACEHOLDER;
  }
}
