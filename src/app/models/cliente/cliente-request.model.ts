import { Endereco } from "../endereco.model";

export interface ClienteRequest {
    nome: string;
    email: string;
    telefone: string;
    documento: string;
    endereco: Endereco;
  }