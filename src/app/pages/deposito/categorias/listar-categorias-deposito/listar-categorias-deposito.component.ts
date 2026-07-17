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
import { DepositoCategoria, DepositoImagem } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';

@Component({
  selector: 'app-listar-categorias-deposito',
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
  templateUrl: './listar-categorias-deposito.component.html',
  styleUrl: './listar-categorias-deposito.component.scss',
})
export class ListarCategoriasDepositoComponent implements OnInit {
  categorias: DepositoCategoria[] = [];
  totalCategorias = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  categoriaSelecionadaMenu: DepositoCategoria | null = null;
  readonly colunasExibidas = ['codigo', 'nome', 'slug', 'hierarquia', 'ativo', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly depositoService: DepositoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarCategorias();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarCategorias(): void {
    this.carregando = true;
    this.depositoService
      .listarCategorias({
        page: this.pagina,
        size: this.tamanhoPagina,
        sort: 'nome,asc',
        textoPesquisa: this.termoPesquisa,
      })
      .subscribe({
        next: (response) => {
          this.categorias = response.content || [];
          this.totalCategorias = response.totalElements || 0;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Não foi possível carregar as categorias do depósito.');
        },
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarCategorias();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor || '';
    this.pagina = 0;
    this.carregarCategorias();
  }

  editar(categoria: DepositoCategoria): void {
    this.router.navigate(['/page/deposito/categorias/editar', categoria.id]);
  }

  excluir(categoria: DepositoCategoria): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Inativar categoria',
        message: `Tem certeza que deseja inativar a categoria "${categoria.nome}"?`,
        confirmText: 'Inativar',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.depositoService.excluirCategoria(categoria.id).subscribe({
        next: () => {
          this.toastr.success('Categoria inativada com sucesso!');
          this.carregarCategorias();
        },
        error: () => {
          this.toastr.error('Erro ao inativar a categoria.');
        },
      });
    });
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/deposito/categorias/nova']);
  }

  selecionarCategoriaMenu(categoria: DepositoCategoria, event: Event): void {
    event.stopPropagation();
    this.categoriaSelecionadaMenu = categoria;
  }

  trackByCategoria(index: number, categoria: DepositoCategoria): number {
    return categoria.id ?? index;
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
