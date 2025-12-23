import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const token = this.authService.getToken();
    const allowedRoles = route.data['roles'] as string[];

    if (token && !this.authService.isAccessTokenExpired(token)) {
      return of(this.hasRequiredRole(token, allowedRoles));
    }

    if (this.authService.hasValidRefreshToken()) {
      return this.authService.refreshToken().pipe(
        map(tokens => this.hasRequiredRole(tokens.accessToken, allowedRoles)),
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch {
      return [];
    }
  }

  private hasRequiredRole(token: string, allowedRoles: string[]): boolean | UrlTree {
    const userRoles = this.getUserRoles(token);
    const hasAccess = allowedRoles.some(role => userRoles.includes(`ROLE_${role}`));

    return hasAccess ? true : this.router.createUrlTree(['/forbidden']);
  }
}
