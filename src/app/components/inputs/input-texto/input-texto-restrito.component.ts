import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-texto-restrito',
  standalone: true,
  templateUrl: './input-texto-restrito.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextoRestritoComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() maxlength: number = 200;

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-input-texto-restrito>');
    }
  }

  updateErrorMessage(): void {
    this.control.markAsTouched();
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (this.control.hasError('maxlength')) {
      return "Máximo de ${this.control.getError('maxlength')?.requiredLength} caracteres";
    }
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  permitirSomenteLetrasENumeros(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isValidChar = /^[a-zA-Z0-9À-ÿ ]$/.test(event.key);
    if (!isValidChar && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  atualizarValor(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const filtrado = input.replace(/[^a-zA-Z0-9À-ÿ ]/g, '');
    this.control.setValue(filtrado);
  }
}