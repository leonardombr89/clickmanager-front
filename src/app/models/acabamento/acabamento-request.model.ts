import { AcabamentoVariacaoRequest } from './acabamento-variacao-request.model';

export interface AcabamentoRequest {
  nome: string;
  descricao?: string | null;
  variacoes: AcabamentoVariacaoRequest[];
  ativo?: boolean;
}
