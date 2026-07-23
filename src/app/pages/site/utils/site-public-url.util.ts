import { SiteConfigResponse } from '../models/site-config.models';

const CLICKMANAGER_PUBLIC_DOMAIN = 'clickmanager.com.br';
const DEFAULT_PUBLIC_SLUG = 'nome-da-empresa';
const VALID_CUSTOM_DOMAIN_STATUSES = new Set([
  'ATIVO',
  'ACTIVE',
  'VALIDO',
  'VALID',
  'VALIDADO',
  'VERIFICADO',
  'VERIFIED',
  'CONFIGURADO',
  'OK',
]);

export function getUrlClickManager(slug: string | null | undefined): string {
  const slugNormalizado = normalizarSlugPublico(slug) || DEFAULT_PUBLIC_SLUG;
  return `https://${slugNormalizado}.${CLICKMANAGER_PUBLIC_DOMAIN}`;
}

export function getUrlDominioProprio(dominio: string | null | undefined): string {
  const dominioNormalizado = normalizarDominioProprio(dominio);
  return dominioNormalizado ? `https://${dominioNormalizado}` : '';
}

export function getUrlPublicaPrincipal(config: SiteConfigResponse | null | undefined): string {
  if (config && dominioProprioAtivo(config)) {
    return getUrlDominioProprio(config.dominioCustom);
  }

  return getUrlClickManager(config?.slugPublico);
}

export function dominioProprioAtivo(config: SiteConfigResponse): boolean {
  if (!normalizarDominioProprio(config.dominioCustom)) {
    return false;
  }

  return config.dominioCustomAtivo === true
    || config.dominioVerificado === true
    || statusDominioValido(config.statusDominio);
}

export function normalizarSlugPublico(slug: string | null | undefined): string {
  return String(slug || '').trim();
}

export function normalizarDominioProprio(dominio: string | null | undefined): string {
  return String(dominio || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .replace(/\.+$/, '')
    .toLowerCase();
}

function statusDominioValido(status: string | null | undefined): boolean {
  return VALID_CUSTOM_DOMAIN_STATUSES.has(String(status || '').trim().toUpperCase());
}
