import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { TipoEmpresa } from '../models/empresa/tipo-empresa.enum';
import { Usuario } from '../models/usuario/usuario.model';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class EmpresaTipoGuard implements CanActivate, CanActivateChild {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.validarTiposPermitidos(route.data?.['allowedEmpresaTipos'] as TipoEmpresa[] | undefined);
  }

  canActivateChild(childRoute: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.validarTiposPermitidos(childRoute.data?.['allowedEmpresaTipos'] as TipoEmpresa[] | undefined);
  }

  private validarTiposPermitidos(allowedEmpresaTipos?: TipoEmpresa[]): Observable<boolean | UrlTree> {
    if (!allowedEmpresaTipos?.length) {
      return of(true);
    }

    return this.resolveUsuario().pipe(
      map((usuario) => {
        const tipoEmpresa = this.authService.getTipoEmpresa(usuario);
        if (allowedEmpresaTipos.includes(tipoEmpresa)) {
          return true;
        }

        return this.router.createUrlTree([this.authService.getDefaultRouteForUsuario(usuario)]);
      }),
      catchError(() => of(true))
    );
  }

  private resolveUsuario(): Observable<Usuario | null> {
    return this.authService.usuario$.pipe(
      take(1),
      switchMap((usuario) => {
        if (usuario) {
          return of(usuario);
        }

        return this.authService.carregarUsuarioCompleto().pipe(
          map((carregado) => carregado as Usuario | null),
          catchError(() => of(null))
        );
      })
    );
  }
}
