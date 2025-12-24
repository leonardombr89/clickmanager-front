import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { Material } from 'src/app/models/material.model';
import { PaginaResponse } from 'src/app/models/pagina-response.model';

@Injectable({ providedIn: 'root' })
export class MaterialService {
  private readonly endpoint = 'api/materiais';

  constructor(private api: ApiService) {}

  listar(
    page: number = 0,
    size: number = 10,
    ativo?: boolean | null,
    textoPesquisa?: string
  ): Observable<PaginaResponse<Material>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
    if (textoPesquisa && textoPesquisa.trim()) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa.trim())}`;
    }
    return this.api.get<PaginaResponse<Material>>(url);
  }

  buscarPorNome(filtro: string): Observable<PaginaResponse<Material>> {
      let url = `${this.endpoint}?page=0&size=200&ativo=true`;
      if (filtro && filtro.trim().length > 0) {
        url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
      }
      return this.api.get<PaginaResponse<Material>>(url);
    }

  buscarPorId(id: number): Observable<Material> {
    return this.api.get<Material>(`${this.endpoint}/${id}`);
  }

  salvar(material: Material): Observable<Material> {
    return this.api.post<Material>(this.endpoint, material);
  }

  atualizar(id: number, material: Material): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, material);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
