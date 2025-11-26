import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { Formato } from 'src/app/models/formato.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';

@Injectable({ providedIn: 'root' })
export class FormatoService {
  private readonly endpoint = 'api/formatos';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, ativo?: boolean | null): Observable<PaginaResponse<Formato>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
    return this.api.get<PaginaResponse<Formato>>(url);
  }
  
  buscarPorNome(filtro: string): Observable<PaginaResponse<Formato>> {
      let url = `${this.endpoint}?page=0&size=200&ativo=true`;
      if (filtro && filtro.trim().length > 0) {
        url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
      }
      return this.api.get<PaginaResponse<Formato>>(url);
    }

  buscarPorId(id: number): Observable<Formato> {
    return this.api.get<Formato>(`${this.endpoint}/${id}`);
  }

  salvar(formato: Formato): Observable<Formato> {
    return this.api.post<Formato>(this.endpoint, formato);
  }

  atualizar(id: number, formato: Formato): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, formato);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
