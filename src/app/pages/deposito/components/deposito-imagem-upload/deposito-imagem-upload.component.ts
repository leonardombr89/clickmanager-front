import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DepositoImagem } from '../../models/deposito.models';
import { DepositoImagemService } from '../../services/deposito-imagem.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';
import {
  DEPOSITO_IMAGE_UPLOAD_LIMITS,
  extractDepositoImageUploadError,
  formatDepositoImageSize,
  validateDepositoImageFile,
} from '../../utils/deposito-image-upload-validation.util';

@Component({
  selector: 'app-deposito-imagem-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './deposito-imagem-upload.component.html',
  styleUrl: './deposito-imagem-upload.component.scss',
})
export class DepositoImagemUploadComponent implements OnChanges {
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
  arrastandoArquivo = false;
  readonly limitesUpload = DEPOSITO_IMAGE_UPLOAD_LIMITS;

  constructor(private readonly depositoImagemService: DepositoImagemService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imagemAtual']) {
      this.sincronizarImagemAtual();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    await this.processarArquivo(file);

    if (input) {
      input.value = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.carregando) {
      this.arrastandoArquivo = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastandoArquivo = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.arrastandoArquivo = false;

    if (this.carregando) {
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    await this.processarArquivo(file);
  }

  private async processarArquivo(file: File): Promise<void> {
    const validacao = await validateDepositoImageFile(file);
    if (!validacao.valid) {
      this.erro = validacao.message || 'Esta imagem não pode ser enviada.';
      return;
    }

    this.erro = '';
    this.arquivoNome = file.name;
    this.arquivoTamanho = formatDepositoImageSize(file.size);
    this.ultimoArquivoSelecionado = file;
    this.previewLocal(file);
    this.enviarArquivo(file);
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
    this.previewUrl = this.imagemAtual ? getDepositoImageUrl(this.imagemAtual, '', 'MEDIUM') : '';
    this.previewFallbackUrl = '';
    this.arquivoNome = this.imagemAtual?.titulo || '';
    this.arquivoTamanho = this.imagemAtual?.size ? formatDepositoImageSize(this.imagemAtual.size) : '';
    this.ultimoArquivoSelecionado = null;
    this.avisoPreview = '';
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
      .upload(file, this.context, {
        titulo: file.name,
        altText: this.label,
        principal: this.principal,
      })
      .subscribe({
        next: (imagem) => {
          this.carregando = false;
          this.uploadingChange.emit(false);
          this.previewUrl = getDepositoImageUrl(imagem, this.previewUrl, 'MEDIUM');
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
          this.erro = extractDepositoImageUploadError(error);
        },
      });
  }
}
