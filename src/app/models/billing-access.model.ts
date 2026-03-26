export interface BillingAccessResponse {
  allowed: boolean;
  warning?: boolean;
  type?: 'NONE' | 'PRE_DUE' | 'POST_DUE' | 'BLOCKED' | string;
  diasVencimento?: number;
  diasVencidos?: number;
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
  originalValue?: number | null;
  finalValue?: number | null;
  originalValueCentavos?: number | null;
  finalValueCentavos?: number | null;
  requiresPayment?: boolean;
  benefitApplied?: boolean;
  benefitCode?: string | null;
  message?: string | null;
  confirmationMode?: 'PAYMENT_CONFIRMED' | 'PARTIAL_BENEFIT' | 'BENEFIT_EXEMPTION' | 'ALREADY_REGULAR' | string;
  outcome?: 'PAYMENT_REQUIRED' | 'BENEFIT_APPLIED' | 'ALREADY_REGULAR' | string;
}
