import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-storage-video-status',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span class="storage-video-status" [ngClass]="className">
      <mat-icon>{{ icon }}</mat-icon>
      {{ label }}
    </span>
  `,
  styles: [`
    .storage-video-status {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 28px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .storage-video-status mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }
    .status-ativo { color: #0f5132; background: #d1e7dd; }
    .status-processando { color: #664d03; background: #fff3cd; }
    .status-falha { color: #842029; background: #f8d7da; }
    .status-cancelado { color: #41464b; background: #e2e3e5; }
  `],
})
export class StorageVideoStatusComponent {
  @Input() status?: string | null;

  get normalized(): string {
    return String(this.status || '').toUpperCase();
  }

  get label(): string {
    const labels: Record<string, string> = {
      ATIVO: 'Ativo',
      PROCESSANDO: 'Processando',
      FALHA: 'Falha',
      CANCELADO: 'Cancelado',
      CANCELADA: 'Cancelado',
    };
    return labels[this.normalized] || this.status || '-';
  }

  get icon(): string {
    const icons: Record<string, string> = {
      ATIVO: 'check_circle',
      PROCESSANDO: 'sync',
      FALHA: 'error',
      CANCELADO: 'block',
      CANCELADA: 'block',
    };
    return icons[this.normalized] || 'info';
  }

  get className(): string {
    if (this.normalized === 'ATIVO') return 'status-ativo';
    if (this.normalized === 'PROCESSANDO') return 'status-processando';
    if (this.normalized === 'FALHA') return 'status-falha';
    return 'status-cancelado';
  }
}
