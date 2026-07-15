import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { OnboardingShellComponent } from 'src/app/components/onboarding/onboarding-shell.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { AuthService } from 'src/app/services/auth.service';
import {
  isOnboardingV2Finished,
  resolveOnboardingV2RouteFromProgress,
  resolveOnboardingV2StepFromProgress,
} from '../models/onboarding-v2.models';
import { OnboardingV2StateService } from '../services/onboarding-v2-state.service';

@Component({
  selector: 'app-onboarding-v2-summary-page',
  standalone: true,
  imports: [CommonModule, MaterialModule, OnboardingShellComponent, SectionCardComponent],
  templateUrl: './onboarding-v2-summary-page.component.html',
  styleUrls: ['./onboarding-v2-summary-page.component.scss'],
})
export class OnboardingV2SummaryPageComponent implements OnInit {
  carregando = true;

  constructor(
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    protected readonly onboardingV2State: OnboardingV2StateService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/onboarding-v2']);
      return;
    }

    this.loadStep();
  }

  submit(): void {
    this.onboardingV2State.finishOnboarding().subscribe({
      next: () => {
        this.toastr.success('Onboarding finalizado. Seu painel já está liberado.');
        this.router.navigateByUrl(this.authService.getDefaultRouteForUsuario());
      },
      error: () => {
        this.toastr.error(this.onboardingV2State.error() || 'Não foi possível concluir o onboarding.');
      },
    });
  }

  loadStep(): void {
    this.carregando = true;
    this.onboardingV2State
      .loadResumo()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (resumo) => {
          if (resumo.onboardingVersion !== 'v2') {
            this.router.navigateByUrl(this.authService.getOnboardingRouteForUsuario(resumo.onboardingConcluido));
            return;
          }

          if (isOnboardingV2Finished(resumo)) {
            this.router.navigateByUrl(this.authService.getDefaultRouteForUsuario());
            return;
          }

          if (resolveOnboardingV2StepFromProgress(resumo) !== 'summary') {
            this.router.navigateByUrl(resolveOnboardingV2RouteFromProgress(resumo));
          }
        },
        error: () => {
          this.toastr.error(this.onboardingV2State.error() || 'Não foi possível carregar o resumo.');
        },
      });
  }
}
