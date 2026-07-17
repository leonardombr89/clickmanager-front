import {
  resolveStorageImageUrl,
  STORAGE_IMAGE_PLACEHOLDER,
} from './storage-media-url.util';
import { StorageMediaLike } from '../models/storage.models';

describe('storage-media-url.util', () => {
  it('uses preferred variant from object', () => {
    const media: StorageMediaLike = {
      variantes: {
        CARD: { tipo: 'CARD', url: 'card.webp' },
        DETAIL: { tipo: 'DETAIL', url: 'detail.webp' },
      },
      displayUrl: 'legacy.jpg',
    };

    expect(resolveStorageImageUrl(media, 'DETAIL')).toBe('detail.webp');
  });

  it('uses preferred variant from array', () => {
    const media: StorageMediaLike = {
      variantes: [
        { tipo: 'THUMBNAIL', url: 'thumb.webp' },
        { tipo: 'CARD', url: 'card.webp' },
      ],
    };

    expect(resolveStorageImageUrl(media, 'THUMBNAIL')).toBe('thumb.webp');
  });

  it('falls back to another available variant', () => {
    const media: StorageMediaLike = {
      variantes: {
        MEDIUM: { tipo: 'MEDIUM', url: 'medium.webp' },
      },
    };

    expect(resolveStorageImageUrl(media, 'ZOOM')).toBe('medium.webp');
  });

  it('falls back to displayUrl, imagemUrl, url and placeholder', () => {
    expect(resolveStorageImageUrl({ displayUrl: 'display.jpg' }, 'CARD')).toBe('display.jpg');
    expect(resolveStorageImageUrl({ imagemUrl: 'imagem.jpg' }, 'CARD')).toBe('imagem.jpg');
    expect(resolveStorageImageUrl({ url: 'url.jpg' }, 'CARD')).toBe('url.jpg');
    expect(resolveStorageImageUrl(null, 'CARD')).toBe(STORAGE_IMAGE_PLACEHOLDER);
  });
});
