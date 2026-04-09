import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { MobileSummarySheetComponent } from 'src/app/components/mobile-summary-sheet/mobile-summary-sheet.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { OnboardingTourComponent } from 'src/app/shared/onboarding/onboarding-tour.component';
import { OnboardingService } from 'src/app/shared/onboarding/onboarding.service';
import { OnboardingTourConfig } from 'src/app/shared/onboarding/onboarding-step.model';
import { DemoAnalyticsService } from './demo-analytics.service';
import { getDemoLandingContactUrl } from './demo-links';
import { DemoSmartcalcService } from './demo-smartcalc.service';

@Component({
  selector: 'app-demo-whatsapp',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MobileTotalBarComponent, MobileSummarySheetComponent, SectionCardComponent, OnboardingTourComponent],
  templateUrl: './demo-whatsapp.component.html',
  styleUrl: './demo-whatsapp.component.scss',
})
export class DemoWhatsappComponent implements OnInit, OnDestroy {
  private static readonly TOUR_STORAGE_KEY = 'demo-whatsapp-tour-seen';
  private static readonly ANALYTICS_WHATSAPP_KEY = 'whatsapp-previewed';
  readonly mobileViewport = signal(false);
  readonly mobileSheetOpen = signal(false);
  readonly showConversionCta = signal(false);
  readonly tourConfig: OnboardingTourConfig = {
    id: 'demo-whatsapp-tour',
    storageKey: DemoWhatsappComponent.TOUR_STORAGE_KEY,
    steps: [
      {
        id: 'preview',
        title: 'Mensagem pronta para enviar',
        description: 'Aqui o pedido demo já vira texto comercial pronto para WhatsApp.',
        target: '[data-tour="demo-whatsapp-preview"]',
        preferredPlacement: 'bottom',
      },
      {
        id: 'copy',
        title: 'Copie em um toque',
        description: 'Use copiar para testar o texto e mostrar como o atendimento ganha velocidade.',
        target: '[data-tour="demo-whatsapp-copy"]',
        preferredPlacement: 'top',
      },
      {
        id: 'send',
        title: 'Abra no WhatsApp',
        description: 'Esse é o fechamento do fluxo: cálculo, pedido e mensagem prontos para vender.',
        target: ['[data-tour="demo-whatsapp-send"]', '[data-tour="demo-whatsapp-send-mobile"]'],
        preferredPlacement: 'top',
      },
    ],
  };
  constructor(
    readonly demo: DemoSmartcalcService,
    private readonly router: Router,
    private readonly onboarding: OnboardingService,
    private readonly analytics: DemoAnalyticsService,
  ) {}

  ngOnInit(): void {
    this.updateViewport();
    if (!this.demo.pedidoSimulado()) {
      this.router.navigate(['/demo/pedido']);
      return;
    }

    if (this.demo.whatsappPreview()) {
      this.trackWhatsappViewed();
      this.startTourIfNeeded();
      return;
    }

    this.demo.carregarWhatsappPreview().subscribe({
      next: () => {
        this.trackWhatsappViewed();
        this.startTourIfNeeded();
      },
      error: () => this.router.navigate(['/demo/pedido']),
    });
  }

  ngOnDestroy(): void {
    this.onboarding.stop();
  }

  @HostListener('window:resize')
  updateViewport(): void {
    const mobile = window.innerWidth <= 900;
    this.mobileViewport.set(mobile);
    this.mobileSheetOpen.set(mobile);
  }

  get displayNumero(): string {
    return this.demo.whatsappPreview()?.numeroPedido || this.demo.orderPreview().numero;
  }

  get status(): string {
    return this.demo.whatsappPreview()?.status || 'RASCUNHO';
  }

  get telefone(): string {
    return this.demo.whatsappPreview()?.telefone || this.demo.orderPreview().clienteTelefone;
  }

  get mensagem(): string {
    return this.demo.whatsappMessage();
  }

  abrirCadastro(): void {
    this.analytics.track('demo_cta_signup_clicked', 'whatsapp', 'conversao', { cta: 'signup' });
    this.router.navigateByUrl('/authentication/registro-gestor');
  }

  abrirWhatsApp(): void {
    this.showConversionCta.set(true);
  }

  falarComEspecialista(): void {
    this.analytics.track('demo_cta_specialist_clicked', 'whatsapp', 'conversao', { cta: 'specialist' });
    window.location.assign(getDemoLandingContactUrl());
  }

  fecharConversao(): void {
    this.showConversionCta.set(false);
  }

  abrirMobileSheet(): void {
    this.mobileSheetOpen.set(true);
  }

  fecharMobileSheet(): void {
    this.mobileSheetOpen.set(false);
  }

  copiar(): void {
    if (!this.mensagem) return;
    navigator.clipboard.writeText(this.mensagem).catch(() => {});
  }

  abrirTutorial(): void {
    if (this.mobileViewport()) {
      this.mobileSheetOpen.set(true);
    }
    this.onboarding.restart(this.tourConfig);
  }

  private startTourIfNeeded(): void {
    setTimeout(() => {
      if (this.mobileViewport()) {
        this.mobileSheetOpen.set(true);
      }
      this.onboarding.startIfNeeded(this.tourConfig);
    }, 220);
  }

  private trackWhatsappViewed(): void {
    const preview = this.demo.whatsappPreview();
    if (!preview) {
      return;
    }

    this.analytics.track(
      'demo_whatsapp_previewed',
      'whatsapp',
      'preview',
      {
        numeroPedidoDemo: preview.numeroPedido,
        telefone: preview.telefone,
      },
      { onceKey: DemoWhatsappComponent.ANALYTICS_WHATSAPP_KEY },
    );
  }
}
