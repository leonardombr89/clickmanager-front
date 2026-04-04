import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ProdutoService } from '../../services/produto.service';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { MobileFabActionComponent } from 'src/app/components/mobile-fab-action/mobile-fab-action.component';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-produtos',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatRippleModule,
    MatIconModule,
    MatMenuModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    TablerIconsModule,
    RouterModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    MobileFabActionComponent,
    MatTooltipModule,
    CardHeaderComponent
],
  templateUrl: './listar-produtos.component.html',
  styleUrl: './listar-produtos.component.scss'
})
export class ListarProdutosComponent implements OnInit {

  produtos: ProdutoListagem[] = [];
  produtosSelecionados: ProdutoListagem[] = [];
  totalProdutos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa: string = '';

  // ✅ agora só nome, descricao, variacoes, acoes
  colunasExibidas = ['nome', 'descricao', 'variacoes', 'acoes'];
  maxChips = 4; // mostra até 4 variações; o resto vira “+N”
  isMobileView = false;
  mobileFabCompact = false;
  produtoSelecionadoMenu: ProdutoListagem | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private produtoService: ProdutoService,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarProdutos();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.produtoService.listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa).subscribe({
      next: (res) => {
        this.produtos = res.content || [];
        this.totalProdutos = res.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarProdutos();
  }

  editar(produto: ProdutoListagem): void {
    this.router.navigate(['/page/cadastro-tecnico/produtos/editar', produto.id]);
  }

  excluir(produto: ProdutoListagem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Produto',
        message: `Tem certeza que deseja excluir o produto "${produto.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.produtoService.excluir(produto.id!).subscribe({
          next: () => {
            this.toastr.success('Produto excluído com sucesso!');
            this.carregarProdutos();
          },
          error: () => {
            this.toastr.error('Erro ao excluir o produto.');
          }
        });
      }
    });
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarProdutos();
  }

  // ========= Helpers de exibição das variações =========

  /**
   * Mostra até 5 variações; se houver mais, a 6ª é "..."
   */
  variacoesPreview(produto: ProdutoListagem): string[] {
    const arr = produto?.variacoes ?? [];
    return arr.length > 5 ? [...arr.slice(0, 5), '...'] : arr;
  }

  tooltipVariacoes(produto: ProdutoListagem): string | null {
    const arr = produto?.variacoes ?? [];
    return arr.length > 5 ? arr.join('\n') : null;
  }

  variacoesResumoMobile(produto: ProdutoListagem): string[] {
    return (produto?.variacoes ?? []).slice(0, 2);
  }

  variacoesRestantesMobile(produto: ProdutoListagem): number {
    return Math.max((produto?.variacoes?.length ?? 0) - 2, 0);
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/cadastro-tecnico/produtos/criar']);
  }

  selecionarProdutoMenu(produto: ProdutoListagem, event: Event): void {
    event.stopPropagation();
    this.produtoSelecionadoMenu = produto;
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
