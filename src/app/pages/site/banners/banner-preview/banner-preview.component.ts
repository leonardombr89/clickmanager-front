import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SiteBannerCorTexto, SiteBannerPosicaoTexto } from '../../models/site-banner.models';

@Component({
  selector: 'app-banner-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner-preview.component.html',
  styleUrl: './banner-preview.component.scss',
})
export class BannerPreviewComponent {
  @Input() imagemUrl?: string | null;
  @Input() titulo?: string | null;
  @Input() subtitulo?: string | null;
  @Input() descricao?: string | null;
  @Input() ctaTexto?: string | null;
  @Input() altText?: string | null;
  @Input() posicaoTexto: SiteBannerPosicaoTexto | null = 'ESQUERDA';
  @Input() corTexto: SiteBannerCorTexto | null = 'CLARO';
  @Input() overlayAtivo: boolean | null = true;
  @Input() overlayOpacidade: number | null = 45;

  get posicaoClass(): string {
    const posicao = this.posicaoTexto || 'ESQUERDA';
    return `banner-preview__content--${posicao.toLowerCase()}`;
  }

  get corClass(): string {
    const cor = this.corTexto || 'CLARO';
    return `banner-preview__content--${cor.toLowerCase()}`;
  }

  get overlayBackground(): string {
    const opacity = this.overlayAtivo ? this.normalizarOpacidade(this.overlayOpacidade) / 100 : 0;
    return `rgba(15, 23, 42, ${opacity})`;
  }

  private normalizarOpacidade(value: unknown): number {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return 45;
    }

    return Math.min(100, Math.max(0, Math.round(parsed)));
  }
}
