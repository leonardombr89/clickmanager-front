import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';
import { DepositoImagem } from '../../models/deposito.models';
import { DepositoImagemService } from '../../services/deposito-imagem.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';

@Component({
  selector: 'app-deposito-imagem-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './deposito-imagem-upload.component.html',
  styleUrl: './deposito-imagem-upload.component.scss',
})
export class DepositoImagemUploadComponent implements OnChanges {
  @Input({ required: true }) empresaSlug = '';
  @Input({ required: true }) context = 'geral';
  @Input({ required: true }) label = 'Imagem';
  @Input() imagemAtual?: DepositoImagem | null;
  @Input() principal = false;

  @Output() imagemSelecionada = new EventEmitter<DepositoImagem | null>();
  @Output() uploadingChange = new EventEmitter<boolean>();

  carregando = false;
  erro = '';
  previewUrl = '';
  previewFallbackUrl = '';
  arquivoNome = '';
  arquivoTamanho = '';
  ultimoArquivoSelecionado: File | null = null;
  avisoPreview = '';

  constructor(private readonly depositoImagemService: DepositoImagemService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imagemAtual']) {
      this.sincronizarImagemAtual();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.validarArquivo(file)) {
      input.value = '';
      return;
    }

    if (!this.empresaSlug?.trim()) {
      this.erro = 'Não foi possível identificar a empresa para enviar a imagem.';
      input.value = '';
      return;
    }

    this.erro = '';
    this.arquivoNome = file.name;
    this.arquivoTamanho = this.formatarTamanho(file.size);
    this.ultimoArquivoSelecionado = file;
    this.previewLocal(file);
    this.enviarArquivo(file);

    if (input) {
      input.value = '';
    }
  }

  tentarNovamente(): void {
    if (!this.ultimoArquivoSelecionado || this.carregando) {
      return;
    }

    this.erro = '';
    this.enviarArquivo(this.ultimoArquivoSelecionado);
  }

  limparSelecao(): void {
    this.previewUrl = '';
    this.previewFallbackUrl = '';
    this.arquivoNome = '';
    this.arquivoTamanho = '';
    this.erro = '';
    this.avisoPreview = '';
    this.ultimoArquivoSelecionado = null;
    this.imagemAtual = null;
    this.imagemSelecionada.emit(null);
  }

  get altPreview(): string {
    return this.imagemAtual?.altText?.trim() || this.label;
  }

  get possuiImagem(): boolean {
    return !!this.previewUrl;
  }

  get uploadPendente(): boolean {
    return !!this.ultimoArquivoSelecionado && !this.imagemAtual && !this.carregando;
  }

  onPreviewError(): void {
    if (this.previewFallbackUrl && this.previewUrl !== this.previewFallbackUrl) {
      this.previewUrl = this.previewFallbackUrl;
      this.avisoPreview = 'A imagem foi enviada, mas a URL pública não carregou agora. Exibindo a prévia local.';
      return;
    }

    this.previewUrl = '';
    this.avisoPreview = 'A imagem foi enviada, mas não foi possível carregar a visualização.';
  }

  private sincronizarImagemAtual(): void {
    this.previewUrl = this.imagemAtual ? getDepositoImageUrl(this.imagemAtual, '') : '';
    this.previewFallbackUrl = '';
    this.arquivoNome = this.imagemAtual?.titulo || '';
    this.arquivoTamanho = this.imagemAtual?.size ? this.formatarTamanho(this.imagemAtual.size) : '';
    this.ultimoArquivoSelecionado = null;
    this.avisoPreview = '';
  }

  private validarArquivo(file: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
      this.erro = 'Formato inválido. Use PNG, JPG, WEBP, SVG ou GIF.';
      return false;
    }

    return true;
  }

  private previewLocal(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.previewFallbackUrl = String(reader.result || '');
      this.previewUrl = this.previewFallbackUrl;
      this.avisoPreview = '';
    };
    reader.readAsDataURL(file);
  }

  private enviarArquivo(file: File): void {
    this.carregando = true;
    this.uploadingChange.emit(true);

    this.depositoImagemService
      .upload(file, this.empresaSlug.trim(), this.context, {
        titulo: file.name,
        altText: this.label,
        principal: this.principal,
      })
      .subscribe({
        next: (imagem) => {
          this.carregando = false;
          this.uploadingChange.emit(false);
          this.previewUrl = getDepositoImageUrl(imagem, this.previewUrl);
          this.imagemAtual = imagem;
          this.ultimoArquivoSelecionado = null;
          this.avisoPreview = '';
          this.imagemSelecionada.emit(imagem);
        },
        error: (error: unknown) => {
          this.carregando = false;
          this.uploadingChange.emit(false);
          this.imagemAtual = null;
          this.imagemSelecionada.emit(null);
          this.erro = this.extrairMensagemErro(error);
        },
      });
  }

  private extrairMensagemErro(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage =
        error.error?.message
        || error.error?.mensagem
        || error.error?.error
        || error.message;

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage.trim();
      }
    }

    return 'Falha ao enviar a imagem. Tente novamente.';
  }

  private formatarTamanho(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
