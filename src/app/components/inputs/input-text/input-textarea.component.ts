import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
    selector: 'app-input-textarea',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule
    ],
    templateUrl: './input-textarea.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputTextareaComponent implements OnInit {
    @Input() control!: FormControl;
    @Input() label: string = 'Textarea';
    @Input() placeholder: string = '';
    @Input() rows: number = 5;
    @Input() maxlength: number = 255;

    ngOnInit(): void {
        if (!this.control) {
            throw new Error('O FormControl é obrigatório para <app-input-textarea>');
        }

        const validators = this.control.validator ? [this.control.validator] : [];
        this.control.setValidators([
            ...validators,
            this.maxlength ? Validators.maxLength(this.maxlength) : Validators.nullValidator
        ]);
        this.control.updateValueAndValidity();
    }

    get isRequired(): boolean {
        return this.control?.validator?.({} as any)?.['required'] ?? false;
    }

    errorMessage(): string {
        if (this.control.hasError('required')) {
            return 'Campo obrigatório';
        }
        if (this.control.hasError('maxlength')) {
            return `Máximo de ${this.control.getError('maxlength')?.requiredLength} caracteres`;
        }
        return 'Valor inválido';
    }
}

