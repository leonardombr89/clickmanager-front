import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { FiscalDocumentoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-inutilizacoes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Inutilização de numeração" subtitulo="Ação restrita, transmitida ao provedor fiscal.">
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <div class="fiscal-alert fiscal-alert--success" *ngIf="sucesso"><mat-icon>check_circle</mat-icon>{{ sucesso }}</div>
      <app-section-card titulo="Solicitação">
        <form [formGroup]="form" (ngSubmit)="enviar()">
          <div class="grid">
            <mat-form-field appearance="outline"><mat-label>Ano</mat-label><input matInput type="number" formControlName="ano" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Série</mat-label><input matInput formControlName="serie" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Número inicial</mat-label><input matInput type="number" formControlName="numeroInicial" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Número final</mat-label><input matInput type="number" formControlName="numeroFinal" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Ambiente</mat-label><mat-select formControlName="ambiente"><mat-option value="HOMOLOGACAO">Homologação</mat-option><mat-option value="PRODUCAO">Produção</mat-option></mat-select></mat-form-field>
            <mat-form-field appearance="outline" class="full"><mat-label>Justificativa</mat-label><textarea matInput rows="4" formControlName="justificativa"></textarea></mat-form-field>
          </div>
          <div class="fiscal-alert fiscal-alert--warn"><mat-icon>warning</mat-icon>A inutilização não deve ser acessível para operadores comuns e exige confirmação.</div>
          <div class="actions"><button mat-flat-button color="warn" [disabled]="form.invalid || salvando"><mat-icon>block</mat-icon>{{ salvando ? 'Transmitindo...' : 'Inutilizar numeração' }}</button></div>
        </form>
      </app-section-card>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss', './fiscal-inutilizacoes.component.scss'],
})
export class FiscalInutilizacoesComponent {
  salvando = false; erro = ''; sucesso = '';
  form = this.fb.group({ ano: [new Date().getFullYear(), Validators.required], serie: ['', Validators.required], numeroInicial: [null as number | null, Validators.required], numeroFinal: [null as number | null, Validators.required], justificativa: ['', [Validators.required, Validators.minLength(15)]], ambiente: ['HOMOLOGACAO', Validators.required] });
  constructor(private readonly fb: FormBuilder, private readonly service: FiscalDocumentoService) {}
  enviar(): void { if (!window.confirm('Confirma a inutilização desta faixa de numeração?')) return; this.salvando = true; this.service.inutilizar(this.form.getRawValue() as any).pipe(finalize(() => (this.salvando = false))).subscribe({ next: () => { this.sucesso = 'Solicitação de inutilização enviada.'; this.form.reset({ ano: new Date().getFullYear(), ambiente: 'HOMOLOGACAO' }); }, error: () => (this.erro = 'Não foi possível inutilizar a numeração.') }); }
}
