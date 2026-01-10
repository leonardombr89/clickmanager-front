import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { BillingAccessResponse, CheckoutResponse } from 'src/app/models/billing-access.model';
import { PlanoPublico } from 'src/app/types/plano-publico.type';
import { BillingStateService } from './billing-state.service';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly endpoint = 'api/billing';
  private readonly assinaturaCheckoutEndpoint = 'api/assinaturas/checkout';

  constructor(
    private api: ApiService,
    private billingState: BillingStateService
  ) {}

  obterStatus(): Observable<BillingAccessResponse> {
    const snapshot = this.billingState.snapshot;
    if (snapshot && snapshot.allowed === false) {
      return of(snapshot);
    }
    return this.api.get<BillingAccessResponse>(`${this.endpoint}/access-status`);
  }

  checkout(body: any = {}): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>(`${this.endpoint}/checkout`, body);
  }

  checkoutAssinatura(planoId: number): Observable<CheckoutResponse> {
    return this.api.post<CheckoutResponse>(this.assinaturaCheckoutEndpoint, { planoId });
  }

  resumoAssinatura(): Observable<any> {
    return this.api.get<any>('api/billing/assinatura/resumo');
  }

  checkoutUrl(url: string, body: any = {}): Observable<CheckoutResponse> {
    const normalized = this.normalizeUrl(url);
    return this.api.post<CheckoutResponse>(normalized, body);
  }

  listarPlanosPublicos(): Observable<PlanoPublico[]> {
    return this.api.get<PlanoPublico[]>('api/planos/publicos');
  }

  private normalizeUrl(url: string): string {
    if (!url) return `${this.endpoint}/checkout`;
    if (url.startsWith('http')) return url;
    const clean = url.replace(/^\/+/, '');
    return clean.startsWith('api/') ? clean : `api/${clean}`;
  }
}
