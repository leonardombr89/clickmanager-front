import { PoliticaRevenda } from "../politica-revenda.model";
import { Preco } from "../preco/preco-response.model";

export interface ProdutoListagem {
  id: number;
  nome: string;
  descricao: string | null;
  variacoes: string[];                        
  categoria: string | null;
  grupo: string | null;
  politicaRevenda: PoliticaRevenda | null;
  ativo: boolean;   
  preco: Preco;                           
}