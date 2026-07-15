import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  SitePaginaCreateRequest,
  SitePaginaHomeRequest,
  SitePaginaListParams,
  SitePaginaMenuRequest,
  SitePaginaOrdenacaoHomeRequest,
  SitePaginaOrdenacaoMenuRequest,
  SitePaginaPaginaResponse,
  SitePaginaResponse,
  SitePaginaUpdateRequest,
} from '../models/site-pagina.models';

@Injectable({ providedIn: 'root' })
export class SitePaginaService {
  private readonly endpoint = 'api/site/paginas';

  constructor(private readonly api: ApiService) {}

  listar(params: SitePaginaListParams = {}): Observable<SitePaginaPaginaResponse<SitePaginaResponse> | SitePaginaResponse[]> {
    return this.api.get<SitePaginaPaginaResponse<SitePaginaResponse> | SitePaginaResponse[]>(
      this.endpoint,
      this.buildParams(params)
    );
  }

  buscarPorId(id: number): Observable<SitePaginaResponse> {
    return this.api.get<SitePaginaResponse>(`${this.endpoint}/${id}`);
  }

  criar(request: SitePaginaCreateRequest): Observable<SitePaginaResponse> {
    return this.api.post<SitePaginaResponse>(this.endpoint, request);
  }

  atualizar(id: number, request: SitePaginaUpdateRequest): Observable<SitePaginaResponse> {
    return this.api.put<SitePaginaResponse>(`${this.endpoint}/${id}`, request);
  }

  alterarStatus(id: number, ativa: boolean): Observable<SitePaginaResponse> {
    return this.api.patch<SitePaginaResponse>(`${this.endpoint}/${id}/status`, { ativa });
  }

  alterarMenu(id: number, payload: SitePaginaMenuRequest): Observable<SitePaginaResponse> {
    return this.api.patch<SitePaginaResponse>(`${this.endpoint}/${id}/menu`, payload);
  }

  alterarHome(id: number, payload: SitePaginaHomeRequest): Observable<SitePaginaResponse> {
    return this.api.patch<SitePaginaResponse>(`${this.endpoint}/${id}/home`, payload);
  }

  reordenarMenu(payload: SitePaginaOrdenacaoMenuRequest): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/ordem-menu`, payload);
  }

  reordenarHome(payload: SitePaginaOrdenacaoHomeRequest): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/ordem-home`, payload);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  private buildParams(params: SitePaginaListParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.textoPesquisa?.trim()) {
      httpParams = httpParams.set('textoPesquisa', params.textoPesquisa.trim());
    }

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', String(params.page));
    }

    if (params.size !== undefined) {
      httpParams = httpParams.set('size', String(params.size));
    }

    if (params.sort?.trim()) {
      httpParams = httpParams.set('sort', params.sort.trim());
    }

    return httpParams;
  }
}
