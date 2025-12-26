import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { ViewportScroller } from '@angular/common';
import { MaterialModule } from 'src/app/material.module';
import { TablerIconsModule } from 'angular-tabler-icons';
import { RouterLink } from '@angular/router';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';

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

@Component({
  selector: 'app-landingpage',
  standalone: true,
  imports: [MaterialModule, TablerIconsModule, RouterLink, BrandingComponent],
  templateUrl: './landingpage.component.html',
})
export class AppLandingpageComponent {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  options = this.settings.getOptions();
  currentYear: number = new Date().getFullYear();

  constructor(
    private settings: CoreService,
    private scroller: ViewportScroller
  ) {}

  scrollTo(anchor: string) {
    this.scroller.scrollToAnchor(anchor);
  }

  timeWins: TimeWin[] = [
    {
      title: '60% menos tempo em orçamentos',
      detail:
        'O SmartCalc calcula automaticamente área, insumos e margem, evitando contas manuais e planilhas paralelas.',
      accent: 'Tempo salvo',
    },
    {
      title: 'Preços consistentes, sem surpresas',
      detail:
        'Histórico de preços e regras de cálculo centralizadas mantêm a margem segura para cada pedido.',
      accent: 'Margem protegida',
    },
    {
      title: 'Equipe responde 2x mais rápido',
      detail:
        'Com fórmulas prontas e simulação de cenários, o time envia propostas enquanto o cliente ainda está na linha.',
      accent: 'Velocidade real',
    },
  ];

  features: Feature[] = [
    {
      icon: 'calculator',
      title: 'Cálculo inteligente',
      color: 'primary',
      subtext: 'Configure insumos, perdas e acabamento uma vez e deixe o SmartCalc precificar por você.',
    },
    {
      icon: 'clock-play',
      title: 'Simulação em segundos',
      color: 'warning',
      subtext: 'Teste materiais e prazos na hora, comparando margens antes de enviar o orçamento.',
    },
    {
      icon: 'history',
      title: 'Histórico sempre à mão',
      color: 'success',
      subtext: 'Veja preços anteriores e aprove as melhores condições com dados reais.',
    },
    {
      icon: 'chart-donut-3',
      title: 'Métricas de produção',
      color: 'secondary',
      subtext: 'Acompanhe lead time, margens e gargalos do pedido à entrega em um painel único.',
    },
    {
      icon: 'clipboard-list',
      title: 'Fluxo integrado',
      color: 'primary',
      subtext: 'Vendas, atendimento e produção enxergam o mesmo status, sem retrabalho.',
    },
    {
      icon: 'shield-lock',
      title: 'Governança simples',
      color: 'error',
      subtext: 'Perfis e permissões para cada área garantem segurança e controle de acesso.',
    },
  ];

  steps: Step[] = [
    {
      title: 'Centralize pedidos',
      desc: 'Organize tudo em um só lugar: cliente, peças, materiais e prazos.',
      badge: '1',
    },
    {
      title: 'Ative o SmartCalc',
      desc: 'O cálculo roda com suas regras e simula cenários em segundos.',
      badge: '2',
    },
    {
      title: 'Aprove, produza e entregue',
      desc: 'Status claros, margin alert e histórico sempre visível para o time.',
      badge: '3',
    },
  ];
}
