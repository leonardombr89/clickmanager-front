import { PoliticaRevendaResponse } from "../politica-revenda/politica-revenda-response.model";


export interface ProdutoListResponse {
  id: number;
  nome: string;
  descricao: string;
  variacoes: string[];
  categoria: string;
  grupo: string;
  politicaRevenda: PoliticaRevendaResponse | null;
  ativo: boolean;
}
