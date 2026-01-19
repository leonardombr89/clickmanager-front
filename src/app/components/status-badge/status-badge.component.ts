import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StatusLabelPipe } from 'src/app/pipes/status-label.pipe';

type StatusConfig = { icon: string; label: string; className: string };

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, StatusLabelPipe],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined;

  private readonly map: Record<string, StatusConfig> = {
    RASCUNHO: { icon: 'edit', label: 'RASCUNHO', className: 'chip-rascunho' },
    PENDENTE: { icon: 'schedule', label: 'PENDENTE', className: 'chip-pendente' },
    ORCAMENTO: { icon: 'assignment', label: 'ORCAMENTO', className: 'chip-orcamento' },
    AGUARDANDO_PAGAMENTO: { icon: 'credit_card', label: 'AGUARDANDO_PAGAMENTO', className: 'chip-aguardando' },
    EM_PRODUCAO: { icon: 'lock', label: 'EM_PRODUCAO', className: 'chip-producao' },
    PRONTO: { icon: 'check_circle', label: 'PRONTO', className: 'chip-pronto' },
    ENTREGUE: { icon: 'local_shipping', label: 'ENTREGUE', className: 'chip-entregue' },
    CANCELADO: { icon: 'close', label: 'CANCELADO', className: 'chip-cancelado' },
  };

  get config(): StatusConfig {
    const key = (this.status || '').toUpperCase();
    return this.map[key] || { icon: 'info', label: this.status || '—', className: 'chip-default' };
  }
}
