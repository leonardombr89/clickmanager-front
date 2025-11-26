import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { CalculadoraConfigRequest } from 'src/app/models/calculadora/calculadora-config-request.model';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CalculadoraConfigListResponse } from 'src/app/models/calculadora/calculadora-config-list-response.model';

@Injectable({ providedIn: 'root' })
export class CalculadoraConfigService {

  private baseUrl = 'api/calculadora-config';

  constructor(private api: ApiService) {}

  getConfig(): Observable<CalculadoraConfigResponse> {
    return this.api.get<CalculadoraConfigResponse>(`${this.baseUrl}`);
  }

  salvar(req: CalculadoraConfigRequest): Observable<CalculadoraConfigResponse> {
    return this.api.post<CalculadoraConfigResponse>(this.baseUrl, req);
  }
}
