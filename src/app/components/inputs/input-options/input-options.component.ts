import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-input-options',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './input-options.component.html'
})
export class InputOptionsComponent {
  @Input() control!: FormControl;
  @Input() label: string = 'Selecione uma opção';
  @Input() placeholder: string = '- Selecione -';
  @Input() options: string[] = [];

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Valor inválido';
  }
}
