export interface PrecoResponseBase {
  id: number;
  tipo: string;
}

export interface PrecoFixoResponse extends PrecoResponseBase {
  tipo: 'FIXO';
  valor: number;
}

export interface PrecoPorQuantidadeResponse extends PrecoResponseBase {
  tipo: 'QUANTIDADE';
  faixas: { quantidade: number; valor: number }[];
}

export interface PrecoPorMetroResponse extends PrecoResponseBase {
  tipo: 'METRO';
  precoMetro: number;
  precoMinimo: number;
  alturaMaxima: number;
  larguraMaxima: number;
  largurasLinearesPermitidas: string;
  modoCobranca: 'QUADRADO' | 'LINEAR';
}

export interface PrecoPorDemandaResponse extends PrecoResponseBase {
  tipo: 'DEMANDA';
  faixas: { de: number; ate: number; valorUnitario: number }[];
}

export interface PrecoPorHoraResponse extends PrecoResponseBase {
  tipo: 'HORA';
  valorHora: number;
  tempoEstimado?: number;
}

export type Preco =
  | PrecoFixoResponse
  | PrecoPorQuantidadeResponse
  | PrecoPorMetroResponse
  | PrecoPorDemandaResponse
  | PrecoPorHoraResponse
