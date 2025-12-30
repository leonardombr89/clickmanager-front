import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { extrairMensagemErro } from '../utils/mensagem.util';

@Injectable()
export class ErrorMessageInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const userMessage = extrairMensagemErro(error, 'Erro na requisição. Tente novamente.');
        const enriched = { ...error, userMessage };
        return throwError(() => enriched);
      })
    );
  }
}
