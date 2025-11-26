import { AcabamentoResponse } from "../acabamento/acabamento-response.model";
import { Preco } from "../preco/preco-response.model";
import { ServicoResponse } from "../servico/servico-response.model";

export interface ProdutoVariacaoResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  materialId: number;
  materialNome: string;
  formatoId: number;
  formatoNome: string;
  corId?: number;
  corNome?: string;

  acabamentos: AcabamentoResponse[];
  servicos: ServicoResponse[];

  precoId: number;
  tipoPreco: string;
  preco?: Preco;
  
  ativo: boolean;
}
  