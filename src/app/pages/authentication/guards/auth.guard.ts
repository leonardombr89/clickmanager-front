import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean {
    const token = this.authService.getToken();

    if (token && !this.isTokenExpired(token)) {
      return true;
    }
    
    this.authService.logout();
    this.router.navigate(['/login']);
    return false;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp < now;
    } catch (e) {
      return true;
    }
  }
}
