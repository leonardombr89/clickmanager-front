export interface BillingAccessResponse {
  allowed: boolean;
  warning?: boolean;
  type?: 'NONE' | 'PRE_DUE' | 'POST_DUE' | 'BLOCKED' | string;
  days?: number;
  message?: string;
  expiresAt?: string | null;
  checkoutUrl?: string | null;
  statusAssinatura?: string | null;
  empresaId?: number | null;
  planoId?: number | null;
  proprietario?: boolean | null;
  returnUrl?: string;
}

export interface ErrorResponseWithBilling {
  status: number;
  error: string;
  message: string;
  path: string;
  billing?: BillingAccessResponse;
}

export interface CheckoutResponse {
  provider: 'ASAAS' | 'MERCADOPAGO' | string;
  paymentId?: string;
  initPoint?: string;
  invoiceUrl?: string;
  paymentReference?: string;
}
