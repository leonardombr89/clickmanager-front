import { Component, OnInit, ViewChild } from '@angular/core';
import { Acabamento } from 'src/app/models/acabamento/acabamento.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { TablerIconsModule } from 'angular-tabler-icons';
import { AcabamentoService } from '../../services/acabamento.service';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';

@Component({
  selector: 'app-listar-acabamento',
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
    TemPermissaoDirective
  ],
  templateUrl: './listar-acabamento.component.html',
  styleUrl: './listar-acabamento.component.scss'
})
export class ListarAcabamentoComponent implements OnInit {
  acabamentos: Acabamento[] = [];
  totalAcabamentos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  filtroStatus: boolean | null = true;
  colunasExibidas = ['nome', 'descricao', 'status', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private acabamentoService: AcabamentoService,
    private router: Router,
    private dialog: MatDialog,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarAcabamentos();
  }

  carregarAcabamentos(): void {
    this.carregando = true;
    this.acabamentoService.listar(this.pagina, this.tamanhoPagina, this.filtroStatus).subscribe({
      next: (res) => {
        this.acabamentos = res.content || [];
        this.totalAcabamentos = res.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.toastrService.error('Erro ao carregar acabamentos.');
      }
    });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarAcabamentos();
  }

  editar(acabamento: Acabamento): void {
    this.router.navigate(['page/cadastro-tecnico/acabamentos/editar', acabamento.id]);
  }

  excluir(acabamento: Acabamento): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir acabamento',
        message: `Tem certeza que deseja excluir o acabamento "${acabamento.descricao}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.acabamentoService.excluir(acabamento.id!).subscribe({
          next: () => {
            this.toastrService.success('Acabamento excluído com sucesso!');
            this.carregarAcabamentos();
          },
          error: () => {
            this.toastrService.error('Erro ao excluir o acabamento.');
          }
        });
      }
    });
  }

  aplicarFiltro(status: boolean): void {
    this.filtroStatus = status;
    this.carregarAcabamentos();
  }

  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarAcabamentos();
  }
}
