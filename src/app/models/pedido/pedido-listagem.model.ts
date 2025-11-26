export interface PedidoListagem {
  id: number;
  numero: string;
  status: string;
  dataCriacao: string;
  total: number;
  valorTotalPago: number;
  restaPagar: number;
  nomeCliente?: string;
  nomeResponsavel?: string;
}
