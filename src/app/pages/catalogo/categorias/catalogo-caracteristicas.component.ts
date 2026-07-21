import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CatalogoCaracteristica, CatalogoCaracteristicaRequest, CatalogoTipoCaracteristica } from '../shared/models/catalogo.models';
import { CatalogoCaracteristicaService, CatalogoCategoriaService } from '../shared/services/catalogo.service';
import {
  catalogoErrorMessage,
  catalogoLabel,
  CATALOGO_TIPOS_CARACTERISTICA,
  CATALOGO_UNIDADES_CARACTERISTICA,
} from '../shared/utils/catalogo-utils';
import { CatalogoStatusChipComponent } from '../shared/components/catalogo-status-chip.component';

@Component({
  selector: 'app-catalogo-caracteristicas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent, CatalogoStatusChipComponent],
  template: `
    <app-page-card titulo="Caracteristicas da categoria" [subtitulo]="categoriaNome || 'Configuracao tecnica do catalogo'">
      <div class="layout">
        <div>
          <app-section-card titulo="Caracteristicas herdadas" subtitulo="Definicoes vindas das categorias superiores">
            <table mat-table [dataSource]="herdadas" *ngIf="herdadas.length">
              <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
              <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let item">{{ tipoLabel(item.tipo) }}</td></ng-container>
              <ng-container matColumnDef="origem"><th mat-header-cell *matHeaderCellDef>Origem</th><td mat-cell *matCellDef="let item">{{ item.categoriaOrigemNome || '-' }}</td></ng-container>
              <ng-container matColumnDef="ativo"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><app-catalogo-status-chip [ativo]="item.ativo"></app-catalogo-status-chip></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasHerdadas"></tr><tr mat-row *matRowDef="let row; columns: colunasHerdadas"></tr>
            </table>
            <p class="empty" *ngIf="!herdadas.length">Nenhuma caracteristica herdada.</p>
          </app-section-card>

          <app-section-card titulo="Caracteristicas desta categoria" subtitulo="Definicoes editaveis na categoria atual">
            <table mat-table [dataSource]="proprias" *ngIf="proprias.length">
              <ng-container matColumnDef="ordem"><th mat-header-cell *matHeaderCellDef>Ordem</th><td mat-cell *matCellDef="let item">{{ item.ordemExibicao ?? '-' }}</td></ng-container>
              <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Codigo</th><td mat-cell *matCellDef="let item">{{ item.codigo }}</td></ng-container>
              <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
              <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let item">{{ tipoLabel(item.tipo) }}</td></ng-container>
              <ng-container matColumnDef="flags"><th mat-header-cell *matHeaderCellDef>Uso</th><td mat-cell *matCellDef="let item">{{ flags(item) }}</td></ng-container>
              <ng-container matColumnDef="ativo"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><app-catalogo-status-chip [ativo]="item.ativo"></app-catalogo-status-chip></td></ng-container>
              <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Acoes</th><td mat-cell *matCellDef="let item"><button mat-icon-button *ngIf="podeEditar" (click)="editar(item)"><mat-icon>edit</mat-icon></button><button mat-icon-button *ngIf="podeExcluir && item.ativo" (click)="inativar(item)"><mat-icon>block</mat-icon></button></td></ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasProprias"></tr><tr mat-row *matRowDef="let row; columns: colunasProprias"></tr>
            </table>
            <p class="empty" *ngIf="!proprias.length">Nenhuma caracteristica propria.</p>
          </app-section-card>
        </div>

        <app-section-card [titulo]="editandoId ? 'Editar caracteristica' : 'Nova caracteristica'" subtitulo="Definicao, validacoes e opcoes">
          <form [formGroup]="form" (ngSubmit)="salvar()">
            <div class="form-grid">
              <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo" maxlength="50" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" maxlength="120" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Tipo</mat-label><mat-select formControlName="tipo" (selectionChange)="onTipoChange()"><mat-option *ngFor="let item of tipos" [value]="item.value">{{ item.label }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Unidade</mat-label><mat-select formControlName="unidade"><mat-option *ngFor="let item of unidades" [value]="item.value">{{ item.label }}</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Ordem</mat-label><input matInput type="number" min="0" formControlName="ordemExibicao" /></mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="w-100"><mat-label>Descricao</mat-label><textarea matInput rows="2" formControlName="descricao"></textarea></mat-form-field>
            <div class="toggles">
              <mat-checkbox formControlName="obrigatoria">Obrigatoria</mat-checkbox>
              <mat-checkbox formControlName="filtravel">Filtravel</mat-checkbox>
              <mat-checkbox formControlName="exibirNaListagem">Listagem</mat-checkbox>
              <mat-checkbox formControlName="exibirNoSite">Site</mat-checkbox>
              <mat-checkbox formControlName="ativo">Ativa</mat-checkbox>
            </div>
            <div class="form-grid" *ngIf="isNumerico">
              <mat-form-field appearance="outline"><mat-label>Valor minimo</mat-label><input matInput type="number" formControlName="valorMinimo" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Valor maximo</mat-label><input matInput type="number" formControlName="valorMaximo" /></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="form.value.tipo === 'DECIMAL'"><mat-label>Casas decimais</mat-label><input matInput type="number" min="0" formControlName="casasDecimais" /></mat-form-field>
            </div>

            <div class="opcoes" *ngIf="isSelecao" formArrayName="opcoes">
              <div class="opcoes__header"><strong>Opcoes</strong><button mat-stroked-button type="button" (click)="addOpcao()"><mat-icon>add</mat-icon>Adicionar</button></div>
              <div class="opcao" *ngFor="let opcao of opcoes.controls; let i = index" [formGroupName]="i">
                <input type="hidden" formControlName="id" />
                <mat-form-field appearance="outline"><mat-label>Codigo</mat-label><input matInput formControlName="codigo" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" /></mat-form-field>
                <mat-form-field appearance="outline"><mat-label>Ordem</mat-label><input matInput type="number" formControlName="ordemExibicao" /></mat-form-field>
                <mat-checkbox formControlName="ativo">Ativa</mat-checkbox>
                <button mat-icon-button type="button" (click)="removeOpcao(i)"><mat-icon>delete</mat-icon></button>
              </div>
            </div>

            <div class="actions"><button mat-stroked-button type="button" (click)="novo()">Limpar</button><button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando || !podeSalvar">{{ salvando ? 'Salvando...' : 'Salvar' }}</button></div>
          </form>
        </app-section-card>
      </div>
    </app-page-card>
  `,
  styles: [`.layout{display:grid; grid-template-columns: minmax(0,1fr) 420px; gap:16px}.form-grid{display:grid; grid-template-columns:1fr 1fr; gap:12px}.toggles{display:flex; flex-wrap:wrap; gap:12px; margin:8px 0 16px}.actions,.opcoes__header{display:flex; justify-content:flex-end; gap:12px; margin-top:16px}.opcao{display:grid; grid-template-columns:1fr 1fr 90px auto 40px; gap:8px; align-items:center}.empty{color:#6b7280} table{width:100%}@media(max-width:1100px){.layout{grid-template-columns:1fr}.opcao,.form-grid{grid-template-columns:1fr}}`],
})
export class CatalogoCaracteristicasComponent implements OnInit {
  categoriaId!: number;
  categoriaNome = '';
  herdadas: CatalogoCaracteristica[] = [];
  proprias: CatalogoCaracteristica[] = [];
  colunasHerdadas = ['nome', 'tipo', 'origem', 'ativo'];
  colunasProprias = ['ordem', 'codigo', 'nome', 'tipo', 'flags', 'ativo', 'acoes'];
  tipos = CATALOGO_TIPOS_CARACTERISTICA;
  unidades = CATALOGO_UNIDADES_CARACTERISTICA;
  editandoId?: number;
  salvando = false;
  form = this.fb.group({
    codigo: ['', Validators.required],
    nome: ['', Validators.required],
    descricao: [''],
    tipo: ['TEXTO' as CatalogoTipoCaracteristica, Validators.required],
    unidade: ['SEM_UNIDADE'],
    obrigatoria: [false],
    filtravel: [false],
    exibirNaListagem: [false],
    exibirNoSite: [false],
    ordemExibicao: [0, Validators.min(0)],
    valorMinimo: [null as number | null],
    valorMaximo: [null as number | null],
    casasDecimais: [null as number | null],
    ativo: [true],
    opcoes: this.fb.array<FormGroup>([]),
  });

  constructor(private readonly fb: FormBuilder, private readonly categoriaService: CatalogoCategoriaService, private readonly caracteristicaService: CatalogoCaracteristicaService, private readonly route: ActivatedRoute, private readonly dialog: MatDialog, private readonly toastr: ToastrService, private readonly auth: AuthService) {}

  ngOnInit(): void {
    this.categoriaId = Number(this.route.snapshot.paramMap.get('id'));
    this.categoriaService.detalhar(this.categoriaId).subscribe({ next: (categoria) => (this.categoriaNome = categoria.nome) });
    this.carregar();
  }

  get opcoes(): FormArray<FormGroup> { return this.form.controls.opcoes as FormArray<FormGroup>; }
  get isSelecao(): boolean { return ['SELECAO_UNICA', 'SELECAO_MULTIPLA'].includes(this.form.value.tipo || ''); }
  get isNumerico(): boolean { return ['INTEIRO', 'DECIMAL'].includes(this.form.value.tipo || ''); }
  get podeSalvar(): boolean { return this.editandoId ? this.podeEditar : this.podeCriar; }
  get podeCriar(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_CADASTRAR'); }
  get podeEditar(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_EDITAR'); }
  get podeExcluir(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_EXCLUIR'); }

  carregar(): void {
    this.categoriaService.listarCaracteristicas(this.categoriaId).subscribe({
      next: (items) => {
        this.herdadas = (items || []).filter((item) => item.herdada);
        this.proprias = (items || []).filter((item) => !item.herdada);
      },
      error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel carregar caracteristicas.')),
    });
  }

  salvar(): void {
    if (this.form.invalid || !this.validarOpcoes()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const raw = this.form.getRawValue();
    const payload: CatalogoCaracteristicaRequest = {
      codigo: raw.codigo || '',
      nome: raw.nome || '',
      descricao: raw.descricao || null,
      tipo: raw.tipo || 'TEXTO',
      unidade: raw.unidade as any,
      obrigatoria: !!raw.obrigatoria,
      filtravel: !!raw.filtravel,
      exibirNaListagem: !!raw.exibirNaListagem,
      exibirNoSite: !!raw.exibirNoSite,
      ordemExibicao: raw.ordemExibicao,
      ativo: raw.ativo !== false,
      opcoes: this.isSelecao ? raw.opcoes as any : [],
      valorMinimo: this.isNumerico ? raw.valorMinimo : null,
      valorMaximo: this.isNumerico ? raw.valorMaximo : null,
      casasDecimais: raw.tipo === 'DECIMAL' ? raw.casasDecimais : null,
    };
    const request$ = this.editandoId ? this.caracteristicaService.atualizar(this.categoriaId, this.editandoId, payload) : this.caracteristicaService.criar(this.categoriaId, payload);
    request$.subscribe({
      next: () => { this.salvando = false; this.toastr.success('Caracteristica salva.'); this.novo(); this.carregar(); },
      error: (error) => { this.salvando = false; this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel salvar a caracteristica.')); },
    });
  }

  editar(item: CatalogoCaracteristica): void {
    this.editandoId = item.id;
    this.form.patchValue({
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao || '',
      tipo: item.tipo,
      unidade: item.unidade || 'SEM_UNIDADE',
      obrigatoria: !!item.obrigatoria,
      filtravel: !!item.filtravel,
      exibirNaListagem: !!item.exibirNaListagem,
      exibirNoSite: !!item.exibirNoSite,
      ordemExibicao: item.ordemExibicao ?? 0,
      valorMinimo: item.valorMinimo ?? null,
      valorMaximo: item.valorMaximo ?? null,
      casasDecimais: item.casasDecimais ?? null,
      ativo: item.ativo !== false,
    });
    this.opcoes.clear();
    (item.opcoes || []).forEach((opcao) => this.opcoes.push(this.opcaoGroup(opcao)));
  }

  novo(): void {
    this.editandoId = undefined;
    this.form.reset({ tipo: 'TEXTO', unidade: 'SEM_UNIDADE', obrigatoria: false, filtravel: false, exibirNaListagem: false, exibirNoSite: false, ordemExibicao: 0, ativo: true });
    this.opcoes.clear();
  }

  inativar(item: CatalogoCaracteristica): void {
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '420px', data: { title: 'Inativar caracteristica', message: `Deseja inativar "${item.nome}"?`, confirmText: 'Inativar', confirmColor: 'warn' } });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.caracteristicaService.inativar(this.categoriaId, item.id).subscribe({
        next: () => { this.toastr.success('Caracteristica inativada.'); this.carregar(); },
        error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Erro ao inativar caracteristica.')),
      });
    });
  }

  onTipoChange(): void {
    if (!this.isSelecao) this.opcoes.clear();
    if (!this.isNumerico) this.form.patchValue({ valorMinimo: null, valorMaximo: null, casasDecimais: null });
  }

  addOpcao(): void { this.opcoes.push(this.opcaoGroup({ codigo: '', nome: '', ordemExibicao: this.opcoes.length, ativo: true })); }
  removeOpcao(index: number): void { this.opcoes.removeAt(index); }
  tipoLabel(value: CatalogoTipoCaracteristica): string { return catalogoLabel(CATALOGO_TIPOS_CARACTERISTICA, value); }
  flags(item: CatalogoCaracteristica): string { return [item.obrigatoria && 'Obrigatoria', item.filtravel && 'Filtro', item.exibirNaListagem && 'Listagem', item.exibirNoSite && 'Site'].filter(Boolean).join(', ') || '-'; }

  private opcaoGroup(value: any): FormGroup {
    return this.fb.group({ id: [value.id || null], codigo: [value.codigo || '', Validators.required], nome: [value.nome || '', Validators.required], ordemExibicao: [value.ordemExibicao ?? 0, Validators.min(0)], ativo: [value.ativo !== false] });
  }

  private validarOpcoes(): boolean {
    if (!this.isSelecao) return true;
    if (!this.opcoes.length) {
      this.toastr.warning('Informe pelo menos uma opcao.');
      return false;
    }
    const codigos = this.opcoes.getRawValue().map((item: any) => String(item.codigo || '').trim().toLowerCase()).filter(Boolean);
    if (new Set(codigos).size !== codigos.length) {
      this.toastr.warning('Existem opcoes com codigo duplicado.');
      return false;
    }
    return true;
  }
}
