import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { StorageArquivo, StorageVideo } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';
import { formatBytes } from '../../utils/storage-format.util';
import { resolveStorageImageUrl, resolveStorageVideoUrl } from '../../utils/storage-media-url.util';
import { StorageVideoStatusComponent } from '../storage-video-status/storage-video-status.component';
import { StorageVideoUploadComponent } from '../storage-video-upload/storage-video-upload.component';

@Component({
  selector: 'app-storage-videos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StorageVideoStatusComponent,
    StorageVideoUploadComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './storage-videos.component.html',
  styleUrl: './storage-videos.component.scss',
})
export class StorageVideosComponent implements OnInit, OnDestroy {
  videos: StorageVideo[] = [];
  carregando = false;
  private readonly polling = new Map<number, Subscription>();

  constructor(
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.polling.forEach((sub) => sub.unsubscribe());
    this.polling.clear();
  }

  carregar(): void {
    this.carregando = true;
    this.storageService.listarArquivos({ tipo: 'VIDEO', size: 50 }).subscribe({
      next: (response) => {
        this.videos = (response.content || []).map((arquivo) => this.fromArquivo(arquivo));
        this.videos
          .filter((video) => this.isProcessando(video))
          .forEach((video) => this.iniciarPolling(video.arquivoId));
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar os vídeos.');
      },
    });
  }

  onVideoEnviado(video: StorageVideo): void {
    this.upsertVideo(video);
    if (video.arquivoId) {
      this.iniciarPolling(video.arquivoId);
    }
  }

  reprocessar(video: StorageVideo): void {
    this.storageService.reprocessarVideo(video.arquivoId).subscribe({
      next: (atualizado) => {
        this.upsertVideo(atualizado);
        this.iniciarPolling(atualizado.arquivoId);
        this.toastr.success('Reprocessamento iniciado.');
      },
      error: (err) => this.toastr.error(err?.userMessage || 'Original de vídeo indisponível para reprocessar.'),
    });
  }

  cancelar(video: StorageVideo): void {
    this.storageService.cancelarVideo(video.arquivoId).subscribe({
      next: (atualizado) => {
        this.pararPolling(video.arquivoId);
        this.upsertVideo(atualizado);
        this.toastr.success('Processamento cancelado.');
      },
      error: (err) => this.toastr.error(err?.userMessage || 'Falha ao cancelar o processamento.'),
    });
  }

  moverParaLixeira(video: StorageVideo): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Mover vídeo para lixeira',
        message: `Mover o vídeo "${this.nomeVideo(video)}" para a lixeira?`,
        confirmText: 'Mover',
        confirmColor: 'warn',
      },
    }).afterClosed().subscribe((confirmado) => {
      if (!confirmado) return;
      this.storageService.moverVideoParaLixeira(video.arquivoId).subscribe({
        next: () => {
          this.toastr.success('Vídeo movido para a lixeira.');
          this.videos = this.videos.filter((item) => item.arquivoId !== video.arquivoId);
        },
        error: (err) => this.toastr.error(err?.userMessage || 'Falha ao mover vídeo para a lixeira.'),
      });
    });
  }

  nomeVideo(video: StorageVideo): string {
    return video.nomeExibicao || video.titulo || `Vídeo ${video.arquivoId}`;
  }

  poster(video: StorageVideo): string {
    return resolveStorageImageUrl(video, 'CARD', '');
  }

  videoUrl(video: StorageVideo): string {
    return resolveStorageVideoUrl(video);
  }

  isAtivo(video: StorageVideo): boolean {
    return String(video.status || '').toUpperCase() === 'ATIVO';
  }

  isFalha(video: StorageVideo): boolean {
    return String(video.status || '').toUpperCase() === 'FALHA';
  }

  isProcessando(video: StorageVideo): boolean {
    return String(video.status || '').toUpperCase() === 'PROCESSANDO';
  }

  formatBytes = formatBytes;

  private iniciarPolling(arquivoId: number): void {
    if (!arquivoId || this.polling.has(arquivoId)) {
      return;
    }

    const sub = this.storageService.acompanharVideo(arquivoId).subscribe({
      next: (video) => {
        this.upsertVideo(video);
        if (this.storageService.isVideoFinal(video.status)) {
          this.pararPolling(arquivoId);
        }
      },
      error: () => {
        this.pararPolling(arquivoId);
        this.toastr.error('Falha ao consultar o status do vídeo.');
      },
    });
    this.polling.set(arquivoId, sub);
  }

  private pararPolling(arquivoId: number): void {
    this.polling.get(arquivoId)?.unsubscribe();
    this.polling.delete(arquivoId);
  }

  private upsertVideo(video: StorageVideo): void {
    const index = this.videos.findIndex((item) => item.arquivoId === video.arquivoId);
    if (index >= 0) {
      const copy = [...this.videos];
      copy[index] = { ...copy[index], ...video };
      this.videos = copy;
      return;
    }

    this.videos = [video, ...this.videos];
  }

  private fromArquivo(arquivo: StorageArquivo): StorageVideo {
    return {
      ...arquivo,
      arquivoId: arquivo.arquivoId || arquivo.id || 0,
      titulo: arquivo.titulo || arquivo.nomeExibicao || arquivo.nomeOriginal || arquivo.nome,
      status: arquivo.status,
      videoUrl: arquivo.url || arquivo.displayUrl,
    };
  }
}
