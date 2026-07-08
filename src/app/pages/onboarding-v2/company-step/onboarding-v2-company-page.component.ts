import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { InputCepComponent } from 'src/app/components/inputs/input-cep/input-cep.component';
import { InputDocumentoComponent } from 'src/app/components/inputs/input-documento/input-documento.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { OnboardingShellComponent } from 'src/app/components/onboarding/onboarding-shell.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { EnderecoViaCep } from 'src/app/models/endereco/endereco.viacep.model';
import {
  OnboardingV2CompanyPayload,
  isOnboardingV2Finished,
  resolveOnboardingV2RouteFromProgress,
  resolveOnboardingV2StepFromProgress,
} from '../models/onboarding-v2.models';
import { OnboardingV2StateService } from '../services/onboarding-v2-state.service';

@Component({
  selector: 'app-onboarding-v2-company-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    OnboardingShellComponent,
    SectionCardComponent,
    InputTextoRestritoComponent,
    InputTelefoneComponent,
    InputEmailComponent,
    InputDocumentoComponent,
    InputCepComponent,
  ],
  templateUrl: './onboarding-v2-company-page.component.html',
  styleUrls: ['./onboarding-v2-company-page.component.scss'],
})
export class OnboardingV2CompanyPageComponent implements OnInit {
  readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    telefone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    cnpj: [''],
    inscricaoEstadual: [''],
    horario: [''],
    responsavelNome: ['', [Validators.required, Validators.minLength(2)]],
    responsavelTelefone: [''],
    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      cidade: [''],
      estado: [''],
    }),
  });

  carregando = true;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly authService: AuthService,
    protected readonly onboardingV2State: OnboardingV2StateService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/onboarding-v2']);
      return;
    }

    this.loadStep();
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get telefoneControl(): FormControl {
    return this.form.get('telefone') as FormControl;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get cnpjControl(): FormControl {
    return this.form.get('cnpj') as FormControl;
  }

  get inscricaoEstadualControl(): FormControl {
    return this.form.get('inscricaoEstadual') as FormControl;
  }

  get horarioControl(): FormControl {
    return this.form.get('horario') as FormControl;
  }

  get responsavelNomeControl(): FormControl {
    return this.form.get('responsavelNome') as FormControl;
  }

  get responsavelTelefoneControl(): FormControl {
    return this.form.get('responsavelTelefone') as FormControl;
  }

  get enderecoGroup(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  get cepControl(): FormControl {
    return this.enderecoGroup.get('cep') as FormControl;
  }

  get logradouroControl(): FormControl {
    return this.enderecoGroup.get('logradouro') as FormControl;
  }

  get numeroControl(): FormControl {
    return this.enderecoGroup.get('numero') as FormControl;
  }

  get complementoControl(): FormControl {
    return this.enderecoGroup.get('complemento') as FormControl;
  }

  get bairroControl(): FormControl {
    return this.enderecoGroup.get('bairro') as FormControl;
  }

  get cidadeControl(): FormControl {
    return this.enderecoGroup.get('cidade') as FormControl;
  }

  get estadoControl(): FormControl {
    return this.enderecoGroup.get('estado') as FormControl;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.onboardingV2State.saveCompany(this.buildPayload()).subscribe({
      next: (progress) => {
        this.toastr.success('Dados salvos. Agora vamos escolher sua base inicial de produtos.');
        this.router.navigateByUrl(resolveOnboardingV2RouteFromProgress(progress));
      },
      error: () => {
        this.toastr.error(this.onboardingV2State.error() || 'Erro ao salvar os dados da empresa.');
      },
    });
  }

  preencherEnderecoViaCep(endereco: EnderecoViaCep | null): void {
    if (!endereco) {
      return;
    }

    this.enderecoGroup.patchValue({
      logradouro: endereco.logradouro || '',
      bairro: endereco.bairro || '',
      cidade: endereco.localidade || '',
      estado: endereco.uf || '',
    });
  }

  private loadStep(): void {
    this.carregando = true;

    this.onboardingV2State
      .refreshProgress()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (progress) => {
          if (progress.onboardingVersion !== 'v2') {
            this.router.navigateByUrl(this.authService.getOnboardingRouteForUsuario(progress.onboardingConcluido));
            return;
          }

          if (isOnboardingV2Finished(progress)) {
            this.router.navigateByUrl(this.authService.getDefaultRouteForUsuario());
            return;
          }

          if (resolveOnboardingV2StepFromProgress(progress) !== 'company') {
            this.router.navigateByUrl(resolveOnboardingV2RouteFromProgress(progress));
            return;
          }

          this.patchForm(progress);
        },
        error: () => {
          this.toastr.error(this.onboardingV2State.error() || 'Não foi possível carregar o onboarding.');
        },
      });
  }

  private patchForm(progress: { empresa: any }): void {
    const empresa = progress.empresa || {};
    const endereco = empresa.endereco || {};

    this.form.patchValue({
      nome: empresa.nome || '',
      telefone: empresa.telefone || '',
      email: empresa.email || '',
      cnpj: empresa.cnpj || '',
      inscricaoEstadual: empresa.inscricaoEstadual || '',
      horario: empresa.horario || '',
      responsavelNome: empresa.responsavelNome || '',
      responsavelTelefone: empresa.responsavelTelefone || '',
      endereco: {
        cep: endereco.cep || '',
        logradouro: endereco.logradouro || '',
        numero: endereco.numero || '',
        complemento: endereco.complemento || '',
        bairro: endereco.bairro || '',
        cidade: endereco.cidade || '',
        estado: endereco.estado || '',
      },
    });
  }

  private buildPayload(): OnboardingV2CompanyPayload {
    const raw = this.form.getRawValue();
    const enderecoRaw = raw.endereco || {};

    return {
      nome: raw.nome,
      telefone: raw.telefone || null,
      email: raw.email || null,
      cnpj: raw.cnpj || null,
      inscricaoEstadual: raw.inscricaoEstadual || null,
      horario: raw.horario || null,
      responsavelNome: raw.responsavelNome || null,
      responsavelTelefone: raw.responsavelTelefone || null,
      endereco: this.hasEnderecoValue(enderecoRaw)
        ? {
            cep: enderecoRaw.cep || null,
            logradouro: enderecoRaw.logradouro || null,
            numero: enderecoRaw.numero || null,
            complemento: enderecoRaw.complemento || null,
            bairro: enderecoRaw.bairro || null,
            cidade: enderecoRaw.cidade || null,
            estado: enderecoRaw.estado || null,
          }
        : null,
    };
  }

  private hasEnderecoValue(endereco: Record<string, string | null | undefined>): boolean {
    return Object.values(endereco).some((value) => !!String(value || '').trim());
  }
}
