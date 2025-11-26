import { PoliticaRevenda } from "src/app/models/politica-revenda.model";
import { PoliticaRevendaRequest } from "src/app/models/politica-revenda/politica-revenda-request.model";
import { Preco } from "src/app/models/preco/preco-response.model";

export interface ServicoVariacao {
  servicoId: number;
  preco: number;
}

export interface VariacaoProduto {
  id?: number;

  materialId: number | { id: number; label?: string };
  formatoId:  number | { id: number; label?: string };

  cor?: number | { id: number; nome?: string } | null;

  acabamentos: Array<number | { id: number; nome?: string }>;
  servicos:    Array<number | { id: number; nome?: string }>;

  preco: Preco | null;

  politicaRevenda?: PoliticaRevenda | null;
}

