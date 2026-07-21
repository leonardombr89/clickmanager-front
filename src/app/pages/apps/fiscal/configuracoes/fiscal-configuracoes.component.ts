import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { FiscalConfiguracaoEmpresa } from '../shared/fiscal.models';
import { FiscalConfiguracaoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-configuracoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PageCardComponent],
  template: `
    <app-page-card titulo="Configurações fiscais" subtitulo="Dados da empresa, provedor, certificado, numeração e ambiente.">
      <div class="loading" *ngIf="carregando"><mat-spinner diameter="32"></mat-spinner><span>Carregando configuração...</span></div>
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <div class="fiscal-alert fiscal-alert--success" *ngIf="sucesso"><mat-icon>check_circle</mat-icon>{{ sucesso }}</div>
      <form [formGroup]="form" *ngIf="!carregando" (ngSubmit)="salvar()">
        <div class="fiscal-alert fiscal-alert--warn" *ngIf="form.value.ambiente === 'HOMOLOGACAO'"><mat-icon>science</mat-icon>Ambiente de homologação. As notas emitidas neste ambiente não possuem validade fiscal.</div>
        <mat-accordion multi>
          <mat-expansion-panel expanded><mat-expansion-panel-header><mat-panel-title>Dados da empresa</mat-panel-title></mat-expansion-panel-header><div class="grid triple">
            <mat-form-field appearance="outline"><mat-label>Razão social</mat-label><input matInput formControlName="razaoSocial" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>CNPJ</mat-label><input matInput formControlName="cnpj" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Inscrição estadual</mat-label><input matInput formControlName="inscricaoEstadual" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Inscrição municipal</mat-label><input matInput formControlName="inscricaoMunicipal" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>CNAE</mat-label><input matInput formControlName="cnae" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>E-mail</mat-label><input matInput formControlName="email" /></mat-form-field>
          </div></mat-expansion-panel>
          <mat-expansion-panel><mat-expansion-panel-header><mat-panel-title>Endereço fiscal</mat-panel-title></mat-expansion-panel-header><div class="grid triple">
            <mat-form-field appearance="outline"><mat-label>CEP</mat-label><input matInput formControlName="cep" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Logradouro</mat-label><input matInput formControlName="logradouro" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Número</mat-label><input matInput formControlName="numero" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Bairro</mat-label><input matInput formControlName="bairro" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Município</mat-label><input matInput formControlName="municipio" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>UF</mat-label><input matInput maxlength="2" formControlName="uf" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Código município</mat-label><input matInput formControlName="codigoMunicipio" /></mat-form-field>
            <mat-form-field appearance="outline" class="span-2"><mat-label>Complemento</mat-label><input matInput formControlName="complemento" /></mat-form-field>
          </div></mat-expansion-panel>
          <mat-expansion-panel><mat-expansion-panel-header><mat-panel-title>Regime e numeração</mat-panel-title></mat-expansion-panel-header><div class="grid triple">
            <mat-form-field appearance="outline"><mat-label>Regime tributário</mat-label><mat-select formControlName="regimeTributario"><mat-option value="SIMPLES_NACIONAL">Simples Nacional</mat-option><mat-option value="REGIME_NORMAL">Regime normal</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Série NF-e</mat-label><input matInput formControlName="serieNfe" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Próximo número NF-e</mat-label><input matInput type="number" formControlName="proximoNumeroNfe" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Série NFC-e</mat-label><input matInput formControlName="serieNfce" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Próximo número NFC-e</mat-label><input matInput type="number" formControlName="proximoNumeroNfce" /></mat-form-field>
          </div></mat-expansion-panel>
          <mat-expansion-panel><mat-expansion-panel-header><mat-panel-title>Provedor e certificado</mat-panel-title></mat-expansion-panel-header>
            <div class="provider">
              <div><span>Provedor</span><strong>{{ form.value.provedor || '-' }}</strong></div><div><span>Status da integração</span><strong>{{ form.value.statusIntegracao || '-' }}</strong></div><div><span>Credenciais configuradas</span><strong>{{ form.value.credenciaisConfiguradas ? 'Sim' : 'Não' }}</strong></div><div><span>Certificado</span><strong>{{ form.value.certificadoConfigurado ? 'Configurado' : 'Não configurado' }}</strong></div><div><span>Validade</span><strong>{{ form.value.certificadoValidade | date:'shortDate' }}</strong></div><div><span>Titular</span><strong>{{ form.value.certificadoTitular || '-' }}</strong></div>
            </div>
            <div class="fiscal-alert"><mat-icon>lock</mat-icon>Tokens, senhas e conteúdo do certificado não são exibidos nesta tela.</div>
          </mat-expansion-panel>
          <mat-expansion-panel><mat-expansion-panel-header><mat-panel-title>Ambiente</mat-panel-title></mat-expansion-panel-header>
            <mat-radio-group formControlName="ambiente" class="radio-stack"><mat-radio-button value="HOMOLOGACAO">Ambiente de homologação</mat-radio-button><mat-radio-button value="PRODUCAO" [disabled]="!podeEditar">Ambiente de produção</mat-radio-button></mat-radio-group>
          </mat-expansion-panel>
        </mat-accordion>
        <div class="actions">
          <button mat-stroked-button type="button" (click)="validar()"><mat-icon>fact_check</mat-icon>Validar configuração</button>
          <button mat-flat-button color="primary" type="submit" [disabled]="!podeEditar || salvando || form.invalid"><mat-icon>save</mat-icon>{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss', './fiscal-configuracoes.component.scss'],
})
export class FiscalConfiguracoesComponent implements OnInit {
  carregando = false; salvando = false; erro = ''; sucesso = '';
  form = this.fb.group({
    razaoSocial: ['', Validators.required], cnpj: ['', Validators.required], inscricaoEstadual: [''], inscricaoMunicipal: [''], cnae: [''], telefone: [''], email: [''],
    cep: [''], logradouro: [''], numero: [''], complemento: [''], bairro: [''], municipio: [''], uf: [''], codigoMunicipio: [''],
    regimeTributario: [''], serieNfe: [''], proximoNumeroNfe: [null as number | null], serieNfce: [''], proximoNumeroNfce: [null as number | null],
    provedor: [''], statusIntegracao: [''], credenciaisConfiguradas: [false], certificadoConfigurado: [false], certificadoValidade: [''], certificadoTitular: [''], certificadoCnpj: [''], ultimaVerificacao: [''],
    ambiente: ['HOMOLOGACAO', Validators.required],
  });
  constructor(private readonly fb: FormBuilder, private readonly service: FiscalConfiguracaoService, private readonly auth: AuthService) {}
  ngOnInit(): void { this.carregar(); }
  get podeEditar(): boolean { return this.auth.temPermissao('FISCAL_CONFIGURACAO_EDITAR'); }
  carregar(): void { this.carregando = true; this.service.carregar().pipe(finalize(() => (this.carregando = false))).subscribe({ next: (cfg) => this.form.patchValue(cfg), error: () => (this.erro = 'Configure os dados fiscais da empresa antes de emitir notas.') }); }
  salvar(): void { if (!this.podeEditar) return; if (this.form.value.ambiente === 'PRODUCAO' && !window.confirm('Você está alterando para produção. Confirma?')) return; this.salvando = true; this.service.salvar(this.form.getRawValue() as FiscalConfiguracaoEmpresa).pipe(finalize(() => (this.salvando = false))).subscribe({ next: (cfg) => { this.form.patchValue(cfg); this.sucesso = 'Configuração fiscal salva.'; }, error: () => (this.erro = 'Não foi possível salvar a configuração fiscal.') }); }
  validar(): void { this.service.validar().subscribe({ next: (pendencias) => (this.erro = pendencias?.length ? pendencias.join(' ') : ''), error: () => (this.erro = 'Validação não concluída.') }); }
}
