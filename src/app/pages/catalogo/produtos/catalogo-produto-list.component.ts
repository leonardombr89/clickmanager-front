import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CatalogoCategoriaOption, CatalogoMarcaOption, CatalogoProdutoListItem } from '../shared/models/catalogo.models';
import { CatalogoCategoriaService, CatalogoMarcaService, CatalogoProdutoService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage, catalogoLabel, catalogoPrecoLabel, CATALOGO_UNIDADES_VENDA } from '../shared/utils/catalogo-utils';
import { CatalogoStatusChipComponent } from '../shared/components/catalogo-status-chip.component';

@Component({
  selector: 'app-catalogo-produto-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, CardHeaderComponent, CatalogoStatusChipComponent],
  template: `
    <mat-card class="cardWithShadow"><mat-card-content>
      <app-card-header titulo="Produtos do Catalogo" subtitulo="Produtos do novo catalogo administrativo">
        <button mat-flat-button color="primary" *ngIf="podeCriar" (click)="novo()"><mat-icon>add</mat-icon>Novo produto</button>
      </app-card-header>
      <form class="filters" [formGroup]="filters">
        <mat-form-field appearance="outline"><mat-label>Pesquisar</mat-label><input matInput formControlName="texto" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoria</mat-label><mat-select formControlName="categoriaId"><mat-option [value]="null">Todas</mat-option><mat-option *ngFor="let item of categorias" [value]="item.id">{{ item.nome }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Marca</mat-label><mat-select formControlName="marcaId"><mat-option [value]="null">Todas</mat-option><mat-option *ngFor="let item of marcas" [value]="item.id">{{ item.nome }}</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select formControlName="ativo"><mat-option [value]="null">Todos</mat-option><mat-option [value]="true">Ativos</mat-option><mat-option [value]="false">Inativos</mat-option></mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Destaque</mat-label><mat-select formControlName="destaque"><mat-option [value]="null">Todos</mat-option><mat-option [value]="true">Sim</mat-option><mat-option [value]="false">Nao</mat-option></mat-select></mat-form-field>
      </form>
      <div class="table-wrap">
        <div class="loading" *ngIf="carregando"><mat-spinner diameter="36"></mat-spinner></div>
        <table mat-table [dataSource]="produtos" *ngIf="produtos.length">
          <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let item">{{ item.codigo }}</td></ng-container>
          <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
          <ng-container matColumnDef="categoria"><th mat-header-cell *matHeaderCellDef>Categoria</th><td mat-cell *matCellDef="let item">{{ item.categoriaNome || '-' }}</td></ng-container>
          <ng-container matColumnDef="marca"><th mat-header-cell *matHeaderCellDef>Marca</th><td mat-cell *matCellDef="let item">{{ item.marcaNome || '-' }}</td></ng-container>
          <ng-container matColumnDef="unidade"><th mat-header-cell *matHeaderCellDef>Unidade</th><td mat-cell *matCellDef="let item">{{ unidadeLabel(item.unidadeVenda) }}</td></ng-container>
          <ng-container matColumnDef="preco"><th mat-header-cell *matHeaderCellDef>Preco</th><td mat-cell *matCellDef="let item">{{ precoLabel(item) }}</td></ng-container>
          <ng-container matColumnDef="destaque"><th mat-header-cell *matHeaderCellDef>Destaque</th><td mat-cell *matCellDef="let item">{{ item.destaque ? 'Sim' : 'Nao' }}</td></ng-container>
          <ng-container matColumnDef="ativo"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><app-catalogo-status-chip [ativo]="item.ativo"></app-catalogo-status-chip></td></ng-container>
          <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Acoes</th><td mat-cell *matCellDef="let item"><button mat-icon-button (click)="detalhar(item)"><mat-icon>visibility</mat-icon></button><button mat-icon-button *ngIf="podeEditar" (click)="editar(item)"><mat-icon>edit</mat-icon></button><button mat-icon-button *ngIf="podeExcluir && item.ativo" (click)="inativar(item)"><mat-icon>block</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr><tr mat-row *matRowDef="let row; columns: colunas"></tr>
        </table>
        <div class="empty" *ngIf="!carregando && !produtos.length">Nenhum produto encontrado.</div>
      </div>
      <mat-paginator [length]="total" [pageIndex]="pagina" [pageSize]="tamanho" [pageSizeOptions]="[10,20,50]" (page)="paginar($event)"></mat-paginator>
    </mat-card-content></mat-card>
  `,
  styles: [`.filters{display:grid; grid-template-columns:1fr repeat(4, 170px); gap:12px; margin:16px 0}.table-wrap{position:relative; min-height:180px; overflow:auto}.loading{position:absolute; inset:0; display:grid; place-items:center; background:rgba(255,255,255,.65); z-index:1}.empty{text-align:center; color:#6b7280; padding:24px}table{width:100%}@media(max-width:1100px){.filters{grid-template-columns:1fr 1fr}}@media(max-width:700px){.filters{grid-template-columns:1fr}}`],
})
export class CatalogoProdutoListComponent implements OnInit {
  produtos: CatalogoProdutoListItem[] = [];
  categorias: CatalogoCategoriaOption[] = [];
  marcas: CatalogoMarcaOption[] = [];
  total = 0;
  pagina = 0;
  tamanho = 10;
  carregando = false;
  colunas = ['codigo', 'nome', 'categoria', 'marca', 'unidade', 'preco', 'destaque', 'ativo', 'acoes'];
  filters = this.fb.group({ texto: [''], categoriaId: [null as number | null], marcaId: [null as number | null], ativo: [null as boolean | null], destaque: [null as boolean | null] });

  constructor(private readonly fb: FormBuilder, private readonly produtoService: CatalogoProdutoService, private readonly categoriaService: CatalogoCategoriaService, private readonly marcaService: CatalogoMarcaService, private readonly router: Router, private readonly dialog: MatDialog, private readonly toastr: ToastrService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    forkJoin({ categorias: this.categoriaService.options(true), marcas: this.marcaService.options(true) }).subscribe({ next: ({ categorias, marcas }) => { this.categorias = categorias || []; this.marcas = marcas || []; } });
    this.filters.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => { this.pagina = 0; this.carregar(); });
    this.carregar();
  }

  get podeCriar(): boolean { return this.auth.temPermissao('CATALOGO_PRODUTOS_CADASTRAR'); }
  get podeEditar(): boolean { return this.auth.temPermissao('CATALOGO_PRODUTOS_EDITAR'); }
  get podeExcluir(): boolean { return this.auth.temPermissao('CATALOGO_PRODUTOS_EXCLUIR'); }

  carregar(): void {
    this.carregando = true;
    const value = this.filters.value;
    this.produtoService.listar({
      page: this.pagina,
      size: this.tamanho,
      sort: 'ordemExibicao,asc',
      texto: value.texto || '',
      categoriaId: value.categoriaId,
      marcaId: value.marcaId,
      ativo: value.ativo,
      destaque: value.destaque,
    }).subscribe({
      next: (page) => { this.produtos = page.content || []; this.total = page.totalElements || 0; this.carregando = false; },
      error: (error) => { this.carregando = false; this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel carregar produtos.')); },
    });
  }

  unidadeLabel(value: any): string { return catalogoLabel(CATALOGO_UNIDADES_VENDA, value); }
  precoLabel(item: CatalogoProdutoListItem): string { return item.sobConsulta ? 'Sob consulta' : catalogoPrecoLabel(item.precoPromocional ?? item.precoVenda); }
  paginar(event: PageEvent): void { this.pagina = event.pageIndex; this.tamanho = event.pageSize; this.carregar(); }
  novo(): void { this.router.navigate(['/page/catalogo/produtos/novo']); }
  detalhar(item: CatalogoProdutoListItem): void { this.router.navigate(['/page/catalogo/produtos', item.id]); }
  editar(item: CatalogoProdutoListItem): void { this.router.navigate(['/page/catalogo/produtos', item.id, 'editar']); }
  inativar(item: CatalogoProdutoListItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { title: 'Inativar produto', message: `Deseja inativar "${item.nome}"?`, confirmText: 'Inativar', confirmColor: 'warn' } });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.produtoService.inativar(item.id).subscribe({ next: () => { this.toastr.success('Produto inativado.'); this.carregar(); }, error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Erro ao inativar produto.')) });
    });
  }
}
