import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { CepService } from 'src/app/services/cep.service';
import { InputTextoRestritoComponent } from '../inputs/input-texto/input-texto-restrito.component';

@Component({
  selector: 'app-endereco-form',
  standalone: true,
  templateUrl: './endereco-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ToastrModule,
    InputTextoRestritoComponent
  ]
})
export class EnderecoFormComponent implements OnInit {
    @Output() formReady = new EventEmitter<FormGroup>();
    enderecoForm!: FormGroup; 

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cepService: CepService
  ) {}

  ngOnInit(): void {
    this.enderecoForm = this.fb.group({
      cep: ['', Validators.required],
      logradouro: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
    });

    this.formReady.emit(this.enderecoForm);
  }

  getControl(nome: string): FormControl {
    const control = this.enderecoForm.get(nome);
    if (!control) throw new Error(`FormControl '${nome}' não encontrado`);
    return control as FormControl;
  }

  buscarEnderecoPorCep(): void {
    const cep = this.getControl('cep').value?.replace(/\D/g, '');

    if (!cep || cep.length < 8) return;

    this.cepService.buscarEnderecoPorCep(cep).subscribe({
      next: (dados) => {
        if (dados.erro) {
          this.toastr.warning('CEP não encontrado');
          return;
        }

        this.enderecoForm.patchValue({
          logradouro: dados.logradouro || '',
          bairro: dados.bairro || '',
          cidade: dados.localidade || '',
          estado: dados.uf || ''
        });
      },
      error: () => this.toastr.error('Erro ao buscar o endereço')
    });
  }

  isCampoObrigatorio(nome: string): boolean {
    const control = this.getControl(nome);
    const validator = control?.validator;
    if (!validator) return false;
  
    const validationResult = validator({} as AbstractControl);
    return validationResult?.['required'] ?? false;
  }
}
