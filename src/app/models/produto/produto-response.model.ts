import { PoliticaRevendaResponse } from "../politica-revenda/politica-revenda-response.model";
import { CategoriaResponse } from "./categoria-response.model";
import { GrupoResponse } from "./grupo-response.model";
import { ProdutoVariacaoResponse } from "./produto-variacao-response.model";


export interface ProdutoResponse {
  id: number;
  nome: string;
  descricao: string;
  variacoes: ProdutoVariacaoResponse[];
  ativo: boolean;
  categoria: CategoriaResponse | null;
  grupo: GrupoResponse | null;
  politicaRevenda: PoliticaRevendaResponse | null;
}