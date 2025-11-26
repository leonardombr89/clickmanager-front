import { Acabamento } from "../acabamento/acabamento.model";
import { Cor } from "../cor.model";
import { Formato } from "../formato.model";
import { Material } from "../material.model";
import { PoliticaRevenda } from "../politica-revenda.model";
import { Preco } from "../preco/preco-response.model";


export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  formato?: Formato;
  material?: Material;
  acabamento?: Acabamento;
  cor?: Cor;
  preco?: Preco;
  politicaRevenda?: PoliticaRevenda;
}

  