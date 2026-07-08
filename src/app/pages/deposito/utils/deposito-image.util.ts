import { DepositoImagem } from '../models/deposito.models';

export const DEPOSITO_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;utf8,"
  + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240">
      <rect width="320" height="240" rx="24" fill="#f8fafc"/>
      <rect x="20" y="20" width="280" height="200" rx="18" fill="#eef2ff" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="110" cy="95" r="22" fill="#bfdbfe"/>
      <path d="M52 182l58-60 44 38 36-30 78 52H52z" fill="#93c5fd"/>
      <path d="M120 182l52-48 34 28 62 20H120z" fill="#60a5fa"/>
    </svg>
  `);

export function getDepositoImageUrl(
  imagem?: DepositoImagem | null,
  fallback: string = DEPOSITO_IMAGE_PLACEHOLDER
): string {
  return imagem?.displayUrl?.trim() || fallback;
}
