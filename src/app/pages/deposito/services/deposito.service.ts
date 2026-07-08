import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  DepositoCategoria,
  DepositoCategoriaRequest,
  DepositoItem,
  DepositoItemRequest,
  DepositoListParams,
  DepositoMarca,
  DepositoMarcaRequest,
  DepositoPaginaResponse,
} from '../models/deposito.models';

@Injectable({ providedIn: 'root' })
export class DepositoService {
  private readonly categoriasEndpoint = 'api/deposito/categorias';
  private readonly marcasEndpoint = 'api/deposito/marcas';
  private readonly itensEndpoint = 'api/deposito/itens';

  constructor(private readonly api: ApiService) {}

  listarCategorias(params: DepositoListParams = {}): Observable<DepositoPaginaResponse<DepositoCategoria>> {
    return this.api.get<DepositoPaginaResponse<DepositoCategoria>>(this.categoriasEndpoint, this.buildParams(params));
  }

  detalharCategoria(id: number): Observable<DepositoCategoria> {
    return this.api.get<DepositoCategoria>(`${this.categoriasEndpoint}/${id}`);
  }

  criarCategoria(body: DepositoCategoriaRequest): Observable<DepositoCategoria> {
    return this.api.post<DepositoCategoria>(this.categoriasEndpoint, body);
  }

  atualizarCategoria(id: number, body: DepositoCategoriaRequest): Observable<DepositoCategoria> {
    return this.api.put<DepositoCategoria>(`${this.categoriasEndpoint}/${id}`, body);
  }

  excluirCategoria(id: number): Observable<void> {
    return this.api.delete<void>(`${this.categoriasEndpoint}/${id}`);
  }

  listarMarcas(params: DepositoListParams = {}): Observable<DepositoPaginaResponse<DepositoMarca>> {
    return this.api.get<DepositoPaginaResponse<DepositoMarca>>(this.marcasEndpoint, this.buildParams(params));
  }

  detalharMarca(id: number): Observable<DepositoMarca> {
    return this.api.get<DepositoMarca>(`${this.marcasEndpoint}/${id}`);
  }

  criarMarca(body: DepositoMarcaRequest): Observable<DepositoMarca> {
    return this.api.post<DepositoMarca>(this.marcasEndpoint, body);
  }

  atualizarMarca(id: number, body: DepositoMarcaRequest): Observable<DepositoMarca> {
    return this.api.put<DepositoMarca>(`${this.marcasEndpoint}/${id}`, body);
  }

  excluirMarca(id: number): Observable<void> {
    return this.api.delete<void>(`${this.marcasEndpoint}/${id}`);
  }

  listarItens(params: DepositoListParams = {}): Observable<DepositoPaginaResponse<DepositoItem>> {
    return this.api.get<DepositoPaginaResponse<DepositoItem>>(this.itensEndpoint, this.buildParams(params));
  }

  detalharItem(id: number): Observable<DepositoItem> {
    return this.api.get<DepositoItem>(`${this.itensEndpoint}/${id}`);
  }

  criarItem(body: DepositoItemRequest): Observable<DepositoItem> {
    return this.api.post<DepositoItem>(this.itensEndpoint, body);
  }

  atualizarItem(id: number, body: DepositoItemRequest): Observable<DepositoItem> {
    return this.api.put<DepositoItem>(`${this.itensEndpoint}/${id}`, body);
  }

  excluirItem(id: number): Observable<void> {
    return this.api.delete<void>(`${this.itensEndpoint}/${id}`);
  }

  private buildParams(params: DepositoListParams): HttpParams {
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
