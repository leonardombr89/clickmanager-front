import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ClienteListagem } from 'src/app/models/cliente/cliente-listagem.model';
import { ClienteRequest } from 'src/app/models/cliente/cliente-request.model';
import { ClienteResponse } from 'src/app/models/cliente/cliente-response.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { ApiService } from 'src/app/services/api.service';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly endpoint = 'api/clientes';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, textoPesquisa?: string): Observable<PaginaResponse<ClienteListagem>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (textoPesquisa) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa)}`;
    }
    return this.api.get<PaginaResponse<ClienteListagem>>(url);
  }

  buscarPorNome(filtro: string): Observable<PaginaResponse<ClienteListagem>> {
    let url = `${this.endpoint}?page=0&size=200`;
    if (filtro && filtro.trim().length > 0) {
      url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
    }
    return this.api.get<PaginaResponse<ClienteListagem>>(url);
  }

  buscarPorId(id: number): Observable<ClienteResponse> {
    return this.api.get<ClienteResponse>(`${this.endpoint}/${id}`);
  }

  salvar(cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.api.post<ClienteResponse>(this.endpoint, cliente);
  }

  atualizar(id: number, cliente: ClienteRequest): Observable<ClienteResponse> {
    return this.api.put<ClienteResponse>(`${this.endpoint}/${id}`, cliente);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}