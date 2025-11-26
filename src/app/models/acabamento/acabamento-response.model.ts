import { Preco } from "../preco/preco-response.model";

export interface AcabamentoResponse {
    id: number;
    nome: string;
    descricao: string | null;
    preco: Preco | null;
    ativo: boolean;
  }