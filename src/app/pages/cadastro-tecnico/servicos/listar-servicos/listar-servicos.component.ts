import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { TablerIconsModule } from 'angular-tabler-icons';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { ServicoService } from '../../services/servico.service';
import { ServicoListagem } from 'src/app/models/servico/servico-listagem.model';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-listar-servicos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    TablerIconsModule,
    RouterModule,
    TemPermissaoDirective,
    InputPesquisaComponent
  ],
  templateUrl: './listar-servicos.component.html'
})
export class ListarServicoComponent implements OnInit {

  servicos: ServicoListagem[] = [];
  totalServicos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  filtroStatus: boolean | null = true;
  termoPesquisa: string = '';
  colunasExibidas = ['nome', 'status', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private servicoService: ServicoService,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos(): void {
    this.carregando = true;

    this.servicoService.listar(
      this.pagina,
      this.tamanhoPagina,
      this.filtroStatus !== null ? this.filtroStatus : undefined,
      this.termoPesquisa
    ).subscribe({
      next: (res) => {
        this.servicos = res.content || [];
        this.totalServicos = res.totalElements;
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
    this.carregarServicos();
  }

  editar(servico: ServicoListagem): void {
    this.router.navigate(['/page/cadastro-tecnico/servico/editar', servico.id]);
  }

  excluir(servico: ServicoListagem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Serviço',
        message: `Tem certeza que deseja excluir o serviço "${servico.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;

      this.servicoService.excluir(servico.id!).subscribe({
        next: () => {
          this.toastr.success('Serviço excluído com sucesso!');
          this.carregarServicos();
        },
        error: () => {
          this.toastr.error('Erro ao excluir o serviço.');
        }
      });
    });
  }

  aplicarFiltro(status: boolean): void {
    this.filtroStatus = status;
    this.carregarServicos();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarServicos();
  }

  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarServicos();
  }
}
