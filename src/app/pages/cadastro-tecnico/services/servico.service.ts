import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { ServicoListagem } from 'src/app/models/servico/servico-listagem.model';
import { ServicoRequest } from 'src/app/models/servico/servico-request.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { ApiService } from 'src/app/services/api.service';

@Injectable({ providedIn: 'root' })
export class ServicoService {

  private readonly endpoint = 'api/servicos';

  constructor(private api: ApiService) { }

  listar(page: number = 0, size: number = 10, ativo?: boolean, textoPesquisa?: string): Observable<PaginaResponse<ServicoListagem>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== undefined && ativo !== null) {
      url += `&ativo=${ativo}`;
    }
    if (textoPesquisa) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa)}`;
    }
    return this.api.get<PaginaResponse<ServicoListagem>>(url);
  }

  buscarPorId(id: number): Observable<ServicoResponse> {
    return this.api.get<ServicoResponse>(`${this.endpoint}/${id}`);
  }

  salvar(servico: ServicoRequest): Observable<ServicoResponse> {
    return this.api.post<ServicoResponse>(this.endpoint, servico);
  }

  atualizar(id: number, servico: ServicoRequest): Observable<ServicoResponse> {
    return this.api.put<ServicoResponse>(`${this.endpoint}/${id}`, servico);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
