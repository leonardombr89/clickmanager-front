import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { LandingEtapaFunil, LandingpagePublicService } from 'src/app/pages/theme-pages/landingpage/landingpage-public.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-boxed-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
    InputTextoRestritoComponent,
    InputTelefoneComponent,
    InputEmailComponent,
  ],
  templateUrl: './boxed-register.component.html',
  styleUrl: './boxed-register.component.scss',
})
export class AppBoxedRegisterComponent implements OnInit, AfterViewInit {
  private readonly cadastroConcluidoStorageKey = 'clickmanager:onboarding:cadastro-concluido';
  private readonly landingSessionStorageKey = 'clickmanager:landing:session-id';
  private readonly landingStageStoragePrefix = 'clickmanager:landing:stage';
  private readonly pageTitle = 'Cadastro de Empresa';
  private sessionId = '';
  submitting = false;
  showPassword = false;
  showConfirmPassword = false;

  @ViewChild('registerCard') registerCard?: ElementRef<HTMLElement>;

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private toastr: ToastrService,
    private onboardingService: OnboardingService,
    private landingpagePublicService: LandingpagePublicService,
    private authService: AuthService
  ) { }

  // Formulário aninhado: empresa + usuario
  form = new FormGroup({
    empresa: new FormGroup({
      nome: new FormControl<string | null>('', [Validators.required]),
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
    this.sessionId = this.ensureSessionId();
    this.registrarEtapaFunil('FORMULARIO_VISUALIZADO');
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.registerCard?.nativeElement.querySelector<HTMLInputElement>('input')?.focus();
    });
  }

  // getters para facilitar o template
  get empresa(): FormGroup {
    return this.form.get('empresa') as FormGroup;
  }

  get usuario(): FormGroup {
    return this.form.get('usuario') as FormGroup;
  }

  get empresaNomeControl(): FormControl {
    return this.empresa.get('nome') as FormControl;
  }

  get usuarioNomeControl(): FormControl {
    return this.usuario.get('nome') as FormControl;
  }

  get usuarioEmailControl(): FormControl {
    return this.usuario.get('email') as FormControl;
  }

  get usuarioTelefoneControl(): FormControl {
    return this.usuario.get('telefone') as FormControl;
  }

  get usuarioSenhaControl(): FormControl {
    return this.usuario.get('senha') as FormControl;
  }

  get usuarioConfirmarSenhaControl(): FormControl {
    return this.usuario.get('confirmarSenha') as FormControl;
  }

  get senhaDivergente(): boolean {
    const senha = this.usuario.get('senha')?.value;
    const confirmar = this.usuario.get('confirmarSenha')?.value;
    return !!senha && !!confirmar && senha !== confirmar;
  }

  get formPronto(): boolean {
    return this.form.valid && !this.senhaDivergente;
  }

  get ctaLabel(): string {
    return this.submitting ? 'Criando sua conta...' : 'Começar agora';
  }

  get senhaStrengthLabel(): string {
    const senha = this.usuarioSenhaControl.value ?? '';
    if (!senha) {
      return '';
    }

    if (senha.length < 8) {
      return 'Senha básica';
    }

    const hasLetter = /[A-Za-z]/.test(senha);
    const hasNumber = /\d/.test(senha);
    const hasSymbol = /[^A-Za-z0-9]/.test(senha);

    if (hasLetter && hasNumber && hasSymbol) {
      return 'Senha forte';
    }

    if (hasLetter && hasNumber) {
      return 'Senha boa';
    }

    return 'Senha básica';
  }

  get senhaStrengthClass(): string {
    const senha = this.usuarioSenhaControl.value ?? '';
    if (!senha || senha.length < 8) {
      return 'strength-basic';
    }

    const hasLetter = /[A-Za-z]/.test(senha);
    const hasNumber = /\d/.test(senha);
    const hasSymbol = /[^A-Za-z0-9]/.test(senha);

    if (hasLetter && hasNumber && hasSymbol) {
      return 'strength-strong';
    }

    if (hasLetter && hasNumber) {
      return 'strength-good';
    }

    return 'strength-basic';
  }

  get confirmarSenhaHint(): string {
    if (!this.usuarioConfirmarSenhaControl.value) {
      return '';
    }

    return this.senhaDivergente ? 'As senhas não coincidem' : 'Senhas coincidem';
  }

  handleEnter(event: Event): void {
    const target = event.target as HTMLElement | null;
    if (!target || target.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();

    const focusables = Array.from(
      this.registerCard?.nativeElement.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        'form input, form button[type="submit"]'
      ) ?? []
    ).filter(element => !element.disabled && element.offsetParent !== null);

    const currentIndex = focusables.indexOf(target as HTMLInputElement);
    const nextElement = focusables[currentIndex + 1];

    if (nextElement) {
      nextElement.focus();
      return;
    }

    if (this.formPronto && !this.submitting) {
      this.submit();
    }
  }

  submit() {
    if (this.submitting) {
      return;
    }

    if (this.form.invalid || this.senhaDivergente) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;

    const empresa = raw.empresa!;
    const usuario = raw.usuario!;
    const telefone = usuario.telefone?.trim() || undefined;

    const payload = {
      empresa: {
        nome: empresa.nome!,
        ...(telefone ? { telefone } : {})
      },
      usuario: {
        nome: usuario.nome!,
        username: usuario.email!,
        email: usuario.email!,
        ...(telefone ? { telefone } : {}),
        senha: usuario.senha!,
        proprietario: true
      },
    };

    this.submitting = true;

    this.onboardingService.registrarEmpresaComGestor(payload).subscribe({
      next: response => {
        const finalizarFluxo = () => {
          sessionStorage.setItem(this.cadastroConcluidoStorageKey, JSON.stringify(response));
          this.toastr.success('Empresa e gestor cadastrados com sucesso!');
          this.submitting = false;
          this.router.navigate(['authentication/cadastro-concluido'], {
            state: {
              cadastro: response
            }
          });
        };

        const autenticar = () => {
          if (!response.autenticado || !response.accessToken || !response.refreshToken) {
            finalizarFluxo();
            return;
          }

          this.authService.autenticarComTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            tokenType: response.tokenType,
          }).subscribe({
            next: () => finalizarFluxo(),
            error: err => {
              this.submitting = false;
              const msg = err?.error?.message || err?.message || 'Erro ao autenticar após o cadastro';
              this.toastr.error(msg);
            }
          });
        };

        this.registrarEtapaFunil('FORMULARIO_CONCLUIDO', autenticar);
      },
      error: err => {
        this.submitting = false;
        const msg = err?.error?.message || 'Erro desconhecido';
        this.toastr.error('Erro ao concluir cadastro: ' + msg);
      }
    });
  }

  private registrarEtapaFunil(etapaFunil: LandingEtapaFunil, onComplete?: () => void): void {
    const stageStorageKey = `${this.landingStageStoragePrefix}:${etapaFunil}:${this.getCurrentPath()}`;
    if (sessionStorage.getItem(stageStorageKey)) {
      onComplete?.();
      return;
    }

    this.landingpagePublicService.registrarEtapa({
      pagina: this.pageTitle,
      path: this.getCurrentPath(),
      sessionId: this.sessionId,
      etapaFunil,
    }).subscribe({
      next: () => {
        sessionStorage.setItem(stageStorageKey, '1');
        onComplete?.();
      },
      error: () => onComplete?.(),
    });
  }

  private ensureSessionId(): string {
    const existing = localStorage.getItem(this.landingSessionStorageKey);
    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `landing-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(this.landingSessionStorageKey, generated);
    return generated;
  }

  private getCurrentPath(): string {
    return window.location.pathname || '/';
  }
}
