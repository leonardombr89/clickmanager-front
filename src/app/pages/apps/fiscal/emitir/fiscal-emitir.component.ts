import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { FiscalEmissaoResponse, FiscalPendencia } from '../shared/fiscal.models';
import { FiscalDocumentoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-emitir',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Emitir nota fiscal" subtitulo="Valide pendências no backend antes de transmitir.">
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <form [formGroup]="form">
        <mat-stepper linear>
          <mat-step label="Pedido" [stepControl]="form"><app-section-card><div class="grid"><mat-form-field appearance="outline"><mat-label>ID do pedido</mat-label><input matInput type="number" formControlName="pedidoId" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Ambiente</mat-label><mat-select formControlName="ambiente"><mat-option value="HOMOLOGACAO">Homologação</mat-option><mat-option value="PRODUCAO">Produção</mat-option></mat-select></mat-form-field></div></app-section-card><button mat-flat-button color="primary" matStepperNext>Continuar</button></mat-step>
          <mat-step label="Destinatário"><app-section-card><p>Dados fiscais do destinatário serão carregados do pedido e validados pelo backend. Ajustes devem informar se alteram somente esta emissão ou o cadastro do cliente.</p><mat-checkbox formControlName="atualizarCadastroCliente">Atualizar cadastro do cliente quando o backend suportar</mat-checkbox></app-section-card><button mat-button matStepperPrevious>Voltar</button><button mat-flat-button color="primary" matStepperNext>Continuar</button></mat-step>
          <mat-step label="Produtos"><app-section-card><p>Produtos com NCM, CEST, origem, CFOP e CST/CSOSN pendentes serão listados após a validação.</p></app-section-card><button mat-button matStepperPrevious>Voltar</button><button mat-flat-button color="primary" matStepperNext>Continuar</button></mat-step>
          <mat-step label="Tributação"><app-section-card><p>Tributos críticos não são calculados no navegador. A regra aplicada e pendências vêm do backend.</p></app-section-card><button mat-button matStepperPrevious>Voltar</button><button mat-flat-button color="primary" matStepperNext>Continuar</button></mat-step>
          <mat-step label="Validação"><app-section-card><button mat-flat-button color="primary" type="button" [disabled]="validando" (click)="validar()"><mat-icon>fact_check</mat-icon>{{ validando ? 'Validando...' : 'Validar nota' }}</button><div class="pendencias" *ngIf="pendencias.length"><div *ngFor="let grupo of gruposPendencias()"><strong>{{ grupo }}</strong><ul><li *ngFor="let p of pendenciasPorGrupo(grupo)">{{ p.referencia ? p.referencia + ': ' : '' }}{{ p.mensagem }}</li></ul></div></div><div class="fiscal-alert fiscal-alert--success" *ngIf="validacaoOk"><mat-icon>check_circle</mat-icon>Validação concluída sem pendências bloqueantes.</div></app-section-card><button mat-button matStepperPrevious>Voltar</button><button mat-flat-button color="primary" matStepperNext [disabled]="!validacaoOk">Continuar</button></mat-step>
          <mat-step label="Emissão"><app-section-card><div class="fiscal-alert fiscal-alert--warn" *ngIf="form.value.ambiente === 'PRODUCAO'"><mat-icon>warning</mat-icon>Você está prestes a transmitir esta NF-e para o ambiente de produção.</div><button mat-flat-button color="primary" type="button" [disabled]="emitindo || !validacaoOk" (click)="emitir()"><mat-icon>send</mat-icon>{{ emitindo ? 'Transmitindo...' : 'Transmitir nota' }}</button></app-section-card></mat-step>
        </mat-stepper>
      </form>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss', './fiscal-emitir.component.scss'],
})
export class FiscalEmitirComponent {
  form = this.fb.group({ pedidoId: [Number(this.route.snapshot.paramMap.get('pedidoId')) || null, Validators.required], ambiente: ['HOMOLOGACAO', Validators.required], atualizarCadastroCliente: [false] });
  pendencias: FiscalPendencia[] = []; validacaoOk = false; validando = false; emitindo = false; erro = '';
  constructor(private readonly fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly service: FiscalDocumentoService) {}
  validar(): void { this.validando = true; this.erro = ''; this.validacaoOk = false; this.service.validarEmissao(this.form.getRawValue() as any).pipe(finalize(() => (this.validando = false))).subscribe({ next: (res) => { this.pendencias = res.pendencias || []; this.validacaoOk = !this.pendencias.length; }, error: () => (this.erro = 'Validação fiscal não concluída.') }); }
  emitir(): void { if (this.form.value.ambiente === 'PRODUCAO' && !window.confirm('Confirma transmissão em produção?')) return; this.emitindo = true; this.service.emitir(this.form.getRawValue() as any).pipe(finalize(() => (this.emitindo = false))).subscribe({ next: (res: FiscalEmissaoResponse) => { if (res.documentoId) this.router.navigate(['/apps/fiscal/documentos', res.documentoId]); else this.erro = res.mensagem || 'Emissão iniciada, mas o documento ainda não foi retornado.'; }, error: () => (this.erro = 'Não foi possível transmitir a nota fiscal.') }); }
  gruposPendencias(): string[] { return Array.from(new Set(this.pendencias.map((p) => p.grupo))); }
  pendenciasPorGrupo(grupo: string): FiscalPendencia[] { return this.pendencias.filter((p) => p.grupo === grupo); }
}
