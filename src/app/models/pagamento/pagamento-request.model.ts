export interface PagamentoRequest {
    forma: string;
    valor: number;
    confirmado?: boolean;
  }