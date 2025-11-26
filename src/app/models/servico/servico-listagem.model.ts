import { Preco } from "../preco/preco-response.model";

export interface ServicoListagem {
  id: number;
  nome: string;
  preco: Preco;
  ativo: boolean;
}
