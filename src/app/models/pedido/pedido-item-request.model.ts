import { ItemTipo } from "./item-tipo.enum";

export interface PedidoItemRequest {
  id?: number;

  // hierarquia
  grupoKey?: string;
  tipo: ItemTipo;

  // descrição e valores
  descricao: string;
  quantidade: number;
  valor: number;
  subTotal?: number;

  // base
  produtoId?: number;
  produtoVariacaoId?: number;
  largura?: number;
  altura?: number;

  // filhos (um OU outro, dependendo do tipo)
  servicoId?: number;
  acabamentoId?: number;
}