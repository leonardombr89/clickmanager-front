import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AppReceitaResumoComponent } from 'src/app/components/dashboard1/receita-resumo/receita-resumo.component';
import { AppComparativoPedidosComponent } from 'src/app/components/dashboard1/comparativo-pedidos/comparativo-pedidos.component';
import { DashboardService } from 'src/app/components/dashboard1/dashboard.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AppStatusGridComponent } from 'src/app/components/dashboard1/status-grid/status-grid.component';

interface DashboardSummaryCard {
  key: 'receita' | 'pedidos' | 'pendentes' | 'ticket-medio';
  label: string;
  value: string;
  routeStatus?: string;
  accent?: 'primary' | 'success' | 'warning' | 'neutral';
}

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [
    CommonModule,
    AppStatusGridComponent,
    AppReceitaResumoComponent,
    AppComparativoPedidosComponent
  ],
  templateUrl: './dashboard1.component.html',
  styleUrls: ['./dashboard1.component.scss'],
})
export class AppDashboard1Component implements OnInit {
  mobileSummaryCards: DashboardSummaryCard[] = [
    { key: 'pedidos', label: 'Pedidos', value: '0', accent: 'neutral' },
    { key: 'pendentes', label: 'Pendentes', value: '0', routeStatus: 'PENDENTE', accent: 'warning' },
  ];
  desktopSummaryCards: DashboardSummaryCard[] = [
    { key: 'receita', label: 'Receita', value: 'R$ 0,00', accent: 'primary' },
    { key: 'pedidos', label: 'Pedidos', value: '0', accent: 'neutral' },
    { key: 'pendentes', label: 'Pendentes', value: '0', routeStatus: 'PENDENTE', accent: 'warning' },
    { key: 'ticket-medio', label: 'Ticket médio', value: 'R$ 0,00', accent: 'success' },
  ];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarResumo();
  }

  abrirResumo(card: DashboardSummaryCard): void {
    this.router.navigate(['/page/pedido'], {
      queryParams: card.routeStatus ? { status: card.routeStatus } : {}
    });
  }

  get heroReceita(): DashboardSummaryCard {
    return this.desktopSummaryCards.find((card) => card.key === 'receita') || this.desktopSummaryCards[0];
  }

  get heroMetricas(): DashboardSummaryCard[] {
    return this.desktopSummaryCards.filter((card) => card.key !== 'receita');
  }

  private async carregarResumo(): Promise<void> {
    const now = new Date();
    const [comparativo, receita] = await Promise.all([
      firstValueFrom(
        this.dashboardService.obterComparativoSimples(1, now.getFullYear(), now.getMonth(), Math.max(0, now.getMonth() - 1), 'quantidade')
      ),
      firstValueFrom(
        this.dashboardService.obterReceitaResumo({ periodo: 'MES_ATUAL' })
      )
    ]);

    const totalPedidos = comparativo.kpis.reduce((acc, item) => acc + (item.quantidade || 0), 0);
    const pedidosPendentes = Number(comparativo.kpis.find((item) => item.status === 'PENDENTE')?.quantidade || 0);
    const valorReceita = receita.valorTotal || 0;
    const receitaPeriodo = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorReceita);
    const ticketMedio = totalPedidos > 0 ? valorReceita / totalPedidos : 0;
    const ticketMedioFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio);

    this.mobileSummaryCards = [
      { key: 'pedidos', label: 'Pedidos', value: `${totalPedidos}`, accent: 'neutral' },
      { key: 'pendentes', label: 'Pendentes', value: `${pedidosPendentes}`, routeStatus: 'PENDENTE', accent: 'warning' },
    ];

    this.desktopSummaryCards = [
      { key: 'receita', label: 'Receita', value: receitaPeriodo, accent: 'primary' },
      { key: 'pedidos', label: 'Pedidos', value: `${totalPedidos}`, accent: 'neutral' },
      { key: 'pendentes', label: 'Pendentes', value: `${pedidosPendentes}`, routeStatus: 'PENDENTE', accent: 'warning' },
      { key: 'ticket-medio', label: 'Ticket médio', value: ticketMedioFormatado, accent: 'success' },
    ];
  }
}
