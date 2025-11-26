import { Permissao } from "./permissao.model";

export interface Perfil {
    id: number;
    nome: string;
    descricao?: string;
    permissoes: Permissao[];
  }