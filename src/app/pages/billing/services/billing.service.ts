import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from 'src/app/services/api.service';
import { BillingAccessResponse, CheckoutResponse } from 'src/app/models/billing-access.model';
import { PlanoPublico } from 'src/app/types/plano-publico.type';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly endpoint = 'api/billing';
  private readonly assinaturaCheckoutEndpoint = 'api/assinaturas/checkout';

  constructor(private api: ApiService) {}

  obterStatus(): Observable<BillingAccessResponse> {
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

  listarPlanosInternos(): Observable<PlanoPublico[]> {
    return this.api.get<any[]>('api/billing/planos').pipe(
      map((planos) => (planos || []).map((plano, idx) => this.normalizarPlano(plano, idx)))
    );
  }

  checkoutUrl(url: string, body: any = {}): Observable<CheckoutResponse> {
    const normalized = this.normalizeUrl(url);
    return this.api.post<CheckoutResponse>(normalized, body);
  }

  listarPlanosPublicos(): Observable<PlanoPublico[]> {
    return this.api.get<any[]>('api/public/planos').pipe(
      map((planos) => (planos || []).map((plano, idx) => this.normalizarPlano(plano, idx)))
    );
  }

  private normalizeUrl(url: string): string {
    if (!url) return `${this.endpoint}/checkout`;
    if (url.startsWith('http')) return url;
    const clean = url.replace(/^\/+/, '');
    return clean.startsWith('api/') ? clean : `api/${clean}`;
  }

  private normalizarPlano(plano: any, idx: number): PlanoPublico {
    const precoOriginalCentavos = plano?.precoOriginalCentavos ?? plano?.preco_original_centavos ?? plano?.precoCentavos ?? plano?.preco_centavos ?? 0;
    const precoFinalCentavos = plano?.precoFinalCentavos ?? plano?.preco_final_centavos ?? plano?.precoCentavos ?? plano?.preco_centavos ?? 0;
    const valorOriginal = plano?.valorOriginal ?? plano?.valor_original ?? (Number.isFinite(precoOriginalCentavos) ? precoOriginalCentavos / 100 : 0);
    const valorFinal = plano?.valorFinal ?? plano?.valor_final ?? (Number.isFinite(precoFinalCentavos) ? precoFinalCentavos / 100 : 0);
    const ordemExibicao = plano?.ordemExibicao ?? plano?.ordem_exibicao ?? 0;
    const beneficiosJson = plano?.beneficiosJson ?? plano?.beneficios_json ?? null;
    const limitesJson = plano?.limitesJson ?? plano?.limites_json ?? null;
    const destaque = typeof plano?.destaque === 'string' ? plano.destaque.trim() || null : null;

    return {
      ...plano,
      precoCentavos: precoFinalCentavos,
      preco_centavos: precoFinalCentavos,
      precoOriginalCentavos,
      precoFinalCentavos,
      valorOriginal,
      valorFinal,
      ordemExibicao,
      ordem_exibicao: ordemExibicao,
      beneficiosJson,
      beneficios_json: beneficiosJson,
      limitesJson,
      limites_json: limitesJson,
      benefitApplied: Boolean(plano?.benefitApplied),
      benefitCode: plano?.benefitCode ?? null,
      benefitType: plano?.benefitType ?? null,
      mercadoPagoPlanId: plano?.mercadoPagoPlanId ?? plano?.mercado_pago_plan_id ?? null,
      mercado_pago_plan_id: plano?.mercadoPagoPlanId ?? plano?.mercado_pago_plan_id ?? null,
      destaque,
      vantagem: typeof plano?.vantagem === 'string' ? plano.vantagem.trim() : plano?.vantagem,
      imgSrc: plano?.imgSrc || this.fallbackImg(idx),
      popular: plano?.popular ?? !!destaque,
    };
  }

  private fallbackImg(idx: number): string {
    const assets = [
      'assets/images/backgrounds/silver.png',
      'assets/images/backgrounds/bronze.png',
      'assets/images/backgrounds/gold.png',
    ];
    return assets[idx % assets.length];
  }
}
