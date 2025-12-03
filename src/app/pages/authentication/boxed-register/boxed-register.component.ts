import { Component, OnInit } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { ToastrService } from 'ngx-toastr';
import { OnboardingService } from '../side-register/side-register.service';

@Component({
  selector: 'app-boxed-register',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-register.component.html',
})
export class AppBoxedRegisterComponent implements OnInit {

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private toastr: ToastrService,
    private onboardingService: OnboardingService
  ) { }

  // Formulário aninhado: empresa + usuario
  form = new FormGroup({
    empresa: new FormGroup({
      nome: new FormControl<string | null>('', [Validators.required]),
      telefone: new FormControl<string | null>('', [Validators.required]),
      cnpj: new FormControl<string | null>('', [Validators.required])
    }),
    usuario: new FormGroup({
      nome: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)]),
      email: new FormControl<string | null>('', [Validators.required, Validators.email]),
      telefone: new FormControl<string | null>(''),
      senha: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)]),
      confirmarSenha: new FormControl<string | null>('', [Validators.required]),
    }),
  });

  ngOnInit(): void {
    // Aqui NÃO verificamos mais se já existe usuário,
    // pois agora cada empresa faz seu próprio cadastro (multi-tenant).
  }

  // getters para facilitar o template
  get empresa(): FormGroup {
    return this.form.get('empresa') as FormGroup;
  }

  get usuario(): FormGroup {
    return this.form.get('usuario') as FormGroup;
  }

  get senhaDivergente(): boolean {
    const senha = this.usuario.get('senha')?.value;
    const confirmar = this.usuario.get('confirmarSenha')?.value;
    return !!senha && !!confirmar && senha !== confirmar;
  }

  submit() {
    if (this.form.invalid || this.senhaDivergente) {
      this.form.markAllAsTouched();
      this.toastr.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const raw = this.form.value;

    const empresa = raw.empresa!;
    const usuario = raw.usuario!;

    const payload = {
      empresa: {
        nome: empresa.nome!,
        telefone: empresa.telefone!,
        cnpj: empresa.cnpj!
      },
      usuario: {
        nome: usuario.nome!,
        username: usuario.email!,       
        email: usuario.email!,
        telefone: usuario.telefone || '',
        senha: usuario.senha!,
        proprietario: true              
      },
    };

    this.onboardingService.registrarEmpresaComGestor(payload).subscribe({
      next: () => {
        this.toastr.success('Empresa e gestor cadastrados com sucesso!');
        this.router.navigate(['authentication/login']);
      },
      error: err => {
        const msg = err?.error?.message || 'Erro desconhecido';
        this.toastr.error('Erro ao concluir cadastro: ' + msg);
      }
    });
  }
}
