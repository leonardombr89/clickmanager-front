import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { PedidoListagem } from 'src/app/models/pedido/pedido-listagem.model';
import { PedidoRequest } from 'src/app/models/pedido/pedido-request.model';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { ApiService } from 'src/app/services/api.service';
import { ProdutoService } from '../cadastro-tecnico/services/produto.service';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { ClienteListagem } from 'src/app/models/cliente/cliente-listagem.model';
import { ClienteService } from '../cliente/cliente.service';
import { PagamentoRequest } from 'src/app/models/pagamento/pagamento-request.model';
import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly endpoint = 'api/pedidos';

  constructor(private api: ApiService, private produtoService: ProdutoService, private clienteService: ClienteService) { }

  listar(page: number = 0, size: number = 10, textoPesquisa?: string, status?: string): Observable<PaginaResponse<PedidoListagem>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (textoPesquisa) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa)}`;
    }
    if (status && status !== 'TODOS') {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return this.api.get<PaginaResponse<PedidoListagem>>(url);
  }

  buscarPorId(id: number): Observable<PedidoResponse> {
    return this.api.get<PedidoResponse>(`${this.endpoint}/${id}`);
  }

  salvar(pedido: PedidoRequest): Observable<PedidoListagem> {
    return this.api.post<PedidoListagem>(this.endpoint, pedido);
  }

  criarEmBranco(): Observable<PedidoResponse> {
    return this.api.post<PedidoResponse>(`${this.endpoint}/iniciar`, {});
  }

  atualizar(id: number, pedido: PedidoRequest): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, pedido);
  }

  cancelar(id: number): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}/cancelar`, {});
  }

  iniciar(): Observable<PedidoResponse> {
    return this.api.post<PedidoResponse>(`${this.endpoint}/iniciar`, {});
  }

  buscarProdutosPorNome(filtro: string): Observable<PaginaResponse<ProdutoListagem>> {
    return this.produtoService.buscarPorNome(filtro);
  }

  buscarClientesPorNome(filtro: string): Observable<PaginaResponse<ClienteListagem>> {
    return this.clienteService.buscarPorNome(filtro);
  }

  adicionarPagamento(pedidoId: number, pagamento: PagamentoRequest): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${pedidoId}/pagamentos`, pagamento);
  }

  adicionarItens(pedidoId: number, itens: PedidoItemRequest[]): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${pedidoId}/itens`, itens);
  }

  listarStatus(): Observable<string[]> {
    return this.api.get<string[]>(`${this.endpoint}/status`);
  }

  atualizarStatus(id: number, status: string): Observable<PedidoResponse> {
    return this.api.patch<PedidoResponse>(`${this.endpoint}/${id}/status`, { status });
  }

  patchPedido$(pedidoId: number, body: { observacoes?: string }): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/${pedidoId}`, body);
  }

  aprovarOrcamento(id: number) {
  return this.api.post<PedidoResponse>(`${this.endpoint}/${id}/aprovar-orcamento`, {});
}
}

