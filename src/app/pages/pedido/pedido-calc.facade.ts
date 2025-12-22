import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { PedidoService } from "./pedido.service";
import { PedidoResponse } from "src/app/models/pedido/pedido-response.model";
import { PedidoItemRequest } from "src/app/models/pedido/pedido-item-request.model";
import { ApiService } from "src/app/services/api.service";

@Injectable({ providedIn: 'root' })
export class PedidoCalcFacade {
  private readonly KEY = 'currentPedidoId';
  private pedidoId$ = new BehaviorSubject<number | null>(null);

  constructor(private api: ApiService, private pedidoService: PedidoService) {}

  initDraft(): Observable<PedidoResponse> {
    const cached = localStorage.getItem(this.KEY);
    if (cached) {
      const id = +cached;
      this.pedidoId$.next(id);
      return this.pedidoService.buscarPorId(id);
    }
    return this.pedidoService.iniciar().pipe(
      tap(p => {
        localStorage.setItem(this.KEY, String(p.id));
        this.pedidoId$.next(p.id);
      })
    );
  }

  addItemFromCalc(item: PedidoItemRequest): Observable<void> {
    const id = this.pedidoId$.value!;
    return this.pedidoService.adicionarItens(id, [item]);
  }

  updateItem(itemId: number, patch: Partial<PedidoItemRequest & { observacao?: string; calculoSnapshot?: any }>): Observable<void> {
    const id = this.pedidoId$.value!;
    return this.api.put<void>(`api/pedidos/${id}/itens/${itemId}`, patch);
  }

  patchPedido(patch: { observacoes?: string; clienteId?: number; frete?: number; desconto?: number; acrescimo?: number }): Observable<void> {
    const id = this.pedidoId$.value!;
    return this.api.patch<void>(`api/pedidos/${id}`, patch);
  }

  clearDraft() {
    localStorage.removeItem(this.KEY);
    this.pedidoId$.next(null);
  }
}
