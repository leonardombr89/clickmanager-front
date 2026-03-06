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
  private readonly endpoint = 'api/pessoas/funcionarios';

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
    return this.api.get<Funcionario>(`${this.endpoint}/${id}`).pipe(map((f) => (f ? this.normalizarFuncionario(f) : undefined)));
  }

  criar$(payload: FuncionarioFormValue): Observable<Funcionario> {
    return this.api.post<Funcionario>(this.endpoint, this.normalizarPayload(payload)).pipe(map((f) => this.normalizarFuncionario(f)));
  }

  atualizar$(id: number, payload: FuncionarioFormValue): Observable<Funcionario> {
    return this.api
      .put<Funcionario>(`${this.endpoint}/${id}`, this.normalizarPayload(payload))
      .pipe(map((f) => this.normalizarFuncionario(f)));
  }

  alterarStatus$(id: number, status: StatusFuncionario, motivo: string): Observable<void> {
    return this.api.patch<void>(`${this.endpoint}/${id}/status`, { status, motivo });
  }

  kpis$(): Observable<{ total: number; ativos: number; afastados: number; desligados: number }> {
    return this.listar$().pipe(
      map((lista) => ({
        total: lista.length,
        ativos: lista.filter((x) => x.status === 'ATIVO').length,
        afastados: lista.filter((x) => x.status === 'AFASTADO').length,
        desligados: lista.filter((x) => x.status === 'DESLIGADO').length
      }))
    );
  }

  private extrairLista(
    res: Funcionario[] | PaginatedResponse<Funcionario> | undefined
  ): Funcionario[] {
    if (!res) return [];
    if (Array.isArray(res)) return res.map((x) => this.normalizarFuncionario(x));

    if (Array.isArray(res.content)) return res.content.map((x) => this.normalizarFuncionario(x));
    if (Array.isArray(res.items)) return res.items.map((x) => this.normalizarFuncionario(x));
    if (Array.isArray(res.data)) return res.data.map((x) => this.normalizarFuncionario(x));

    if (res.data && typeof res.data === 'object') {
      const nested = res.data as PaginatedResponse<Funcionario>;
      if (Array.isArray(nested.content)) return nested.content.map((x) => this.normalizarFuncionario(x));
      if (Array.isArray(nested.items)) return nested.items.map((x) => this.normalizarFuncionario(x));
      if (Array.isArray(nested.data)) return nested.data.map((x) => this.normalizarFuncionario(x));
    }

    return [];
  }

  private normalizarFuncionario(item: Funcionario): Funcionario {
    if (!item) return item;
    const salarioBase = (item as any).salarioBase ?? item.salario ?? null;
    return {
      ...item,
      salarioBase,
      salario: salarioBase
    };
  }

  private normalizarPayload(payload: FuncionarioFormValue): any {
    const salarioBase = payload.salarioBase ?? payload.salario ?? null;
    const out: any = {
      ...payload,
      salarioBase
    };
    delete out.salario;
    return out;
  }
}
