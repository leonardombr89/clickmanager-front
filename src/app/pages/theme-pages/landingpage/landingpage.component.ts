import { CommonModule, ViewportScroller } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CoreService } from 'src/app/services/core.service';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import {
  LandingEtapaFunil,
  LandingpagePublicService,
  PublicContatoRequest,
} from './landingpage-public.service';

interface Feature {
  icon: string;
  title: string;
  subtext: string;
  color: string;
}

interface TimeWin {
  title: string;
  detail: string;
  accent: string;
}

interface Step {
  title: string;
  desc: string;
  badge: string;
}

interface PermissionUseCase {
  title: string;
  detail: string;
}

interface Gain {
  title: string;
  desc: string;
}

interface Metric {
  value: string;
  label: string;
  accent?: string;
}

interface Testimonial {
  name: string;
  role: string;
  quote: string;
  result: string;
}

interface CaseStudy {
  title: string;
  before: string;
  after: string;
  detail: string;
}

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [CommonModule, MaterialModule, TablerIconsModule, RouterLink, BrandingComponent, ReactiveFormsModule],
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.scss'],
})
export class AppLandingpageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('leadFormSection') private leadFormSection?: ElementRef<HTMLElement>;
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  options = this.settings.getOptions();
  currentYear: number = new Date().getFullYear();
  enviandoLead = false;
  leadEnviado = false;

  readonly leadForm = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    celular: new FormControl('', [Validators.required]),
    mensagem: new FormControl('Quero conhecer o ClickManager e entender como ele pode ajudar minha empresa.'),
  });

  private readonly pageTitle = 'Landing Principal';
  private readonly landingSessionStorageKey = 'clickmanager:landing:session-id';
  private readonly landingStageStoragePrefix = 'clickmanager:landing:stage';
  private sessionId = '';
  private leadFormObserver?: IntersectionObserver;

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller,
    private readonly landingpagePublicService: LandingpagePublicService,
    private readonly toastr: ToastrService
  ) {}

  scrollTo(anchor: string) {
    this.scroller.scrollToAnchor(anchor);
  }

  scrollToLeadForm(): void {
    this.scroller.scrollToAnchor('lead-rapido');
    this.registrarEtapaFunil('FORMULARIO_VISUALIZADO');
  }

  timeWins: TimeWin[] = [
    {
      title: 'Angular + Material',
      detail: 'Interface moderna, rápida e responsiva para sua operação diária.',
      accent: 'Tecnologia',
    },
    {
      title: 'Onboarding em minutos',
      detail: 'Fluxos guiados e formulários simples para começar sem esforço.',
      accent: 'Fácil de usar',
    },
    {
      title: '30 dias grátis',
      detail: 'Teste todos os recursos, SmartCalc e perfis, sem risco.',
      accent: 'Trial',
    },
  ];

  smartCalcHighlights: Feature[] = [
    {
      icon: 'calculator',
      title: 'Cálculo inteligente',
      color: 'primary',
      subtext: 'Insumos, perdas e acabamento configurados uma vez; o SmartCalc precifica por você.',
    },
    {
      icon: 'clock-play',
      title: 'Simulação em segundos',
      color: 'warning',
      subtext: 'Troque materiais, prazos e margens para encontrar o preço ideal na hora.',
    },
    {
      icon: 'history',
      title: 'Histórico e consistência',
      color: 'success',
      subtext: 'Use preços anteriores e regras centralizadas para manter margens saudáveis.',
    },
  ];

  permissionHighlights: Feature[] = [
    {
      icon: 'shield-lock',
      title: 'Perfis flexíveis',
      color: 'primary',
      subtext: 'Escolha exatamente o que cada perfil pode ver ou editar.',
    },
    {
      icon: 'users',
      title: 'Vincule usuários com 1 clique',
      color: 'secondary',
      subtext: 'Aplique o perfil pronto ao time e altere facilmente quando precisar.',
    },
    {
      icon: 'adjustments-cog',
      title: 'Selecionar todos ou granular',
      color: 'warning',
      subtext: 'Marque por grupo (Calculadoras, Pedidos, Clientes, Configurações) ou permissão a permissão.',
    },
  ];

  steps: Step[] = [
    {
      title: 'Centralize pedidos',
      desc: 'Organize cliente, peças, materiais e prazos em um só lugar.',
      badge: '1',
    },
    {
      title: 'Ative o SmartCalc',
      desc: 'Calcule e simule cenários em segundos com suas regras.',
      badge: '2',
    },
    {
      title: 'Controle acessos',
      desc: 'Perfis sob medida para cada função: orçamentista, produção, financeiro.',
      badge: '3',
    },
  ];

  permissionUseCases: PermissionUseCase[] = [
    {
      title: 'Orçamentista enxuto',
      detail: 'Acesso somente ao SmartCalc para simular preços e enviar propostas rápidas.',
    },
    {
      title: 'Gestor de produção',
      detail: 'Visualiza pedidos, dashboards e histórico, sem editar preços ou usuários.',
    },
    {
      title: 'Time financeiro',
      detail: 'Permissões para faturar, ajustar dados da empresa e acompanhar margens.',
    },
  ];

  gains: Gain[] = [
    {
      title: 'Time produtivo',
      desc: 'Horas recuperadas com cálculos automáticos e menos retrabalho.',
    },
    {
      title: 'Margem protegida',
      desc: 'Regras centralizadas e histórico reduzem erros de precificação.',
    },
    {
      title: 'Governança simples',
      desc: 'Perfis sob medida deixam cada pessoa com o acesso certo.',
    },
  ];

  metrics: Metric[] = [
    { value: '60%', label: 'menos tempo em orçamentos', accent: 'Tempo' },
    { value: '+8%', label: 'margem média preservada', accent: 'Margem' },
    { value: '30 dias', label: 'de teste completo', accent: 'Trial' },
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Ana Souza',
      role: 'COO · Gráfica Digital',
      quote: 'O SmartCalc tirou a equipe das planilhas e reduziu o tempo de orçamento de horas para minutos.',
      result: '-65% no tempo de orçamento em 4 semanas',
    },
    {
      name: 'Marcos Lima',
      role: 'Diretor · Comunicação Visual',
      quote: 'Perfis flexíveis deixaram produção e comercial organizados. Menos retrabalho, mais entregas.',
      result: '+10% de produtividade em produção',
    },
    {
      name: 'Patrícia Nogueira',
      role: 'Gestora · Gráfica Rápida',
      quote: 'Consegui criar um perfil só para orçamentista com acesso ao SmartCalc. Ficou simples de treinar.',
      result: 'Onboarding em 2 dias, orçamentos padronizados',
    },
    {
      name: 'Ricardo Almeida',
      role: 'CEO · Indústria de rótulos',
      quote: 'Os dashboards mostraram gargalos e conseguimos ajustar prazos antes de virar crise.',
      result: '-30% em atrasos de pedidos',
    },
    {
      name: 'Larissa Campos',
      role: 'Financeiro · Comunicação Visual',
      quote: 'Segregamos acessos: financeiro vê faturamento e dados da empresa, sem entrar no fluxo de produção.',
      result: 'Governança simples, zero acessos indevidos',
    },
    {
      name: 'Diego Martins',
      role: 'Operações · Impressão',
      quote: 'O histórico de preços e regras centralizadas deram previsibilidade de margem.',
      result: '+8% de margem média em 60 dias',
    },
  ];

  caseStudy: CaseStudy = {
    title: 'Case rápido: gráfica de médio porte',
    before: '2h por orçamento, margens inconsistentes',
    after: '15min por orçamento, margem estável',
    detail: 'Com SmartCalc ativo e perfis de orçamentista/gestor, o time ganhou previsibilidade e reduziu idas e vindas com clientes.',
  };

  currentSlideIndex = 0;
  private readonly itemsPerSlide = 3;
  private testimonialInterval: any;

  get currentTestimonials(): Testimonial[] {
    const start = this.currentSlideIndex * this.itemsPerSlide;
    const slice = this.testimonials.slice(start, start + this.itemsPerSlide);
    if (slice.length < this.itemsPerSlide) {
      return slice.concat(this.testimonials.slice(0, this.itemsPerSlide - slice.length));
    }
    return slice;
  }

  get totalSlides(): number {
    return Math.ceil(this.testimonials.length / this.itemsPerSlide);
  }

  get testimonialSlides(): number[] {
    return Array.from({ length: this.totalSlides }, (_, i) => i);
  }

  nextTestimonial(): void {
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.totalSlides;
  }

  prevTestimonial(): void {
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.totalSlides) % this.totalSlides;
  }

  ngOnInit(): void {
    this.sessionId = this.ensureSessionId();
    this.registrarEtapaFunil('LANDING_VISUALIZADA');
    this.startCarousel();
  }

  ngAfterViewInit(): void {
    this.observeLeadFormSection();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    this.leadFormObserver?.disconnect();
  }

  pauseCarousel(): void {
    this.stopCarousel();
  }

  resumeCarousel(): void {
    this.startCarousel();
  }

  onLeadFieldFocus(): void {
    this.registrarEtapaFunil('FORMULARIO_VISUALIZADO');
  }

  submitLead(): void {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      this.toastr.error('Preencha os campos obrigatórios para enviar seu contato.');
      return;
    }

    this.registrarEtapaFunil('FORMULARIO_VISUALIZADO');
    this.enviandoLead = true;

    const payload: PublicContatoRequest = {
      nome: this.leadForm.controls.nome.value?.trim() || '',
      email: this.leadForm.controls.email.value?.trim() || '',
      celular: this.leadForm.controls.celular.value?.trim() || '',
      mensagem:
        this.leadForm.controls.mensagem.value?.trim() ||
        'Quero conhecer o ClickManager e entender como ele pode ajudar minha empresa.',
      pagina: this.pageTitle,
      path: this.getCurrentPath(),
      referrer: document.referrer || '',
      utmSource: this.getUtmParam('utm_source'),
      utmMedium: this.getUtmParam('utm_medium'),
      utmCampaign: this.getUtmParam('utm_campaign'),
      sessionId: this.sessionId,
    };

    this.landingpagePublicService.enviarContato(payload).subscribe({
      next: () => {
        this.enviandoLead = false;
        this.leadEnviado = true;
        this.leadForm.reset({
          nome: '',
          email: '',
          celular: '',
          mensagem: 'Quero conhecer o ClickManager e entender como ele pode ajudar minha empresa.',
        });
        this.toastr.success('Recebemos seu contato. Vamos falar com você em breve.');
      },
      error: (err) => {
        this.enviandoLead = false;
        const message = err?.error?.message || 'Nao foi possivel enviar seu contato agora.';
        this.toastr.error(message);
      },
    });
  }

  private startCarousel(): void {
    this.stopCarousel();
    this.testimonialInterval = setInterval(() => this.nextTestimonial(), 5000);
  }

  private stopCarousel(): void {
    if (this.testimonialInterval) {
      clearInterval(this.testimonialInterval);
      this.testimonialInterval = null;
    }
  }

  private observeLeadFormSection(): void {
    if (!this.leadFormSection || typeof IntersectionObserver === 'undefined') {
      return;
    }

    this.leadFormObserver = new IntersectionObserver(
      entries => {
        const isVisible = entries.some(entry => entry.isIntersecting);
        if (!isVisible) {
          return;
        }

        this.registrarEtapaFunil('FORMULARIO_VISUALIZADO');
        this.leadFormObserver?.disconnect();
      },
      { threshold: 0.35 }
    );

    this.leadFormObserver.observe(this.leadFormSection.nativeElement);
  }

  private registrarEtapaFunil(etapaFunil: LandingEtapaFunil): void {
    const stageStorageKey = `${this.landingStageStoragePrefix}:${etapaFunil}:${this.getCurrentPath()}`;
    if (sessionStorage.getItem(stageStorageKey)) {
      return;
    }

    this.landingpagePublicService.registrarEtapa({
      pagina: this.pageTitle,
      path: this.getCurrentPath(),
      sessionId: this.sessionId,
      etapaFunil,
    }).subscribe({
      next: () => sessionStorage.setItem(stageStorageKey, '1'),
      error: () => undefined,
    });
  }

  private ensureSessionId(): string {
    const existing = localStorage.getItem(this.landingSessionStorageKey);
    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `landing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(this.landingSessionStorageKey, generated);
    return generated;
  }

  private getCurrentPath(): string {
    return window.location.pathname || '/';
  }

  private getUtmParam(key: 'utm_source' | 'utm_medium' | 'utm_campaign'): string {
    return new URLSearchParams(window.location.search).get(key) || '';
  }
}
