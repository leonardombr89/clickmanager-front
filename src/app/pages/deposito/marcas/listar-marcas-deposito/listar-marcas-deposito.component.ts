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
import { DepositoImagem, DepositoMarca } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';

@Component({
  selector: 'app-listar-marcas-deposito',
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
    TablerIconsModule,
    RouterModule,
    CardHeaderComponent,
    InputPesquisaComponent,
    MobileFabActionComponent,
  ],
  templateUrl: './listar-marcas-deposito.component.html',
  styleUrl: './listar-marcas-deposito.component.scss',
})
export class ListarMarcasDepositoComponent implements OnInit {
  marcas: DepositoMarca[] = [];
  totalMarcas = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  marcaSelecionadaMenu: DepositoMarca | null = null;
  readonly colunasExibidas = ['codigo', 'nome', 'slug', 'destaque', 'ativo', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly depositoService: DepositoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarMarcas();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarMarcas(): void {
    this.carregando = true;
    this.depositoService
      .listarMarcas({
        page: this.pagina,
        size: this.tamanhoPagina,
        sort: 'nome,asc',
        textoPesquisa: this.termoPesquisa,
      })
      .subscribe({
        next: (response) => {
          this.marcas = response.content || [];
          this.totalMarcas = response.totalElements || 0;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Não foi possível carregar as marcas do depósito.');
        },
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarMarcas();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor || '';
    this.pagina = 0;
    this.carregarMarcas();
  }

  editar(marca: DepositoMarca): void {
    this.router.navigate(['/page/deposito/marcas/editar', marca.id]);
  }

  excluir(marca: DepositoMarca): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Inativar marca',
        message: `Tem certeza que deseja inativar a marca "${marca.nome}"?`,
        confirmText: 'Inativar',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.depositoService.excluirMarca(marca.id).subscribe({
        next: () => {
          this.toastr.success('Marca inativada com sucesso!');
          this.carregarMarcas();
        },
        error: () => {
          this.toastr.error('Erro ao inativar a marca.');
        },
      });
    });
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/deposito/marcas/nova']);
  }

  selecionarMarcaMenu(marca: DepositoMarca, event: Event): void {
    event.stopPropagation();
    this.marcaSelecionadaMenu = marca;
  }

  statusAtivoLabel(ativo: boolean): string {
    return ativo ? 'Ativa' : 'Inativa';
  }

  getImagemSrc(imagem?: DepositoImagem | null): string {
    return getDepositoImageUrl(imagem, undefined, 'CARD');
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
