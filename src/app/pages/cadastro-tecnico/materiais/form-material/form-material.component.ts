import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Material } from 'src/app/models/material.model';
import { MaterialService } from '../../services/material.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-form-material',
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
  templateUrl: './form-material.component.html',
  styleUrl: './form-material.component.scss'
})
export class FormMaterialComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  materialId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private materialService: MaterialService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      ativo: [true]
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.materialId = +id;
        this.carregarMaterial(this.materialId);
      }
    });
  }

  carregarMaterial(id: number): void {
    this.materialService.buscarPorId(id).subscribe({
      next: (material: Material) => {
        this.form.patchValue({
          nome: material.nome,
          descricao: material.descricao,
          ativo: material.ativo
        });
      },
      error: () => {
        this.toastr.error('Erro ao carregar material.');
        this.router.navigate(['/page/cadastro-tecnico/materiais']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const materialData = this.form.value as Material;

    if (this.isEditMode) {
      this.materialService.atualizar(this.materialId, materialData).subscribe({
        next: () => {
          this.toastr.success('Material atualizado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/materiais']);
        },
        error: () => this.toastr.error('Erro ao atualizar material.')
      });
    } else {
      this.materialService.salvar(materialData).subscribe({
        next: () => {
          this.toastr.success('Material criado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/materiais']);
        },
        error: () => this.toastr.error('Erro ao criar material.')
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
    return 'Campo inválido';
  }
}
