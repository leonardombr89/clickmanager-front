import { HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  FiscalConfiguracaoEmpresa,
  FiscalConfiguracaoProduto,
  FiscalDocumentoDetalhe,
  FiscalDocumentoListItem,
  FiscalEmissaoRequest,
  FiscalEmissaoResponse,
  FiscalPagina,
  FiscalRegraTributaria,
} from './fiscal.models';

export interface FiscalListParams {
  page?: number;
  size?: number;
  texto?: string;
  status?: string;
  ambiente?: string;
  tipo?: string;
  periodoInicio?: string;
  periodoFim?: string;
}

function paramsOf(params: FiscalListParams = {}): HttpParams {
  let httpParams = new HttpParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  });
  return httpParams;
}

@Injectable({ providedIn: 'root' })
export class FiscalConfiguracaoService {
  private readonly endpoint = 'api/fiscal/configuracoes';
  constructor(private readonly api: ApiService) {}
  carregar(): Observable<FiscalConfiguracaoEmpresa> { return this.api.get<FiscalConfiguracaoEmpresa>(this.endpoint); }
  salvar(body: FiscalConfiguracaoEmpresa): Observable<FiscalConfiguracaoEmpresa> { return this.api.put<FiscalConfiguracaoEmpresa>(this.endpoint, body); }
  validar(): Observable<string[]> { return this.api.post<string[]>(`${this.endpoint}/validar`, {}); }
  alterarAmbiente(ambiente: string): Observable<FiscalConfiguracaoEmpresa> { return this.api.post<FiscalConfiguracaoEmpresa>(`${this.endpoint}/ambiente`, { ambiente }); }
  enviarCertificado(arquivo: File, senha: string): Observable<FiscalConfiguracaoEmpresa> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('senha', senha);
    return this.api.post<FiscalConfiguracaoEmpresa>(`${this.endpoint}/certificado`, form);
  }
}

@Injectable({ providedIn: 'root' })
export class FiscalProdutoService {
  private readonly endpoint = 'api/fiscal/produtos';
  constructor(private readonly api: ApiService) {}
  listar(params: FiscalListParams = {}): Observable<FiscalPagina<FiscalConfiguracaoProduto>> { return this.api.get<FiscalPagina<FiscalConfiguracaoProduto>>(this.endpoint, paramsOf(params)); }
  detalhar(id: number): Observable<FiscalConfiguracaoProduto> { return this.api.get<FiscalConfiguracaoProduto>(`${this.endpoint}/${id}`); }
  salvar(id: number, body: FiscalConfiguracaoProduto): Observable<FiscalConfiguracaoProduto> { return this.api.put<FiscalConfiguracaoProduto>(`${this.endpoint}/${id}`, body); }
}

@Injectable({ providedIn: 'root' })
export class FiscalRegraService {
  private readonly endpoint = 'api/fiscal/regras';
  constructor(private readonly api: ApiService) {}
  listar(params: FiscalListParams = {}): Observable<FiscalPagina<FiscalRegraTributaria>> { return this.api.get<FiscalPagina<FiscalRegraTributaria>>(this.endpoint, paramsOf(params)); }
  salvar(body: FiscalRegraTributaria): Observable<FiscalRegraTributaria> { return body.id ? this.api.put<FiscalRegraTributaria>(`${this.endpoint}/${body.id}`, body) : this.api.post<FiscalRegraTributaria>(this.endpoint, body); }
  inativar(id: number): Observable<void> { return this.api.delete<void>(`${this.endpoint}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class FiscalDocumentoService {
  private readonly endpoint = 'api/fiscal/documentos';
  constructor(private readonly api: ApiService) {}
  listar(params: FiscalListParams = {}): Observable<FiscalPagina<FiscalDocumentoListItem>> { return this.api.get<FiscalPagina<FiscalDocumentoListItem>>(this.endpoint, paramsOf(params)); }
  detalhar(id: number): Observable<FiscalDocumentoDetalhe> { return this.api.get<FiscalDocumentoDetalhe>(`${this.endpoint}/${id}`); }
  validarEmissao(request: FiscalEmissaoRequest): Observable<FiscalEmissaoResponse> { return this.api.post<FiscalEmissaoResponse>(`${this.endpoint}/validar-emissao`, request); }
  emitir(request: FiscalEmissaoRequest): Observable<FiscalEmissaoResponse> { return this.api.post<FiscalEmissaoResponse>(`${this.endpoint}/emitir`, request); }
  consultar(id: number): Observable<FiscalDocumentoDetalhe> { return this.api.post<FiscalDocumentoDetalhe>(`${this.endpoint}/${id}/consultar`, {}); }
  cancelar(id: number, justificativa: string): Observable<FiscalDocumentoDetalhe> { return this.api.post<FiscalDocumentoDetalhe>(`${this.endpoint}/${id}/cancelar`, { justificativa }); }
  cartaCorrecao(id: number, correcao: string): Observable<FiscalDocumentoDetalhe> { return this.api.post<FiscalDocumentoDetalhe>(`${this.endpoint}/${id}/carta-correcao`, { correcao }); }
  inutilizar(body: { ano: number; serie: string; numeroInicial: number; numeroFinal: number; justificativa: string; ambiente: string }): Observable<void> { return this.api.post<void>('api/fiscal/inutilizacoes', body); }
}

@Injectable({ providedIn: 'root' })
export class FiscalArquivoService {
  constructor(private readonly api: ApiService) {}
  baixarXml(documentoId: number): Observable<HttpResponse<Blob>> { return this.api.getBlobResponse(`api/fiscal/documentos/${documentoId}/xml`); }
  baixarDanfe(documentoId: number): Observable<HttpResponse<Blob>> { return this.api.getBlobResponse(`api/fiscal/documentos/${documentoId}/danfe`); }
}
