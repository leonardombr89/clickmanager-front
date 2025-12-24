export interface Endereco {
    id?: number;
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string | null;
    bairro?: string;
    cidade?: string;
    estado?: string;
  }
