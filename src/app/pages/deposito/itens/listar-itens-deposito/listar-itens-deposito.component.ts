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
import { DepositoImagem, DepositoItem } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { getDepositoImageUrl } from '../../utils/deposito-image.util';
import {
  formatarPreco,
  formatarUnidadeVenda,
  getPrecoExibicao,
} from '../../utils/deposito-item-commercial.util';

@Component({
  selector: 'app-listar-itens-deposito',
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
  templateUrl: './listar-itens-deposito.component.html',
  styleUrl: './listar-itens-deposito.component.scss',
})
export class ListarItensDepositoComponent implements OnInit {
  itens: DepositoItem[] = [];
  totalItens = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  itemSelecionadoMenu: DepositoItem | null = null;
  readonly colunasExibidas = ['codigo', 'nome', 'categoria', 'marca', 'preco', 'unidade', 'site', 'consulta', 'destaque', 'estoque', 'ativo', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly depositoService: DepositoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarItens();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarItens(): void {
    this.carregando = true;
    this.depositoService
      .listarItens({
        page: this.pagina,
        size: this.tamanhoPagina,
        sort: 'nome,asc',
        textoPesquisa: this.termoPesquisa,
      })
      .subscribe({
        next: (response) => {
          this.itens = response.content || [];
          this.totalItens = response.totalElements || 0;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Não foi possível carregar os itens do depósito.');
        },
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarItens();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor || '';
    this.pagina = 0;
    this.carregarItens();
  }

  editar(item: DepositoItem): void {
    this.router.navigate(['/page/deposito/itens/editar', item.id]);
  }

  excluir(item: DepositoItem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Inativar item',
        message: `Tem certeza que deseja inativar o item "${item.nome}"?`,
        confirmText: 'Inativar',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.depositoService.excluirItem(item.id).subscribe({
        next: () => {
          this.toastr.success('Item inativado com sucesso!');
          this.carregarItens();
        },
        error: () => {
          this.toastr.error('Erro ao inativar o item.');
        },
      });
    });
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/deposito/itens/novo']);
  }

  selecionarItemMenu(item: DepositoItem, event: Event): void {
    event.stopPropagation();
    this.itemSelecionadoMenu = item;
  }

  trackByItem(index: number, item: DepositoItem): number {
    return item.id ?? index;
  }

  statusAtivoLabel(ativo: boolean): string {
    return ativo ? 'Ativo' : 'Inativo';
  }

  estoqueLabel(controlaEstoque: boolean): string {
    return controlaEstoque ? 'Controla estoque' : 'Sem controle';
  }

  getImagemSrc(imagem?: DepositoImagem | null): string {
    return getDepositoImageUrl(imagem);
  }

  formatarPreco(valor?: number | null): string {
    return formatarPreco(valor);
  }

  formatarUnidadeVenda(valor?: DepositoItem['unidadeVenda']): string {
    return formatarUnidadeVenda(valor);
  }

  getPrecoExibicao(item: DepositoItem): string {
    return getPrecoExibicao(item);
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
