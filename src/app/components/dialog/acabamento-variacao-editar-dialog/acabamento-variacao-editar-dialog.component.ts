import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';
import { AcabamentoVariacaoForm } from 'src/app/pages/cadastro-tecnico/acabamentos/variacoes-acabamento/variacoes-acabamento.component';

interface IdNome {
  id: number;
  nome?: string | null;
}

export interface AcabamentoVariacaoEditarDialogData {
  variacao: AcabamentoVariacaoForm;
  lookups: {
    materiais: IdNome[];
    formatos: IdNome[];
  };
}

export interface AcabamentoVariacaoEditarDialogResult {
  variacao: AcabamentoVariacaoForm;
}

@Component({
  selector: 'app-acabamento-variacao-editar-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    PrecoSelectorComponent,
  ],
  templateUrl: './acabamento-variacao-editar-dialog.component.html',
  styleUrl: './acabamento-variacao-editar-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcabamentoVariacaoEditarDialogComponent {
  readonly precoForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AcabamentoVariacaoEditarDialogData,
    private readonly dialogRef: MatDialogRef<AcabamentoVariacaoEditarDialogComponent, AcabamentoVariacaoEditarDialogResult>,
    private readonly fb: FormBuilder,
  ) {
    this.precoForm = this.buildPrecoForm(data.variacao.preco);
  }

  get materialLabel(): string {
    return this.resolveLabel(this.data.variacao.materialId, this.data.lookups.materiais) || 'Todos os materiais';
  }

  get formatoLabel(): string {
    return this.resolveLabel(this.data.variacao.formatoId, this.data.lookups.formatos) || 'Todos os formatos';
  }

  get aplicacaoLabel(): string {
    return TipoAplicacaoAcabamento.label(this.data.variacao.tipoAplicacao) || 'Aplicação';
  }

  get estruturaResumo(): string {
    return [this.materialLabel, this.formatoLabel, this.aplicacaoLabel].filter(Boolean).join(' • ');
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
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

  private resolveLabel(value: any, lookup: IdNome[] = []): string | null {
    const id = this.extractId(value);
    if (id == null) {
      return null;
    }
    const found = lookup.find(item => Number(item.id) === Number(id));
    return found?.nome ?? null;
  }

  private extractId(value: any): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    if (typeof value === 'object' && value.id != null) return Number(value.id);
    return null;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
