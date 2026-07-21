import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  CalculadoraPisoAdicionarOrcamentoRequest,
  CalculadoraPisoAdicionarOrcamentoResponse,
  CalculadoraPisoProduto,
  CalculadoraPisoRequest,
  CalculadoraPisoResultado,
} from './calculadora-pisos.models';

@Injectable({ providedIn: 'root' })
export class CalculadoraPisosService {
  private readonly endpoint = 'api/calculadoras/pisos';

  constructor(private readonly api: ApiService) {}

  buscarProdutos(texto: string): Observable<CalculadoraPisoProduto[]> {
    const params = new HttpParams().set('texto', texto || '');
    return this.api.get<CalculadoraPisoProduto[]>(`${this.endpoint}/produtos`, params);
  }

  consultarProduto(produtoId: number): Observable<CalculadoraPisoProduto> {
    return this.api.get<CalculadoraPisoProduto>(`${this.endpoint}/produtos/${produtoId}`);
  }

  calcular(request: CalculadoraPisoRequest): Observable<CalculadoraPisoResultado> {
    return this.api.post<CalculadoraPisoResultado>(`${this.endpoint}/calcular`, request);
  }

  adicionarAoOrcamento(request: CalculadoraPisoAdicionarOrcamentoRequest): Observable<CalculadoraPisoAdicionarOrcamentoResponse> {
    return this.api.post<CalculadoraPisoAdicionarOrcamentoResponse>(`${this.endpoint}/orcamentos/itens`, request);
  }
}
