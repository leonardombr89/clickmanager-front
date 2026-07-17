import { DepositoImagem } from '../models/deposito.models';
import { StorageImageVariantType } from '../../storage/models/storage.models';
import {
  resolveStorageImageUrl,
  STORAGE_IMAGE_PLACEHOLDER,
} from '../../storage/utils/storage-media-url.util';

export const DEPOSITO_IMAGE_PLACEHOLDER = STORAGE_IMAGE_PLACEHOLDER;

export function getDepositoImageUrl(
  imagem?: DepositoImagem | null,
  fallback: string = DEPOSITO_IMAGE_PLACEHOLDER,
  preferredVariant?: StorageImageVariantType
): string {
  return resolveStorageImageUrl(imagem, preferredVariant, fallback);
}
