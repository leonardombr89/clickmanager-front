import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { TablerIconsModule } from 'angular-tabler-icons';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ImagemUtil } from 'src/app/utils/imagem-util';
import { ToastrService } from 'ngx-toastr';
import { ValidadorUtil } from 'src/app/utils/validador-util';
import { EnderecoViaCep } from 'src/app/models/endereco/endereco.viacep.model';
import { CepUtilService } from 'src/app/utils/cep-util.service';
import { EmpresaFormService } from './empresa-form.service';
import { AuthService } from 'src/app/services/auth.service';
import { filter, take } from 'rxjs';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { Empresa } from 'src/app/models/empresa/empresa.model';


@Component({
  selector: 'app-empresa-form',
  standalone: true,
  templateUrl: './empresa-form.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    TablerIconsModule,
    NgxMaskDirective,
    CardHeaderComponent
],
  providers: [provideNgxMask()]
})
export class EmpresaFormComponent implements OnInit {

  @Input() modoOnboarding = false;
  @Output() empresaSalva = new EventEmitter<void>();

  form!: FormGroup;

  readonly IMAGEM_PADRAO = './assets/images/logos/LogoPadrao.png';
  imagemPreview: string | ArrayBuffer | null = null;
  imagemOriginal: string | null = './assets/images/logos/LogoPadrao.png';
  imagemBlob: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private cepUtilService: CepUtilService,
    private empresaService: EmpresaFormService,
    private authService: AuthService) { }

  ngOnInit(): void {
    this.form = this.criarFormulario();

    this.authService.usuario$
      .pipe(
        filter(usuario => !!usuario),
      ).subscribe(usuario => {
        if (usuario?.empresa?.id) {
          this.empresaService.buscarEmpresa(usuario.empresa.id).subscribe({
            next: empresa => this.preencherFormulario(empresa),
            error: () => this.toastr.warning('Erro ao buscar empresa')
          });
        }
      });
  }

  private criarFormulario(): FormGroup {
    return this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      telefone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      cnpj: ['', [Validators.required, ValidadorUtil.validarCNPJ]],
      inscricaoEstadual: [''],
      horario: [''],
      enderecoRequest: this.fb.group({
        cep: ['', Validators.required],
        logradouro: ['', Validators.required],
        numero: ['', Validators.required],
        complemento: [''],
        bairro: ['', Validators.required],
        cidade: ['', Validators.required],
        estado: ['', Validators.required]
      }),
      logo: [null]
    });
  }

  private preencherFormulario(empresa: Empresa): void {
    this.form.patchValue({
      nome: empresa.nome,
      telefone: empresa.telefone,
      email: empresa.email,
      cnpj: empresa.cnpj,
      inscricaoEstadual: empresa.inscricaoEstadual || '',
      horario: empresa.horario || '',
      enderecoRequest: {
        cep: empresa.endereco?.cep || '',
        logradouro: empresa.endereco?.logradouro || '',
        numero: empresa.endereco?.numero || '',
        complemento: empresa.endereco?.complemento || '',
        bairro: empresa.endereco?.bairro || '',
        cidade: empresa.endereco?.cidade || '',
        estado: empresa.endereco?.estado || ''
      }
    });

    this.imagemOriginal = empresa.logoPath
      ? ImagemUtil.montarUrlImagemLogo(empresa.logoPath)
      : this.IMAGEM_PADRAO;

    this.imagemPreview = this.imagemOriginal;
  }


  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    ImagemUtil.processarImagemSelecionada(file, 216, 340)
      .then(({ preview, blob }) => {
        this.imagemPreview = preview;

        const fileFromBlob = new File([blob], file.name, { type: blob.type });
        this.imagemBlob = fileFromBlob;
        this.form.get('fotoPerfil')?.setValue(fileFromBlob);
      })
      .catch(err => this.toastr.warning(err));
  }

  resetarImagem(input: HTMLInputElement): void {
    this.imagemPreview = null;
    this.imagemBlob = null;
    this.form.get('fotoPerfil')?.setValue(null);
    this.imagemOriginal = this.IMAGEM_PADRAO;

    if (input) input.value = '';
  }

  onSubmit(): void {
  if (this.form.invalid) {
    this.toastr.warning('Preencha todos os campos obrigatórios corretamente.', 'Formulário inválido');
    this.form.markAllAsTouched();
    return;
  }

  const formData = this.montarFormData();

  this.empresaService.cadastrarEmpresaFormData(formData).subscribe({
    next: () => {
      this.toastr.success('Empresa cadastrada com sucesso!');

      if (this.modoOnboarding) {
        this.empresaSalva.emit();
      }
    },
    error: () => this.toastr.error('Erro ao cadastrar empresa')
  });
}


  private montarFormData(): FormData {
    const formData = new FormData();
    const rawValues = this.form.getRawValue();

    // Adiciona os campos principais da empresa (exceto logo e enderecoRequest)
    Object.entries(rawValues).forEach(([key, value]) => {
      if (
        value !== null &&
        value !== undefined &&
        key !== 'logo' &&
        key !== 'enderecoRequest'
      ) {
        formData.append(key, String(value));
      }
    });

    // Adiciona os campos do endereço
    const endereco = rawValues['enderecoRequest'];
    if (endereco) {
      Object.entries(endereco).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(`enderecoRequest.${key}`, String(value));
        }
      });
    }

    // Adiciona a imagem do logo da empresa, se houver
    if (this.imagemBlob) {
      formData.append('logo', this.imagemBlob, this.imagemBlob.name);
    }

    // Adiciona o ID do usuário logado
    const usuarioId = this.authService.getJwtId();
    if (usuarioId) {
      formData.append('usuarioId', String(usuarioId));
    }

    return formData;
  }


  buscarEnderecoPorCep(): void {
    const cep = this.form.get('enderecoRequest.cep')?.value;
    if (!cep) return;

    this.cepUtilService.buscarEndereco(cep).subscribe((dados: EnderecoViaCep | null) => {
      if (!dados) {
        this.toastr.warning('CEP não encontrado');
        return;
      }

      this.form.patchValue({
        enderecoRequest: {
          logradouro: dados.logradouro || '',
          bairro: dados.bairro || '',
          cidade: dados.localidade || '',
          estado: dados.uf || ''
        }
      });
    });
  }


}
