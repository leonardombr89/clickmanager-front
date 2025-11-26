import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginaResponse } from 'src/app/models/pagina-response.model';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { ProdutoOption } from 'src/app/models/produto/produto-option.model';
import { ProdutoResponse } from 'src/app/models/produto/produto-response.model';
import { ApiService } from 'src/app/services/api.service';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly endpoint = 'api/produtos';

  constructor(private api: ApiService) {}

  listar(page: number = 0, size: number = 10, ativo?: boolean | null, textoPesquisa?: string): Observable<PaginaResponse<ProdutoListagem>> {
    let url = `${this.endpoint}?page=${page}&size=${size}`;
    if (ativo !== null && ativo !== undefined) {
      url += `&ativo=${ativo}`;
    }
    if (textoPesquisa) {
      url += `&textoPesquisa=${encodeURIComponent(textoPesquisa)}`;
    }
    return this.api.get<PaginaResponse<ProdutoListagem>>(url);
  }

  buscarPorNome(filtro: string): Observable<PaginaResponse<ProdutoListagem>> {
    let url = `${this.endpoint}?page=0&size=200&ativo=true`;
    if (filtro && filtro.trim().length > 0) {
      url += `&textoPesquisa=${encodeURIComponent(filtro.trim())}`;
    }
    return this.api.get<PaginaResponse<ProdutoListagem>>(url);
  }

  buscarPorId(id: number): Observable<ProdutoResponse> {
    return this.api.get<any>(`${this.endpoint}/${id}`);
  }

  salvar(produto: any): Observable<any> {
    return this.api.post<any>(this.endpoint, produto);
  }

  atualizar(id: number, produto: any): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}`, produto);
  }

  excluir(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  listarOptionsAtivos() {
    return this.api.get<ProdutoOption[]>(`${this.endpoint}/options`);
  }
}
