import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { StorageArquivo, StorageArquivoListParams } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';
import { formatBytes } from '../../utils/storage-format.util';
import { StorageDetalheDialogComponent } from '../storage-detalhe-dialog/storage-detalhe-dialog.component';
import { StorageImagePreviewComponent } from '../storage-image-preview/storage-image-preview.component';

@Component({
  selector: 'app-storage-arquivos-lista',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    StatusBadgeComponent,
    StorageImagePreviewComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './storage-arquivos-lista.component.html',
  styleUrl: './storage-arquivos-lista.component.scss',
})
export class StorageArquivosListaComponent implements OnInit {
  arquivos: StorageArquivo[] = [];
  colunas = ['preview', 'nome', 'contexto', 'status', 'tamanho', 'variantes', 'criadoEm', 'referencia', 'acoes'];
  carregando = false;
  page = 0;
  size = 20;
  totalElements = 0;

  filtros = this.fb.group({
    nome: [''],
    status: [''],
    contexto: [''],
    tipo: [''],
    possuiReferencia: [''],
    possuiAnomalia: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
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
    this.storageService.listarArquivos(this.buildParams()).subscribe({
      next: (response) => {
        this.arquivos = response.content || [];
        this.totalElements = response.totalElements || this.arquivos.length;
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar os arquivos.');
      },
    });
  }

  aplicarFiltros(): void {
    this.carregar(0);
  }

  limparFiltros(): void {
    this.filtros.reset({ nome: '', status: '', contexto: '', tipo: '', possuiReferencia: '', possuiAnomalia: '' });
    this.carregar(0);
  }

  abrirDetalhe(arquivo: StorageArquivo): void {
    this.dialog.open(StorageDetalheDialogComponent, { data: arquivo });
  }

  abrirUrl(arquivo: StorageArquivo): void {
    const arquivoId = this.resolveArquivoId(arquivo);
    if (!arquivoId) {
      this.toastr.warning('Arquivo sem arquivoId para buscar URL temporária.');
      return;
    }

    this.storageService.buscarUrl(arquivoId, 'CARD').subscribe({
      next: (resp) => {
        if (resp.url) {
          window.open(resp.url, '_blank', 'noopener,noreferrer');
          return;
        }
        this.toastr.warning('URL temporária indisponível.');
      },
      error: (err) => this.toastr.error(err?.userMessage || 'Não foi possível abrir a URL temporária.'),
    });
  }

  moverParaLixeira(arquivo: StorageArquivo): void {
    const arquivoId = this.resolveArquivoId(arquivo);
    if (!arquivoId) {
      this.toastr.warning('Arquivo sem arquivoId para mover à lixeira.');
      return;
    }

    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Mover para lixeira',
        message: `Mover o arquivo "${this.nomeArquivo(arquivo)}" para a lixeira?`,
        confirmText: 'Mover',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.storageService.moverParaLixeira(arquivoId).subscribe({
        next: () => {
          this.toastr.success('Arquivo movido para a lixeira.');
          this.carregar();
        },
        error: (err) => this.toastr.error(err?.userMessage || 'Falha ao mover o arquivo para a lixeira.'),
      });
    });
  }

  nomeArquivo(arquivo: StorageArquivo): string {
    return arquivo.nomeExibicao || arquivo.nomeOriginal || arquivo.nome || arquivo.titulo || `Arquivo ${this.resolveArquivoId(arquivo) || ''}`;
  }

  variantesLabel(arquivo: StorageArquivo): string {
    const variantes = arquivo.variantes;
    if (!variantes) return '-';
    if (Array.isArray(variantes)) return String(variantes.length);
    return String(Object.keys(variantes).length);
  }

  formatBytes = formatBytes;

  get podeVoltar(): boolean {
    return this.page > 0;
  }

  get podeAvancar(): boolean {
    return (this.page + 1) * this.size < this.totalElements;
  }

  private buildParams(): StorageArquivoListParams {
    const raw = this.filtros.getRawValue();
    return {
      page: this.page,
      size: this.size,
      nome: raw.nome || undefined,
      status: raw.status || undefined,
      contexto: raw.contexto || undefined,
      tipo: raw.tipo || undefined,
      possuiReferencia: this.parseBoolean(raw.possuiReferencia),
      possuiAnomalia: this.parseBoolean(raw.possuiAnomalia),
    };
  }

  private parseBoolean(value?: string | null): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private resolveArquivoId(arquivo: StorageArquivo): number | null {
    return arquivo.arquivoId || arquivo.id || null;
  }
}
