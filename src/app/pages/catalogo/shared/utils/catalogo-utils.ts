import {
  CatalogoTipoCaracteristica,
  CatalogoUnidadeCaracteristica,
  CatalogoUnidadeVenda,
} from '../models/catalogo.models';

export const CATALOGO_UNIDADES_VENDA: Array<{ value: CatalogoUnidadeVenda; label: string }> = [
  { value: 'UNIDADE', label: 'Unidade' },
  { value: 'METRO', label: 'Metro' },
  { value: 'METRO_QUADRADO', label: 'Metro quadrado' },
  { value: 'METRO_CUBICO', label: 'Metro cubico' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'PACOTE', label: 'Pacote' },
  { value: 'SACO', label: 'Saco' },
  { value: 'LITRO', label: 'Litro' },
  { value: 'MILILITRO', label: 'Mililitro' },
  { value: 'QUILOGRAMA', label: 'Quilograma' },
  { value: 'GRAMA', label: 'Grama' },
  { value: 'PAR', label: 'Par' },
  { value: 'JOGO', label: 'Jogo' },
  { value: 'ROLO', label: 'Rolo' },
];

export const CATALOGO_TIPOS_CARACTERISTICA: Array<{ value: CatalogoTipoCaracteristica; label: string }> = [
  { value: 'TEXTO', label: 'Texto' },
  { value: 'TEXTO_LONGO', label: 'Texto longo' },
  { value: 'INTEIRO', label: 'Inteiro' },
  { value: 'DECIMAL', label: 'Decimal' },
  { value: 'BOOLEANO', label: 'Booleano' },
  { value: 'DATA', label: 'Data' },
  { value: 'SELECAO_UNICA', label: 'Selecao unica' },
  { value: 'SELECAO_MULTIPLA', label: 'Selecao multipla' },
];

export const CATALOGO_UNIDADES_CARACTERISTICA: Array<{ value: CatalogoUnidadeCaracteristica; label: string }> = [
  { value: 'SEM_UNIDADE', label: 'Sem unidade' },
  { value: 'MILIMETRO', label: 'Milimetro' },
  { value: 'CENTIMETRO', label: 'Centimetro' },
  { value: 'METRO', label: 'Metro' },
  { value: 'MILIMETRO_QUADRADO', label: 'Milimetro quadrado' },
  { value: 'CENTIMETRO_QUADRADO', label: 'Centimetro quadrado' },
  { value: 'METRO_QUADRADO', label: 'Metro quadrado' },
  { value: 'MILILITRO', label: 'Mililitro' },
  { value: 'LITRO', label: 'Litro' },
  { value: 'GRAMA', label: 'Grama' },
  { value: 'QUILOGRAMA', label: 'Quilograma' },
  { value: 'UNIDADE', label: 'Unidade' },
  { value: 'PECA', label: 'Peca' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'PORCENTAGEM', label: 'Porcentagem' },
  { value: 'MINUTO', label: 'Minuto' },
  { value: 'HORA', label: 'Hora' },
  { value: 'DIA', label: 'Dia' },
];

export function catalogoSlugify(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function catalogoLabel<T extends string>(options: Array<{ value: T; label: string }>, value?: T | null): string {
  return options.find((item) => item.value === value)?.label || value || '-';
}

export function catalogoPrecoLabel(valor?: number | null): string {
  if (valor === undefined || valor === null) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor));
}

export function catalogoBooleanLabel(value?: boolean | null): string {
  return value ? 'Sim' : 'Nao';
}

export function catalogoErrorMessage(error: any, fallback: string): string {
  return error?.error?.message || error?.error?.mensagem || error?.message || fallback;
}
