import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, WritableSignal, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { OnboardingTourComponent } from 'src/app/shared/onboarding/onboarding-tour.component';
import { OnboardingService } from 'src/app/shared/onboarding/onboarding.service';
import { OnboardingTourConfig } from 'src/app/shared/onboarding/onboarding-step.model';
import { DemoSmartcalcService } from './demo-smartcalc.service';
import { EMPTY, Subject, Subscription, catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs';
import { isDemoLandingReferrer } from './demo-links';
import { DemoAnalyticsService } from './demo-analytics.service';

@Component({
  selector: 'app-demo-smartcalc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    InputOptionsComponent,
    InputNumericoComponent,
    InputMultiSelectComponent,
    MobileTotalBarComponent,
    OnboardingTourComponent,
    CurrencyPipe,
  ],
  templateUrl: './demo-smartcalc.component.html',
  styleUrl: './demo-smartcalc.component.scss',
})
export class DemoSmartcalcComponent implements OnInit, OnDestroy {
  private static readonly TOUR_STORAGE_KEY = 'demo-smartcalc-tour-seen';
  private static readonly GUIDE_DISMISSED_KEY = 'demo-smartcalc-guide-dismissed';
  private static readonly NEXT_PEDIDO_TOUR_KEY = 'demo-pedido-tour-autostart';
  private static readonly ANALYTICS_VIEWED_KEY = 'smartcalc-viewed';
  private static readonly ANALYTICS_TOUR_STARTED_KEY = 'smartcalc-tour-started';
  private static readonly ANALYTICS_TOUR_COMPLETED_KEY = 'smartcalc-tour-completed';
  private static readonly ANALYTICS_TOUR_SKIPPED_KEY = 'smartcalc-tour-skipped';
  private static readonly ANALYTICS_CALC_KEY = 'smartcalc-calculation-completed';
  readonly mobileViewport = signal(false);
  readonly resultadoMobileAberto = signal(false);
  readonly needsRecalcular = signal(false);
  readonly animandoResultado = signal(false);
  readonly howItWorksExpanded = signal(false);
  readonly howItWorksDismissed = signal(false);
  readonly showConversionCta = signal(false);
  readonly displayedTotal = signal(0);
  readonly displayedUnitPrice = signal(0);
  readonly displayedProduced = signal(0);
  readonly displayedSobra = signal(0);
  readonly tourConfig: OnboardingTourConfig = {
    id: 'demo-smartcalc-tour',
    storageKey: DemoSmartcalcComponent.TOUR_STORAGE_KEY,
    steps: [
      {
        id: 'produto-material',
        title: 'Escolha produto e material',
        description: 'Já deixamos um exemplo pronto para você começar.',
        target: '[data-tour="demo-product-material"]',
        preferredPlacement: 'bottom',
      },
      {
        id: 'medidas',
        title: 'Defina tamanho e quantidade',
        description: 'Você pode usar esses valores ou testar outros.',
        target: '[data-tour="demo-measures"]',
        preferredPlacement: 'bottom',
      },
      {
        id: 'extras',
        title: 'Adicione extras que impactam no preço',
        description: 'Extras mudam o preço na hora.',
        target: '[data-tour="demo-extras"]',
        preferredPlacement: 'top',
      },
      {
        id: 'resultado',
        title: 'Veja o valor final instantâneo',
        description: 'Aqui aparece o preço final. Toque em abrir detalhes para ver distribuição, sobra útil e mais informações do cálculo.',
        target: ['[data-tour="demo-results-desktop"]', 'app-mobile-total-bar[data-tour="demo-results-mobile"]'],
        preferredPlacement: 'left',
      },
      {
        id: 'pedido',
        title: 'Pronto para enviar ao cliente',
        description: 'Quando o valor fizer sentido, avance e veja o pedido demo virar mensagem de WhatsApp.',
        target: ['[data-tour="demo-create-order-desktop"]', 'app-mobile-total-bar[data-tour="demo-results-mobile"] .mobile-total-bar__cta'],
        preferredPlacement: 'top',
        ctaHint: 'Sem cartão • 2 minutos',
      },
    ],
  };
  produtoInitSelecionado: { nome: string; variacoes: number[] } | null = null;
  private readonly calcTrigger$ = new Subject<void>();
  private readonly subscriptions = new Subscription();
  private animationFrames = new Set<number>();
  produtos: Array<{ id: number; nome: string }> = [];
  materiais: Array<{ id: number; nome: string }> = [];
  acabamentos: Array<{ id: number; nome: string }> = [];
  servicos: Array<{ id: string; nome: string }> = [];

  readonly form = new FormGroup({
    produtoId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    materialId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    largura: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    altura: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    quantidade: new FormControl<number | null>(null, { validators: [Validators.required, Validators.min(1)] }),
    acabamentosIds: new FormControl<number[]>(this.demo.getSelectedFinishIds(), { nonNullable: true }),
    servicosIds: new FormControl<string[]>(this.demo.getSelectedServiceIds(), { nonNullable: true }),
  });

  constructor(
    readonly demo: DemoSmartcalcService,
    private readonly router: Router,
    private readonly onboarding: OnboardingService,
    private readonly analytics: DemoAnalyticsService,
  ) {
    effect(() => {
      const completion = this.onboarding.completion();
      if (!completion || completion.tourId !== this.tourConfig.id) {
        return;
      }

      if (completion.reason === 'finished') {
        this.analytics.track(
          'demo_tour_completed',
          'smartcalc',
          'tour',
          { completedStep: this.tourConfig.steps.length },
          { onceKey: DemoSmartcalcComponent.ANALYTICS_TOUR_COMPLETED_KEY },
        );
        this.showConversionCta.set(true);
      } else if (completion.reason === 'skipped') {
        this.analytics.track(
          'demo_tour_skipped',
          'smartcalc',
          'tour',
          { skippedAtStep: this.onboarding.currentIndex() + 1 },
          { onceKey: DemoSmartcalcComponent.ANALYTICS_TOUR_SKIPPED_KEY },
        );
      }

      this.onboarding.clearCompletion();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.updateViewport();
    this.howItWorksDismissed.set(this.readGuideDismissed());
    this.analytics.track('demo_viewed', 'smartcalc', 'entrada', null, {
      onceKey: DemoSmartcalcComponent.ANALYTICS_VIEWED_KEY,
    });
    this.subscriptions.add(
      this.calcTrigger$
        .pipe(
          debounceTime(800),
          filter(() => this.canAutoCalculate()),
          map(() => this.buildCalculationFingerprint()),
          distinctUntilChanged(),
          switchMap(() =>
            this.demo.calcularAtual().pipe(
              tap(() => {
                this.needsRecalcular.set(false);
                if (this.demo.hasResult()) {
                  this.analytics.track(
                    'demo_calculation_completed',
                    'smartcalc',
                    'resultado',
                    this.buildCalculationAnalyticsMetadata(),
                    { onceKey: DemoSmartcalcComponent.ANALYTICS_CALC_KEY },
                  );
                  this.animandoResultado.set(true);
                  this.animateResults();
                  setTimeout(() => this.animandoResultado.set(false), 700);
                }
              }),
              catchError(() => {
                this.needsRecalcular.set(false);
                return EMPTY;
              }),
            )
          ),
        )
        .subscribe()
    );

    this.subscriptions.add(
      this.demo.loadContext().subscribe({
        next: () => {
          const produto = this.demo.produto;
          this.produtos = produto.id ? [{ id: produto.id, nome: produto.nome }] : [];
          this.materiais = [...this.demo.materiais];
          this.acabamentos = this.demo.acabamentos.map((acabamento) => ({
            id: acabamento.id,
            nome: acabamento.label,
          }));
          this.servicos = this.demo.servicos.map((servico) => ({
            id: servico.id,
            nome: servico.label,
          }));
          this.applyDefaultScenario();
          this.startTourIfNeeded();
        },
        error: () => {},
      })
    );

    this.subscriptions.add(this.form.controls.produtoId.valueChanges.subscribe((produtoId) => {
      const selected = !!produtoId;
      this.demo.setProductSelected(selected);
      this.produtoInitSelecionado = selected
        ? { nome: this.demo.produtoMeta().nome, variacoes: Array.from({ length: this.demo.produtoMeta().variacoes }, (_, index) => index + 1) }
        : null;

      if (!selected) {
        this.form.patchValue(
          {
            materialId: null,
            largura: null,
            altura: null,
            quantidade: null,
            acabamentosIds: [],
            servicosIds: [],
          },
          { emitEvent: false },
        );

        this.demo.reset();
        this.needsRecalcular.set(false);
      }
    }));

    this.subscriptions.add(this.form.controls.materialId.valueChanges.subscribe((materialId) => {
      this.demo.setFormat(materialId);
      this.queueRecalculate();
    }));

    this.subscriptions.add(this.form.controls.largura.valueChanges.subscribe((largura) => {
      this.demo.setWidth(largura);
      this.queueRecalculate();
    }));

    this.subscriptions.add(this.form.controls.altura.valueChanges.subscribe((altura) => {
      this.demo.setHeight(altura);
      this.queueRecalculate();
    }));

    this.subscriptions.add(this.form.controls.quantidade.valueChanges.subscribe((quantidade) => {
      this.demo.setQuantity(quantidade);
      this.queueRecalculate();
    }));

    this.subscriptions.add(this.form.controls.acabamentosIds.valueChanges.subscribe((acabamentosIds) => {
      this.demo.setSelectedFinishIds(acabamentosIds ?? []);
      this.queueRecalculate();
    }));

    this.subscriptions.add(this.form.controls.servicosIds.valueChanges.subscribe((servicosIds) => {
      this.demo.setSelectedServiceIds(servicosIds ?? []);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.cancelAnimations();
    this.onboarding.stop();
  }

  @HostListener('window:resize')
  updateViewport(): void {
    this.mobileViewport.set(window.innerWidth <= 900);
  }

  get configAtiva(): boolean {
    return !this.demo.loadingContext();
  }

  get carregandoProdutos(): boolean {
    return this.demo.loadingContext();
  }

  get carregandoCalculo(): boolean {
    return this.demo.loadingCalculation();
  }

  get carregandoAdd(): boolean {
    return this.demo.loadingPedido();
  }

  get erroProdutos(): string | null {
    return this.demo.contextError();
  }

  get erroCalculo(): string | null {
    return this.demo.calculationError();
  }

  get itemResumo(): string {
    if (!this.temResultado) {
      return '';
    }
    const pedido = this.demo.orderPreview();
    return `${pedido.produtoNome} • ${pedido.formatoLabel}`;
  }

  get totalFormatado(): string {
    return this.demo.formatCurrency(this.demo.totalPrice());
  }

  get valorUnitarioFormatado(): string {
    return this.demo.formatCurrency(this.demo.unitPrice());
  }

  get totalAnimadoFormatado(): string {
    return this.demo.formatCurrency(this.displayedTotal());
  }

  get valorUnitarioAnimadoFormatado(): string {
    return this.demo.formatCurrency(this.displayedUnitPrice());
  }

  get quantidadeAcabamentos(): number {
    return this.demo.selectedFinishes().length + this.demo.selectedServices().length;
  }

  get temResultado(): boolean {
    return this.demo.hasResult();
  }

  get total(): number {
    return this.demo.totalPrice();
  }

  seguir(): void {
    if (!this.temResultado || this.carregandoAdd) {
      return;
    }

    this.showConversionCta.set(false);
    try {
      sessionStorage.setItem(DemoSmartcalcComponent.NEXT_PEDIDO_TOUR_KEY, 'true');
    } catch {
      // ignore sessionStorage failure
    }

    this.subscriptions.add(
      this.demo.prepareOrder().subscribe({
        next: () => this.router.navigate(['/demo/pedido']),
        error: () => {},
      })
    );
  }

  limpar(): void {
    this.showConversionCta.set(false);
    this.cancelAnimations();
    this.displayedTotal.set(0);
    this.displayedUnitPrice.set(0);
    this.displayedProduced.set(0);
    this.displayedSobra.set(0);
    this.demo.reset();
    this.form.reset({
      produtoId: null,
      materialId: null,
      largura: null,
      altura: null,
      quantidade: null,
      acabamentosIds: [],
      servicosIds: [],
    });
    this.fecharResultadoMobile();
  }

  alternarResultadoMobile(): void {
    this.resultadoMobileAberto.update((aberto) => !aberto);
    queueMicrotask(() => this.onboarding.remeasure());
  }

  fecharResultadoMobile(): void {
    this.resultadoMobileAberto.set(false);
  }

  multiSelectCardMinHeight(): number {
    return this.mobileViewport() ? 168 : 220;
  }

  multiSelectListHeight(): number {
    return this.mobileViewport() ? 124 : 220;
  }

  abrirTutorial(): void {
    this.showConversionCta.set(false);
    const started = this.onboarding.restart(this.tourConfig);
    if (started) {
      this.analytics.track(
        'demo_tour_started',
        'smartcalc',
        'tour',
        { trigger: 'manual' },
        { onceKey: DemoSmartcalcComponent.ANALYTICS_TOUR_STARTED_KEY },
      );
    }
  }

  abrirCadastro(): void {
    this.showConversionCta.set(false);
    this.analytics.track('demo_cta_signup_clicked', 'smartcalc', 'conversao', { cta: 'signup' });
    this.router.navigate(['/authentication/registro-gestor']);
  }

  fecharConversao(): void {
    this.showConversionCta.set(false);
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

  private queueRecalculate(): void {
    if (!this.form.controls.produtoId.value) {
      return;
    }

    this.needsRecalcular.set(true);
    this.calcTrigger$.next();
  }

  private startTourIfNeeded(): void {
    setTimeout(() => {
      if (this.cameFromLanding()) {
        const started = this.onboarding.restart(this.tourConfig);
        if (started) {
          this.analytics.track(
            'demo_tour_started',
            'smartcalc',
            'tour',
            { trigger: 'landing' },
            { onceKey: DemoSmartcalcComponent.ANALYTICS_TOUR_STARTED_KEY },
          );
        }
        return;
      }

      const started = this.onboarding.startIfNeeded(this.tourConfig);
      if (started) {
        this.analytics.track(
          'demo_tour_started',
          'smartcalc',
          'tour',
          { trigger: 'auto' },
          { onceKey: DemoSmartcalcComponent.ANALYTICS_TOUR_STARTED_KEY },
        );
      }
    }, 220);
  }

  private cameFromLanding(): boolean {
    if (typeof document === 'undefined') {
      return false;
    }

    const referrer = document.referrer ?? '';
    return isDemoLandingReferrer(referrer);
  }

  private applyDefaultScenario(): void {
    const produto = this.produtos[0]?.id ?? null;
    const material = this.materiais[0]?.id ?? null;
    const acabamento = this.acabamentos[0]?.id ?? null;

    if (!produto || !material) {
      return;
    }

    const defaultAcabamentos = acabamento ? [acabamento] : [];

    this.form.patchValue(
      {
        produtoId: produto,
        materialId: material,
        largura: 5,
        altura: 5,
        quantidade: 500,
        acabamentosIds: defaultAcabamentos,
        servicosIds: [],
      },
      { emitEvent: false },
    );

    this.demo.setProductSelected(true);
    this.demo.setFormat(material);
    this.demo.setWidth(5);
    this.demo.setHeight(5);
    this.demo.setQuantity(500);
    this.demo.setSelectedFinishIds(defaultAcabamentos);
    this.demo.setSelectedServiceIds([]);
    this.produtoInitSelecionado = {
      nome: this.demo.produtoMeta().nome,
      variacoes: Array.from({ length: this.demo.produtoMeta().variacoes }, (_, index) => index + 1),
    };

    this.queueRecalculate();
  }

  private canAutoCalculate(): boolean {
    return !!this.form.controls.produtoId.value
      && !!this.form.controls.materialId.value
      && !!this.form.controls.largura.value
      && !!this.form.controls.altura.value
      && !!this.form.controls.quantidade.value
      && this.form.controls.materialId.valid
      && this.form.controls.largura.valid
      && this.form.controls.altura.valid
      && this.form.controls.quantidade.valid;
  }

  private buildCalculationFingerprint(): string {
    return JSON.stringify({
      produtoId: this.form.controls.produtoId.value,
      materialId: this.form.controls.materialId.value,
      largura: this.form.controls.largura.value,
      altura: this.form.controls.altura.value,
      quantidade: this.form.controls.quantidade.value,
      acabamentosIds: [...(this.form.controls.acabamentosIds.value ?? [])].sort((a, b) => a - b),
      servicosIds: [...(this.form.controls.servicosIds.value ?? [])].sort(),
    });
  }

  private readGuideDismissed(): boolean {
    try {
      return localStorage.getItem(DemoSmartcalcComponent.GUIDE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persistGuideDismissed(value: boolean): void {
    try {
      localStorage.setItem(DemoSmartcalcComponent.GUIDE_DISMISSED_KEY, String(value));
    } catch {
      // ignore localStorage failure
    }
  }

  private buildCalculationAnalyticsMetadata(): Record<string, unknown> {
    return {
      produtoId: this.demo.produto.id,
      materialId: this.form.controls.materialId.value,
      largura: this.form.controls.largura.value,
      altura: this.form.controls.altura.value,
      quantidade: this.form.controls.quantidade.value,
      acabamentosCount: this.form.controls.acabamentosIds.value?.length ?? 0,
      servicosCount: this.form.controls.servicosIds.value?.length ?? 0,
      valorTotal: this.demo.totalPrice(),
    };
  }

  private animateResults(): void {
    this.cancelAnimations();
    this.animateSignal(this.displayedTotal, this.demo.totalPrice(), 720, 2);
    this.animateSignal(this.displayedUnitPrice, this.demo.unitPrice(), 680, 2);
    this.animateSignal(this.displayedProduced, this.demo.producedQuantity(), 560);
    this.animateSignal(this.displayedSobra, this.demo.sobraUtil(), 560);
  }

  private animateSignal(
    targetSignal: WritableSignal<number>,
    endValue: number,
    duration = 600,
    fractionDigits = 0,
  ): void {
    const startValue = targetSignal();
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + ((endValue - startValue) * eased);
      const rounded = fractionDigits > 0
        ? Number(nextValue.toFixed(fractionDigits))
        : Math.round(nextValue);

      targetSignal.set(rounded);

      if (progress < 1) {
        const frame = requestAnimationFrame(tick);
        this.animationFrames.add(frame);
      }
    };

    const frame = requestAnimationFrame(tick);
    this.animationFrames.add(frame);
  }

  private cancelAnimations(): void {
    this.animationFrames.forEach((frame) => cancelAnimationFrame(frame));
    this.animationFrames.clear();
  }
}
