// src/app/pages/onboarding/onboarding-wizard.component.ts
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ToastrService } from 'ngx-toastr';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { AcabamentoPadraoResumidoResponse } from 'src/app/models/acabamento-padrao/acabamento-padrao-resumido-response';
import { OnboardingService } from './onboarding.service';
import { CommonModule } from '@angular/common';
import { CardHeaderComponent } from "../card-header/card-header.component";
import { EmpresaFormComponent } from "src/app/pages/empresa/empresa-form.component";
import { Empresa } from 'src/app/models/empresa/empresa.model';

export interface OnboardingWizardData {
  empresaNome: string;
}

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCheckboxModule,
    BrandingComponent,
    CardHeaderComponent,
    EmpresaFormComponent
],
  templateUrl: './onboarding-wizard.component.html',
})
export class OnboardingWizardComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Step 1: grupo “dummy” só pra deixar o step válido no modo linear
  empresaStepGroup: FormGroup;
  acabamentosForm: FormGroup;
  finalForm: FormGroup;

  carregandoAcabamentos = true;
  acabamentosPadrao: AcabamentoPadraoResumidoResponse[] = [];
  selecionados = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<OnboardingWizardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OnboardingWizardData
  ) {
    this.empresaStepGroup = this.fb.group({
      done: [false, Validators.requiredTrue],
    });

    this.acabamentosForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.finalForm = this.fb.group({
      naoMostrarMais: [false],
    });
  }

  ngOnInit(): void {
    this.onboardingService.listarAcabamentosPadrao().subscribe({
      next: (lista) => {
        this.acabamentosPadrao = lista;
        this.carregandoAcabamentos = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar acabamentos padrão');
        this.carregandoAcabamentos = false;
      },
    });
  }

  get naoMostrarMais(): boolean {
    return this.finalForm.get('naoMostrarMais')?.value === true;
  }

  toggleAcabamento(checked: boolean, id: number): void {
    if (checked) {
      this.selecionados.add(id);
    } else {
      this.selecionados.delete(id);
    }
    this.acabamentosForm
      .get('selecionadosIds')
      ?.setValue(Array.from(this.selecionados));
  }

  /**
   * Chamado pelo <app-empresa-form> quando salvar com sucesso.
   */
  onEmpresaSalva(empresa: Empresa): void {
    // marca o step 1 como válido
    this.empresaStepGroup.get('done')?.setValue(true);

    // avisa o backend que o step de dados da empresa foi concluído
    this.onboardingService.concluirTarefa({ step: 'DADOS_EMPRESA' }).subscribe({
      next: () => {
        this.toastr.success(
          'Dados da empresa salvos e etapa concluída com sucesso.'
        );
        this.stepper.next(); // 👉 aqui ele deve ir para o step 2
      },
      error: () => {
        this.toastr.error('Erro ao concluir etapa de dados da empresa.');
      },
    });
  }

  // STEP 2
  salvarAcabamentosEProsseguir(): void {
    const ids = Array.from(this.selecionados);

    if (!ids.length) {
      this.toastr.warning(
        'Selecione pelo menos um acabamento ou pule essa etapa.'
      );
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'ACABAMENTOS_PADRAO',
        acabamentosSelecionadosIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Acabamentos padrão adicionados com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar acabamentos padrão.');
        },
      });
  }

  // STEP 3
  finalizarOnboarding(): void {
    if (this.naoMostrarMais) {
      this.onboardingService.desativarOnboarding().subscribe({
        next: () => {
          this.toastr.success('Onboarding desativado para próximos acessos.');
          this.dialogRef.close(true);
        },
        error: () => {
          this.toastr.error('Erro ao desativar onboarding.');
          this.dialogRef.close(false);
        },
      });
    } else {
      this.toastr.success('Onboarding concluído!');
      this.dialogRef.close(true);
    }
  }
}
