import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { decodeToken } from 'src/app/utils/token.util';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const auth = this.authService as any;
    const token = typeof auth.getToken === 'function' ? (auth.getToken() as string | null) : null;
    const allowedRoles = route.data['roles'] as string[];

    if (token && !this.estaExpirado(token, auth)) {
      return of(this.hasRequiredRole(token, allowedRoles));
    }

    const hasValidRefreshToken =
      typeof auth.hasValidRefreshToken === 'function' ? Boolean(auth.hasValidRefreshToken()) : true;
    const refreshFn = typeof auth.refreshToken === 'function' ? auth.refreshToken.bind(auth) : null;

    if (hasValidRefreshToken && refreshFn) {
      return refreshFn().pipe(
        map((tokens: any) => this.hasRequiredRole(String(tokens?.accessToken || ''), allowedRoles)),
        catchError(() => {
          this.authService.logout();
          return of(this.router.createUrlTree(['/login']));
        })
      );
    }

    this.authService.logout();
    return of(this.router.createUrlTree(['/login']));
  }

  private getUserRoles(token: string): string[] {
    try {
      const payload = decodeToken(token) as any;
      return payload.roles || [];
    } catch {
      return [];
    }
  }

  private estaExpirado(token: string, auth: any): boolean {
    if (typeof auth.isAccessTokenExpired === 'function') {
      return Boolean(auth.isAccessTokenExpired(token));
    }
    const payload = decodeToken(token);
    if (!payload?.exp) return true;
    return payload.exp < Math.floor(Date.now() / 1000);
  }

  private hasRequiredRole(token: string, allowedRoles: string[]): boolean | UrlTree {
    const userRoles = this.getUserRoles(token);
    const hasAccess = allowedRoles.some(role => userRoles.includes(`ROLE_${role}`));

    return hasAccess ? true : this.router.createUrlTree(['/forbidden']);
  }
}
