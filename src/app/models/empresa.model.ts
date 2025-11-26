import { Endereco } from "./endereco.model";

export interface Empresa {
    id?: number;
    nome?: string;
    telefone?: string;
    email?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    horario?: string;
    logoPath?: string;
    endereco?: Endereco;
  }