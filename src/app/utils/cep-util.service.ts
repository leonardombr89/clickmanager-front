import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { EnderecoViaCep } from '../models/endereco.viacep.model';

@Injectable({ providedIn: 'root' })
export class CepUtilService {
  private readonly viacepUrl = 'https://viacep.com.br/ws';

  constructor(private http: HttpClient) {}

  buscarEndereco(cep: string): Observable<EnderecoViaCep | null> {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return of(null);

    return this.http.get<EnderecoViaCep & { erro?: boolean }>(`${this.viacepUrl}/${cepLimpo}/json`).pipe(
      map(resposta => (resposta.erro ? null : resposta)),
      catchError(() => of(null))
    );
  }
}
