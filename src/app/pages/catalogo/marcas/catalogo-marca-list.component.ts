import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { StorageImagePreviewComponent } from 'src/app/pages/storage/components/storage-image-preview/storage-image-preview.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CatalogoMarca } from '../shared/models/catalogo.models';
import { CatalogoMarcaService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage } from '../shared/utils/catalogo-utils';
import { CatalogoStatusChipComponent } from '../shared/components/catalogo-status-chip.component';

@Component({
  selector: 'app-catalogo-marca-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, CardHeaderComponent, CatalogoStatusChipComponent, StorageImagePreviewComponent],
  template: `
    <mat-card class="cardWithShadow"><mat-card-content>
      <app-card-header titulo="Marcas do Catalogo" subtitulo="Fabricantes e linhas do novo catalogo administrativo">
        <button mat-flat-button color="primary" *ngIf="podeCriar" (click)="nova()"><mat-icon>add</mat-icon>Nova marca</button>
      </app-card-header>
      <form class="filters" [formGroup]="filters">
        <mat-form-field appearance="outline"><mat-label>Pesquisar</mat-label><input matInput formControlName="texto" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="ativo"><mat-option [value]="null">Todos</mat-option><mat-option [value]="true">Ativos</mat-option><mat-option [value]="false">Inativos</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Destaque</mat-label><mat-select formControlName="destaque"><mat-option [value]="null">Todos</mat-option><mat-option [value]="true">Sim</mat-option><mat-option [value]="false">Nao</mat-option></mat-select></mat-form-field>
      </form>
      <div class="table-wrap">
        <div class="loading" *ngIf="carregando"><mat-spinner diameter="36"></mat-spinner></div>
        <table mat-table [dataSource]="marcas" *ngIf="marcas.length">
          <ng-container matColumnDef="imagem"><th mat-header-cell *matHeaderCellDef>Imagem</th><td mat-cell *matCellDef="let item"><app-storage-image-preview [media]="item.imagem" [alt]="item.nome"></app-storage-image-preview></td></ng-container>
          <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let item">{{ item.codigo }}</td></ng-container>
          <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
          <ng-container matColumnDef="ordem"><th mat-header-cell *matHeaderCellDef>Ordem</th><td mat-cell *matCellDef="let item">{{ item.ordemExibicao ?? '-' }}</td></ng-container>
          <ng-container matColumnDef="destaque"><th mat-header-cell *matHeaderCellDef>Destaque</th><td mat-cell *matCellDef="let item">{{ item.destaque ? 'Sim' : 'Nao' }}</td></ng-container>
          <ng-container matColumnDef="ativo"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><app-catalogo-status-chip [ativo]="item.ativo"></app-catalogo-status-chip></td></ng-container>
          <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Acoes</th><td mat-cell *matCellDef="let item"><button mat-icon-button *ngIf="podeEditar" (click)="editar(item)"><mat-icon>edit</mat-icon></button><button mat-icon-button *ngIf="podeExcluir && item.ativo" (click)="inativar(item)"><mat-icon>block</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr><tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <div class="empty" *ngIf="!carregando && !marcas.length">Nenhuma marca encontrada.</div>
      </div>
      <mat-paginator [length]="total" [pageIndex]="pagina" [pageSize]="tamanho" [pageSizeOptions]="[10,20,50]" (page)="paginar($event)"></mat-paginator>
    </mat-card-content></mat-card>
  `,
  styles: [`.filters{display:grid; grid-template-columns:1fr 180px 180px; gap:12px; margin:16px 0}.table-wrap{position:relative; min-height:160px; overflow:auto}.loading{position:absolute; inset:0; display:grid; place-items:center; background:rgba(255,255,255,.65); z-index:1}.empty{text-align:center; color:#6b7280; padding:24px}table{width:100%}@media(max-width:768px){.filters{grid-template-columns:1fr}}`],
})
export class CatalogoMarcaListComponent implements OnInit {
  marcas: CatalogoMarca[] = [];
  total = 0;
  pagina = 0;
  tamanho = 10;
  carregando = false;
  colunas = ['imagem', 'codigo', 'nome', 'ordem', 'destaque', 'ativo', 'acoes'];
  filters = this.fb.group({ texto: [''], ativo: [null as boolean | null], destaque: [null as boolean | null] });

  constructor(private readonly fb: FormBuilder, private readonly service: CatalogoMarcaService, private readonly router: Router, private readonly dialog: MatDialog, private readonly toastr: ToastrService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.filters.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => { this.pagina = 0; this.carregar(); });
    this.carregar();
  }

  get podeCriar(): boolean { return this.auth.temPermissao('CATALOGO_MARCAS_CADASTRAR'); }
  get podeEditar(): boolean { return this.auth.temPermissao('CATALOGO_MARCAS_EDITAR'); }
  get podeExcluir(): boolean { return this.auth.temPermissao('CATALOGO_MARCAS_EXCLUIR'); }

  carregar(): void {
    this.carregando = true;
    const value = this.filters.value;
    this.service.listar({
      page: this.pagina,
      size: this.tamanho,
      sort: 'ordemExibicao,asc',
      texto: value.texto || '',
      ativo: value.ativo,
      destaque: value.destaque,
    }).subscribe({
      next: (page) => { this.marcas = page.content || []; this.total = page.totalElements || 0; this.carregando = false; },
      error: (error) => { this.carregando = false; this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel carregar marcas.')); },
    });
  }

  paginar(event: PageEvent): void { this.pagina = event.pageIndex; this.tamanho = event.pageSize; this.carregar(); }
  nova(): void { this.router.navigate(['/page/catalogo/marcas/nova']); }
  editar(item: CatalogoMarca): void { this.router.navigate(['/page/catalogo/marcas', item.id, 'editar']); }
  inativar(item: CatalogoMarca): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { title: 'Inativar marca', message: `Deseja inativar "${item.nome}"?`, confirmText: 'Inativar', confirmColor: 'warn' } });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.service.inativar(item.id).subscribe({ next: () => { this.toastr.success('Marca inativada.'); this.carregar(); }, error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Erro ao inativar marca.')) });
    });
  }
}
