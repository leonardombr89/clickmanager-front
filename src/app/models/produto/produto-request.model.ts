import { PoliticaRevenda } from "../politica-revenda.model";
import { PoliticaRevendaRequest } from "../politica-revenda/politica-revenda-request.model";
import { VariacaoProdutoRequest } from "./variacao-produto-request.model";

export interface ProdutoRequest {
  nome: string;
  descricao: string;
  variacoes: VariacaoProdutoRequest[];
  categoriaId?: number | null;
  grupoId?: number | null;
  politicaRevenda?: PoliticaRevenda | null;
}
