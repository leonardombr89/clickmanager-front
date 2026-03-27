import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-input-email',
  standalone: true,
  templateUrl: './input-custom.component.html',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputEmailComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label: string = 'E-mail';
  @Input() placeholder: string = 'Digite seu e-mail';
  @Input() autocomplete: string = 'email';
  @Input() maxlength: number = 200;
  @Input() requiredError: string = 'Campo obrigatório';
  @Input() emailError: string = 'E-mail inválido';
  readonly type: string = 'email'; // fixo

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-input-email>');
    }
  }

  updateErrorMessage(): void {
    this.control.markAsTouched();
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return this.requiredError;
    }
    if (this.control.hasError('maxlength')) {
      return `Máximo de ${this.control.getError('maxlength')?.requiredLength} caracteres`;
    }
    if (this.control.hasError('email')) {
      return this.emailError;
    }
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }
}
