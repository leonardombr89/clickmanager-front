import { AcabamentoVariacaoResponse } from "./acabamento-variacao-response.model";

export interface AcabamentoResponse {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  variacoes?: AcabamentoVariacaoResponse[];
}


  