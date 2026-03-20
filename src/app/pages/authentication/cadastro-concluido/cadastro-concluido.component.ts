import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';

interface CadastroConcluidoViewModel {
  cadastroConcluido: boolean;
  eventoConversao: string;
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
export class AppCadastroConcluidoComponent implements OnInit {
  cadastro = this.buildMockData();
  private cameFromRealFlow = false;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.cadastro = this.resolveCadastro();
    this.trackConversionIfNeeded();
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

  private resolveCadastro(): CadastroConcluidoViewModel {
    const stateCadastro = history.state?.cadastro as Partial<CadastroConcluidoViewModel> | undefined;
    const queryParams = this.route.snapshot.queryParamMap;
    this.cameFromRealFlow = !!stateCadastro;

    return {
      ...this.buildMockData(),
      ...stateCadastro,
      cadastroConcluido: this.parseBoolean(queryParams.get('cadastroConcluido'), stateCadastro?.cadastroConcluido ?? true),
      eventoConversao: queryParams.get('eventoConversao') || stateCadastro?.eventoConversao || 'cadastro_empresa_concluido',
      empresaId: this.parseNumber(queryParams.get('empresaId'), stateCadastro?.empresaId ?? 123),
      empresaNome: queryParams.get('empresaNome') || stateCadastro?.empresaNome || 'Grafica Exemplo',
      usuarioId: this.parseNumber(queryParams.get('usuarioId'), stateCadastro?.usuarioId ?? 456),
      usuarioNome: queryParams.get('usuarioNome') || stateCadastro?.usuarioNome || 'Leonardo Barros',
      usuarioUsername: queryParams.get('usuarioUsername') || stateCadastro?.usuarioUsername || 'leo@email.com',
      onboardingConcluido: this.parseBoolean(queryParams.get('onboardingConcluido'), stateCadastro?.onboardingConcluido ?? false),
      trialInicio: queryParams.get('trialInicio') || stateCadastro?.trialInicio || '2026-03-20',
      trialFim: queryParams.get('trialFim') || stateCadastro?.trialFim || '2026-03-27',
    };
  }

  private buildMockData(): CadastroConcluidoViewModel {
    return {
      cadastroConcluido: true,
      eventoConversao: 'cadastro_empresa_concluido',
      empresaId: 123,
      empresaNome: 'Grafica Exemplo',
      usuarioId: 456,
      usuarioNome: 'Leonardo Barros',
      usuarioUsername: 'leo@email.com',
      onboardingConcluido: false,
      trialInicio: '2026-03-20',
      trialFim: '2026-03-27',
    };
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

  private parseBoolean(value: string | null, fallback: boolean): boolean {
    if (value === null) {
      return fallback;
    }

    return value === 'true';
  }

  private parseNumber(value: string | null, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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
