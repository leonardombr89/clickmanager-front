import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  Funcionario,
  FuncionarioFormValue,
  StatusFuncionario
} from '../models/funcionario.model';

interface PaginatedResponse<T> {
  content?: T[];
  items?: T[];
  data?: T[] | PaginatedResponse<T>;
}

@Injectable({
  providedIn: 'root'
})
export class FuncionariosService {
  private readonly endpoint = 'api/funcionarios';

  constructor(private readonly api: ApiService) {}

  listar$(termo?: string, status?: string): Observable<Funcionario[]> {
    let url = this.endpoint;
    const params: string[] = [];

    if (termo && termo.trim().length > 0) {
      params.push(`search=${encodeURIComponent(termo.trim())}`);
    }
    if (status && status !== 'TODOS') {
      params.push(`status=${encodeURIComponent(status)}`);
    }
    if (params.length) {
      url += `?${params.join('&')}`;
    }

    return this.api
      .get<Funcionario[] | PaginatedResponse<Funcionario>>(url)
      .pipe(map((res) => this.extrairLista(res)));
  }

  obterPorId$(id: number): Observable<Funcionario | undefined> {
    return this.api.get<Funcionario>(`${this.endpoint}/${id}`).pipe(
      map((f) => f || undefined)
    );
  }

  criar$(payload: FuncionarioFormValue): Observable<Funcionario> {
    return this.api.post<Funcionario>(this.endpoint, payload);
  }

  atualizar$(id: number, payload: FuncionarioFormValue): Observable<Funcionario> {
    return this.api.put<Funcionario>(`${this.endpoint}/${id}`, payload);
  }

  alterarStatus$(id: number, status: StatusFuncionario, motivo: string): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/${id}/status`, { status, motivo });
  }

  kpis$(): Observable<{ total: number; ativos: number; afastados: number; desligados: number }> {
    return this.api.get<{ total: number; ativos: number; afastados: number; desligados: number }>(
      `${this.endpoint}/kpis`
    );
  }

  private extrairLista(
    res: Funcionario[] | PaginatedResponse<Funcionario> | undefined
  ): Funcionario[] {
    if (!res) return [];
    if (Array.isArray(res)) return res;

    if (Array.isArray(res.content)) return res.content;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;

    if (res.data && typeof res.data === 'object') {
      const nested = res.data as PaginatedResponse<Funcionario>;
      if (Array.isArray(nested.content)) return nested.content;
      if (Array.isArray(nested.items)) return nested.items;
      if (Array.isArray(nested.data)) return nested.data;
    }

    return [];
  }
}
