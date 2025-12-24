import { PrecoRequest } from "../preco/preco.model";

export interface VariacaoProdutoRequest {
    
    produtoId?: number;
    materialId: number;
    formatoId?: number | null;
    acabamentoIds?: number[];
    servicoIds?: number[];
    corId?: number | null;
    preco: PrecoRequest;

  }
