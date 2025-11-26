export interface PrecoRequestBase {
    tipo: string;
    descricao?: string;
    ativo?: boolean;
  }
  
  export interface PrecoFixoRequest extends PrecoRequestBase {
    tipo: 'FIXO';
    valor: number;
  }
  
  export interface PrecoPorQuantidadeRequest extends PrecoRequestBase {
    tipo: 'QUANTIDADE';
    faixas: { quantidade: number; valor: number }[];
  }
  
  export interface PrecoPorMetroRequest extends PrecoRequestBase {
    tipo: 'METRO';
    precoMetro: number;
    precoMinimo?: number;
    alturaMaxima?: number;
    larguraMaxima?: number;
    largurasLinearesPermitidas?: string;
    modoCobranca: 'QUADRADO' | 'LINEAR';
  }
  
  export interface PrecoPorDemandaRequest extends PrecoRequestBase {
    tipo: 'DEMANDA';
    faixas: { de: number; ate: number; valorUnitario: number }[];
  }
  
  export type PrecoRequest =
    | PrecoFixoRequest
    | PrecoPorQuantidadeRequest
    | PrecoPorMetroRequest
    | PrecoPorDemandaRequest;
  