import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';

import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { MobileFabActionComponent } from 'src/app/components/mobile-fab-action/mobile-fab-action.component';

import { AcabamentoService } from '../acabamento.service';
import { AcabamentoListResponse } from 'src/app/models/acabamento/acabamento-listagem.response.model';

@Component({
  selector: 'app-listar-acabamento',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatRippleModule,
    MatTooltipModule,
    TablerIconsModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    CardHeaderComponent,
    MobileFabActionComponent
  ],
  templateUrl: './listar-acabamento.component.html',
  styleUrl: './listar-acabamento.component.scss'
})
export class ListarAcabamentoComponent implements OnInit {
  acabamentos: AcabamentoListResponse[] = [];
  totalAcabamentos = 0;
  carregando = false;

  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  isMobileView = false;
  mobileFabCompact = false;
  acabamentoSelecionadoMenu: AcabamentoListResponse | null = null;

  colunasExibidas = ['nome', 'descricao', 'variacoes', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly acabamentoService: AcabamentoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.atualizarViewport();
    this.carregarAcabamentos();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact = (window.scrollY || document.documentElement.scrollTop || 0) > 96;
  }

  carregarAcabamentos(): void {
    this.carregando = true;

    this.acabamentoService
      .listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa)
      .subscribe({
        next: (res) => {
          this.acabamentos = res.content || [];
          this.totalAcabamentos = res.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Erro ao carregar acabamentos.');
        }
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarAcabamentos();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarAcabamentos();
  }

  editar(acabamento: AcabamentoListResponse): void {
    this.router.navigate(['page/cadastro-tecnico/acabamentos/editar', acabamento.id]);
  }

  excluir(acabamento: AcabamentoListResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir acabamento',
        message: `Tem certeza que deseja excluir o acabamento "${acabamento.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.acabamentoService.excluir(acabamento.id!).subscribe({
        next: () => {
          this.toastr.success('Acabamento excluído com sucesso!');
          this.carregarAcabamentos();
        },
        error: () => {
          this.toastr.error('Erro ao excluir o acabamento.');
        }
      });
    });
  }

  navegarCriacao(): void {
    this.router.navigate(['/page/cadastro-tecnico/acabamentos/criar']);
  }

  selecionarAcabamentoMenu(acabamento: AcabamentoListResponse, event: Event): void {
    event.stopPropagation();
    this.acabamentoSelecionadoMenu = acabamento;
  }

  variacoesPreview(acabamento: AcabamentoListResponse): string[] {
    const arr = acabamento?.variacoes ?? [];
    return arr.length > 5 ? [...arr.slice(0, 5), '...'] : arr;
  }

  tooltipVariacoes(acabamento: AcabamentoListResponse): string | null {
    const arr = acabamento?.variacoes ?? [];
    return arr.length > 5 ? arr.join('\n') : null;
  }

  variacoesResumoMobile(acabamento: AcabamentoListResponse): string[] {
    return (acabamento?.variacoes ?? []).slice(0, 2);
  }

  variacoesRestantesMobile(acabamento: AcabamentoListResponse): number {
    return Math.max((acabamento?.variacoes?.length ?? 0) - 2, 0);
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
    this.tamanhoPagina = this.isMobileView ? 20 : 10;
  }
}
