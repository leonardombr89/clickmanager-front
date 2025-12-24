import { Endereco } from "../endereco/endereco.model";

export interface ClienteResponse {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    documento: string;
    endereco: Endereco;
  }