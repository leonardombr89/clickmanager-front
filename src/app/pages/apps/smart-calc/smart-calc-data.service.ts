import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap, tap, throwError, catchError } from 'rxjs';

import { ApiService } from 'src/app/services/api.service';
import { ProdutoService } from '../../cadastro-tecnico/services/produto.service';
import { PedidoService } from '../../pedido/pedido.service';

import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { ProdutoResponse } from 'src/app/models/produto/produto-response.model';
import { ProdutoVariacaoResponse } from 'src/app/models/produto/produto-variacao-response.model';

import { SmartCalcRequest } from 'src/app/models/smart-calc/smart-calc-request.model';
import { SmartCalcResultado } from 'src/app/models/smart-calc/smart-calc-resultado.model';

import { AcabamentoResponse } from 'src/app/models/acabamento/acabamento-response.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { AuthService } from 'src/app/services/auth.service';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';

@Injectable({ providedIn: 'root' })
export class SmartCalcDataService {
  private readonly calcEndpoint = 'api/smartcalc-core/calcular';
  private readonly DRAFT_KEY = 'currentPedidoId';

  constructor(
    private produtosApi: ProdutoService,
    private api: ApiService,
    private pedidos: PedidoService,
    private auth: AuthService
  ) { }

  // ------------------- PEDIDO RASCUNHO -------------------

  /** [NÃO CRIA MAIS] Retorna o pedido do localStorage se existir; caso contrário, erro. */
  getExistingDraft$(): Observable<any> {
    const id = this.getPedidoId();
    if (!id) {
      return throwError(() => new Error('Nenhum pedido rascunho ativo.'));
    }
    return this.pedidos.buscarPorId(id);
  }

  /** Criar rascunho — chame isso APENAS no clique “Adicionar ao pedido” se não existir. */
  createDraft$(): Observable<any> {
    return this.pedidos.iniciar().pipe(
      tap(p => localStorage.setItem(this.DRAFT_KEY, String(p.id)))
    );
  }

  /** Id do rascunho atual (ou null). */
  getPedidoId(): number | null {
    const v = localStorage.getItem(this.DRAFT_KEY);
    return v ? +v : null;
  }

  limparRascunho(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }

  /** Adiciona UM item no rascunho existente. NÃO cria mais automaticamente. */
  addItemToDraft(item: PedidoItemRequest): Observable<void> {
    const pedidoId = this.getPedidoId();
    if (!pedidoId) {
      return throwError(() => new Error('Nenhum pedido rascunho ativo.'));
    }
    return this.pedidos.adicionarItens(pedidoId, [item]);
  }

  /** Atualiza observação do pedido apenas se houver rascunho. */
  atualizarObservacaoGeral(obs: string): Observable<void> {
    const pedidoId = this.getPedidoId();
    if (!pedidoId) {
      return throwError(() => new Error('Nenhum pedido rascunho ativo.'));
    }
    return this.pedidos.atualizar(pedidoId, { observacoes: obs } as any);
  }

  // ------------------- PRODUTOS -------------------

  getProdutos(size = 500, filtro?: string): Observable<ProdutoListagem[]> {
    if (filtro?.trim()) {
      return this.produtosApi.buscarPorNome(filtro).pipe(map(p => p.content ?? []));
    }
    return this.produtosApi.listar(0, size, true).pipe(map(p => p.content ?? []));
  }

  getProdutoPorId(id: number): Observable<ProdutoResponse> {
    return this.produtosApi.buscarPorId(id);
  }

  // ------------------- CÁLCULO (sem criação de rascunho) -------------------

  calcularSmartCalc(payload: SmartCalcRequest): Observable<SmartCalcResultado> {
    return this.api
      .post<SmartCalcResultado | SmartCalcResultado[]>(this.calcEndpoint, payload)
      .pipe(
        map((res): SmartCalcResultado =>
          Array.isArray(res) ? (res[0] ?? { itens: [], total: 0, observacao: undefined }) : res
        )
      );
  }

  // ------------------- HELPERS EXISTENTES -------------------

  extrairAcabamentos(produto: ProdutoResponse): AcabamentoResponse[] {
    const mapId = new Map<number, AcabamentoResponse>();
    (produto?.variacoes ?? []).forEach((v: ProdutoVariacaoResponse) => {
      (v?.acabamentos ?? []).forEach(a => {
        if (a?.id != null && a?.ativo !== false && !mapId.has(a.id)) {
          mapId.set(a.id, a);
        }
      });
    });
    return Array.from(mapId.values());
  }

  extrairServicos(produto: ProdutoResponse): ServicoResponse[] {
    const mapId = new Map<number, ServicoResponse>();
    (produto?.variacoes ?? []).forEach((v: ProdutoVariacaoResponse) => {
      (v?.servicos ?? []).forEach(s => {
        if (s?.id != null && s?.ativo !== false && !mapId.has(s.id)) {
          mapId.set(s.id, s);
        }
      });
    });
    return Array.from(mapId.values());
  }

  extrairMateriaisBasicos(produto: ProdutoResponse): { id: number; nome: string }[] {
    const mapId = new Map<number, { id: number; nome: string }>();
    (produto?.variacoes ?? []).forEach((v: ProdutoVariacaoResponse) => {
      if (v?.materialId != null && !mapId.has(v.materialId)) {
        mapId.set(v.materialId, { id: v.materialId, nome: v.materialNome });
      }
    });
    return Array.from(mapId.values());
  }

  /** usuário logado (atendente) */
  getUsuarioLogado() {
    return this.auth.getUsuario();
  }

  /** Busca rascunho do atendente logado */
  getDraftByUser$(): Observable<PedidoResponse | null> {
    const user = this.getUsuarioLogado();
    return this.api.get<PedidoResponse>(`api/pedidos/rascunho?responsavelId=${user.id}`).pipe(
      catchError(() => of(null))
    );
  }

  /** Cria rascunho para o atendente logado */
  createDraftForUser$(): Observable<PedidoResponse> {
    const user = this.getUsuarioLogado();
    return this.api.post<PedidoResponse>(`api/pedidos/iniciar?responsavelId=${user.id}`, {});
  }

  /** Adiciona itens ao pedido */
  addItensToPedido$(pedidoId: number, itens: PedidoItemRequest[]) {
    return this.api.post<void>(`api/pedidos/${pedidoId}/itens`, itens);
  }

  // smart-calc-data.service.ts
  updateObservacao$(pedidoId: number, observacao: string) {
    return this.pedidos.atualizar(pedidoId, { observacoes: observacao } as any);
  }

}
