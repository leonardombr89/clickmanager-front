import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { MobileFabActionComponent } from 'src/app/components/mobile-fab-action/mobile-fab-action.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { resolveStorageImageUrl } from 'src/app/pages/storage/utils/storage-media-url.util';
import { SiteBannerResponse } from '../../models/site-banner.models';
import { SiteBannerService } from '../../services/site-banner.service';

@Component({
  selector: 'app-listar-banners',
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
  templateUrl: './listar-banners.component.html',
  styleUrl: './listar-banners.component.scss',
})
export class ListarBannersComponent implements OnInit {
  banners: SiteBannerResponse[] = [];
  totalBanners = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  bannerSelecionadoMenu: SiteBannerResponse | null = null;
  readonly colunasExibidas = ['imagem', 'titulo', 'ordem', 'status', 'vigencia', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly siteBannerService: SiteBannerService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarBanners();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarBanners(): void {
    this.carregando = true;
    this.siteBannerService
      .listar({
        page: this.pagina,
        size: this.tamanhoPagina,
        sort: 'ordem,asc',
        textoPesquisa: this.termoPesquisa,
      })
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.banners = response;
            this.totalBanners = response.length;
          } else {
            this.banners = response.content || [];
            this.totalBanners = response.totalElements || 0;
          }

          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Não foi possível carregar os banners do site.');
        },
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarBanners();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor || '';
    this.pagina = 0;
    this.carregarBanners();
  }

  editar(banner: SiteBannerResponse): void {
    this.router.navigate(['/page/site/banners/editar', banner.id]);
  }

  alterarStatus(banner: SiteBannerResponse): void {
    const novoStatus = !banner.ativo;
    this.siteBannerService.alterarStatus(banner.id, novoStatus).subscribe({
      next: () => {
        this.toastr.success(novoStatus ? 'Banner ativado com sucesso!' : 'Banner desativado com sucesso!');
        this.carregarBanners();
      },
      error: () => {
        this.toastr.error('Não foi possível alterar o status do banner.');
      },
    });
  }

  excluir(banner: SiteBannerResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir banner',
        message: `Tem certeza que deseja excluir o banner "${banner.titulo || 'sem título'}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.siteBannerService.excluir(banner.id).subscribe({
        next: () => {
          this.toastr.success('Banner excluído com sucesso!');
          this.carregarBanners();
        },
        error: () => {
          this.toastr.error('Erro ao excluir o banner.');
        },
      });
    });
  }

  mover(banner: SiteBannerResponse, direcao: -1 | 1): void {
    const index = this.banners.findIndex((item) => item.id === banner.id);
    const targetIndex = index + direcao;

    if (index < 0 || targetIndex < 0 || targetIndex >= this.banners.length) {
      return;
    }

    const novaLista = [...this.banners];
    [novaLista[index], novaLista[targetIndex]] = [novaLista[targetIndex], novaLista[index]];

    const payload = {
      banners: novaLista.map((item, idx) => ({
        id: item.id,
        ordem: idx + 1 + this.pagina * this.tamanhoPagina,
      })),
    };

    this.siteBannerService.reordenar(payload).subscribe({
      next: () => {
        this.toastr.success('Ordem dos banners atualizada.');
        this.carregarBanners();
      },
      error: () => {
        this.toastr.error('Não foi possível atualizar a ordem dos banners.');
      },
    });
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/site/banners/novo']);
  }

  selecionarBannerMenu(banner: SiteBannerResponse, event: Event): void {
    event.stopPropagation();
    this.bannerSelecionadoMenu = banner;
  }

  trackByBanner(index: number, banner: SiteBannerResponse): number {
    return banner.id ?? index;
  }

  statusLabel(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  bannerImagemUrl(banner: SiteBannerResponse): string {
    return resolveStorageImageUrl(banner, 'CARD', '');
  }

  vigenciaLabel(banner: SiteBannerResponse): string {
    const inicio = this.formatarData(banner.dataInicio);
    const fim = this.formatarData(banner.dataFim);

    if (inicio && fim) {
      return `${inicio} até ${fim}`;
    }

    if (inicio) {
      return `A partir de ${inicio}`;
    }

    if (fim) {
      return `Até ${fim}`;
    }

    return 'Sempre visível';
  }

  private formatarData(value?: string | null): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString('pt-BR');
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
