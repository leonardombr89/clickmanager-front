import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { OnboardingV2Service } from 'src/app/pages/onboarding-v2/services/onboarding-v2.service';
import { isOnboardingV2Finished, resolveOnboardingV2RouteFromProgress } from 'src/app/pages/onboarding-v2/models/onboarding-v2.models';

interface CadastroConcluidoViewModel {
  cadastroConcluido: boolean;
  eventoConversao: string;
  autenticado: boolean;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  empresaId: number;
  empresaNome: string;
  usuarioId: number;
  usuarioNome: string;
  usuarioUsername: string;
  onboardingConcluido: boolean;
  trialInicio: string;
  trialFim: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  }
}

@Component({
  selector: 'app-cadastro-concluido',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, BrandingComponent],
  templateUrl: './cadastro-concluido.component.html',
  styleUrl: './cadastro-concluido.component.scss',
})
export class AppCadastroConcluidoComponent implements OnInit, OnDestroy {
  private readonly cadastroConcluidoStorageKey = 'clickmanager:onboarding:cadastro-concluido';
  private autoRedirectTimer: ReturnType<typeof setTimeout> | null = null;
  private redirecting = false;
  cadastro!: CadastroConcluidoViewModel;
  private cameFromRealFlow = false;
  nextRoute = '/onboarding';

  constructor(
    private router: Router,
    private onboardingV2Service: OnboardingV2Service
  ) {}

  ngOnInit(): void {
    const cadastro = this.resolveCadastro();
    if (!cadastro) {
      this.router.navigate(['/authentication/registro-gestor']);
      return;
    }

    this.cadastro = cadastro;
    this.trackConversionIfNeeded();
    this.resolveNextRoute();
  }

  ngOnDestroy(): void {
    if (this.autoRedirectTimer) {
      clearTimeout(this.autoRedirectTimer);
    }
  }

  get trialPeriodoFormatado(): string {
    return `${this.formatDate(this.cadastro.trialInicio)} a ${this.formatDate(this.cadastro.trialFim)}`;
  }

  get diasDeTrial(): number {
    const inicio = this.parseDate(this.cadastro.trialInicio);
    const fim = this.parseDate(this.cadastro.trialFim);

    if (!inicio || !fim) {
      return 0;
    }

    const diffInMs = fim.getTime() - inicio.getTime();
    return Math.max(0, Math.round(diffInMs / 86400000));
  }

  get trialLabel(): string {
    return `${this.diasDeTrial || 7} dias grátis`;
  }

  get ctaLink(): string[] {
    return [this.nextRoute];
  }

  private scheduleAutoRedirect(): void {
    this.autoRedirectTimer = setTimeout(() => {
      this.router.navigateByUrl(this.nextRoute);
    }, 2500);
  }

  private resolveNextRoute(): void {
    this.redirecting = true;

    this.onboardingV2Service.fetchProgress().pipe(finalize(() => (this.redirecting = false))).subscribe({
      next: (progress) => {
        if (progress.onboardingVersion === 'v2') {
          this.nextRoute = isOnboardingV2Finished(progress)
            ? '/dashboards/dashboard1'
            : resolveOnboardingV2RouteFromProgress(progress);
        } else {
          this.nextRoute = progress.onboardingConcluido ? '/dashboards/dashboard1' : '/onboarding';
        }

        this.scheduleAutoRedirect();
      },
      error: () => {
        this.nextRoute = '/onboarding';
        this.scheduleAutoRedirect();
      }
    });
  }

  private resolveCadastro(): CadastroConcluidoViewModel | null {
    const stateCadastro = history.state?.cadastro as CadastroConcluidoViewModel | undefined;
    const storedCadastro = this.readStoredCadastro();
    const cadastro = stateCadastro || storedCadastro;
    this.cameFromRealFlow = !!cadastro;

    if (cadastro) {
      sessionStorage.removeItem(this.cadastroConcluidoStorageKey);
    }

    return cadastro || null;
  }

  private trackConversionIfNeeded(): void {
    if (!this.cameFromRealFlow || !this.cadastro.cadastroConcluido) {
      return;
    }

    const eventName = this.cadastro.eventoConversao || 'cadastro_empresa_concluido';
    const storageKey = `ga-conversion:${eventName}:${this.cadastro.empresaId}:${this.cadastro.usuarioId}`;

    if (sessionStorage.getItem(storageKey)) {
      return;
    }

    const payload = {
      event_category: 'onboarding',
      event_label: this.cadastro.empresaNome,
      empresa_id: this.cadastro.empresaId,
      empresa_nome: this.cadastro.empresaNome,
      usuario_id: this.cadastro.usuarioId,
      usuario_nome: this.cadastro.usuarioNome,
      onboarding_concluido: this.cadastro.onboardingConcluido,
      trial_inicio: this.cadastro.trialInicio,
      trial_fim: this.cadastro.trialFim,
    };

    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...payload,
      });
    }

    sessionStorage.setItem(storageKey, '1');
  }

  private readStoredCadastro(): CadastroConcluidoViewModel | null {
    const raw = sessionStorage.getItem(this.cadastroConcluidoStorageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CadastroConcluidoViewModel;
    } catch {
      return null;
    }
  }

  private parseDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const normalized = value.length <= 10 ? `${value}T00:00:00` : value;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDate(value: string): string {
    const date = this.parseDate(value);

    if (!date) {
      return '-';
    }

    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
}
