import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { MobileFabActionComponent } from 'src/app/components/mobile-fab-action/mobile-fab-action.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { SitePaginaCodigo, SitePaginaResponse, SitePaginaTipo } from '../../models/site-pagina.models';
import { SitePaginaService } from '../../services/site-pagina.service';

@Component({
  selector: 'app-listar-paginas',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatRippleModule,
    MatTableModule,
    RouterModule,
    TablerIconsModule,
    CardHeaderComponent,
    InputPesquisaComponent,
    MobileFabActionComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './listar-paginas.component.html',
  styleUrl: './listar-paginas.component.scss',
})
export class ListarPaginasComponent implements OnInit {
  paginas: SitePaginaResponse[] = [];
  totalPaginas = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  paginaSelecionadaMenu: SitePaginaResponse | null = null;
  readonly colunasExibidas = ['titulo', 'tipo', 'slug', 'ativa', 'menu', 'home', 'ordemMenu', 'ordemHome', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly sitePaginaService: SitePaginaService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarPaginas();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarPaginas(): void {
    this.carregando = true;
    this.sitePaginaService
      .listar({
        page: this.pagina,
        size: this.tamanhoPagina,
        sort: 'ordemMenu,asc',
        textoPesquisa: this.termoPesquisa,
      })
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.paginas = response;
            this.totalPaginas = response.length;
          } else {
            this.paginas = response.content || [];
            this.totalPaginas = response.totalElements || 0;
          }

          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Não foi possível carregar as páginas do site.');
        },
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarPaginas();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor || '';
    this.pagina = 0;
    this.carregarPaginas();
  }

  editar(pagina: SitePaginaResponse): void {
    this.router.navigate(['/page/site/paginas/editar', pagina.id]);
  }

  alterarStatus(pagina: SitePaginaResponse): void {
    if (this.isHome(pagina)) {
      this.toastr.warning('A página HOME deve permanecer ativa.');
      return;
    }

    const novoStatus = !pagina.ativa;
    this.sitePaginaService.alterarStatus(pagina.id, novoStatus).subscribe({
      next: () => {
        this.toastr.success(novoStatus ? 'Página ativada com sucesso!' : 'Página desativada com sucesso!');
        this.carregarPaginas();
      },
      error: () => {
        this.toastr.error('Não foi possível alterar o status da página.');
      },
    });
  }

  alterarMenu(pagina: SitePaginaResponse): void {
    this.sitePaginaService
      .alterarMenu(pagina.id, {
        exibirNoMenu: !pagina.exibirNoMenu,
        ordemMenu: pagina.ordemMenu,
      })
      .subscribe({
        next: () => {
          this.toastr.success(!pagina.exibirNoMenu ? 'Página exibida no menu.' : 'Página ocultada do menu.');
          this.carregarPaginas();
        },
        error: () => {
          this.toastr.error('Não foi possível alterar a exibição no menu.');
        },
      });
  }

  alterarHome(pagina: SitePaginaResponse): void {
    this.sitePaginaService
      .alterarHome(pagina.id, {
        exibirNaHome: !pagina.exibirNaHome,
        ordemHome: pagina.ordemHome,
        tituloHome: pagina.tituloHome,
        subtituloHome: pagina.subtituloHome,
        limiteItensHome: pagina.limiteItensHome ?? 6,
        layoutHome: pagina.layoutHome || 'GRID',
        textoBotaoHome: pagina.textoBotaoHome,
      })
      .subscribe({
        next: () => {
          this.toastr.success(!pagina.exibirNaHome ? 'Página exibida na Home.' : 'Página ocultada da Home.');
          this.carregarPaginas();
        },
        error: () => {
          this.toastr.error('Não foi possível alterar a exibição na Home.');
        },
      });
  }

  excluir(pagina: SitePaginaResponse): void {
    if (!this.podeExcluir(pagina)) {
      this.toastr.warning('Páginas de sistema não podem ser excluídas.');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir página',
        message: `Tem certeza que deseja excluir a página "${pagina.titulo || 'sem título'}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.sitePaginaService.excluir(pagina.id).subscribe({
        next: () => {
          this.toastr.success('Página excluída com sucesso!');
          this.carregarPaginas();
        },
        error: () => {
          this.toastr.error('Erro ao excluir a página.');
        },
      });
    });
  }

  moverMenu(pagina: SitePaginaResponse, direcao: -1 | 1): void {
    this.mover(pagina, direcao, 'menu');
  }

  moverHome(pagina: SitePaginaResponse, direcao: -1 | 1): void {
    this.mover(pagina, direcao, 'home');
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/site/paginas/nova']);
  }

  selecionarPaginaMenu(pagina: SitePaginaResponse, event: Event): void {
    event.stopPropagation();
    this.paginaSelecionadaMenu = pagina;
  }

  tipoLabel(tipo: SitePaginaTipo): string {
    const labels: Record<SitePaginaTipo, string> = {
      SISTEMA: 'Sistema',
      PERSONALIZADA: 'Personalizada',
    };

    return labels[tipo] || tipo;
  }

  codigoLabel(codigo?: SitePaginaCodigo | null): string {
    if (!codigo) {
      return '';
    }

    const labels: Record<SitePaginaCodigo, string> = {
      HOME: 'Home',
      PRODUTOS: 'Produtos',
      CATEGORIAS: 'Categorias',
      MARCAS: 'Marcas',
      QUEM_SOMOS: 'Quem somos',
      CONTATO: 'Contato',
      ORCAMENTO: 'Orçamento',
    };

    return labels[codigo] || codigo;
  }

  rotaLabel(pagina: SitePaginaResponse): string {
    if (this.isHome(pagina)) {
      return '/';
    }

    const slug = String(pagina.slug || '').trim();
    return slug ? `/${slug.replace(/^\/+/, '')}` : '-';
  }

  statusLabel(ativa: boolean): string {
    return ativa ? 'Ativa' : 'Inativa';
  }

  efeitoLabel(pagina: SitePaginaResponse, campo: 'menu' | 'home'): string {
    const habilitado = campo === 'menu' ? pagina.exibirNoMenu : pagina.exibirNaHome;
    if (!habilitado) {
      return 'Não';
    }

    return pagina.ativa ? 'Sim' : 'Sem efeito';
  }

  isHome(pagina?: SitePaginaResponse | null): boolean {
    return pagina?.codigo === 'HOME';
  }

  podeExcluir(pagina?: SitePaginaResponse | null): boolean {
    return pagina?.tipo === 'PERSONALIZADA' && !pagina.paginaSistema;
  }

  podeMoverMenu(index: number, direcao: -1 | 1): boolean {
    const paginasMenu = this.paginasComMenu();
    const pagina = this.paginas[index];
    const posicao = paginasMenu.findIndex((item) => item.id === pagina.id);
    return posicao >= 0 && posicao + direcao >= 0 && posicao + direcao < paginasMenu.length;
  }

  podeMoverHome(index: number, direcao: -1 | 1): boolean {
    const paginasHome = this.paginasComHome();
    const pagina = this.paginas[index];
    const posicao = paginasHome.findIndex((item) => item.id === pagina.id);
    return posicao >= 0 && posicao + direcao >= 0 && posicao + direcao < paginasHome.length;
  }

  private mover(pagina: SitePaginaResponse, direcao: -1 | 1, tipo: 'menu' | 'home'): void {
    const lista = tipo === 'menu' ? this.paginasComMenu() : this.paginasComHome();
    const index = lista.findIndex((item) => item.id === pagina.id);
    const targetIndex = index + direcao;

    if (index < 0 || targetIndex < 0 || targetIndex >= lista.length) {
      return;
    }

    const novaLista = [...lista];
    [novaLista[index], novaLista[targetIndex]] = [novaLista[targetIndex], novaLista[index]];

    const request$ =
      tipo === 'menu'
        ? this.sitePaginaService.reordenarMenu({
            paginas: novaLista.map((item, idx) => ({ id: item.id, ordemMenu: idx + 1 })),
          })
        : this.sitePaginaService.reordenarHome({
            paginas: novaLista.map((item, idx) => ({ id: item.id, ordemHome: idx + 1 })),
          });

    request$.subscribe({
      next: () => {
        this.toastr.success(tipo === 'menu' ? 'Ordem do menu atualizada.' : 'Ordem da Home atualizada.');
        this.carregarPaginas();
      },
      error: () => {
        this.toastr.error(tipo === 'menu' ? 'Não foi possível atualizar a ordem do menu.' : 'Não foi possível atualizar a ordem da Home.');
      },
    });
  }

  private paginasComMenu(): SitePaginaResponse[] {
    return this.paginas
      .filter((pagina) => pagina.exibirNoMenu)
      .sort((a, b) => Number(a.ordemMenu || 0) - Number(b.ordemMenu || 0));
  }

  private paginasComHome(): SitePaginaResponse[] {
    return this.paginas
      .filter((pagina) => pagina.exibirNaHome)
      .sort((a, b) => Number(a.ordemHome || 0) - Number(b.ordemHome || 0));
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
