import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-lista-dinamica-input',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './lista-dinamica-input.component.html',
  styleUrl: './lista-dinamica-input.component.scss',
})
export class ListaDinamicaInputComponent {
  @Input({ required: true }) control!: FormControl<string[] | null>;
  @Input({ required: true }) label!: string;
  @Input() placeholder = 'Adicionar item';
  @Input() buttonLabel = 'Adicionar';
  @Input() helperText = '';

  valorAtual = '';

  get itens(): string[] {
    return (this.control?.value || []).filter((item): item is string => !!String(item || '').trim());
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.adicionar();
  }

  adicionar(): void {
    const valorNormalizado = String(this.valorAtual || '').trim();
    if (!valorNormalizado) {
      return;
    }

    const listaAtual = this.itens;
    if (listaAtual.includes(valorNormalizado)) {
      this.valorAtual = '';
      return;
    }

    this.control.setValue([...listaAtual, valorNormalizado]);
    this.control.markAsDirty();
    this.control.markAsTouched();
    this.valorAtual = '';
  }

  remover(item: string): void {
    this.control.setValue(this.itens.filter((valor) => valor !== item));
    this.control.markAsDirty();
    this.control.markAsTouched();
  }
}
