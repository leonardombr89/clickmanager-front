import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { StorageArquivo } from '../../models/storage.models';
import { StorageImagePreviewComponent } from '../storage-image-preview/storage-image-preview.component';
import { formatBytes } from '../../utils/storage-format.util';

@Component({
  selector: 'app-storage-detalhe-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, StorageImagePreviewComponent],
  template: `
    <h2 mat-dialog-title>Detalhes do arquivo</h2>
    <mat-dialog-content>
      <div class="storage-detail">
        <app-storage-image-preview [media]="arquivo" variant="DETAIL" [alt]="nome"></app-storage-image-preview>
        <dl>
          <div><dt>Arquivo ID</dt><dd>{{ arquivo.arquivoId || arquivo.id || '-' }}</dd></div>
          <div><dt>Nome</dt><dd>{{ nome }}</dd></div>
          <div><dt>Contexto</dt><dd>{{ arquivo.contexto || arquivo.context || '-' }}</dd></div>
          <div><dt>Status</dt><dd>{{ arquivo.status || '-' }}</dd></div>
          <div><dt>Tipo</dt><dd>{{ arquivo.contentType || arquivo.tipo || '-' }}</dd></div>
          <div><dt>Tamanho</dt><dd>{{ formatBytes(arquivo.size) }}</dd></div>
          <div><dt>Dimensões</dt><dd>{{ dimensoes }}</dd></div>
          <div><dt>Referência</dt><dd>{{ arquivo.referencia || (arquivo.possuiReferencia ? 'Sim' : 'Não') }}</dd></div>
          <div><dt>Anomalia</dt><dd>{{ arquivo.anomalia || (arquivo.possuiAnomalia ? 'Sim' : 'Não') }}</dd></div>
        </dl>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .storage-detail {
      display: grid;
      grid-template-columns: 96px minmax(0, 1fr);
      gap: 16px;
      min-width: min(620px, 80vw);
    }
    .storage-detail app-storage-image-preview {
      width: 96px;
      height: 96px;
    }
    dl {
      display: grid;
      gap: 8px;
      margin: 0;
    }
    dl div {
      display: grid;
      grid-template-columns: 120px minmax(0, 1fr);
      gap: 12px;
    }
    dt {
      color: #5a6a85;
      font-weight: 600;
    }
    dd {
      margin: 0;
      word-break: break-word;
    }
  `],
})
export class StorageDetalheDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public readonly arquivo: StorageArquivo) {}

  get nome(): string {
    return this.arquivo.nomeExibicao || this.arquivo.nomeOriginal || this.arquivo.nome || this.arquivo.titulo || '-';
  }

  get dimensoes(): string {
    if (!this.arquivo.largura || !this.arquivo.altura) {
      return '-';
    }
    return `${this.arquivo.largura} x ${this.arquivo.altura}`;
  }

  formatBytes = formatBytes;
}
