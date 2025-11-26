import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { Cor } from 'src/app/models/cor.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';

@Injectable({ providedIn: 'root' })
export class CorService {
  private readonly endpoint = 'api/cores';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, ativo?: boolean | null): Observable<PaginaResponse<Cor>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
    return this.api.get<PaginaResponse<Cor>>(url);
  }

  buscarPorNome(filtro: string): Observable<PaginaResponse<Cor>> {
    let url = `${this.endpoint}?page=0&size=200&ativo=true`;
    if (filtro && filtro.trim().length > 0) {
      url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
    }
    return this.api.get<PaginaResponse<Cor>>(url);
  }

  buscarPorId(id: number): Observable<Cor> {
    return this.api.get<Cor>(`${this.endpoint}/${id}`);
  }

  salvar(cor: Cor): Observable<Cor> {
    return this.api.post<Cor>(this.endpoint, cor);
  }

  atualizar(id: number, cor: Cor): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, cor);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
