import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { FiscalConfiguracaoProduto } from '../shared/fiscal.models';
import { FiscalProdutoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-produtos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Produtos fiscais" subtitulo="Complete NCM, CEST, origem, unidades e GTIN sem sugerir códigos automaticamente.">
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <app-section-card titulo="Filtros"><div class="filters"><mat-form-field appearance="outline"><mat-label>Texto</mat-label><input matInput [formControl]="filtros.controls.texto" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Status fiscal</mat-label><mat-select [formControl]="filtros.controls.status"><mat-option value="">Todos</mat-option><mat-option value="COMPLETO">Completo</mat-option><mat-option value="INCOMPLETO">Incompleto</mat-option><mat-option value="COM_PENDENCIAS">Com pendências</mat-option></mat-select></mat-form-field><button mat-flat-button color="primary" (click)="carregar()"><mat-icon>search</mat-icon>Filtrar</button></div></app-section-card>
      <div class="layout">
        <app-section-card titulo="Listagem">
          <div class="loading" *ngIf="carregando"><mat-spinner diameter="32"></mat-spinner><span>Carregando produtos...</span></div>
          <div class="empty" *ngIf="!carregando && !produtos.length">Nenhum produto fiscal encontrado.</div>
          <table mat-table [dataSource]="produtos" *ngIf="!carregando && produtos.length">
            <ng-container matColumnDef="produto"><th mat-header-cell *matHeaderCellDef>Produto</th><td mat-cell *matCellDef="let item">{{ item.codigo }} - {{ item.produtoNome }}</td></ng-container>
            <ng-container matColumnDef="ncm"><th mat-header-cell *matHeaderCellDef>NCM</th><td mat-cell *matCellDef="let item">{{ item.ncm || '-' }}</td></ng-container>
            <ng-container matColumnDef="cest"><th mat-header-cell *matHeaderCellDef>CEST</th><td mat-cell *matCellDef="let item">{{ item.cest || '-' }}</td></ng-container>
            <ng-container matColumnDef="origem"><th mat-header-cell *matHeaderCellDef>Origem</th><td mat-cell *matCellDef="let item">{{ item.origem || '-' }}</td></ng-container>
            <ng-container matColumnDef="unidade"><th mat-header-cell *matHeaderCellDef>Unidade</th><td mat-cell *matCellDef="let item">{{ item.unidadeComercial || '-' }}</td></ng-container>
            <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item">{{ item.statusFiscal }}</td></ng-container>
            <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item"><button mat-icon-button (click)="editar(item)" [disabled]="!podeEditar"><mat-icon>edit</mat-icon></button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </app-section-card>
        <app-section-card titulo="Edição fiscal" subtitulo="Preencha com códigos fiscais conferidos.">
          <form [formGroup]="form" (ngSubmit)="salvar()" *ngIf="selecionado; else vazio">
            <div class="edit-grid">
              <mat-form-field appearance="outline"><mat-label>NCM</mat-label><input matInput formControlName="ncm" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>CEST</mat-label><input matInput formControlName="cest" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Origem da mercadoria</mat-label><input matInput formControlName="origem" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>GTIN</mat-label><input matInput formControlName="gtin" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>GTIN tributável</mat-label><input matInput formControlName="gtinTributavel" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Unidade comercial</mat-label><input matInput formControlName="unidadeComercial" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Unidade tributável</mat-label><input matInput formControlName="unidadeTributavel" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Fator de conversão</mat-label><input matInput type="number" formControlName="fatorConversao" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Código benefício fiscal</mat-label><input matInput formControlName="codigoBeneficioFiscal" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>EX TIPI</mat-label><input matInput formControlName="exTipi" /></mat-form-field>
            </div>
            <div class="fiscal-alert" *ngIf="selecionado.pendencias?.length"><mat-icon>warning</mat-icon>{{ selecionado.pendencias?.join(' ') }}</div>
            <div class="actions"><button mat-flat-button color="primary" [disabled]="!podeEditar || salvando"><mat-icon>save</mat-icon>{{ salvando ? 'Salvando...' : 'Salvar' }}</button></div>
          </form>
          <ng-template #vazio><p class="empty">Selecione um produto para editar os dados fiscais.</p></ng-template>
        </app-section-card>
      </div>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss', './fiscal-produtos.component.scss'],
})
export class FiscalProdutosComponent implements OnInit {
  produtos: FiscalConfiguracaoProduto[] = []; selecionado: FiscalConfiguracaoProduto | null = null; carregando = false; salvando = false; erro = '';
  columns = ['produto', 'ncm', 'cest', 'origem', 'unidade', 'status', 'acoes'];
  filtros = this.fb.group({ texto: [''], status: [''] });
  form = this.fb.group({ ncm: [''], cest: [''], origem: [''], gtin: [''], gtinTributavel: [''], unidadeComercial: [''], unidadeTributavel: [''], fatorConversao: [null as number | null], codigoBeneficioFiscal: [''], exTipi: [''] });
  constructor(private readonly fb: FormBuilder, private readonly service: FiscalProdutoService, private readonly auth: AuthService) {}
  ngOnInit(): void { this.carregar(); }
  get podeEditar(): boolean { return this.auth.temPermissao('FISCAL_PRODUTOS_EDITAR'); }
  carregar(): void { this.carregando = true; this.service.listar({ texto: this.filtros.value.texto || '', status: this.filtros.value.status || '' }).pipe(finalize(() => (this.carregando = false))).subscribe({ next: (page) => (this.produtos = page.content || []), error: () => (this.erro = 'Não foi possível carregar produtos fiscais.') }); }
  editar(item: FiscalConfiguracaoProduto): void { this.selecionado = item; this.form.patchValue(item); }
  salvar(): void { if (!this.selecionado || !this.podeEditar) return; this.salvando = true; const body = { ...this.selecionado, ...this.form.value } as FiscalConfiguracaoProduto; this.service.salvar(this.selecionado.id, body).pipe(finalize(() => (this.salvando = false))).subscribe({ next: (res) => { this.selecionado = res; this.carregar(); }, error: () => (this.erro = 'Não foi possível salvar o produto fiscal.') }); }
}
