import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SitePaginaBlocoResponse, SitePaginaBlocoTipo } from 'src/app/pages/site/models/site-pagina-bloco.models';
import { resolveStorageImageUrl } from 'src/app/pages/storage/utils/storage-media-url.util';

@Component({
  selector: 'app-bloco-preview',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './bloco-preview.component.html',
  styleUrl: './bloco-preview.component.scss',
})
export class BlocoPreviewComponent {
  @Input() bloco: SitePaginaBlocoResponse | null = null;

  get imagemUrl(): string {
    return resolveStorageImageUrl(this.bloco, 'CARD', '');
  }

  get tipoLabel(): string {
    return this.labelTipo(this.bloco?.tipo);
  }

  get conteudo(): Record<string, any> {
    return this.parseConteudo(this.bloco?.conteudoJson);
  }

  get resumo(): string {
    const conteudo = this.conteudo;
    if (this.bloco?.tipo === 'FAQ') {
      const total = Array.isArray(conteudo['itens']) ? conteudo['itens'].length : 0;
      return `${total} pergunta${total === 1 ? '' : 's'}`;
    }

    if (this.bloco?.tipo === 'CTA') {
      return [conteudo['textoBotao'], conteudo['url']].filter(Boolean).join(' - ') || 'Chamada sem URL';
    }

    if (this.bloco?.tipo === 'VIDEO') {
      return conteudo['url'] || 'Video sem URL';
    }

    if (this.bloco?.tipo === 'MAPA') {
      return conteudo['urlEmbed'] || 'Mapa sem URL/embed';
    }

    if (['PRODUTOS', 'CATEGORIAS', 'MARCAS'].includes(this.bloco?.tipo || '')) {
      return `Limite: ${conteudo['limite'] || 6}`;
    }

    return this.stripHtml(conteudo['html']) || this.bloco?.subtitulo || 'Sem resumo';
  }

  private parseConteudo(value: SitePaginaBlocoResponse['conteudoJson']): Record<string, any> {
    if (!value) {
      return {};
    }

    if (typeof value === 'object') {
      return value as Record<string, any>;
    }

    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private stripHtml(value: unknown): string {
    return String(value || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private labelTipo(tipo?: SitePaginaBlocoTipo | null): string {
    const labels: Record<SitePaginaBlocoTipo, string> = {
      TEXTO: 'Texto',
      IMAGEM: 'Imagem',
      TEXTO_IMAGEM: 'Texto + imagem',
      FAQ: 'FAQ',
      CTA: 'CTA',
      VIDEO: 'Video',
      GALERIA: 'Galeria',
      MAPA: 'Mapa',
      PRODUTOS: 'Produtos',
      CATEGORIAS: 'Categorias',
      MARCAS: 'Marcas',
    };

    return tipo ? labels[tipo] || tipo : 'Bloco';
  }
}
