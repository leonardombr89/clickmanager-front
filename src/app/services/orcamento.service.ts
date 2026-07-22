import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  FORMATO_IMPRESSAO_ORCAMENTO_API,
  FormatoImpressaoOrcamento,
  Orcamento,
  OrcamentoCriarRequest,
  OrcamentoItemRequest,
  OrcamentoListParams,
  OrcamentoListagemParams,
  OrcamentoPaginaResponse,
  OrcamentoStatus,
} from '../models/orcamento/orcamento.model';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private readonly orcamentosEndpoint = 'api/orcamentos';

  constructor(private readonly api: ApiService) {}

  listar(params: OrcamentoListagemParams = {}): Observable<OrcamentoPaginaResponse<Orcamento>> {
    return this.api
      .get<OrcamentoPaginaResponse<Orcamento>>(this.orcamentosEndpoint, this.buildParams(params))
      .pipe(catchError((error) => this.handleError(error)));
  }

  detalhar(id: number): Observable<Orcamento> {
    return this.api
      .get<Orcamento>(`${this.orcamentosEndpoint}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  criar(payload: OrcamentoCriarRequest): Observable<Orcamento> {
    return this.api
      .post<Orcamento>(this.orcamentosEndpoint, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  alterarStatus(id: number, status: OrcamentoStatus): Observable<Orcamento> {
    return this.api
      .patch<Orcamento>(`${this.orcamentosEndpoint}/${id}/status`, { status })
      .pipe(catchError((error) => this.handleError(error)));
  }

  atualizarObservacaoInterna(id: number, observacaoInterna: string | null): Observable<Orcamento> {
    return this.api
      .patch<Orcamento>(`${this.orcamentosEndpoint}/${id}/observacao-interna`, { observacaoInterna })
      .pipe(catchError((error) => this.handleError(error)));
  }

  atualizarContato(id: number, contato: Pick<OrcamentoCriarRequest, 'nomeContato' | 'telefoneContato' | 'emailContato' | 'clienteId'>): Observable<Orcamento> {
    return this.api
      .patch<Orcamento>(`${this.orcamentosEndpoint}/${id}/contato`, contato)
      .pipe(catchError((error) => this.handleError(error)));
  }

  adicionarItem(id: number, item: OrcamentoItemRequest): Observable<Orcamento> {
    return this.api
      .post<Orcamento>(`${this.orcamentosEndpoint}/${id}/itens`, item)
      .pipe(catchError((error) => this.handleError(error)));
  }

  atualizarItem(id: number, itemId: number, item: OrcamentoItemRequest): Observable<Orcamento> {
    return this.api
      .put<Orcamento>(`${this.orcamentosEndpoint}/${id}/itens/${itemId}`, item)
      .pipe(catchError((error) => this.handleError(error)));
  }

  removerItem(id: number, itemId: number): Observable<Orcamento> {
    return this.api
      .delete<Orcamento>(`${this.orcamentosEndpoint}/${id}/itens/${itemId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  cancelar(id: number, justificativa?: string | null): Observable<Orcamento> {
    return this.api
      .patch<Orcamento>(`${this.orcamentosEndpoint}/${id}/cancelamento`, { justificativa: justificativa || null })
      .pipe(catchError((error) => this.handleError(error)));
  }

  excluir(id: number): Observable<void> {
    return this.api
      .delete<void>(`${this.orcamentosEndpoint}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  gerarImpressao(
    id: number,
    formato: FormatoImpressaoOrcamento,
    download = false
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams()
      .set('formato', FORMATO_IMPRESSAO_ORCAMENTO_API[formato])
      .set('download', String(download));

    return this.api
      .getBlobResponse(`${this.orcamentosEndpoint}/${id}/impressao`, params)
      .pipe(catchError((error) => this.handleError(error)));
  }

  abrirImpressao(id: number, formato: FormatoImpressaoOrcamento): Observable<HttpResponse<Blob>> {
    return this.gerarImpressao(id, formato, false);
  }

  baixarImpressao(id: number, formato: FormatoImpressaoOrcamento): Observable<HttpResponse<Blob>> {
    return this.gerarImpressao(id, formato, true);
  }

  private buildParams(params: OrcamentoListParams, incluirTextoPesquisa = true): HttpParams {
    let httpParams = new HttpParams();

    if (incluirTextoPesquisa && params.textoPesquisa?.trim()) {
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

    const orcamentoParams = params as OrcamentoListagemParams;
    if (orcamentoParams.status) {
      httpParams = httpParams.set('status', orcamentoParams.status);
    }

    if (orcamentoParams.origem) {
      httpParams = httpParams.set('origem', orcamentoParams.origem);
    }

    if (orcamentoParams.dataInicio) {
      httpParams = httpParams.set('dataInicio', orcamentoParams.dataInicio);
    }

    if (orcamentoParams.dataFim) {
      httpParams = httpParams.set('dataFim', orcamentoParams.dataFim);
    }

    return httpParams;
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => error);
  }
}
