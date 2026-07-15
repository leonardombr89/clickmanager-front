import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  SiteBannerCreateRequest,
  SiteBannerListParams,
  SiteBannerOrdenacaoRequest,
  SiteBannerPaginaResponse,
  SiteBannerResponse,
  SiteBannerUpdateRequest,
} from '../models/site-banner.models';

@Injectable({ providedIn: 'root' })
export class SiteBannerService {
  private readonly endpoint = 'api/site/banners';

  constructor(private readonly api: ApiService) {}

  listar(params: SiteBannerListParams = {}): Observable<SiteBannerPaginaResponse<SiteBannerResponse> | SiteBannerResponse[]> {
    return this.api.get<SiteBannerPaginaResponse<SiteBannerResponse> | SiteBannerResponse[]>(
      this.endpoint,
      this.buildParams(params)
    );
  }

  buscarPorId(id: number): Observable<SiteBannerResponse> {
    return this.listar().pipe(
      map((response) => {
        const banners = Array.isArray(response) ? response : response.content || [];
        const banner = banners.find((item) => Number(item.id) === Number(id));
        if (!banner) {
          throw new Error('Banner do site não encontrado.');
        }
        return banner;
      })
    );
  }

  criar(request: SiteBannerCreateRequest): Observable<SiteBannerResponse> {
    return this.api.post<SiteBannerResponse>(this.endpoint, this.toFormData(request));
  }

  atualizar(id: number, request: SiteBannerUpdateRequest): Observable<SiteBannerResponse> {
    return this.api.put<SiteBannerResponse>(`${this.endpoint}/${id}`, this.toFormData(request));
  }

  alterarStatus(id: number, ativo: boolean): Observable<SiteBannerResponse> {
    return this.api.patch<SiteBannerResponse>(`${this.endpoint}/${id}/status`, { ativo });
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  reordenar(payload: SiteBannerOrdenacaoRequest): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/ordem`, payload);
  }

  private toFormData(request: SiteBannerCreateRequest | SiteBannerUpdateRequest): FormData {
    const formData = new FormData();

    this.appendString(formData, 'titulo', request.titulo);
    this.appendString(formData, 'subtitulo', request.subtitulo);
    this.appendString(formData, 'descricao', request.descricao);
    this.appendString(formData, 'ctaTexto', request.ctaTexto);
    this.appendString(formData, 'ctaUrl', request.ctaUrl);
    this.appendString(formData, 'altText', request.altText);
    this.appendString(formData, 'posicaoTexto', request.posicaoTexto);
    this.appendString(formData, 'corTexto', request.corTexto);
    this.appendString(formData, 'dataInicio', request.dataInicio);
    this.appendString(formData, 'dataFim', request.dataFim);

    if (request.ordem !== undefined && request.ordem !== null) {
      formData.append('ordem', String(request.ordem));
    }

    if (request.ativo !== undefined && request.ativo !== null) {
      formData.append('ativo', String(!!request.ativo));
    }

    if (request.abrirEmNovaAba !== undefined && request.abrirEmNovaAba !== null) {
      formData.append('abrirEmNovaAba', String(!!request.abrirEmNovaAba));
    }

    if (request.overlayAtivo !== undefined && request.overlayAtivo !== null) {
      formData.append('overlayAtivo', String(!!request.overlayAtivo));
    }

    if (request.overlayOpacidade !== undefined && request.overlayOpacidade !== null) {
      formData.append('overlayOpacidade', String(request.overlayOpacidade));
    }

    if (request.imagem) {
      formData.append('file', request.imagem, request.imagem.name);
    }

    return formData;
  }

  private appendString(formData: FormData, key: string, value?: string | null): void {
    const normalized = String(value || '').trim();
    if (normalized) {
      formData.append(key, normalized);
    }
  }

  private buildParams(params: SiteBannerListParams): HttpParams {
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
