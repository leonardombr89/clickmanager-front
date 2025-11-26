import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Acabamento } from 'src/app/models/acabamento/acabamento.model';
import { AcabamentoService } from '../../services/acabamento.service';
import { InputTextoRestritoComponent } from "../../../../components/inputs/input-texto/input-texto-restrito.component";
import { Observable } from 'rxjs/internal/Observable';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';

@Component({
  selector: 'app-form-acabamento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    PrecoSelectorComponent,
    InputTextoRestritoComponent
  ],
  templateUrl: './form-acabamento.component.html',
  styleUrl: './form-acabamento.component.scss'
})
export class FormAcabamentoComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  acabamentoId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private acabamentoService: AcabamentoService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['', Validators.required],
      preco: this.fb.group({
        tipo: ['', Validators.required]
      }),
      ativo: [true]
    });
  
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.acabamentoId = +id;
      this.carregarAcabamento(this.acabamentoId);
    }
  }

  carregarAcabamento(id: number): void {
    this.acabamentoService.buscarPorId(id).subscribe({
      next: (acabamento: Acabamento) => {
        this.form.patchValue({
          nome: acabamento.nome,
          descricao: acabamento.descricao,
          ativo: acabamento.ativo
        });
  
        // Preencher preco após o template renderizar o tipo
        const precoGroup = this.getFormGroup('preco');
        precoGroup.get('tipo')?.setValue(acabamento.preco.tipo);
  
        // Aguarda o tipo renderizar e os campos aparecerem
        setTimeout(() => {
          precoGroup.patchValue(acabamento.preco);
        });
      },
      error: () => {
        this.toastr.error('Erro ao carregar acabamento.');
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.updateErrorMessage();
      return;
    }
  
    const acabamentoData = this.form.value as Acabamento;

    console.log(this.form.value);
  
    const acao: Observable<Acabamento> = this.isEditMode
      ? this.acabamentoService.atualizar(this.acabamentoId, acabamentoData)
      : this.acabamentoService.salvar(acabamentoData);
  
    acao.subscribe({
      next: () => {
        const mensagem = this.isEditMode ? 'atualizado' : 'criado';
        this.toastr.success(`Acabamento ${mensagem} com sucesso!`);
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
      },
      error: () => {
        const mensagem = this.isEditMode ? 'atualizar' : 'criar';
        this.toastr.error(`Erro ao ${mensagem} acabamento.`);
      }
    });
  }
  
  updateErrorMessage(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  getFormControl(nome: string): FormControl {
    const control = this.form.get(nome);
    if (!control || !(control instanceof FormControl)) {
      throw new Error(`O controle '${nome}' não é um FormControl`);
    }
    return control;
  }

  getFormGroup(nome: string): FormGroup {
    const control = this.form.get(nome);
    if (!control || !(control instanceof FormGroup)) {
      throw new Error(`O controle '${nome}' não é um FormGroup`);
    }
    return control;
  }
  

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Campo inválido';
  }
}
