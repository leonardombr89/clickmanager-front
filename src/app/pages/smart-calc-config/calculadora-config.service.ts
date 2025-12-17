import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { CalculadoraConfigRequest } from 'src/app/models/calculadora/calculadora-config-request.model';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { ProdutoOption } from 'src/app/models/produto/produto-option.model';

export interface SmartCalcConfigApiResponse {
  config: CalculadoraConfigResponse | null;
  produtosDisponiveis: ProdutoOption[];
}

@Injectable({ providedIn: 'root' })
export class CalculadoraConfigService {

  private baseUrl = 'api/smartcalc-config';

  constructor(private api: ApiService) {}

  /**
   * Retorna a configuração atual e a lista de produtos disponíveis no SmartCalc.
   */
  getConfigCompleta(): Observable<SmartCalcConfigApiResponse> {
    return this.api.get<SmartCalcConfigApiResponse>(this.baseUrl).pipe(
      map(res => ({
        config: res?.config ?? null,
        produtosDisponiveis: res?.produtosDisponiveis ?? []
      }))
    );
  }

  /**
   * Retorna somente o objeto de configuração (compat com chamadas existentes).
   */ 
  getConfig(): Observable<CalculadoraConfigResponse | null> {
    return this.getConfigCompleta().pipe(map(res => res.config));
  }

  salvar(req: CalculadoraConfigRequest): Observable<CalculadoraConfigResponse | null> {
    return this.api.post<SmartCalcConfigApiResponse | CalculadoraConfigResponse>(this.baseUrl, req).pipe(
      map(res => (res as SmartCalcConfigApiResponse)?.config ?? res as CalculadoraConfigResponse ?? null)
    );
  }
}
