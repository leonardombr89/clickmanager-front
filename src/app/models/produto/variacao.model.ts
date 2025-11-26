import { PoliticaRevenda } from "../politica-revenda.model";
import { Preco } from "../preco/preco-response.model";

export interface VariacaoProduto {
    materialId: number | { id: number; nome?: string };
    formatoId:  number | { id: number; nome?: string };
    cor?:       number | { id: number; nome?: string } | null;
  
    // Só para exibição em tabela (opcional)
    corLabel?: string | null;
  
    // IDs
    acabamentos: number[];
    servicos: number[];
  
    // Modelo novo
    preco: Preco | null;
    politicaRevenda?: PoliticaRevenda | null;
  }