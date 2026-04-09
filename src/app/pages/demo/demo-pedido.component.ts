import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { ResumoFinanceiroCardComponent } from 'src/app/components/resumo-financeiro-card/resumo-financeiro-card.component';
import { PedidoInfoCardComponent } from 'src/app/components/pedido-info-card/pedido-info-card.component';
import { ItensPedidoSectionComponent } from 'src/app/components/itens-pedido-section/itens-pedido-section.component';
import { ObservacoesCardComponent } from 'src/app/components/observacoes-card/observacoes-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { OnboardingTourComponent } from 'src/app/shared/onboarding/onboarding-tour.component';
import { OnboardingService } from 'src/app/shared/onboarding/onboarding.service';
import { OnboardingTourConfig } from 'src/app/shared/onboarding/onboarding-step.model';
import { DemoAnalyticsService } from './demo-analytics.service';
import { getDemoLandingContactUrl } from './demo-links';
import { DemoPedidoApi, DemoSmartcalcService } from './demo-smartcalc.service';

@Component({
  selector: 'app-demo-pedido',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    SectionCardComponent,
    ResumoFinanceiroCardComponent,
    PedidoInfoCardComponent,
    ItensPedidoSectionComponent,
    ObservacoesCardComponent,
    StatusBadgeComponent,
    MobileTotalBarComponent,
    OnboardingTourComponent,
  ],
  templateUrl: './demo-pedido.component.html',
  styleUrl: './demo-pedido.component.scss',
})
export class DemoPedidoComponent implements OnInit, OnDestroy {
  private static readonly TOUR_STORAGE_KEY = 'demo-pedido-tour-seen';
  private static readonly GUIDE_DISMISSED_KEY = 'demo-pedido-guide-dismissed';
  private static readonly AUTO_START_TOUR_KEY = 'demo-pedido-tour-autostart';
  private static readonly ANALYTICS_ORDER_KEY = 'pedido-generated';
  readonly observacoesControl = new FormControl<string>('Pedido criado a partir da demonstração pública do SmartCalc.', { nonNullable: true });
  readonly mobileViewport = signal(false);
  readonly howItWorksExpanded = signal(false);
  readonly howItWorksDismissed = signal(false);
  readonly showConversionCta = signal(false);
  readonly desktopTourConfig: OnboardingTourConfig = {
    id: 'demo-pedido-tour',
    storageKey: DemoPedidoComponent.TOUR_STORAGE_KEY,
    steps: [
      {
        id: 'resumo',
        title: 'Seu orçamento virou pedido automaticamente',
        description: 'Tudo já calculado — sem planilha, sem erro.',
        target: ['[data-tour="demo-pedido-resumo"]', '[data-tour="demo-pedido-mobile-shell"]'],
        preferredPlacement: 'bottom',
      },
      {
        id: 'cliente',
        title: 'Pronto para enviar ao cliente',
        description: 'Os dados comerciais já ficam organizados para seguir com segurança.',
        target: '[data-tour="demo-pedido-cliente"]',
        preferredPlacement: 'right',
      },
      {
        id: 'itens',
        title: 'Itens já calculados e organizados',
        description: 'Quantidade, valor e subtotal chegam prontos dentro do pedido.',
        target: '[data-tour="demo-pedido-itens"]',
        preferredPlacement: 'right',
      },
      {
        id: 'acoes',
        title: 'Tudo pronto para produção',
        description: 'Pedido completo, duas vias e etiqueta saem sem remontar nada.',
        target: '[data-tour="demo-pedido-print"]',
        preferredPlacement: 'left',
      },
      {
        id: 'whatsapp',
        title: 'Envie o pedido direto no WhatsApp',
        description: 'A mensagem sai pronta para atendimento e venda.',
        target: ['[data-tour="demo-pedido-whatsapp"]', '[data-tour="demo-pedido-mobile-whatsapp"]'],
        preferredPlacement: 'top',
      },
    ],
  };
  readonly mobileTourConfig: OnboardingTourConfig = {
    id: 'demo-pedido-tour',
    storageKey: DemoPedidoComponent.TOUR_STORAGE_KEY,
    steps: [
      {
        id: 'resumo-mobile',
        title: 'Pedido pronto para revisar',
        description: 'O orçamento já virou pedido sem planilha e sem retrabalho.',
        target: '[data-tour="demo-pedido-resumo"]',
        preferredPlacement: 'bottom',
      },
      {
        id: 'cliente-mobile',
        title: 'Cliente pronto para envio',
        description: 'Os dados comerciais já ficam organizados para seguir com atendimento.',
        target: '[data-tour="demo-pedido-cliente"]',
        preferredPlacement: 'bottom',
      },
      {
        id: 'itens-mobile',
        title: 'Itens já calculados e organizados',
        description: 'Quantidade, valor e subtotal chegam prontos dentro do pedido.',
        target: '[data-tour="demo-pedido-itens"]',
        preferredPlacement: 'top',
      },
      {
        id: 'print-mobile',
        title: 'Tudo pronto para produção',
        description: 'Pedido completo, duas vias e etiqueta saem sem remontar nada.',
        target: '[data-tour="demo-pedido-print"]',
        preferredPlacement: 'top',
      },
      {
        id: 'whatsapp-mobile',
        title: 'Envie o pedido direto no WhatsApp',
        description: 'Mensagem pronta, é só enviar para fechar o atendimento.',
        target: '[data-tour="demo-pedido-mobile-whatsapp"]',
        preferredPlacement: 'top',
      },
    ],
  };
  imprimindoLayout: 'completo' | 'duas-vias' | 'etiquetas' | null = null;
  private readonly document = inject(DOCUMENT);
  private tourStartTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly demo: DemoSmartcalcService,
    private readonly router: Router,
    private readonly onboarding: OnboardingService,
    private readonly analytics: DemoAnalyticsService,
  ) {
    effect(() => {
      const completion = this.onboarding.completion();
      if (!completion || completion.tourId !== this.desktopTourConfig.id) {
        return;
      }

      if (completion.reason === 'finished') {
        this.showConversionCta.set(true);
      }

      this.onboarding.clearCompletion();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.updateViewport();
    this.howItWorksDismissed.set(this.readGuideDismissed());

    if (!this.demo.hasResult()) {
      this.router.navigate(['/demo/smartcalc']);
      return;
    }

    if (this.demo.pedidoSimulado()) {
      this.observacoesControl.setValue(this.demo.pedidoSimulado()?.observacoes || 'Pedido criado a partir da demonstração pública do SmartCalc.');
      this.trackOrderGenerated();
      this.startTourIfNeeded();
      return;
    }

    this.demo.simularPedido().subscribe({
      next: pedido => {
        this.observacoesControl.setValue(pedido.observacoes || 'Pedido criado a partir da demonstração pública do SmartCalc.');
        this.trackOrderGenerated();
        this.startTourIfNeeded();
      },
      error: () => {
        this.router.navigate(['/demo/smartcalc']);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.tourStartTimeout) {
      clearTimeout(this.tourStartTimeout);
      this.tourStartTimeout = null;
    }
    this.onboarding.stop();
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.mobileViewport.set(window.innerWidth <= 900);
  }

  get pedidoAtual(): DemoPedidoApi | null {
    return this.demo.pedidoSimulado();
  }

  get pedidoView(): any | null {
    const pedido = this.pedidoAtual;
    if (!pedido) return null;

    return {
      id: null,
      numero: pedido.numeroPedido,
      status: pedido.status,
      frete: 0,
      acrescimo: 0,
      desconto: 0,
      dataCriacao: new Date().toISOString(),
      cliente: {
        id: null,
        nome: pedido.clienteNome,
        email: pedido.clienteEmail || '-',
        telefone: pedido.clienteTelefone,
        documento: '-',
        ativo: true,
        endereco: {
          cep: '-',
          logradouro: '-',
          numero: '-',
          bairro: '-',
          cidade: '-',
          estado: '-',
        },
      },
      total: pedido.total,
      subTotal: pedido.subtotal,
      valorTotalPago: 0,
      restaPagar: pedido.total,
      itens: pedido.itens.map((item, index) => ({
        id: index + 1,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valor: item.valorUnitario,
        subTotal: item.subtotal,
      })),
      pagamentos: [],
      responsavel: {
        id: 0,
        nome: 'Leonardo Miranda de Barros',
      },
      observacoes: pedido.observacoes || 'Pedido criado a partir da demonstração pública do SmartCalc.',
    };
  }

  get totalPago(): number {
    return 0;
  }

  get restaPagar(): number {
    return this.pedidoAtual?.total ?? 0;
  }

  get pedidoNumeroExibicao(): string {
    return this.pedidoAtual?.numeroPedido ?? 'Pedido demo';
  }

  get carregando(): boolean {
    return this.demo.loadingPedido();
  }

  private get activeTourConfig(): OnboardingTourConfig {
    return this.mobileViewport() ? this.mobileTourConfig : this.desktopTourConfig;
  }

  abrirWhatsapp(): void {
    this.showConversionCta.set(false);
    this.demo.carregarWhatsappPreview().subscribe({
      next: () => this.router.navigate(['/demo/whatsapp']),
      error: () => {},
    });
  }

  abrirTutorial(): void {
    this.showConversionCta.set(false);
    this.onboarding.restart(this.activeTourConfig);
  }

  toggleHowItWorks(): void {
    if (this.howItWorksDismissed()) {
      this.howItWorksDismissed.set(false);
      this.persistGuideDismissed(false);
      this.howItWorksExpanded.set(true);
      return;
    }

    this.howItWorksExpanded.update((expanded) => !expanded);
  }

  dismissHowItWorks(): void {
    this.howItWorksDismissed.set(true);
    this.howItWorksExpanded.set(false);
    this.persistGuideDismissed(true);
  }

  voltarParaSmartcalc(): void {
    this.showConversionCta.set(false);
    this.router.navigate(['/demo/smartcalc']);
  }

  abrirCadastro(): void {
    this.showConversionCta.set(false);
    this.analytics.track('demo_cta_signup_clicked', 'pedido', 'conversao', { cta: 'signup' });
    this.router.navigate(['/authentication/registro-gestor']);
  }

  falarComEspecialista(): void {
    this.analytics.track('demo_cta_specialist_clicked', 'pedido', 'conversao', { cta: 'specialist' });
    window.location.assign(getDemoLandingContactUrl());
  }

  fecharConversao(): void {
    this.showConversionCta.set(false);
  }

  abrirPdf(layout: 'completo' | 'duas-vias' | 'etiquetas'): void {
    if (this.imprimindoLayout) {
      return;
    }

    this.imprimindoLayout = layout;
    this.demo.abrirPdf(layout).subscribe({
      next: () => {
        this.imprimindoLayout = null;
      },
      error: () => {
        this.imprimindoLayout = null;
      },
    });
  }

  noop(): void {}

  private trackOrderGenerated(): void {
    const pedido = this.demo.pedidoSimulado();
    if (!pedido) {
      return;
    }

    this.analytics.track(
      'demo_order_generated',
      'pedido',
      'pedido-gerado',
      {
        numeroPedidoDemo: pedido.numeroPedido,
        total: pedido.total,
        quantidadeItens: pedido.itens?.length ?? 0,
      },
      { onceKey: DemoPedidoComponent.ANALYTICS_ORDER_KEY },
    );
  }

  buscarClientes = (_termo: string): Observable<any[]> => of([]);
  mostrarCliente = (cliente: any): string => cliente?.nome || '';

  private startTourIfNeeded(): void {
    const force = this.consumeAutoStartTourFlag();
    this.scheduleTourStart(force);
  }

  private scheduleTourStart(force: boolean, attempt = 0): void {
    if (this.tourStartTimeout) {
      clearTimeout(this.tourStartTimeout);
      this.tourStartTimeout = null;
    }

    this.tourStartTimeout = setTimeout(() => {
      if (!this.hasRenderableTourTarget()) {
        if (attempt < 8) {
          this.scheduleTourStart(force, attempt + 1);
        }
        return;
      }

      if (force) {
        this.onboarding.restart(this.activeTourConfig);
      } else {
        this.onboarding.startIfNeeded(this.activeTourConfig);
      }
    }, attempt === 0 ? 280 : 180);
  }

  private hasRenderableTourTarget(): boolean {
    for (const step of this.activeTourConfig.steps) {
      const selectors = Array.isArray(step.target) ? step.target : [step.target];
      for (const selector of selectors) {
        const element = this.document.querySelector(selector);
        if (!(element instanceof HTMLElement)) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return true;
        }
      }
    }

    return false;
  }

  private consumeAutoStartTourFlag(): boolean {
    try {
      if (sessionStorage.getItem(DemoPedidoComponent.AUTO_START_TOUR_KEY) !== 'true') {
        return false;
      }

      sessionStorage.removeItem(DemoPedidoComponent.AUTO_START_TOUR_KEY);
      return true;
    } catch {
      return false;
    }
  }

  private readGuideDismissed(): boolean {
    try {
      return localStorage.getItem(DemoPedidoComponent.GUIDE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persistGuideDismissed(value: boolean): void {
    try {
      localStorage.setItem(DemoPedidoComponent.GUIDE_DISMISSED_KEY, String(value));
    } catch {
      // ignore localStorage failure
    }
  }
}
