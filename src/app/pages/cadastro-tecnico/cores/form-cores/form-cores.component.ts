import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Cor } from 'src/app/models/cor.model';
import { CorService } from '../../services/cor.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-form-cores',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    CardHeaderComponent
],
  templateUrl: './form-cores.component.html',
  styleUrl: './form-cores.component.scss'
})
export class FormCoresComponent implements OnInit{
  form!: FormGroup;
  isEditMode = false;
  corId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private coresService: CorService,
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
        this.corId = +id;
        this.carregarCor(this.corId);
      }
    });
  }

  carregarCor(id: number): void {
    this.coresService.buscarPorId(id).subscribe({
      next: (cor: Cor) => {
        this.form.patchValue({
          nome: cor.nome,
          descricao: cor.descricao,
          ativo: cor.ativo
        });
      },
      error: () => {
        this.toastr.error('Erro ao carregar cor.');
        this.router.navigate(['/page/cadastro-tecnico/cores']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const corData = this.form.value as Cor;

    if (this.isEditMode) {
      this.coresService.atualizar(this.corId, corData).subscribe({
        next: () => {
          this.toastr.success('Cor atualizada com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/cores']);
        },
        error: () => this.toastr.error('Erro ao atualizar cor.')
      });
    } else {
      this.coresService.salvar(corData).subscribe({
        next: () => {
          this.toastr.success('Cor criada com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/cores']);
        },
        error: () => this.toastr.error('Erro ao criar cor.')
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
