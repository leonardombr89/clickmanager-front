import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';
import { PlanoPublico } from 'src/app/types/plano-publico.type';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly endpoint = 'api/billing';

  constructor(private api: ApiService) {}

  obterStatus(): Observable<BillingAccessResponse> {
    return this.api.get<BillingAccessResponse>(`${this.endpoint}/access-status`);
  }

  checkout(body: any = {}): Observable<{ linkPagamento?: string; link?: string; initPoint?: string; init_point?: string }> {
    return this.api.post(`${this.endpoint}/checkout`, body);
  }

  listarPlanosPublicos(): Observable<PlanoPublico[]> {
    return this.api.get<PlanoPublico[]>('api/planos/publicos');
  }
}
