import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { FiscalRegraTributaria } from '../shared/fiscal.models';
import { FiscalRegraService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-regras',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Regras tributárias" subtitulo="CFOP, CST/CSOSN e aplicação por operação, UF, produto ou categoria.">
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <div class="layout">
        <app-section-card titulo="Regras cadastradas">
          <div class="loading" *ngIf="carregando"><mat-spinner diameter="32"></mat-spinner><span>Carregando regras...</span></div>
          <div class="empty" *ngIf="!carregando && !regras.length">Nenhuma regra tributária configurada.</div>
          <table mat-table [dataSource]="regras" *ngIf="!carregando && regras.length">
            <ng-container matColumnDef="nome"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.nome }}</td></ng-container>
            <ng-container matColumnDef="regime"><th mat-header-cell *matHeaderCellDef>Regime</th><td mat-cell *matCellDef="let item">{{ item.regime || '-' }}</td></ng-container>
            <ng-container matColumnDef="operacao"><th mat-header-cell *matHeaderCellDef>Operação</th><td mat-cell *matCellDef="let item">{{ item.operacao || '-' }}</td></ng-container>
            <ng-container matColumnDef="ufs"><th mat-header-cell *matHeaderCellDef>UF</th><td mat-cell *matCellDef="let item">{{ item.ufOrigem || '*' }} → {{ item.ufDestino || '*' }}</td></ng-container>
            <ng-container matColumnDef="cfop"><th mat-header-cell *matHeaderCellDef>CFOP</th><td mat-cell *matCellDef="let item">{{ item.cfop || '-' }}</td></ng-container>
            <ng-container matColumnDef="cst"><th mat-header-cell *matHeaderCellDef>CST/CSOSN</th><td mat-cell *matCellDef="let item">{{ item.csosn || item.cst || '-' }}</td></ng-container>
            <ng-container matColumnDef="prioridade"><th mat-header-cell *matHeaderCellDef>Prioridade</th><td mat-cell *matCellDef="let item">{{ item.prioridade ?? '-' }}</td></ng-container>
            <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item"><button mat-icon-button (click)="editar(item)" [disabled]="!podeEditar"><mat-icon>edit</mat-icon></button><button mat-icon-button (click)="duplicar(item)" [disabled]="!podeEditar"><mat-icon>content_copy</mat-icon></button><button mat-icon-button (click)="inativar(item)" [disabled]="!podeEditar"><mat-icon>block</mat-icon></button></td></ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </app-section-card>
        <app-section-card [titulo]="form.value.id ? 'Editar regra' : 'Nova regra'" subtitulo="Campos exibidos conforme regime tributário.">
          <form [formGroup]="form" (ngSubmit)="salvar()">
            <div class="edit-grid">
              <input type="hidden" formControlName="id" />
              <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="nome" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Regime</mat-label><mat-select formControlName="regime"><mat-option value="SIMPLES_NACIONAL">Simples Nacional</mat-option><mat-option value="REGIME_NORMAL">Regime normal</mat-option></mat-select></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Operação</mat-label><input matInput formControlName="operacao" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>UF origem</mat-label><input matInput maxlength="2" formControlName="ufOrigem" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>UF destino</mat-label><input matInput maxlength="2" formControlName="ufDestino" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Produto ou categoria</mat-label><input matInput formControlName="produtoOuCategoria" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>CFOP</mat-label><input matInput formControlName="cfop" /></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="form.value.regime !== 'SIMPLES_NACIONAL'"><mat-label>CST</mat-label><input matInput formControlName="cst" /></mat-form-field>
              <mat-form-field appearance="outline" *ngIf="form.value.regime === 'SIMPLES_NACIONAL'"><mat-label>CSOSN</mat-label><input matInput formControlName="csosn" /></mat-form-field>
              <mat-form-field appearance="outline"><mat-label>Prioridade</mat-label><input matInput type="number" formControlName="prioridade" /></mat-form-field>
              <mat-form-field appearance="outline" class="full"><mat-label>Observações</mat-label><textarea matInput rows="3"></textarea></mat-form-field>
            </div>
            <div class="actions"><button mat-stroked-button type="button" (click)="novo()">Limpar</button><button mat-flat-button color="primary" [disabled]="!podeEditar || form.invalid || salvando"><mat-icon>save</mat-icon>{{ salvando ? 'Salvando...' : 'Salvar' }}</button></div>
          </form>
        </app-section-card>
      </div>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss', './fiscal-regras.component.scss'],
})
export class FiscalRegrasComponent implements OnInit {
  regras: FiscalRegraTributaria[] = []; carregando = false; salvando = false; erro = '';
  columns = ['nome', 'regime', 'operacao', 'ufs', 'cfop', 'cst', 'prioridade', 'acoes'];
  form = this.fb.group({ id: [0], nome: ['', Validators.required], regime: ['SIMPLES_NACIONAL'], operacao: [''], ufOrigem: [''], ufDestino: [''], produtoOuCategoria: [''], cfop: [''], cst: [''], csosn: [''], status: ['ATIVA'], prioridade: [0], ativo: [true] });
  constructor(private readonly fb: FormBuilder, private readonly service: FiscalRegraService, private readonly auth: AuthService) {}
  ngOnInit(): void { this.carregar(); }
  get podeEditar(): boolean { return this.auth.temPermissao('FISCAL_REGRAS_EDITAR'); }
  carregar(): void { this.carregando = true; this.service.listar().pipe(finalize(() => (this.carregando = false))).subscribe({ next: (page) => (this.regras = page.content || []), error: () => (this.erro = 'Não foi possível carregar regras tributárias.') }); }
  editar(item: FiscalRegraTributaria): void { this.form.patchValue(item); }
  duplicar(item: FiscalRegraTributaria): void { this.form.patchValue({ ...item, id: 0, nome: `${item.nome} copia` }); }
  novo(): void { this.form.reset({ id: 0, regime: 'SIMPLES_NACIONAL', status: 'ATIVA', prioridade: 0, ativo: true }); }
  salvar(): void { if (!this.podeEditar) return; this.salvando = true; this.service.salvar(this.form.getRawValue() as FiscalRegraTributaria).pipe(finalize(() => (this.salvando = false))).subscribe({ next: () => { this.novo(); this.carregar(); }, error: () => (this.erro = 'Não foi possível salvar a regra tributária.') }); }
  inativar(item: FiscalRegraTributaria): void { if (item.id && window.confirm(`Inativar regra ${item.nome}?`)) this.service.inativar(item.id).subscribe(() => this.carregar()); }
}
