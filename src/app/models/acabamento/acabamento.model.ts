import { Preco } from "../preco/preco-response.model";

export interface Acabamento {
    id?: number;
    nome: string;
    descricao: string;
    preco: Preco;
    ativo: boolean;
  }