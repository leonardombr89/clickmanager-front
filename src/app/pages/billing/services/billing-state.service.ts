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

  setFromHeaders(headers: HttpHeaders): void {
    const warningHeader = headers.get('X-Billing-Warning');
    if (warningHeader === null) return;

    const type = headers.get('X-Billing-Type') || undefined;
    const daysRaw = headers.get('X-Billing-Days');
    const expiresAt = headers.get('X-Billing-Expires-At') || undefined;
    const messageEncoded = headers.get('X-Billing-Message') || '';

    const warning = warningHeader === 'true';
    const days = daysRaw ? Number(daysRaw) : undefined;
    const message = this.normalizeMessage(this.decodeBase64(messageEncoded) || undefined);

    const billing: BillingAccessResponse = {
      allowed: true,
      warning,
      type,
      days,
      expiresAt,
      message,
    };
    this.setBilling(billing);
  }

  setFromErrorBody(err: any, returnUrl?: string): void {
    const billingRaw = err?.error?.billing as BillingAccessResponse | undefined;
    if (!billingRaw) return;
    const billing = this.normalize(billingRaw);
    const enriched: BillingAccessResponse = {
      ...billing,
      allowed: billing.allowed ?? false,
      returnUrl: returnUrl ?? this.snapshot?.returnUrl,
    };
    this.setBilling(enriched);
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

  private decodeBase64(value: string): string | null {
    if (!value) return null;
    try {
      return atob(value);
    } catch {
      return value;
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
    return { ...billing, checkoutUrl, message: this.normalizeMessage(billing.message) };
  }

  private persist(billing: BillingAccessResponse | null): void {
    if (billing) {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(billing));
    } else {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
