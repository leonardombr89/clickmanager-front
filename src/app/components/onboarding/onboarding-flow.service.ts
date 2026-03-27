import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OnboardingService, OnboardingStatusResponse } from './onboarding.service';

@Injectable({ providedIn: 'root' })
export class OnboardingFlowService {
  private readonly storagePrefix = 'clickmanager:onboarding:dismissed';
  private readonly statusSubject = new BehaviorSubject<OnboardingStatusResponse | null>(null);

  readonly status$ = this.statusSubject.asObservable();

  constructor(private onboardingService: OnboardingService) {}

  get currentStatus(): OnboardingStatusResponse | null {
    return this.statusSubject.value;
  }

  loadStatus(force = false): Observable<OnboardingStatusResponse> {
    if (!force && this.statusSubject.value) {
      return of(this.statusSubject.value);
    }

    return this.onboardingService.obterStatus().pipe(
      tap((status) => {
        this.statusSubject.next(status);
      })
    );
  }

  setStatus(status: OnboardingStatusResponse | null): void {
    this.statusSubject.next(status);
  }

  markDismissed(usuarioId: number): void {
    localStorage.setItem(this.buildStorageKey(usuarioId), '1');
  }

  clearDismissed(usuarioId: number): void {
    localStorage.removeItem(this.buildStorageKey(usuarioId));
  }

  wasDismissed(usuarioId: number): boolean {
    return localStorage.getItem(this.buildStorageKey(usuarioId)) === '1';
  }

  private buildStorageKey(usuarioId: number): string {
    return `${this.storagePrefix}:${usuarioId}`;
  }
}
