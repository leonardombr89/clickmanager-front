import { Endereco } from "../endereco/endereco.model";


export interface Empresa {
    id?: number;
    nome?: string;
    telefone?: string;
    email?: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    horario?: string;
    logoPath?: string | null;
    dataCriacao?: string;
    ativa?: boolean;
    endereco?: Endereco;
  }
