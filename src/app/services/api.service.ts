import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { extrairMensagemErro } from '../utils/mensagem.util';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.BASE_URL}/${endpoint}`, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  getExterno<T>(url: string): Observable<T> {
    return this.http.get<T>(url)
      .pipe(
        catchError(error => this.handleError(error))
      );
  }

  post<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}/${endpoint}`, body, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  put<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL}/${endpoint}`, body, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  patch<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.patch<T>(`${this.BASE_URL}/${endpoint}`, body, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  delete<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}/${endpoint}`, { params })
      .pipe(catchError(error => this.handleError(error)));
  }

  buscarEnderecoPorCep(cep: string): Observable<any> {
    const cepLimpo = cep.replace(/\D/g, '');
    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    return this.getExterno(url);
  }

  private handleError(error: any) {
    const userMessage = extrairMensagemErro(error, 'Erro na requisição. Tente novamente.');
    const enriched = { ...error, userMessage };
    return throwError(() => enriched);
  }
}
