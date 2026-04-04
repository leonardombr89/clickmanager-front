import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { VariacaoProduto } from 'src/app/pages/cadastro-tecnico/produtos/form-produto/variacoes-produto/models/variacao.model';
import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { IdNome } from '../variacao-detalhe-dialog/variacao-detalhe-dialog.component';

export interface VariacaoEditarDialogData {
  variacao: VariacaoProduto;
  lookups: {
    materiais: IdNome[];
    formatos: IdNome[];
    cores: IdNome[];
    acabamentos: IdNome[];
    servicos: IdNome[];
  };
  politicaProduto?: PoliticaRevenda | null;
}

export interface VariacaoEditarDialogResult {
  variacao: VariacaoProduto;
}

@Component({
  selector: 'app-variacao-editar-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    InputMultiSelectComponent,
    PrecoSelectorComponent,
  ],
  templateUrl: './variacao-editar-dialog.component.html',
  styleUrls: ['./variacao-editar-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariacaoEditarDialogComponent {
  readonly form: FormGroup;
  readonly precoForm: FormGroup;
  readonly politicaResumo: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VariacaoEditarDialogData,
    private readonly dialogRef: MatDialogRef<VariacaoEditarDialogComponent, VariacaoEditarDialogResult>,
    private readonly fb: FormBuilder,
  ) {
    this.precoForm = this.buildPrecoForm(data.variacao.preco);
    this.form = this.fb.group({
      acabamentos: this.fb.control(this.normalizeIds(data.variacao.acabamentos), { nonNullable: true }),
      servicos: this.fb.control(this.normalizeIds(data.variacao.servicos), { nonNullable: true }),
    });
    this.politicaResumo = this.buildPoliticaResumo(data.variacao.politicaRevenda ?? data.politicaProduto ?? null);
  }

  get acabamentosControl(): FormControl {
    return this.form.get('acabamentos') as FormControl;
  }

  get servicosControl(): FormControl {
    return this.form.get('servicos') as FormControl;
  }

  get materialLabel(): string {
    return this.resolveLabel(this.data.variacao.materialId, this.data.lookups.materiais) || '—';
  }

  get formatoLabel(): string {
    return this.resolveLabel(this.data.variacao.formatoId, this.data.lookups.formatos) || '—';
  }

  get corLabel(): string {
    return this.resolveLabel(
      this.data.variacao.corLabel ?? this.data.variacao.cor ?? this.data.variacao.corId,
      this.data.lookups.cores
    ) || '—';
  }

  get estruturaResumo(): string {
    return [this.materialLabel, this.formatoLabel, this.corLabel]
      .filter(label => !!label && label !== '—')
      .join(' • ');
  }

  get acabamentoOptions(): { id: any; nome: string }[] {
    return this.toOptionList(this.data.lookups.acabamentos);
  }

  get servicoOptions(): { id: any; nome: string }[] {
    return this.toOptionList(this.data.lookups.servicos);
  }

  get selectedAcabamentosCount(): number {
    return Array.isArray(this.acabamentosControl.value) ? this.acabamentosControl.value.length : 0;
  }

  get selectedServicosCount(): number {
    return Array.isArray(this.servicosControl.value) ? this.servicosControl.value.length : 0;
  }

  get priceSummary(): string {
    const preco = this.precoForm.getRawValue() as any;
    switch (preco?.tipo) {
      case 'FIXO':
        return preco?.valor ? `Preço fixo ${this.moeda(preco.valor)}` : 'Defina o valor da variação';
      case 'QUANTIDADE':
        return `${preco?.faixas?.length ?? 0} faixa(s) por quantidade`;
      case 'DEMANDA':
        return `${preco?.faixas?.length ?? 0} faixa(s) por demanda`;
      case 'METRO':
        return preco?.precoMetro ? `Metro ${this.moeda(preco.precoMetro)}` : 'Defina o preço por metro';
      case 'HORA':
        return preco?.valorHora ? `Hora ${this.moeda(preco.valorHora)}` : 'Defina o valor por hora';
      default:
        return 'Configure o preço desta variação';
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.form.markAllAsTouched();
    this.precoForm.markAllAsTouched();
    this.precoForm.updateValueAndValidity();

    if (this.precoForm.invalid) {
      return;
    }

    this.dialogRef.close({
      variacao: {
        ...this.data.variacao,
        acabamentos: [...(this.acabamentosControl.value ?? [])],
        servicos: [...(this.servicosControl.value ?? [])],
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

  private toOptionList(list: IdNome[] = []): { id: any; nome: string }[] {
    return list.map(item => ({
      id: item.id,
      nome: item.nome ?? item.label ?? item.descricao ?? String(item.id),
    }));
  }

  private normalizeIds(list: Array<number | { id: number }> = []): number[] {
    return list
      .map(item => this.extractId(item))
      .filter((id): id is number => id != null);
  }

  private resolveLabel(value: any, lookup: IdNome[] = []): string | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'string' && value && !/^\d+$/.test(value)) {
      return value;
    }

    if (typeof value === 'object') {
      const directLabel = value.label ?? value.nome ?? value.descricao ?? null;
      if (directLabel) {
        return directLabel;
      }
    }

    const id = this.extractId(value);
    const match = lookup.find(item => Number(item.id) === Number(id));
    return match?.nome ?? match?.label ?? match?.descricao ?? null;
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

  private buildPoliticaResumo(politica: PoliticaRevenda | null): string {
    if (!politica) {
      return 'Sem política aplicada ao produto.';
    }

    if (politica.percentual && politica.percentualDesconto != null) {
      return `Desconto de ${politica.percentualDesconto}% herdado do produto.`;
    }

    if (!politica.percentual && politica.precoFixo != null) {
      return `Preço fixo de revenda ${this.moeda(politica.precoFixo)} herdado do produto.`;
    }

    return 'Política de revenda herdada do produto.';
  }

  private moeda(valor: any): string {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
      return '—';
    }

    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numero);
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
