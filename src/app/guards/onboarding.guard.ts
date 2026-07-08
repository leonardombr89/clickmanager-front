import { Injectable } from '@angular/core';
import { CanActivateChild, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { OnboardingFlowService } from '../components/onboarding/onboarding-flow.service';
import { AuthService } from '../services/auth.service';
import { Usuario } from '../models/usuario/usuario.model';
import { OnboardingV2Service } from '../pages/onboarding-v2/services/onboarding-v2.service';
import { isOnboardingV2Finished, resolveOnboardingV2RouteFromProgress } from '../pages/onboarding-v2/models/onboarding-v2.models';

@Injectable({ providedIn: 'root' })
export class OnboardingGuard implements CanActivateChild {
  constructor(
    private authService: AuthService,
    private onboardingFlow: OnboardingFlowService,
    private onboardingV2Service: OnboardingV2Service,
    private router: Router
  ) {}

  canActivateChild(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    if (this.isBillingRoute(state.url)) {
      return of(true);
    }

    return this.resolveUsuario().pipe(
      switchMap((usuario) => {
        if (!usuario?.proprietario) {
          return of(true);
        }

        const usuarioId = usuario.id ?? null;
        const ignorarOnboarding = usuario.onboardingIgnorado ?? usuario.empresa?.onboardingIgnorado;
        if (ignorarOnboarding) {
          return of(true);
        }

        return this.onboardingV2Service.fetchProgress().pipe(
          map((progress) => {
            if (progress?.onboardingVersion === 'v2') {
              if (isOnboardingV2Finished(progress)) {
                if (usuarioId) {
                  this.onboardingFlow.clearDismissed(usuarioId);
                }
                return true;
              }

              return this.router.createUrlTree([resolveOnboardingV2RouteFromProgress(progress)]);
            }

            return null;
          }),
          switchMap((result) => {
            if (result !== null) {
              return of(result);
            }

            return this.onboardingFlow.loadStatus(true).pipe(
              map((status) => {
                if (status.onboardingConcluido) {
                  if (usuarioId) {
                    this.onboardingFlow.clearDismissed(usuarioId);
                  }
                  return true;
                }

                if (usuarioId && this.onboardingFlow.wasDismissed(usuarioId)) {
                  return true;
                }

                return this.router.createUrlTree([
                  this.authService.getOnboardingRouteForUsuario(false, usuario)
                ]);
              }),
              catchError(() => of(true))
            );
          }),
          catchError(() =>
            this.onboardingFlow.loadStatus(true).pipe(
              map((status) => {
                if (status.onboardingConcluido) {
                  if (usuarioId) {
                    this.onboardingFlow.clearDismissed(usuarioId);
                  }
                  return true;
                }

                if (usuarioId && this.onboardingFlow.wasDismissed(usuarioId)) {
                  return true;
                }

                return this.router.createUrlTree([
                  this.authService.getOnboardingRouteForUsuario(false, usuario)
                ]);
              }),
              catchError(() => of(true))
            )
          )
        );
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

  private isBillingRoute(url: string): boolean {
    const normalized = (url || '').toLowerCase();
    return normalized.startsWith('/billing/');
  }
}
