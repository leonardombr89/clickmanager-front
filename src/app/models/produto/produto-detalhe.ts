import { ProdutoVariacaoDetalheResponse } from "./produto-variacao-detalhe-response";
import { Produto } from "./produto.model";

export interface ProdutoDetalhe extends Produto {
    variacoes: ProdutoVariacaoDetalheResponse[];
  }