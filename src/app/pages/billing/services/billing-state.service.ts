import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';

@Injectable({ providedIn: 'root' })
export class BillingStateService {
  private billingSubject = new BehaviorSubject<BillingAccessResponse | null>(null);
  billing$ = this.billingSubject.asObservable();

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
    const message = this.decodeBase64(messageEncoded) || undefined;

    const billing: BillingAccessResponse = {
      allowed: true,
      warning,
      type,
      days,
      expiresAt,
      message,
    };
    this.billingSubject.next(billing);
  }

  setFromErrorBody(err: any, returnUrl?: string): void {
    const billing = err?.error?.billing as BillingAccessResponse | undefined;
    if (!billing) return;
    const enriched: BillingAccessResponse = {
      ...billing,
      allowed: billing.allowed ?? false,
      returnUrl: returnUrl ?? this.snapshot?.returnUrl,
    };
    this.billingSubject.next(enriched);
  }

  setFromResponse(billing: BillingAccessResponse): void {
    if (!billing) return;
    this.billingSubject.next(billing);
  }

  setReturnUrl(url: string): void {
    const current = this.snapshot;
    if (!current) {
      this.billingSubject.next({ allowed: false, returnUrl: url });
      return;
    }
    this.billingSubject.next({ ...current, returnUrl: url });
  }

  clear(): void {
    this.billingSubject.next(null);
  }

  private decodeBase64(value: string): string | null {
    if (!value) return null;
    try {
      return atob(value);
    } catch {
      return value;
    }
  }
}
