import { CommonModule } from '@angular/common';
import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { CatalogoCaracteristica, CatalogoCaracteristicaRequest, CatalogoTipoCaracteristica } from '../shared/models/catalogo.models';
import { CatalogoCaracteristicaService, CatalogoCategoriaService } from '../shared/services/catalogo.service';
import { catalogoErrorMessage, catalogoLabel, CATALOGO_TIPOS_CARACTERISTICA, CATALOGO_UNIDADES_CARACTERISTICA } from '../shared/utils/catalogo-utils';
import { CatalogoStatusChipComponent } from '../shared/components/catalogo-status-chip.component';

@Component({
  selector: 'app-catalogo-categoria-caracteristicas',
  standalone: true,
  imports: [CommonModule, MaterialModule, SectionCardComponent, CatalogoStatusChipComponent],
  template: `
    <app-section-card titulo="Caracteristicas tecnicas" subtitulo="Defina os campos que serao preenchidos nos produtos desta categoria.">
      <p class="empty" *ngIf="!categoriaId">Salve a categoria para comecar a adicionar caracteristicas tecnicas.</p>

      <ng-container *ngIf="categoriaId">
        <div class="section-actions">
          <button mat-flat-button color="primary" type="button" (click)="abrirDialog()" [disabled]="!podeCriar">
            <mat-icon>add</mat-icon>
            Adicionar caracteristica
          </button>
        </div>

        <h3>Caracteristicas proprias</h3>
        <div class="table-wrap" *ngIf="proprias.length; else semProprias">
          <table mat-table [dataSource]="proprias">
            <ng-container matColumnDef="ordem"><th mat-header-cell *matHeaderCellDef>Ordem</th><td mat-cell *matCellDef="let item">{{ item.ordemExibicao ?? '-' }}</td></ng-container>
            <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
            <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let item">{{ tipoLabel(item.tipo) }}</td></ng-container>
            <ng-container matColumnDef="unidade"><th mat-header-cell *matHeaderCellDef>Unidade</th><td mat-cell *matCellDef="let item">{{ unidadeLabel(item.unidade) }}</td></ng-container>
            <ng-container matColumnDef="obrigatoria"><th mat-header-cell *matHeaderCellDef>Obrig.</th><td mat-cell *matCellDef="let item">{{ item.obrigatoria ? 'Sim' : 'Nao' }}</td></ng-container>
            <ng-container matColumnDef="site"><th mat-header-cell *matHeaderCellDef>Site</th><td mat-cell *matCellDef="let item">{{ item.exibirNoSite ? 'Sim' : 'Nao' }}</td></ng-container>
            <ng-container matColumnDef="filtravel"><th mat-header-cell *matHeaderCellDef>Filtro</th><td mat-cell *matCellDef="let item">{{ item.filtravel ? 'Sim' : 'Nao' }}</td></ng-container>
            <ng-container matColumnDef="ativo"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><app-catalogo-status-chip [ativo]="item.ativo"></app-catalogo-status-chip></td></ng-container>
            <ng-container matColumnDef="acoes">
              <th mat-header-cell *matHeaderCellDef>Acoes</th>
              <td mat-cell *matCellDef="let item; let i = index">
                <button mat-icon-button type="button" matTooltip="Subir" [disabled]="i === 0 || !podeEditar" (click)="mover(item, -1)"><mat-icon>keyboard_arrow_up</mat-icon></button>
                <button mat-icon-button type="button" matTooltip="Descer" [disabled]="i === proprias.length - 1 || !podeEditar" (click)="mover(item, 1)"><mat-icon>keyboard_arrow_down</mat-icon></button>
                <button mat-icon-button type="button" matTooltip="Editar" [disabled]="!podeEditar" (click)="abrirDialog(item)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button type="button" matTooltip="Ativar ou inativar" [disabled]="!podeExcluir" (click)="alternarAtivo(item)"><mat-icon>{{ item.ativo === false ? 'check_circle' : 'block' }}</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="colunasProprias"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasProprias"></tr>
          </table>
        </div>
        <ng-template #semProprias><p class="empty">Nenhuma caracteristica propria cadastrada.</p></ng-template>

        <div class="herdadas" *ngIf="herdadas.length">
          <h3>Caracteristicas herdadas</h3>
          <div class="table-wrap">
            <table mat-table [dataSource]="herdadas">
              <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}<small *ngIf="item.categoriaOrigemNome">Herdada de {{ item.categoriaOrigemNome }}</small></td></ng-container>
              <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let item">{{ tipoLabel(item.tipo) }}</td></ng-container>
              <ng-container matColumnDef="unidade"><th mat-header-cell *matHeaderCellDef>Unidade</th><td mat-cell *matCellDef="let item">{{ unidadeLabel(item.unidade) }}</td></ng-container>
              <ng-container matColumnDef="origem"><th mat-header-cell *matHeaderCellDef>Origem</th><td mat-cell *matCellDef="let item">{{ item.categoriaOrigemNome || '-' }}</td></ng-container>
              <ng-container matColumnDef="obrigatoria"><th mat-header-cell *matHeaderCellDef>Obrig.</th><td mat-cell *matCellDef="let item">{{ item.obrigatoria ? 'Sim' : 'Nao' }}</td></ng-container>
              <ng-container matColumnDef="site"><th mat-header-cell *matHeaderCellDef>Site</th><td mat-cell *matCellDef="let item">{{ item.exibirNoSite ? 'Sim' : 'Nao' }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="colunasHerdadas"></tr>
              <tr mat-row *matRowDef="let row; columns: colunasHerdadas"></tr>
            </table>
          </div>
        </div>
      </ng-container>
    </app-section-card>
  `,
  styles: [`
    .section-actions { display: flex; justify-content: flex-end; margin-bottom: 12px; }
    h3 { font-size: 15px; margin: 16px 0 8px; }
    table { width: 100%; }
    .table-wrap { overflow-x: auto; }
    .empty { color: #6b7280; margin: 0; }
    small { display: block; color: #6b7280; margin-top: 2px; }
    .herdadas { margin-top: 18px; }
  `],
})
export class CatalogoCategoriaCaracteristicasComponent implements OnInit, OnChanges {
  @Input() categoriaId?: number | null;

  herdadas: CatalogoCaracteristica[] = [];
  proprias: CatalogoCaracteristica[] = [];
  colunasProprias = ['ordem', 'nome', 'tipo', 'unidade', 'obrigatoria', 'site', 'filtravel', 'ativo', 'acoes'];
  colunasHerdadas = ['nome', 'tipo', 'unidade', 'origem', 'obrigatoria', 'site'];

  constructor(
    private readonly categoriaService: CatalogoCategoriaService,
    private readonly caracteristicaService: CatalogoCaracteristicaService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void { this.carregar(); }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriaId']) this.carregar();
  }

  get podeCriar(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_CADASTRAR'); }
  get podeEditar(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_EDITAR'); }
  get podeExcluir(): boolean { return this.auth.temPermissao('CATALOGO_CARACTERISTICAS_EXCLUIR'); }

  carregar(): void {
    if (!this.categoriaId) {
      this.herdadas = [];
      this.proprias = [];
      return;
    }
    this.categoriaService.listarCaracteristicas(this.categoriaId).subscribe({
      next: (items) => {
        const sorted = [...(items || [])].sort((a, b) => (a.ordemExibicao ?? 0) - (b.ordemExibicao ?? 0));
        this.herdadas = sorted.filter((item) => item.herdada);
        this.proprias = sorted.filter((item) => !item.herdada);
      },
      error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel carregar caracteristicas.')),
    });
  }

  abrirDialog(item?: CatalogoCaracteristica): void {
    if (!this.categoriaId) return;
    const ref = this.dialog.open(CatalogoCaracteristicaDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      data: { categoriaId: this.categoriaId, caracteristica: item || null },
    });
    ref.afterClosed().subscribe((ok) => { if (ok) this.carregar(); });
  }

  alternarAtivo(item: CatalogoCaracteristica): void {
    if (!this.categoriaId) return;
    if (item.ativo !== false) {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        width: '420px',
        data: { title: 'Inativar caracteristica', message: `Deseja inativar "${item.nome}"?`, confirmText: 'Inativar', confirmColor: 'warn' },
      });
      ref.afterClosed().subscribe((ok) => {
        if (!ok || !this.categoriaId) return;
        this.caracteristicaService.inativar(this.categoriaId, item.id).subscribe({
          next: () => { this.toastr.success('Caracteristica inativada.'); this.carregar(); },
          error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Erro ao inativar caracteristica.')),
        });
      });
      return;
    }
    this.salvarOrdemOuStatus(item, { ativo: true });
  }

  mover(item: CatalogoCaracteristica, delta: number): void {
    const destino = this.proprias[this.proprias.indexOf(item) + delta];
    if (!destino) return;
    const ordemAtual = item.ordemExibicao ?? 0;
    const ordemDestino = destino.ordemExibicao ?? 0;
    this.salvarOrdemOuStatus(item, { ordemExibicao: ordemDestino }, false);
    this.salvarOrdemOuStatus(destino, { ordemExibicao: ordemAtual });
  }

  tipoLabel(value: CatalogoTipoCaracteristica): string { return catalogoLabel(CATALOGO_TIPOS_CARACTERISTICA, value); }
  unidadeLabel(value: any): string { return !value || value === 'SEM_UNIDADE' ? '-' : catalogoLabel(CATALOGO_UNIDADES_CARACTERISTICA, value); }

  private salvarOrdemOuStatus(item: CatalogoCaracteristica, patch: Partial<CatalogoCaracteristicaRequest>, reload = true): void {
    if (!this.categoriaId) return;
    const payload = caracteristicaToRequest(item, patch);
    this.caracteristicaService.atualizar(this.categoriaId, item.id, payload).subscribe({
      next: () => { if (reload) this.carregar(); },
      error: (error) => this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel atualizar a caracteristica.')),
    });
  }
}

@Component({
  selector: 'app-catalogo-caracteristica-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>{{ editando ? 'Editar caracteristica' : 'Adicionar caracteristica' }}</h2>
    <form [formGroup]="form" (ngSubmit)="salvar()">
      <mat-dialog-content>
        <div class="form-grid">
          <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" maxlength="120" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Codigo/chave</mat-label><input matInput formControlName="codigo" maxlength="50" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Tipo</mat-label><mat-select formControlName="tipo" (selectionChange)="onTipoChange()"><mat-option *ngFor="let item of tipos" [value]="item.value">{{ item.label }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline" *ngIf="form.value.tipo !== 'BOOLEANO'"><mat-label>Unidade</mat-label><mat-select formControlName="unidade"><mat-option *ngFor="let item of unidades" [value]="item.value">{{ item.label }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ordem de exibicao</mat-label><input matInput type="number" min="0" formControlName="ordemExibicao" /></mat-form-field>
        </div>
        <mat-form-field appearance="outline" class="w-100"><mat-label>Descricao ou texto de ajuda</mat-label><textarea matInput rows="2" formControlName="descricao"></textarea></mat-form-field>
        <div class="toggles">
          <mat-checkbox formControlName="obrigatoria">Obrigatoria</mat-checkbox>
          <mat-checkbox formControlName="filtravel">Filtravel</mat-checkbox>
          <mat-checkbox formControlName="exibirNoSite">Exibir no site</mat-checkbox>
          <mat-checkbox formControlName="exibirNaListagem">Exibir na listagem</mat-checkbox>
          <mat-checkbox formControlName="ativo">Ativa</mat-checkbox>
        </div>

        <div class="form-grid" *ngIf="isNumerico">
          <mat-form-field appearance="outline"><mat-label>Valor minimo</mat-label><input matInput type="number" formControlName="valorMinimo" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Valor maximo</mat-label><input matInput type="number" formControlName="valorMaximo" /></mat-form-field>
          <mat-form-field appearance="outline" *ngIf="form.value.tipo === 'DECIMAL'"><mat-label>Casas decimais</mat-label><input matInput type="number" min="0" formControlName="casasDecimais" /></mat-form-field>
        </div>

        <p class="hint" *ngIf="form.value.tipo === 'TEXTO_LONGO'">Texto longo sera exibido como area de preenchimento maior no produto.</p>

        <div class="opcoes" *ngIf="isSelecao" formArrayName="opcoes">
          <div class="opcoes__header">
            <strong>Opcoes</strong>
            <button mat-stroked-button type="button" (click)="addOpcao()"><mat-icon>add</mat-icon>Adicionar opcao</button>
          </div>
          <div class="opcao" *ngFor="let opcao of opcoes.controls; let i = index" [formGroupName]="i">
            <input type="hidden" formControlName="id" />
            <mat-form-field appearance="outline"><mat-label>Valor</mat-label><input matInput formControlName="codigo" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Rotulo</mat-label><input matInput formControlName="nome" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ordem</mat-label><input matInput type="number" formControlName="ordemExibicao" /></mat-form-field>
            <mat-checkbox formControlName="ativo">Ativa</mat-checkbox>
            <button mat-icon-button type="button" matTooltip="Remover" (click)="removeOpcao(i)"><mat-icon>delete</mat-icon></button>
          </div>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close(false)">Cancelar</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || salvando">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .toggles { display: flex; flex-wrap: wrap; gap: 12px; margin: 4px 0 16px; }
    .opcoes__header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin: 12px 0; }
    .opcao { display: grid; grid-template-columns: 1fr 1fr 90px auto 40px; gap: 8px; align-items: center; }
    .hint { color: #6b7280; margin: 0 0 12px; }
    @media(max-width: 760px) { .form-grid, .opcao { grid-template-columns: 1fr; } }
  `],
})
export class CatalogoCaracteristicaDialogComponent implements OnInit {
  tipos = CATALOGO_TIPOS_CARACTERISTICA;
  unidades = CATALOGO_UNIDADES_CARACTERISTICA;
  editando = false;
  salvando = false;
  codigoManual = false;

  form = this.fb.group({
    codigo: ['', Validators.required],
    nome: ['', Validators.required],
    descricao: [''],
    tipo: ['TEXTO' as CatalogoTipoCaracteristica, Validators.required],
    unidade: ['SEM_UNIDADE'],
    obrigatoria: [false],
    filtravel: [false],
    exibirNaListagem: [false],
    exibirNoSite: [true],
    ordemExibicao: [0, Validators.min(0)],
    valorMinimo: [null as number | null],
    valorMaximo: [null as number | null],
    casasDecimais: [null as number | null],
    ativo: [true],
    opcoes: this.fb.array<FormGroup>([]),
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: CatalogoCaracteristicaService,
    private readonly toastr: ToastrService,
    public readonly dialogRef: MatDialogRef<CatalogoCaracteristicaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: { categoriaId: number; caracteristica?: CatalogoCaracteristica | null }
  ) {}

  ngOnInit(): void {
    this.editando = !!this.data.caracteristica;
    const item = this.data.caracteristica;
    if (item) {
      this.codigoManual = true;
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
      (item.opcoes || []).forEach((opcao) => this.opcoes.push(this.opcaoGroup(opcao)));
    }
    this.form.controls.codigo.valueChanges.subscribe(() => this.codigoManual = true);
    this.form.controls.nome.valueChanges.subscribe((nome) => {
      if (!this.codigoManual) this.form.controls.codigo.setValue(codigoCaracteristica(nome || ''), { emitEvent: false });
    });
  }

  get opcoes(): FormArray<FormGroup> { return this.form.controls.opcoes as FormArray<FormGroup>; }
  get isSelecao(): boolean { return ['SELECAO_UNICA', 'SELECAO_MULTIPLA'].includes(this.form.value.tipo || ''); }
  get isNumerico(): boolean { return ['INTEIRO', 'DECIMAL'].includes(this.form.value.tipo || ''); }

  salvar(): void {
    if (this.form.invalid || !this.validarOpcoes()) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const payload = this.buildPayload();
    const request$ = this.editando && this.data.caracteristica
      ? this.service.atualizar(this.data.categoriaId, this.data.caracteristica.id, payload)
      : this.service.criar(this.data.categoriaId, payload);
    request$.subscribe({
      next: () => { this.salvando = false; this.toastr.success('Caracteristica salva.'); this.dialogRef.close(true); },
      error: (error) => { this.salvando = false; this.toastr.error(catalogoErrorMessage(error, 'Nao foi possivel salvar a caracteristica.')); },
    });
  }

  onTipoChange(): void {
    if (!this.isSelecao) this.opcoes.clear();
    if (!this.isNumerico) this.form.patchValue({ valorMinimo: null, valorMaximo: null, casasDecimais: null });
    if (this.form.value.tipo === 'BOOLEANO') this.form.controls.unidade.setValue('SEM_UNIDADE');
  }

  addOpcao(): void { this.opcoes.push(this.opcaoGroup({ codigo: '', nome: '', ordemExibicao: this.opcoes.length, ativo: true })); }
  removeOpcao(index: number): void { this.opcoes.removeAt(index); }

  private buildPayload(): CatalogoCaracteristicaRequest {
    const raw = this.form.getRawValue();
    return {
      codigo: codigoCaracteristica(raw.codigo || ''),
      nome: raw.nome || '',
      descricao: raw.descricao || null,
      tipo: raw.tipo || 'TEXTO',
      unidade: raw.tipo === 'BOOLEANO' ? 'SEM_UNIDADE' : raw.unidade as any,
      obrigatoria: !!raw.obrigatoria,
      filtravel: !!raw.filtravel,
      exibirNaListagem: !!raw.exibirNaListagem,
      exibirNoSite: !!raw.exibirNoSite,
      ordemExibicao: raw.ordemExibicao,
      ativo: raw.ativo !== false,
      valorMinimo: this.isNumerico ? raw.valorMinimo : null,
      valorMaximo: this.isNumerico ? raw.valorMaximo : null,
      casasDecimais: raw.tipo === 'DECIMAL' ? raw.casasDecimais : null,
      opcoes: this.isSelecao ? raw.opcoes as any : [],
    };
  }

  private opcaoGroup(value: any): FormGroup {
    return this.fb.group({
      id: [value.id || null],
      codigo: [value.codigo || '', Validators.required],
      nome: [value.nome || '', Validators.required],
      ordemExibicao: [value.ordemExibicao ?? 0, Validators.min(0)],
      ativo: [value.ativo !== false],
    });
  }

  private validarOpcoes(): boolean {
    if (!this.isSelecao) return true;
    if (!this.opcoes.length) {
      this.toastr.warning('Informe pelo menos uma opcao.');
      return false;
    }
    const raw = this.opcoes.getRawValue() as any[];
    const codigos = raw.map((item) => String(item.codigo || '').trim().toUpperCase()).filter(Boolean);
    const nomesVazios = raw.some((item) => !String(item.nome || '').trim());
    if (codigos.length !== raw.length || nomesVazios) {
      this.toastr.warning('Valor e rotulo das opcoes sao obrigatorios.');
      return false;
    }
    if (new Set(codigos).size !== codigos.length) {
      this.toastr.warning('Existem opcoes com valor duplicado.');
      return false;
    }
    return true;
  }
}

function caracteristicaToRequest(item: CatalogoCaracteristica, patch: Partial<CatalogoCaracteristicaRequest> = {}): CatalogoCaracteristicaRequest {
  return {
    codigo: item.codigo,
    nome: item.nome,
    descricao: item.descricao || null,
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
    opcoes: item.opcoes || [],
    ...patch,
  };
}

function codigoCaracteristica(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
