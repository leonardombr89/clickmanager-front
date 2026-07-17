import {
  StorageImageVariant,
  StorageImageVariantType,
  StorageMediaLike,
} from '../models/storage.models';

export const STORAGE_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <rect width="320" height="240" rx="20" fill="#f8fafc"/>
      <rect x="24" y="24" width="272" height="192" rx="16" fill="#eef2ff" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="112" cy="96" r="22" fill="#bfdbfe"/>
      <path d="M56 180l54-58 44 40 34-28 76 46H56z" fill="#93c5fd"/>
      <path d="M124 180l50-46 34 28 56 18H124z" fill="#60a5fa"/>
    </svg>
  `);

const DEFAULT_VARIANT_ORDER: StorageImageVariantType[] = [
  'CARD',
  'MEDIUM',
  'THUMBNAIL',
  'DETAIL',
  'FULL',
  'DESKTOP',
  'TABLET',
  'MOBILE',
  'ZOOM',
];

export function normalizeStorageVariants(
  media: StorageMediaLike | null | undefined
): Partial<Record<StorageImageVariantType, StorageImageVariant>> {
  const variantes = media?.variantes;
  if (!variantes) {
    return {};
  }

  if (Array.isArray(variantes)) {
    return variantes.reduce<Partial<Record<StorageImageVariantType, StorageImageVariant>>>((acc, variante) => {
      if (variante.tipo) {
        acc[variante.tipo] = variante;
      }
      return acc;
    }, {});
  }

  return variantes;
}

export function getStorageVariant(
  media: StorageMediaLike | null | undefined,
  variantType?: StorageImageVariantType
): StorageImageVariant | null {
  if (!variantType) {
    return null;
  }

  return normalizeStorageVariants(media)[variantType] || null;
}

export function hasStorageVariant(
  media: StorageMediaLike | null | undefined,
  variantType?: StorageImageVariantType
): boolean {
  return !!getStorageVariant(media, variantType)?.url?.trim();
}

export function resolveStorageImageUrl(
  media: StorageMediaLike | null | undefined,
  preferredVariant?: StorageImageVariantType,
  fallback: string = STORAGE_IMAGE_PLACEHOLDER
): string {
  const variantes = normalizeStorageVariants(media);
  const preferredUrl = preferredVariant ? variantes[preferredVariant]?.url?.trim() : '';
  if (preferredUrl) {
    return preferredUrl;
  }

  for (const tipo of DEFAULT_VARIANT_ORDER) {
    const url = variantes[tipo]?.url?.trim();
    if (url) {
      return url;
    }
  }

  return (
    media?.displayUrl?.trim() ||
    media?.imagemUrl?.trim() ||
    media?.url?.trim() ||
    media?.thumbnailUrl?.trim() ||
    fallback
  );
}

export function resolveStorageVideoUrl(media: StorageMediaLike & { videoUrl?: string | null } | null | undefined): string {
  return media?.videoUrl?.trim() || media?.url?.trim() || media?.displayUrl?.trim() || '';
}
