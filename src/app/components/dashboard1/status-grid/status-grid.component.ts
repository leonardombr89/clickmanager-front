import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MaterialModule } from '../../../material.module';
import { DashboardComparativoResponse, DashboardService } from '../dashboard.service';

interface StatusGridItem {
  status: string;
  label: string;
  quantidade: number;
  tone: 'neutral' | 'warning' | 'info' | 'primary' | 'success' | 'danger';
}

@Component({
  selector: 'app-status-grid',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './status-grid.component.html',
  styleUrls: ['./status-grid.component.scss'],
})
export class AppStatusGridComponent implements OnInit {
  readonly statusOrder = [
    'RASCUNHO',
    'PENDENTE',
    'ORCAMENTO',
    'AGUARDANDO_PAGAMENTO',
    'EM_PRODUCAO',
    'PRONTO',
    'ENTREGUE',
    'CANCELADO',
  ];

  stats: StatusGridItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    await this.carregarStatus();
  }

  abrirStatus(status: string): void {
    this.router.navigate(['/page/pedido'], { queryParams: { status } });
  }

  private async carregarStatus(): Promise<void> {
    const agora = new Date();
    const resposta: DashboardComparativoResponse = await firstValueFrom(
      this.dashboardService.obterComparativoSimples(
        1,
        agora.getFullYear(),
        agora.getMonth(),
        Math.max(0, agora.getMonth() - 1),
        'quantidade'
      )
    );

    const quantidades = new Map(resposta.kpis.map((item) => [item.status, Number(item.quantidade || 0)]));

    this.stats = this.statusOrder.map((status) => ({
      status,
      label: this.mapLabel(status),
      quantidade: quantidades.get(status) ?? 0,
      tone: this.mapTone(status),
    }));
  }

  private mapLabel(status: string): string {
    const labels: Record<string, string> = {
      RASCUNHO: 'Rascunho',
      PENDENTE: 'Pendente',
      ORCAMENTO: 'Orçamento',
      AGUARDANDO_PAGAMENTO: 'Pagamento',
      EM_PRODUCAO: 'Produção',
      PRONTO: 'Pronto',
      ENTREGUE: 'Entregue',
      CANCELADO: 'Cancelado',
    };
    return labels[status] ?? status;
  }

  private mapTone(status: string): StatusGridItem['tone'] {
    const tones: Record<string, StatusGridItem['tone']> = {
      RASCUNHO: 'neutral',
      PENDENTE: 'warning',
      ORCAMENTO: 'info',
      AGUARDANDO_PAGAMENTO: 'warning',
      EM_PRODUCAO: 'primary',
      PRONTO: 'success',
      ENTREGUE: 'success',
      CANCELADO: 'danger',
    };
    return tones[status] ?? 'neutral';
  }
}
