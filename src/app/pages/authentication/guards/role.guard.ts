import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.router.navigate(['/login']);
      return false;
    }

    const allowedRoles = route.data['roles'] as string[];
    const userRoles = this.getUserRoles(token);

    const hasAccess = allowedRoles.some(role => userRoles.includes(`ROLE_${role}`));
    if (hasAccess) return true;

    console.warn('Acesso negado: usuário não tem as permissões necessárias');
    this.router.navigate(['/forbidden']);
    return false;
  }

  private getUserRoles(token: string): string[] {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || [];
    } catch {
      return [];
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return (payload.exp * 1000) < Date.now();
    } catch {
      return true;
    }
  }
}
