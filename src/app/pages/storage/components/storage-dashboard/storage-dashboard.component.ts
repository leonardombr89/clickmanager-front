import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { StorageDashboard } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';
import { formatBytes } from '../../utils/storage-format.util';

type DashboardCard = { label: string; value: string; icon: string; hint?: string };

@Component({
  selector: 'app-storage-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './storage-dashboard.component.html',
  styleUrl: './storage-dashboard.component.scss',
})
export class StorageDashboardComponent implements OnInit {
  carregando = false;
  dashboard: StorageDashboard | null = null;

  constructor(
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.storageService.dashboard().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar o dashboard de armazenamento.');
      },
    });
  }

  get cards(): DashboardCard[] {
    const dashboard = this.dashboard || {};
    return [
      { label: 'Armazenamento total', value: formatBytes(dashboard.armazenamentoTotal ?? dashboard.totalBytes), icon: 'storage' },
      { label: 'Arquivos ativos', value: String(dashboard.arquivosAtivos ?? dashboard.ativos ?? 0), icon: 'check_circle' },
      { label: 'Espaço na lixeira', value: formatBytes(dashboard.espacoLixeira ?? dashboard.lixeiraBytes), icon: 'delete' },
      { label: 'Arquivos órfãos', value: String(dashboard.arquivosOrfaos ?? dashboard.orfaos ?? 0), icon: 'link_off' },
      { label: 'Falhas', value: String(dashboard.falhas ?? 0), icon: 'error' },
      { label: 'Anomalias', value: String(dashboard.anomalias ?? 0), icon: 'warning' },
      { label: 'Imagens', value: String(dashboard.imagens ?? 0), icon: 'image' },
      { label: 'Vídeos', value: String(dashboard.videos ?? 0), icon: 'movie' },
      { label: 'Documentos', value: String(dashboard.documentos ?? 0), icon: 'description' },
      { label: 'Economia por otimização', value: formatBytes(dashboard.economiaOtimizacao ?? dashboard.economiaBytes), icon: 'compress' },
      { label: 'Vídeos processando', value: String(dashboard.videosProcessando ?? 0), icon: 'sync' },
      { label: 'Vídeos com falha', value: String(dashboard.videosComFalha ?? 0), icon: 'report' },
    ];
  }
}
