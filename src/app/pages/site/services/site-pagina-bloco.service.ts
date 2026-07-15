import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  SitePaginaBlocoCreateRequest,
  SitePaginaBlocoOrdenacaoRequest,
  SitePaginaBlocoResponse,
  SitePaginaBlocoUpdateRequest,
} from '../models/site-pagina-bloco.models';

@Injectable({ providedIn: 'root' })
export class SitePaginaBlocoService {
  private readonly endpoint = 'api/site/paginas';

  constructor(private readonly api: ApiService) {}

  listar(paginaId: number): Observable<SitePaginaBlocoResponse[]> {
    return this.api.get<SitePaginaBlocoResponse[]>(this.baseUrl(paginaId));
  }

  buscarPorId(paginaId: number, blocoId: number): Observable<SitePaginaBlocoResponse> {
    return this.api.get<SitePaginaBlocoResponse>(`${this.baseUrl(paginaId)}/${blocoId}`);
  }

  criar(paginaId: number, request: SitePaginaBlocoCreateRequest): Observable<SitePaginaBlocoResponse> {
    return this.api.post<SitePaginaBlocoResponse>(this.baseUrl(paginaId), this.toFormData(request));
  }

  atualizar(paginaId: number, blocoId: number, request: SitePaginaBlocoUpdateRequest): Observable<SitePaginaBlocoResponse> {
    return this.api.put<SitePaginaBlocoResponse>(`${this.baseUrl(paginaId)}/${blocoId}`, this.toFormData(request));
  }

  alterarStatus(paginaId: number, blocoId: number, ativo: boolean): Observable<SitePaginaBlocoResponse> {
    return this.api.patch<SitePaginaBlocoResponse>(`${this.baseUrl(paginaId)}/${blocoId}/status`, { ativo });
  }

  reordenar(paginaId: number, payload: SitePaginaBlocoOrdenacaoRequest): Observable<void> {
    return this.api.patch<void>(`${this.baseUrl(paginaId)}/ordem`, payload);
  }

  excluir(paginaId: number, blocoId: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl(paginaId)}/${blocoId}`);
  }

  private baseUrl(paginaId: number): string {
    return `${this.endpoint}/${paginaId}/blocos`;
  }

  private toFormData(request: SitePaginaBlocoCreateRequest | SitePaginaBlocoUpdateRequest): FormData {
    const formData = new FormData();

    formData.append('tipo', request.tipo);
    this.appendString(formData, 'titulo', request.titulo);
    this.appendString(formData, 'subtitulo', request.subtitulo);
    this.appendString(formData, 'conteudoJson', request.conteudoJson ?? '{}');
    this.appendString(formData, 'altText', request.altText);

    if (request.ordem !== undefined && request.ordem !== null) {
      formData.append('ordem', String(request.ordem));
    }

    if (request.ativo !== undefined && request.ativo !== null) {
      formData.append('ativo', String(!!request.ativo));
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
}
