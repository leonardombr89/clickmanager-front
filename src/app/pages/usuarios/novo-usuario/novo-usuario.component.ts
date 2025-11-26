import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PerfilService } from '../services/perfil.service';
import { UsuarioService } from '../services/usuario.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-novo-usuario',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './novo-usuario.component.html',
  styleUrl: './novo-usuario.component.scss'
})
export class NovoUsuarioComponent implements OnInit {
  form!: FormGroup;
  perfis: any[] = [];
  isEditMode = false;
  usuarioId?: number;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private perfilService: PerfilService,
    private toastrService: ToastrService,
    private route: ActivatedRoute // ⬅️ novo
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(50), Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      perfilId: [null, [Validators.required]],
      ativo: [true] // ⬅️ campo adicional (só será exibido no HTML se for edição)
    });

    this.perfilService.listar().subscribe(perfis => (this.perfis = perfis));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.usuarioId = +id;
      this.carregarUsuario(this.usuarioId);
      this.form.get('senha')?.clearValidators(); // opcional: não exigir senha na edição
      this.form.get('senha')?.updateValueAndValidity();
    }
  }

  carregarUsuario(id: number): void {
    this.usuarioService.buscarPorId(id).subscribe(usuario => {
      this.form.patchValue(usuario);
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const usuario = this.form.value;

    if (this.isEditMode && this.usuarioId) {
      this.usuarioService.atualizar(this.usuarioId, usuario).subscribe({
        next: () => this.toastrService.success('Usuário atualizado com sucesso!', 'Fechar'),
        error: () => this.toastrService.error('Erro ao atualizar usuário.', 'Fechar')
      });
    } else {
      this.usuarioService.salvar(usuario).subscribe({
        next: () => {
          this.toastrService.success('Usuário cadastrado com sucesso!', 'Fechar');
          this.form.reset();
        },
        error: () => this.toastrService.error('Erro ao cadastrar usuário.', 'Fechar')
      });
    }
  }

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) return 'Campo obrigatório';
    if (control?.hasError('maxlength')) return `Máximo de ${control.getError('maxlength').requiredLength} caracteres`;
    if (control?.hasError('minlength')) return `Mínimo de ${control.getError('minlength').requiredLength} caracteres`;
    if (control?.hasError('email')) return 'E-mail inválido';
    return 'Campo inválido';
  }

  updateErrorMessage(): void {}
}

