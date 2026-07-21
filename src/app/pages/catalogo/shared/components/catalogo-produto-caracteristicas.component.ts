import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import {
  CatalogoCaracteristica,
  CatalogoProdutoCaracteristica,
  CatalogoProdutoCaracteristicaRequest,
} from '../models/catalogo.models';
import {
  catalogoLabel,
  CATALOGO_UNIDADES_CARACTERISTICA,
} from '../utils/catalogo-utils';

@Component({
  selector: 'app-catalogo-produto-caracteristicas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="catalogo-caracteristicas" [formGroup]="form">
      <div class="empty" *ngIf="!definicoes?.length">
        Selecione uma categoria para carregar as caracteristicas.
      </div>

      <div class="caracteristica" *ngFor="let item of definicoes; trackBy: trackByCaracteristica">
        <div class="caracteristica__header">
          <div>
            <strong>{{ item.nome }}</strong>
            <small *ngIf="item.categoriaOrigemNome">Herdada de: {{ item.categoriaOrigemNome }}</small>
            <small *ngIf="item.unidade && item.unidade !== 'SEM_UNIDADE'">{{ unidadeLabel(item.unidade) }}</small>
          </div>
          <span *ngIf="item.obrigatoria">Obrigatoria</span>
        </div>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'TEXTO'">
          <mat-label>{{ item.nome }}</mat-label>
          <input matInput [formControlName]="controlName(item)" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'TEXTO_LONGO'">
          <mat-label>{{ item.nome }}</mat-label>
          <textarea matInput rows="3" [formControlName]="controlName(item)"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'INTEIRO' || item.tipo === 'DECIMAL'">
          <mat-label>{{ item.nome }}</mat-label>
          <input matInput type="number" [step]="item.tipo === 'DECIMAL' ? decimalStep(item) : 1" [formControlName]="controlName(item)" />
          <mat-error *ngIf="form.get(controlName(item))?.hasError('min')">Valor abaixo do minimo.</mat-error>
          <mat-error *ngIf="form.get(controlName(item))?.hasError('max')">Valor acima do maximo.</mat-error>
        </mat-form-field>

        <mat-checkbox *ngIf="item.tipo === 'BOOLEANO'" [formControlName]="controlName(item)">
          {{ item.nome }}
        </mat-checkbox>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'DATA'">
          <mat-label>{{ item.nome }}</mat-label>
          <input matInput type="date" [formControlName]="controlName(item)" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'SELECAO_UNICA'">
          <mat-label>{{ item.nome }}</mat-label>
          <mat-select [formControlName]="controlName(item)">
            <mat-option [value]="null">Nenhuma</mat-option>
            <mat-option *ngFor="let opcao of opcoesAtivas(item)" [value]="opcao.id">
              {{ opcao.nome }} <span *ngIf="opcao.ativo === false">(inativa)</span>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-100" *ngIf="item.tipo === 'SELECAO_MULTIPLA'">
          <mat-label>{{ item.nome }}</mat-label>
          <mat-select multiple [formControlName]="controlName(item)">
            <mat-option *ngFor="let opcao of opcoesAtivas(item)" [value]="opcao.id">
              {{ opcao.nome }} <span *ngIf="opcao.ativo === false">(inativa)</span>
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .catalogo-caracteristicas {
      display: grid;
      gap: 12px;
    }

    .caracteristica {
      border: 1px solid #e5eaef;
      border-radius: 8px;
      padding: 12px;
    }

    .caracteristica__header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }

    .caracteristica__header small {
      display: block;
      color: #6b7280;
      margin-top: 2px;
    }

    .caracteristica__header span {
      color: #d32f2f;
      font-size: 12px;
      font-weight: 600;
    }

    .empty {
      color: #6b7280;
      padding: 12px 0;
    }
  `],
})
export class CatalogoProdutoCaracteristicasComponent implements OnChanges {
  @Input() definicoes: CatalogoCaracteristica[] = [];
  @Input() valores: CatalogoProdutoCaracteristica[] = [];
  @Output() validChange = new EventEmitter<boolean>();

  form: FormGroup = this.fb.group({});

  constructor(private readonly fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['definicoes'] || changes['valores']) {
      this.rebuildForm();
    }
  }

  buildPayload(): CatalogoProdutoCaracteristicaRequest[] {
    return (this.definicoes || []).map((definicao) => {
      const value = this.form.get(this.controlName(definicao))?.value;
      const request: CatalogoProdutoCaracteristicaRequest = {
        caracteristicaId: definicao.id,
      };

      switch (definicao.tipo) {
        case 'TEXTO':
        case 'TEXTO_LONGO':
          request.valorTexto = value === '' || value === undefined ? null : value;
          break;
        case 'INTEIRO':
          request.valorInteiro = value === '' || value === null || value === undefined ? null : Number(value);
          break;
        case 'DECIMAL':
          request.valorDecimal = value === '' || value === null || value === undefined ? null : Number(value);
          break;
        case 'BOOLEANO':
          request.valorBooleano = value === null || value === undefined ? null : !!value;
          break;
        case 'DATA':
          request.valorData = value || null;
          break;
        case 'SELECAO_UNICA':
          request.opcaoIds = value ? [Number(value)] : [];
          break;
        case 'SELECAO_MULTIPLA':
          request.opcaoIds = Array.isArray(value) ? value.map(Number) : [];
          break;
      }

      return request;
    });
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  isValid(): boolean {
    return this.form.valid;
  }

  controlName(item: CatalogoCaracteristica): string {
    return `caracteristica_${item.id}`;
  }

  unidadeLabel(value: any): string {
    return catalogoLabel(CATALOGO_UNIDADES_CARACTERISTICA, value);
  }

  decimalStep(item: CatalogoCaracteristica): string {
    const casas = Math.max(0, item.casasDecimais ?? 2);
    return casas === 0 ? '1' : `0.${'0'.repeat(Math.max(0, casas - 1))}1`;
  }

  opcoesAtivas(item: CatalogoCaracteristica): any[] {
    const atual = this.valorExistente(item)?.opcoes?.map((opcao) => opcao.id).filter(Boolean) || [];
    return (item.opcoes || []).filter((opcao) => opcao.ativo !== false || atual.includes(opcao.id || 0));
  }

  trackByCaracteristica(_index: number, item: CatalogoCaracteristica): number {
    return item.id;
  }

  private rebuildForm(): void {
    const group: Record<string, FormControl> = {};

    (this.definicoes || []).forEach((definicao) => {
      group[this.controlName(definicao)] = new FormControl(
        this.initialValue(definicao),
        this.validatorsFor(definicao)
      );
    });

    this.form = this.fb.group(group);
    this.validChange.emit(this.form.valid);
    this.form.statusChanges.subscribe(() => this.validChange.emit(this.form.valid));
  }

  private initialValue(definicao: CatalogoCaracteristica): any {
    const valor = this.valorExistente(definicao);
    if (!valor) {
      return definicao.tipo === 'SELECAO_MULTIPLA' ? [] : null;
    }

    switch (definicao.tipo) {
      case 'TEXTO':
      case 'TEXTO_LONGO':
        return valor.valorTexto ?? null;
      case 'INTEIRO':
        return valor.valorInteiro ?? null;
      case 'DECIMAL':
        return valor.valorDecimal ?? null;
      case 'BOOLEANO':
        return valor.valorBooleano ?? false;
      case 'DATA':
        return valor.valorData ?? null;
      case 'SELECAO_UNICA':
        return valor.opcoes?.[0]?.id ?? null;
      case 'SELECAO_MULTIPLA':
        return valor.opcoes?.map((opcao) => opcao.id).filter(Boolean) ?? [];
    }
  }

  private validatorsFor(definicao: CatalogoCaracteristica): any[] {
    const validators = [];
    if (definicao.obrigatoria) {
      validators.push(Validators.required);
    }
    if (definicao.valorMinimo !== undefined && definicao.valorMinimo !== null) {
      validators.push(Validators.min(Number(definicao.valorMinimo)));
    }
    if (definicao.valorMaximo !== undefined && definicao.valorMaximo !== null) {
      validators.push(Validators.max(Number(definicao.valorMaximo)));
    }
    return validators;
  }

  private valorExistente(definicao: CatalogoCaracteristica): CatalogoProdutoCaracteristica | undefined {
    return (this.valores || []).find((valor) => valor.caracteristicaId === definicao.id);
  }
}
