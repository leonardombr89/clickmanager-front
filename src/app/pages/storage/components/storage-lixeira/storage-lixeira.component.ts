import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { StorageLixeiraItem } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';
import { formatBytes } from '../../utils/storage-format.util';
import { StorageImagePreviewComponent } from '../storage-image-preview/storage-image-preview.component';

@Component({
  selector: 'app-storage-lixeira',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    StatusBadgeComponent,
    StorageImagePreviewComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './storage-lixeira.component.html',
  styleUrl: './storage-lixeira.component.scss',
})
export class StorageLixeiraComponent implements OnInit {
  itens: StorageLixeiraItem[] = [];
  colunas = ['preview', 'nome', 'contexto', 'status', 'tamanho', 'removidoEm', 'exclusaoAgendadaEm', 'acoes'];
  carregando = false;
  page = 0;
  size = 20;
  totalElements = 0;

  constructor(
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(page = this.page): void {
    this.page = Math.max(page, 0);
    this.carregando = true;
    this.storageService.listarLixeira({ page: this.page, size: this.size }).subscribe({
      next: (response) => {
        this.itens = response.content || [];
        this.totalElements = response.totalElements || this.itens.length;
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar a lixeira.');
      },
    });
  }

  restaurar(item: StorageLixeiraItem): void {
    const arquivoId = this.resolveArquivoId(item);
    if (!arquivoId) {
      this.toastr.warning('Arquivo sem arquivoId para restaurar.');
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Restaurar arquivo?',
        message: 'Restaurar o arquivo não recoloca automaticamente o vínculo em banner, produto ou outra entidade.',
        confirmText: 'Restaurar',
        confirmColor: 'primary',
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.storageService.restaurar(arquivoId).subscribe({
        next: () => {
          this.toastr.success('Arquivo restaurado.');
          this.carregar();
        },
        error: (err) => this.toastr.error(err?.userMessage || 'Falha ao restaurar o arquivo.'),
      });
    });
  }

  excluirDefinitivo(item: StorageLixeiraItem): void {
    const arquivoId = this.resolveArquivoId(item);
    if (!arquivoId) {
      this.toastr.warning('Arquivo sem arquivoId para excluir definitivamente.');
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Excluir definitivamente',
        message: 'Esta ação removerá definitivamente o arquivo e não poderá ser desfeita.',
        confirmText: 'Excluir definitivamente',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.storageService.excluirDefinitivo(arquivoId).subscribe({
        next: () => {
          this.toastr.success('Arquivo excluído definitivamente.');
          this.carregar();
        },
        error: (err) => this.toastr.error(err?.userMessage || 'Falha ao excluir definitivamente.'),
      });
    });
  }

  nomeArquivo(item: StorageLixeiraItem): string {
    return item.nomeExibicao || item.nomeOriginal || item.nome || item.titulo || `Arquivo ${this.resolveArquivoId(item) || ''}`;
  }

  formatBytes = formatBytes;

  get podeVoltar(): boolean {
    return this.page > 0;
  }

  get podeAvancar(): boolean {
    return (this.page + 1) * this.size < this.totalElements;
  }

  private resolveArquivoId(item: StorageLixeiraItem): number | null {
    return item.arquivoId || item.id || null;
  }
}
