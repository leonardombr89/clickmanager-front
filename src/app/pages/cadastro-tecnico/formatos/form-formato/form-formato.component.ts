import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Formato } from 'src/app/models/formato.model';
import { FormatoService } from '../../services/formato.service';

@Component({
  selector: 'app-form-formato',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './form-formato.component.html',
  styleUrl: './form-formato.component.scss'
})
export class FormFormatoComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  formatoId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private formatoService: FormatoService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      larguraCm: [null, [Validators.required, Validators.min(0.1)]],
      alturaCm: [null, [Validators.required, Validators.min(0.1)]],
      larguraUtilCm: [null, [Validators.required, Validators.min(0.1)]],
      alturaUtilCm: [null, [Validators.required, Validators.min(0.1)]],
      ativo: [true]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.formatoId = +id;
        this.carregarFormato(this.formatoId);
      }
    });
  }

  carregarFormato(id: number): void {
    this.formatoService.buscarPorId(id).subscribe({
      next: (formato: Formato) => {
        this.form.patchValue({
          nome: formato.nome,
          larguraCm: formato.larguraCm,
          alturaCm: formato.alturaCm,
          larguraUtilCm: formato.larguraUtilCm,
          alturaUtilCm: formato.alturaUtilCm,
          ativo: formato.ativo
        });
      },
      error: () => {
        this.toastr.error('Erro ao carregar formato.');
        this.router.navigate(['/page/cadastro-tecnico/formatos']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const formatoData = this.form.value as Formato;

    if (this.isEditMode) {
      this.formatoService.atualizar(this.formatoId, formatoData).subscribe({
        next: () => {
          this.toastr.success('Formato atualizado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/formatos']);
        },
        error: () => this.toastr.error('Erro ao atualizar formato.')
      });
    } else {
      this.formatoService.salvar(formatoData).subscribe({
        next: () => {
          this.toastr.success('Formato criado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/formatos']);
        },
        error: () => this.toastr.error('Erro ao criar formato.')
      });
    }
  }

  updateErrorMessage(): void {
    Object.keys(this.form.controls).forEach(field => {
      const control = this.form.get(field);
      if (control && control.invalid && (control.dirty || control.touched)) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control?.hasError('min')) {
      return 'Valor deve ser maior que zero';
    }
    return 'Campo inválido';
  }
}
