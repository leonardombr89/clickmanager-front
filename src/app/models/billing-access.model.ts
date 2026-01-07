export interface BillingAccessResponse {
  allowed: boolean;
  warning?: boolean;
  type?: 'NONE' | 'PRE_DUE' | 'POST_DUE' | 'BLOCKED' | string;
  days?: number;
  message?: string;
  expiresAt?: string | null;
  statusAssinatura?: string | null;
  empresaId?: number | null;
  planoId?: number | null;
  proprietario?: boolean | null;
  returnUrl?: string;
}
