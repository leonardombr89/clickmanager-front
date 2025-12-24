import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AcabamentoListResponse } from 'src/app/models/acabamento/acabamento-listagem.response.model';
import { AcabamentoRequest } from 'src/app/models/acabamento/acabamento-request.model';
import { AcabamentoResponse } from 'src/app/models/acabamento/acabamento-response.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { ApiService } from 'src/app/services/api.service';


@Injectable({ providedIn: 'root' })
export class AcabamentoService {
  private readonly endpoint = 'api/acabamentos';

  constructor(private api: ApiService) { }

  listar(
    page: number = 0,
    size: number = 10,
    ativo?: boolean | null,
    textoPesquisa?: string
  ): Observable<PaginaResponse<AcabamentoListResponse>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;

    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }

    if (textoPesquisa && textoPesquisa.trim()) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa.trim())}`;
    }

    return this.api.get<PaginaResponse<AcabamentoListResponse>>(url);
  }

  /** Busca usada em autocomplete/filter */
  buscarPorNome(filtro: string): Observable<PaginaResponse<AcabamentoResponse>> {
    const query = filtro?.trim() ? `&textoPesquisa=${encodeURIComponent(filtro.trim())}` : '';

    const url = `${this.endpoint}?page=0&size=200&ativo=true${query}`;

    return this.api.get<PaginaResponse<AcabamentoResponse>>(url);
  }

  /** Recupera acabamento completo com variações */
  buscarPorId(id: number): Observable<AcabamentoResponse> {
    return this.api.get<AcabamentoResponse>(`${this.endpoint}/${id}`);
  }

  /** Criação usando AcabamentoRequest */
  salvar(request: AcabamentoRequest): Observable<AcabamentoResponse> {
    return this.api.post<AcabamentoResponse>(this.endpoint, request);
  }

  /** Atualização usando AcabamentoRequest */
  atualizar(id: number, request: AcabamentoRequest): Observable<AcabamentoResponse> {
    return this.api.put<AcabamentoResponse>(`${this.endpoint}/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
