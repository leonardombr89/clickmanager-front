import { PagamentoRequest } from "../pagamento/pagamento-request.model";
import { PedidoItemRequest } from "./pedido-item-request.model";

export interface PedidoRequest {
  clienteId: number | null;
  responsavelId: number | null;
  itens: PedidoItemRequest[];
  acrescimo?: number;
  frete?: number;
  desconto?: number;
  observacoes?: string;
  pagamentos?: PagamentoRequest[];
  orcamento?: boolean;
  nomeOrcamento?: string | null;
  vencimentoOrcamento?: string | null;
}

