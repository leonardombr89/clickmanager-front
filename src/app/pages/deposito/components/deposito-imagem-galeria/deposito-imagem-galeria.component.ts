import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DepositoImagem } from '../../models/deposito.models';
import { DepositoImagemService } from '../../services/deposito-imagem.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';

@Component({
  selector: 'app-deposito-imagem-galeria',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './deposito-imagem-galeria.component.html',
  styleUrl: './deposito-imagem-galeria.component.scss',
})
export class DepositoImagemGaleriaComponent implements OnChanges {
  @Input({ required: true }) empresaSlug = '';
  @Input() context = 'produtos';
  @Input() imagens: DepositoImagem[] = [];

  @Output() imagensChange = new EventEmitter<DepositoImagem[]>();
  @Output() uploadingChange = new EventEmitter<boolean>();

  imagensInternas: DepositoImagem[] = [];
  carregando = false;
  erro = '';

  constructor(private readonly depositoImagemService: DepositoImagemService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imagens']) {
      this.imagensInternas = [...(this.imagens || [])];
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = Array.from(input?.files || []);
    if (!files.length) {
      return;
    }

    if (!this.empresaSlug?.trim()) {
      this.erro = 'Não foi possível identificar a empresa para enviar as imagens.';
      if (input) {
        input.value = '';
      }
      return;
    }

    const arquivosValidos = files.filter((file) => this.validarArquivo(file));
    if (!arquivosValidos.length) {
      this.erro = 'Nenhuma imagem válida foi selecionada.';
      if (input) {
        input.value = '';
      }
      return;
    }

    this.erro = '';
    this.carregando = true;
    this.uploadingChange.emit(true);

    forkJoin(
      arquivosValidos.map((file) =>
        this.depositoImagemService.upload(file, this.empresaSlug.trim(), this.context, {
          titulo: file.name,
          principal: false,
        }).pipe(catchError(() => of(null)))
      )
    ).subscribe({
      next: (resultado) => {
        const novasImagens = resultado.filter((item): item is DepositoImagem => !!item);
        this.imagensInternas = [...this.imagensInternas, ...novasImagens];
        this.emitirMudanca();
        this.carregando = false;
        this.uploadingChange.emit(false);

        if (novasImagens.length !== arquivosValidos.length) {
          this.erro = 'Algumas imagens não puderam ser enviadas.';
        }

        if (input) {
          input.value = '';
        }
      },
      error: () => {
        this.carregando = false;
        this.uploadingChange.emit(false);
        this.erro = 'Falha ao enviar as imagens da galeria.';
        if (input) {
          input.value = '';
        }
      },
    });
  }

  moverParaCima(index: number): void {
    if (index <= 0) {
      return;
    }

    const lista = [...this.imagensInternas];
    [lista[index - 1], lista[index]] = [lista[index], lista[index - 1]];
    this.imagensInternas = lista;
    this.emitirMudanca();
  }

  moverParaBaixo(index: number): void {
    if (index >= this.imagensInternas.length - 1) {
      return;
    }

    const lista = [...this.imagensInternas];
    [lista[index + 1], lista[index]] = [lista[index], lista[index + 1]];
    this.imagensInternas = lista;
    this.emitirMudanca();
  }

  remover(index: number): void {
    this.imagensInternas = this.imagensInternas.filter((_, idx) => idx !== index);
    this.emitirMudanca();
  }

  trackByImagem(index: number, imagem: DepositoImagem): number {
    return imagem.id ?? index;
  }

  getImagemSrc(imagem?: DepositoImagem | null): string {
    return getDepositoImageUrl(imagem);
  }

  private emitirMudanca(): void {
    this.imagensChange.emit([...this.imagensInternas]);
  }

  private validarArquivo(file: File): boolean {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    return tiposPermitidos.includes(file.type);
  }
}
