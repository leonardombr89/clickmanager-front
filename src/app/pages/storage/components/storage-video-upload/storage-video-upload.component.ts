import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'ngx-toastr';
import { StorageVideo } from '../../models/storage.models';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-storage-video-upload',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './storage-video-upload.component.html',
  styleUrl: './storage-video-upload.component.scss',
})
export class StorageVideoUploadComponent {
  @Output() videoEnviado = new EventEmitter<StorageVideo>();

  readonly tamanhoMaximo = 1024 * 1024 * 1024;
  enviando = false;
  arquivo: File | null = null;
  arquivoNome = '';
  erro = '';

  form = this.fb.group({
    contexto: ['VIDEO', Validators.required],
    titulo: [''],
    descricao: [''],
    altText: [''],
    nomeExibicao: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly storageService: StorageService,
    private readonly toastr: ToastrService
  ) {}

  get contextoControl(): FormControl {
    return this.form.get('contexto') as FormControl;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    if (!file) {
      return;
    }

    if (!this.validarArquivo(file)) {
      if (input) input.value = '';
      return;
    }

    this.arquivo = file;
    this.arquivoNome = file.name;
    this.erro = '';
    if (!this.form.value.titulo) {
      this.form.patchValue({ titulo: file.name });
    }
    if (input) input.value = '';
  }

  enviar(): void {
    if (!this.arquivo) {
      this.erro = 'Selecione um vídeo para enviar.';
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando = true;
    const raw = this.form.getRawValue();
    this.storageService.uploadVideo({
      file: this.arquivo,
      contexto: raw.contexto || 'VIDEO',
      titulo: raw.titulo,
      descricao: raw.descricao,
      altText: raw.altText,
      nomeExibicao: raw.nomeExibicao,
    }).subscribe({
      next: (video) => {
        this.enviando = false;
        this.videoEnviado.emit(video);
        this.arquivo = null;
        this.arquivoNome = '';
        this.form.patchValue({ titulo: '', descricao: '', altText: '', nomeExibicao: '' });
        this.toastr.success('Vídeo enviado para processamento.');
      },
      error: (err) => {
        this.enviando = false;
        this.toastr.error(err?.userMessage || 'Falha ao enviar o vídeo.');
      },
    });
  }

  private validarArquivo(file: File): boolean {
    const extensaoValida = /\.(mp4|mov|webm|m4v)$/i.test(file.name);
    const tipoValido = !file.type || file.type.startsWith('video/');
    if (!extensaoValida || !tipoValido) {
      this.erro = 'Formato inválido. Use MP4, MOV, WEBM ou M4V.';
      return false;
    }

    if (file.size > this.tamanhoMaximo) {
      this.erro = 'Arquivo muito grande. O limite visual é 1 GB.';
      return false;
    }

    return true;
  }
}
