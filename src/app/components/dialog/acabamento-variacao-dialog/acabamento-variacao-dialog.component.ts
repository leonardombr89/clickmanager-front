import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { AcabamentoVariacaoForm } from 'src/app/pages/cadastro-tecnico/acabamentos/variacoes-acabamento/variacoes-acabamento.component';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';

export interface AcabamentoVariacaoDialogData {
  mode: 'view' | 'edit';
  variacao: AcabamentoVariacaoForm;
  lookups: {
    materiais: Array<{ id: number; nome: string }>;
    formatos: Array<{ id: number; nome: string }>;
  };
}

export interface AcabamentoVariacaoDialogResult {
  variacao: AcabamentoVariacaoForm;
}

@Component({
  selector: 'app-acabamento-variacao-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    PrecoSelectorComponent,
  ],
  templateUrl: './acabamento-variacao-dialog.component.html',
  styleUrls: ['./acabamento-variacao-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcabamentoVariacaoDialogComponent {
  readonly precoForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AcabamentoVariacaoDialogData,
    private readonly dialogRef: MatDialogRef<AcabamentoVariacaoDialogComponent, AcabamentoVariacaoDialogResult>,
    private readonly fb: FormBuilder,
  ) {
    this.precoForm = this.buildPrecoForm(data.variacao.preco);

    if (this.readOnly) {
      this.precoForm.disable({ emitEvent: false });
    }
  }

  get readOnly(): boolean {
    return this.data.mode === 'view';
  }

  get title(): string {
    return this.readOnly ? 'Visualizar variação' : 'Editar variação';
  }

  get materialLabel(): string {
    return this.resolveLabel(this.data.variacao.materialId, this.data.lookups.materiais) || 'Todos';
  }

  get formatoLabel(): string {
    return this.resolveLabel(this.data.variacao.formatoId, this.data.lookups.formatos) || 'Todos';
  }

  get aplicacaoLabel(): string {
    return TipoAplicacaoAcabamento.label(this.data.variacao.tipoAplicacao) || '—';
  }

  get estruturaResumo(): string {
    return [this.materialLabel, this.formatoLabel, this.aplicacaoLabel].filter(Boolean).join(' • ');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.readOnly) {
      this.cancel();
      return;
    }

    this.precoForm.markAllAsTouched();
    this.precoForm.updateValueAndValidity();

    if (this.precoForm.invalid) {
      return;
    }

    this.dialogRef.close({
      variacao: {
        ...this.data.variacao,
        preco: this.cloneValue(this.precoForm.getRawValue()) as any,
      },
    });
  }

  private buildPrecoForm(preco: any): FormGroup {
    const tipo = preco?.tipo ?? 'FIXO';

    switch (tipo) {
      case 'FIXO':
        return this.fb.group({
          tipo: ['FIXO'],
          valor: [preco?.valor ?? null],
        });
      case 'QUANTIDADE':
        return this.fb.group({
          tipo: ['QUANTIDADE'],
          faixas: this.fb.array(
            (preco?.faixas ?? []).map((faixa: any) => this.fb.group({
              quantidade: [faixa?.quantidade ?? null],
              valor: [faixa?.valor ?? null],
            }))
          ),
        });
      case 'DEMANDA':
        return this.fb.group({
          tipo: ['DEMANDA'],
          faixas: this.fb.array(
            (preco?.faixas ?? []).map((faixa: any) => this.fb.group({
              de: [faixa?.de ?? null],
              ate: [faixa?.ate ?? null],
              valorUnitario: [faixa?.valorUnitario ?? null],
            }))
          ),
        });
      case 'METRO':
        return this.fb.group({
          tipo: ['METRO'],
          precoMetro: [preco?.precoMetro ?? null],
          precoMinimo: [preco?.precoMinimo ?? null],
          alturaMaxima: [preco?.alturaMaxima ?? null],
          larguraMaxima: [preco?.larguraMaxima ?? null],
          modoCobranca: [preco?.modoCobranca ?? 'QUADRADO'],
          largurasLinearesPermitidas: [preco?.largurasLinearesPermitidas ?? ''],
        });
      case 'HORA':
        return this.fb.group({
          tipo: ['HORA'],
          valorHora: [preco?.valorHora ?? null],
          tempoEstimado: [preco?.tempoEstimado ?? null],
        });
      default:
        return this.fb.group({
          tipo: ['FIXO'],
          valor: [null],
        });
    }
  }

  private resolveLabel(value: any, lookup: Array<{ id: number; nome: string }> = []): string | null {
    if (value == null) {
      return null;
    }

    const id = this.extractId(value);
    const match = lookup.find(item => Number(item.id) === Number(id));
    return match?.nome ?? null;
  }

  private extractId(value: any): number | null {
    if (value == null) {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }
    if (typeof value === 'object' && value.id != null) {
      return Number(value.id);
    }
    return null;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
