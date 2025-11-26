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
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { MaterialService } from '../../services/material.service';
import { Material } from 'src/app/models/material.model';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';

@Component({
  selector: 'app-listar-material',
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
  templateUrl: './listar-material.component.html',
  styleUrl: './listar-material.component.scss'
})
export class ListarMaterialComponent implements OnInit {
  materiais: Material[] = [];
  totalMateriais = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  filtroStatus: boolean | null = true;
  colunasExibidas = ['nome', 'descricao', 'status', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private materialService: MaterialService,
    private router: Router,
    private dialog: MatDialog,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarMateriais();
  }

  carregarMateriais(): void {
    this.carregando = true;
    this.materialService.listar(this.pagina, this.tamanhoPagina, this.filtroStatus).subscribe({
      next: (res) => {
        this.materiais = res.content || [];
        this.totalMateriais = res.totalElements;
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
    this.carregarMateriais();
  }

  editar(material: Material): void {
    this.router.navigate(['page/cadastro-tecnico/materiais/editar', material.id]);
  }

  excluir(material: Material): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir material',
        message: `Tem certeza que deseja excluir o material "${material.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.materialService.excluir(material.id!).subscribe({
          next: () => {
            this.toastrService.success('Material excluído com sucesso!');
            this.carregarMateriais();
          },
          error: () => {
            this.toastrService.error('Erro ao excluir o material.');
          }
        });
      }
    });
  }

  aplicarFiltro(status: boolean): void {
    this.filtroStatus = status;
    this.carregarMateriais();
  }

  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarMateriais();
  }
}
