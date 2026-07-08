import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { Usuario } from '../models/usuario/usuario.model';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RootRedirectGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(): Observable<UrlTree> {
    return this.authService.usuario$.pipe(
      take(1),
      switchMap((usuario) => {
        if (usuario) {
          return of(this.redirectFor(usuario));
        }

        return this.authService.carregarUsuarioCompleto().pipe(
          map((carregado) => this.redirectFor(carregado)),
          catchError(() => of(this.router.createUrlTree(['/authentication/login'])))
        );
      })
    );
  }

  private redirectFor(usuario?: Usuario | null): UrlTree {
    return this.router.createUrlTree([this.authService.getDefaultRouteForUsuario(usuario)]);
  }
}
