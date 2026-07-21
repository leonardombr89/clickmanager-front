import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StorageImagePreviewComponent } from 'src/app/pages/storage/components/storage-image-preview/storage-image-preview.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CatalogoProduto } from '../shared/models/catalogo.models';
import { CatalogoProdutoService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage, catalogoLabel, catalogoPrecoLabel, CATALOGO_UNIDADES_VENDA } from '../shared/utils/catalogo-utils';
import { CatalogoStatusChipComponent } from '../shared/components/catalogo-status-chip.component';

@Component({
  selector: 'app-catalogo-produto-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent, StorageImagePreviewComponent, CatalogoStatusChipComponent],
  template: `
    <app-page-card titulo="Detalhe do produto" [subtitulo]="produto?.nome || 'Catalogo administrativo'">
      <div class="toolbar"><button mat-stroked-button (click)="voltar()">Voltar</button><button mat-flat-button color="primary" *ngIf="podeEditar && produto" (click)="editar()">Editar</button></div>
      <ng-container *ngIf="produto">
        <div class="grid">
          <app-section-card titulo="Identificacao">
            <dl>
              <dt>Codigo</dt><dd>{{ produto.codigo }}</dd>
              <dt>Nome</dt><dd>{{ produto.nome }}</dd>
              <dt>Slug</dt><dd>{{ produto.slug }}</dd>
              <dt>Categoria</dt><dd>{{ produto.categoria?.nome || '-' }}</dd>
              <dt>Marca</dt><dd>{{ produto.marca?.nome || '-' }}</dd>
              <dt>Unidade</dt><dd>{{ unidadeLabel(produto.unidadeVenda) }}</dd>
              <dt>Status</dt><dd><app-catalogo-status-chip [ativo]="produto.ativo"></app-catalogo-status-chip></dd>
              <dt>Destaque</dt><dd>{{ produto.destaque ? 'Sim' : 'Nao' }}</dd>
            </dl>
          </app-section-card>
          <app-section-card titulo="Comercial">
            <dl>
              <dt>Preco</dt><dd>{{ catalogoPrecoLabel(produto.comercial?.precoVenda) }}</dd>
              <dt>Promocional</dt><dd>{{ catalogoPrecoLabel(produto.comercial?.precoPromocional) }}</dd>
              <dt>Sob consulta</dt><dd>{{ produto.comercial?.sobConsulta ? 'Sim' : 'Nao' }}</dd>
              <dt>Exibir preco</dt><dd>{{ produto.comercial?.exibirPreco ? 'Sim' : 'Nao' }}</dd>
              <dt>Permite orcamento</dt><dd>{{ produto.comercial?.permiteOrcamento ? 'Sim' : 'Nao' }}</dd>
            </dl>
          </app-section-card>
        </div>
        <app-section-card titulo="Imagens" *ngIf="produto.imagens?.length">
          <div class="images"><app-storage-image-preview *ngFor="let imagem of produto.imagens" [media]="imagem.arquivo" [alt]="produto.nome" variant="CARD"></app-storage-image-preview></div>
        </app-section-card>
        <app-section-card titulo="Caracteristicas" *ngIf="produto.caracteristicas?.length">
          <div class="chars">
            <div *ngFor="let item of produto.caracteristicas">
              <strong>{{ item.nome }}</strong>
              <span>{{ item.valorFormatado || valorCaracteristica(item) }}</span>
            </div>
          </div>
        </app-section-card>
      </ng-container>
    </app-page-card>
  `,
  styles: [`.toolbar{display:flex; justify-content:flex-end; gap:12px; margin-bottom:12px}.grid{display:grid; grid-template-columns:1fr 1fr; gap:16px}dl{display:grid; grid-template-columns:140px 1fr; gap:8px 12px}dt{font-weight:600;color:#4b5563}dd{margin:0}.images{display:flex; flex-wrap:wrap; gap:12px}.chars{display:grid; gap:10px}.chars div{display:flex; justify-content:space-between; gap:16px; border-bottom:1px solid #e5eaef; padding-bottom:8px}@media(max-width:900px){.grid{grid-template-columns:1fr}dl{grid-template-columns:1fr}.chars div{display:block}}`],
})
export class CatalogoProdutoDetailComponent implements OnInit {
  produto?: CatalogoProduto;
  catalogoPrecoLabel = catalogoPrecoLabel;

  constructor(private readonly service: CatalogoProdutoService, private readonly route: ActivatedRoute, private readonly router: Router, private readonly toastr: ToastrService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.detalhar(id).subscribe({
      next: (produto) => (this.produto = produto),
      error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Produto nao encontrado.')),
    });
  }

  get podeEditar(): boolean { return this.auth.temPermissao('CATALOGO_PRODUTOS_EDITAR'); }
  unidadeLabel(value: any): string { return catalogoLabel(CATALOGO_UNIDADES_VENDA, value); }
  valorCaracteristica(item: any): string {
    if (item.valorTexto) return item.valorTexto;
    if (item.valorInteiro !== null && item.valorInteiro !== undefined) return String(item.valorInteiro);
    if (item.valorDecimal !== null && item.valorDecimal !== undefined) return String(item.valorDecimal);
    if (item.valorBooleano !== null && item.valorBooleano !== undefined) return item.valorBooleano ? 'Sim' : 'Nao';
    if (item.valorData) return item.valorData;
    if (item.opcoes?.length) return item.opcoes.map((opcao: any) => opcao.nome).join(', ');
    return '-';
  }
  voltar(): void { this.router.navigate(['/page/catalogo/produtos']); }
  editar(): void { if (this.produto) this.router.navigate(['/page/catalogo/produtos', this.produto.id, 'editar']); }
}
