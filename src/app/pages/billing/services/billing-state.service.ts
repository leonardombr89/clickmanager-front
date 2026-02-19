import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';

@Injectable({ providedIn: 'root' })
export class BillingStateService {
  private readonly STORAGE_KEY = 'billing_state';
  private readonly RETURN_URL_KEY = 'billing_return_url';
  private billingSubject = new BehaviorSubject<BillingAccessResponse | null>(null);
  billing$ = this.billingSubject.asObservable();

  constructor() {
    const stored = sessionStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as BillingAccessResponse;
        this.billingSubject.next(parsed);
      } catch {
        sessionStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  get snapshot(): BillingAccessResponse | null {
    return this.billingSubject.value;
  }

  get blocked$() {
    return this.billing$.pipe(map((billing) => !!billing && billing.allowed === false));
  }

  get warning$() {
    return this.billing$.pipe(map((billing) => !!billing && billing.warning === true));
  }

  setFromHttpResponse(body: any, headers: HttpHeaders): void {
    const bodyBillingRaw = this.extractBillingFromBody(body);
    const headerBilling = this.parseFromHeaders(headers);

    if (bodyBillingRaw) {
      const bodyBilling = this.normalize(bodyBillingRaw);
      this.warnIfDivergent(bodyBilling, headerBilling, 'response');
      this.setBilling(bodyBilling);
      return;
    }

    if (headerBilling) {
      this.setBilling(headerBilling);
    }
  }

  setFromHttpError(err: any, returnUrl?: string): void {
    const bodyBillingRaw = err?.error?.billing as BillingAccessResponse | undefined;
    const headerBilling = this.parseFromHeaders(err?.headers);
    const preferred = bodyBillingRaw ? this.normalize(bodyBillingRaw) : headerBilling;
    if (!preferred) return;

    if (bodyBillingRaw) {
      this.warnIfDivergent(preferred, headerBilling, 'error');
    }

    const enriched: BillingAccessResponse = {
      ...preferred,
      allowed: err?.status === 402 ? false : (preferred.allowed ?? false),
      returnUrl: returnUrl ?? this.snapshot?.returnUrl,
    };
    this.setBilling(enriched);
  }

  setFromHeaders(headers: HttpHeaders): void {
    const billing = this.parseFromHeaders(headers);
    if (!billing) return;
    this.setBilling(billing);
  }

  setFromErrorBody(err: any, returnUrl?: string): void {
    this.setFromHttpError(err, returnUrl);
  }

  setFromResponse(billing: BillingAccessResponse): void {
    if (!billing) return;
    this.setBilling(this.normalize(billing));
  }

  setReturnUrl(url: string): void {
    const current = this.snapshot;
    const nextValue = current ? { ...current, returnUrl: url } : { allowed: false, returnUrl: url };
    sessionStorage.setItem(this.RETURN_URL_KEY, url);
    this.billingSubject.next(nextValue);
    this.persist(nextValue);
  }

  getReturnUrl(): string | null {
    return sessionStorage.getItem(this.RETURN_URL_KEY);
  }

  clear(): void {
    this.billingSubject.next(null);
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.RETURN_URL_KEY);
  }

  formatDaysLabel(days?: number | null): string | null {
    if (typeof days !== 'number' || !Number.isFinite(days)) return null;
    if (days > 0) return `Venceu há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    if (days === 0) return 'Vence hoje';
    const future = Math.abs(days);
    return `Vence em ${future} ${future === 1 ? 'dia' : 'dias'}`;
  }

  private decodeBase64(value: string): string | null {
    if (!value) return null;
    try {
      return atob(value);
    } catch {
      return value;
    }
  }

  private parseBoolean(value: string | null | undefined): boolean {
    if (!value) return false;
    const normalized = value.toString().trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'sim';
  }

  private extractBillingFromBody(body: any): BillingAccessResponse | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const candidate = (body as any).billing;
    if (candidate && typeof candidate === 'object') {
      return candidate as BillingAccessResponse;
    }
    return undefined;
  }

  private parseFromHeaders(headers?: HttpHeaders | null): BillingAccessResponse | null {
    if (!headers) return null;
    const warningHeader = headers.get('X-Billing-Warning');
    if (warningHeader === null) return null;

    const type = headers.get('X-Billing-Type') || undefined;
    const expiresAt = headers.get('X-Billing-Expires-At') || undefined;
    const messageEncoded = headers.get('X-Billing-Message') || '';
    const days = this.parseInteger(headers.get('X-Billing-Days'), 'X-Billing-Days');

    return {
      allowed: true,
      warning: this.parseBoolean(warningHeader),
      type,
      days,
      expiresAt,
      message: this.normalizeMessage(this.decodeBase64(messageEncoded) || undefined),
    };
  }

  private parseInteger(value: string | null | undefined, source: string): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      console.warn(`[BillingState] valor inválido em ${source}:`, value);
      return undefined;
    }
    return Math.trunc(parsed);
  }

  private warnIfDivergent(
    bodyBilling: BillingAccessResponse,
    headerBilling: BillingAccessResponse | null,
    source: 'response' | 'error'
  ): void {
    if (!headerBilling) return;
    const diffDays = bodyBilling.days !== undefined && headerBilling.days !== undefined && bodyBilling.days !== headerBilling.days;
    const diffType = !!bodyBilling.type && !!headerBilling.type && bodyBilling.type !== headerBilling.type;
    const diffWarning = bodyBilling.warning !== undefined && headerBilling.warning !== undefined && bodyBilling.warning !== headerBilling.warning;
    if (diffDays || diffType || diffWarning) {
      console.warn('[BillingState] divergência entre body.billing e headers, priorizando body.billing', {
        source,
        body: bodyBilling,
        headers: headerBilling,
      });
    }
  }

  private normalizeMessage(msg?: string | null): string | undefined {
    if (!msg) return msg ?? undefined;
    try {
      const fixed = decodeURIComponent(escape(msg));
      return fixed || msg;
    } catch {
      return msg;
    }
  }

  private setBilling(billing: BillingAccessResponse): void {
    this.billingSubject.next(billing);
    this.persist(billing);
  }

  private normalize(billing: BillingAccessResponse): BillingAccessResponse {
    const checkoutUrl = (billing as any).checkoutUrl ?? (billing as any).checkout_url ?? (billing as any).checkouturl;
    const diasVencimentoRaw = (billing as any).diasVencimento ?? (billing as any).diasVencidos;
    const normalizedDays =
      typeof billing.days === 'number'
        ? billing.days
        : this.parseInteger(
            (billing as any).days ?? diasVencimentoRaw,
            (billing as any).days !== undefined ? 'body.billing.days' : 'body.billing.diasVencimento'
          );

    return {
      ...billing,
      diasVencimento: normalizedDays,
      days: normalizedDays,
      checkoutUrl,
      message: this.normalizeMessage(billing.message),
    };
  }

  private persist(billing: BillingAccessResponse | null): void {
    if (billing) {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(billing));
    } else {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
