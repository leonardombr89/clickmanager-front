import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  DepositoCategoriaPublica,
  DepositoItemPublico,
  DepositoMarcaPublica,
  EmpresaPublica,
  SitePublicoResponse,
} from './public-store.models';
import { PublicStoreService } from './public-store.service';

@Component({
  selector: 'app-public-store-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './public-store-page.component.html',
  styleUrl: './public-store-page.component.scss',
})
export class PublicStorePageComponent implements OnInit, OnDestroy {
  site?: SitePublicoResponse;
  carregando = true;
  erro = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly service: PublicStoreService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.carregando = true;
          this.erro = '';
          const slug = params.get('slug') || '';
          return this.service.buscarPorSlug(slug);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (site) => {
          this.site = site;
          this.carregando = false;
        },
        error: () => {
          this.erro = 'Não foi possível carregar este site.';
          this.carregando = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get empresa(): EmpresaPublica | undefined {
    return this.site?.empresa;
  }

  get produtos(): DepositoItemPublico[] {
    return this.site?.conteudo?.produtosDestaque || [];
  }

  get categorias(): DepositoCategoriaPublica[] {
    return this.site?.conteudo?.categoriasDestaque || [];
  }

  get marcas(): DepositoMarcaPublica[] {
    return this.site?.conteudo?.marcasDestaque || [];
  }

  get whatsappHref(): string | null {
    const config = this.site?.config;
    const telefone = config?.whatsappTelefone?.replace(/\D/g, '');
    if (!config?.whatsappAtivo || !telefone) {
      return null;
    }
    const mensagem = encodeURIComponent(config.whatsappMensagemInicial || 'Olá! Acessei o site e gostaria de mais informações.');
    const numero = telefone.startsWith('55') ? telefone : `55${telefone}`;
    return `https://wa.me/${numero}?text=${mensagem}`;
  }

  imagemProduto(item: DepositoItemPublico): string | null {
    return this.resolveImage(item.imagemPrincipal?.displayUrl || item.imagemPrincipal?.url);
  }

  imagemCategoria(categoria: DepositoCategoriaPublica): string | null {
    return this.resolveImage(categoria.imagem?.displayUrl || categoria.imagem?.url);
  }

  imagemMarca(marca: DepositoMarcaPublica): string | null {
    return this.resolveImage(marca.imagem?.displayUrl || marca.imagem?.url);
  }

  formatarPreco(item: DepositoItemPublico): string {
    const valor = item.precoPromocional ?? item.precoVenda;
    if (!item.exibirPreco || valor === null || valor === undefined) {
      return 'Sob consulta';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  private resolveImage(url?: string | null): string | null {
    if (!url) {
      return null;
    }
    if (/^https?:\/\//i.test(url) || url.startsWith('data:')) {
      return url;
    }
    const baseUrl = environment.apiUrl || '';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
