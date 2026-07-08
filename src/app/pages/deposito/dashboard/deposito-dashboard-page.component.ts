import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { TablerIconsModule } from 'angular-tabler-icons';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';

@Component({
  selector: 'app-deposito-dashboard-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, TablerIconsModule, CardHeaderComponent],
  templateUrl: './deposito-dashboard-page.component.html',
  styleUrl: './deposito-dashboard-page.component.scss',
})
export class DepositoDashboardPageComponent {
  readonly indicadores = [
    { label: 'Catálogo', valor: '0', detalhe: 'itens cadastrados', icon: 'package', accent: 'primary' },
    { label: 'Categorias', valor: '0', detalhe: 'estruturas criadas', icon: 'tag', accent: 'warning' },
    { label: 'Marcas', valor: '0', detalhe: 'fabricantes ativos', icon: 'star', accent: 'success' },
    { label: 'Orçamentos', valor: '0', detalhe: 'oportunidades comerciais', icon: 'file-text', accent: 'neutral' },
  ];

  readonly destaques = [
    {
      icon: 'package',
      titulo: 'Catálogo centralizado',
      descricao: 'Concentre itens, categorias e marcas em uma estrutura pronta para crescer junto com o depósito.',
    },
    {
      icon: 'file-text',
      titulo: 'Comercial preparado',
      descricao: 'Deixe o espaço reservado para orçamentos e futuras rotinas comerciais do módulo.',
    },
    {
      icon: 'settings',
      titulo: 'Administração unificada',
      descricao: 'Gerencie empresa, usuários e permissões com a mesma base usada nos outros segmentos.',
    },
  ];
}
