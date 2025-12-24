import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    const token = this.authService.getToken();

    if (token && !this.authService.isAccessTokenExpired(token)) {
      return of(true);
    }

    if (this.authService.hasValidRefreshToken()) {
      return this.authService.refreshToken().pipe(
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
}
