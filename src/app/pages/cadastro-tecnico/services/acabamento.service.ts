import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { Acabamento } from 'src/app/models/acabamento/acabamento.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';

@Injectable({ providedIn: 'root' })
export class AcabamentoService {
  private readonly endpoint = 'api/acabamentos';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, ativo?: boolean | null): Observable<PaginaResponse<Acabamento>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
    return this.api.get<PaginaResponse<Acabamento>>(url);
  }

  buscarPorNome(filtro: string): Observable<PaginaResponse<Acabamento>> {
      let url = `${this.endpoint}?page=0&size=200&ativo=true`;
      if (filtro && filtro.trim().length > 0) {
        url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
      }
      return this.api.get<PaginaResponse<Acabamento>>(url);
    }

  buscarPorId(id: number): Observable<Acabamento> {
    return this.api.get<Acabamento>(`${this.endpoint}/${id}`);
  }

  salvar(acabamento: Acabamento): Observable<Acabamento> {
    return this.api.post<Acabamento>(this.endpoint, acabamento);
  }

  atualizar(id: number, acabamento: Acabamento): Observable<Acabamento> {
    return this.api.put<Acabamento>(`${this.endpoint}/${id}`, acabamento);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}