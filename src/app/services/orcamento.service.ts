import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  Orcamento,
  OrcamentoListParams,
  OrcamentoListagemParams,
  OrcamentoPaginaResponse,
  OrcamentoStatus,
} from '../models/orcamento/orcamento.model';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private readonly orcamentosEndpoint = 'api/deposito/orcamentos';

  constructor(private readonly api: ApiService) {}

  listar(params: OrcamentoListagemParams = {}): Observable<OrcamentoPaginaResponse<Orcamento>> {
    return this.api
      .get<OrcamentoPaginaResponse<Orcamento>>(this.orcamentosEndpoint, this.buildParams(params, false))
      .pipe(catchError((error) => this.handleError(error)));
  }

  detalhar(id: number): Observable<Orcamento> {
    return this.api
      .get<Orcamento>(`${this.orcamentosEndpoint}/${id}`)
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

  excluir(id: number): Observable<void> {
    return this.api
      .delete<void>(`${this.orcamentosEndpoint}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
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
