import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  ChamadoSuporteDetalhe,
  ChamadoSuporteListaItem,
  ChamadoSuportePaginadoResponse,
  CriarChamadoSuporteRequest,
  MensagemChamadoSuporte,
  ResponderChamadoSuporteRequest
} from '../models/chamado-suporte.model';

@Injectable({
  providedIn: 'root'
})
export class SuporteService {
  private readonly endpoint = 'api/suporte/chamados';

  constructor(private readonly api: ApiService) {}

  listar$(pagina = 0, tamanho = 20): Observable<ChamadoSuportePaginadoResponse> {
    const params = new HttpParams()
      .set('pagina', String(pagina))
      .set('tamanho', String(tamanho));
    return this.api.get<any>(this.endpoint, params).pipe(map((raw) => this.mapPaginada(raw)));
  }

  buscarPorId$(id: number): Observable<ChamadoSuporteDetalhe> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  criar$(payload: CriarChamadoSuporteRequest): Observable<ChamadoSuporteDetalhe> {
    return this.api.post<any>(this.endpoint, payload).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  responder$(id: number, payload: ResponderChamadoSuporteRequest): Observable<ChamadoSuporteDetalhe> {
    return this.api.post<any>(`${this.endpoint}/${id}/mensagens`, payload).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  fechar$(id: number): Observable<ChamadoSuporteDetalhe> {
    return this.api.post<any>(`${this.endpoint}/${id}/fechar`, {}).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  private mapPaginada(raw: any): ChamadoSuportePaginadoResponse {
    return {
      pagina: Number(raw?.['pagina'] || 0),
      tamanho: Number(raw?.['tamanho'] || 20),
      totalItens: Number(raw?.['totalItens'] || 0),
      totalPaginas: Number(raw?.['totalPaginas'] || 0),
      itens: Array.isArray(raw?.['itens']) ? raw['itens'].map((item: any) => this.mapListaItem(item)) : []
    };
  }

  private mapDetalhe(raw: any): ChamadoSuporteDetalhe {
    return {
      ...this.mapListaItem(raw),
      usuarioSolicitanteId: Number(raw?.['usuarioSolicitanteId'] || 0),
      usuarioSolicitanteNome: String(raw?.['usuarioSolicitanteNome'] || ''),
      mensagens: Array.isArray(raw?.['mensagens']) ? raw['mensagens'].map((item: any) => this.mapMensagem(item)) : []
    };
  }

  private mapListaItem(raw: any): ChamadoSuporteListaItem {
    return {
      id: Number(raw?.['id'] || 0),
      assunto: String(raw?.['assunto'] || ''),
      categoria: String(raw?.['categoria'] || 'OUTRO').toUpperCase() as any,
      prioridade: String(raw?.['prioridade'] || 'MEDIA').toUpperCase() as any,
      status: String(raw?.['status'] || 'ABERTO').toUpperCase() as any,
      criadoEm: String(raw?.['criadoEm'] || ''),
      atualizadoEm: String(raw?.['atualizadoEm'] || ''),
      fechadoEm: raw?.['fechadoEm'] ?? null
    };
  }

  private mapMensagem(raw: any): MensagemChamadoSuporte {
    return {
      id: Number(raw?.['id'] || 0),
      autorUsuarioId: raw?.['autorUsuarioId'] != null ? Number(raw['autorUsuarioId']) : null,
      autorNome: String(raw?.['autorNome'] || ''),
      autorTipo: String(raw?.['autorTipo'] || 'CLIENTE').toUpperCase(),
      mensagem: String(raw?.['mensagem'] || ''),
      interna: Boolean(raw?.['interna']),
      criadaEm: String(raw?.['criadaEm'] || '')
    };
  }
}
