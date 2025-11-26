import { PrecoRequest } from "../preco/preco.model";

export interface ProdutoVariacaoRequest {
  produtoId: number;
  materialId: number;
  formatoId: number;
  acabamentoIds?: number[]; 
  servicoIds?: number[];   
  corId?: number;
  preco: PrecoRequest;
}