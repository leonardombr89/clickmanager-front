import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { decodeToken } from 'src/app/utils/token.util';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    const auth = this.authService as any;
    const token = typeof auth.getToken === 'function' ? (auth.getToken() as string | null) : null;

    if (token && !this.estaExpirado(token, auth)) {
      return of(true);
    }

    const hasValidRefreshToken =
      typeof auth.hasValidRefreshToken === 'function' ? Boolean(auth.hasValidRefreshToken()) : true;
    const refreshFn = typeof auth.refreshToken === 'function' ? auth.refreshToken.bind(auth) : null;

    if (hasValidRefreshToken && refreshFn) {
      return refreshFn().pipe(
        map(() => true),
        catchError(() => {
          this.authService.logout();
          return of(this.router.createUrlTree(['/login']));
        })
      );
    }

    this.authService.logout();
    return of(this.router.createUrlTree(['/login']));
  }

  private estaExpirado(token: string, auth: any): boolean {
    if (typeof auth.isAccessTokenExpired === 'function') {
      return Boolean(auth.isAccessTokenExpired(token));
    }
    const payload = decodeToken(token);
    if (!payload?.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
  }
}
