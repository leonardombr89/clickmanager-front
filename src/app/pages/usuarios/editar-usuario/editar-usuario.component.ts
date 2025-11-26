import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { PerfilService } from '../services/perfil.service';
import { ToastrService } from 'ngx-toastr';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule
  ],
  templateUrl: './editar-usuario.component.html',
  styleUrl: './editar-usuario.component.scss'
})
export class EditarUsuarioComponent implements OnInit {
  form!: FormGroup;
  perfis: any[] = [];
  usuarioId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private perfilService: PerfilService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(50), Validators.email]],
      perfilId: [null, [Validators.required]],
      ativo: [true]
    });
  
    this.perfilService.listar().subscribe(perfis => {
      this.perfis = perfis;
  
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.usuarioId = +id;
        this.usuarioService.buscarPorId(this.usuarioId).subscribe(usuario => {
          this.form.patchValue({
            nome: usuario.nome,
            username: usuario.username,
            perfilId: usuario.perfil?.id,
            ativo: usuario.ativo
          });
        });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const usuarioAtualizado = this.form.value;
    this.usuarioService.atualizar(this.usuarioId, usuarioAtualizado).subscribe({
      next: () => this.toastrService.success('Usuário atualizado com sucesso!'),
      error: () => this.toastrService.error('Erro ao atualizar usuário.')
    });
  }

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) return 'Campo obrigatório';
    if (control?.hasError('maxlength')) return `Máximo de ${control.getError('maxlength').requiredLength} caracteres`;
    if (control?.hasError('minlength')) return `Mínimo de ${control.getError('minlength').requiredLength} caracteres`;
    if (control?.hasError('email')) return 'E-mail inválido';
    return 'Campo inválido';
  }
}
