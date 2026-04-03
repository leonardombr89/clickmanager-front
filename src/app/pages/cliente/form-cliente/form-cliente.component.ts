import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { ClienteRequest } from 'src/app/models/cliente/cliente-request.model';
import { ClienteService } from '../cliente.service';
import { MatTabsModule } from '@angular/material/tabs';
import { InputTextoRestritoComponent } from "../../../components/inputs/input-texto/input-texto-restrito.component";
import { InputTelefoneComponent } from "../../../components/inputs/input-telefone/input-telefone.component";
import { InputEmailComponent } from "../../../components/inputs/input-email/input-custom.component";
import { InputDocumentoComponent } from "../../../components/inputs/input-documento/input-documento.component";
import { EnderecoFormComponent } from 'src/app/components/endereco-form/endereco-form.component';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import { InputCepComponent } from "../../../components/inputs/input-cep/input-cep.component";
import { EnderecoViaCep } from 'src/app/models/endereco/endereco.viacep.model';
import { MobileTotalBarComponent } from "../../../components/mobile-total-bar/mobile-total-bar.component";

@Component({
  selector: 'app-form-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    InputTextoRestritoComponent,
    InputTelefoneComponent,
    InputEmailComponent,
    EnderecoFormComponent,
    InputDocumentoComponent,
    CardHeaderComponent,
    InputCepComponent,
    MatIconModule,
    MobileTotalBarComponent
],
  templateUrl: './form-cliente.component.html',
  styleUrls: ['./form-cliente.component.scss']
})
export class FormClienteComponent implements OnInit, AfterViewInit {
  form!: FormGroup;
  isEditMode = false;
  clienteId?: number;
  retorno: string | null = null;
  isMobileView = false;
  mobileStep = 0;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.atualizarViewport();
    this.inicializarFormulario();
    this.verificarModoEdicao();

    this.route.queryParamMap.subscribe(params => {
      this.retorno = params.get('retorno');
    });
    
  }

  ngAfterViewInit(): void {
    this.focusCampoAtualMobile();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      documento: [''],
      endereco: this.fb.group({
        cep: [''],
        logradouro: [''],
        numero: [''],
        complemento: [''],
        bairro: [''],
        cidade: [''],
        estado: [''],
      })
    });
  }

  private atualizarViewport(): void {
    this.isMobileView = (globalThis?.innerWidth ?? 0) <= 900;
  }

  private verificarModoEdicao(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.clienteId = +id;
        this.carregarCliente(this.clienteId);
      }
    });
  }

  private carregarCliente(id: number): void {
    this.clienteService.buscarPorId(id).subscribe({
      next: cliente => this.form.patchValue(cliente),
      error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao carregar cliente.'))
    });
  }

  onSubmit(): void {
    if (this.isMobileView && this.mobileStep === 0) {
      this.avancarMobile();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  
    const cliente: ClienteRequest = this.form.value;
    const destino = this.retorno ?? '/page/cliente';
  
  
    if (this.isEditMode) {
      const idParam = this.route.snapshot.paramMap.get('id');
      const id = idParam ? Number(idParam) : null;
  
      if (!id) {
        this.toastr.error('ID do cliente inválido.');
        return;
      }
  
      this.clienteService.atualizar(id, cliente).subscribe({
        next: () => {
          this.toastr.success('Cliente atualizado com sucesso!');
          this.router.navigate([destino]);
        },
        error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao atualizar cliente.'))
      });
    } else {
      this.clienteService.salvar(cliente).subscribe({
        next: () => {
          this.toastr.success('Cliente cadastrado com sucesso!');
          this.router.navigate([destino]);
        },
        error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao cadastrar cliente.'))
      });
    }
  } 

  setEnderecoGroup(group: FormGroup): void {
    this.form.setControl('endereco', group);
  }

  avancarMobile(): void {
    if (!this.isMobileView) return;

    if (this.mobileStep === 0) {
      if (this.dadosBasicosInvalidos()) {
        this.marcarDadosBasicosComoTouched();
        return;
      }

      this.mobileStep = 1;
      this.focusCampoAtualMobile();
      return;
    }

    this.onSubmit();
  }

  voltarMobile(): void {
    if (!this.isMobileView || this.mobileStep === 0) return;
    this.mobileStep = 0;
    this.focusCampoAtualMobile();
  }

  salvarMobile(): void {
    this.onSubmit();
  }

  onEnderecoEncontradoMobile(endereco: EnderecoViaCep | null): void {
    if (!endereco) return;
    this.enderecoGroup.patchValue({
      logradouro: endereco.logradouro || '',
      bairro: endereco.bairro || '',
      cidade: endereco.localidade || '',
      estado: endereco.uf || ''
    });
  }

  progressoMobilePercentual(): number {
    return this.mobileStep === 0 ? 50 : 100;
  }

  get mobileFooterLabel(): string {
    return this.mobileStep === 0 ? 'Continuar →' : (this.isEditMode ? 'Salvar alterações' : 'Salvar cliente');
  }

  get mobileFooterValue(): string {
    return this.mobileStep === 0 ? 'Endereço' : 'Salvar cliente';
  }

  get mobileFooterDetail(): string {
    return '';
  }

  get mobileStepTitle(): string {
    return this.mobileStep === 0 ? 'Dados básicos' : 'Endereço';
  }

  get enderecoGroup(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  get podeAvancarMobile(): boolean {
    return this.mobileStep === 0 ? !this.dadosBasicosInvalidos() : this.form.valid;
  }

  private dadosBasicosInvalidos(): boolean {
    return this.nomeControl.invalid || this.telefoneControl.invalid || this.emailControl.invalid;
  }

  private marcarDadosBasicosComoTouched(): void {
    this.nomeControl.markAsTouched();
    this.telefoneControl.markAsTouched();
    this.emailControl.markAsTouched();
    this.documentoControl.markAsTouched();
  }

  private focusCampoAtualMobile(): void {
    if (!this.isMobileView) return;

    setTimeout(() => {
      const selector = this.mobileStep === 0
        ? 'app-form-cliente .cliente-mobile-form app-input-texto-restrito input'
        : 'app-form-cliente .cliente-mobile-form app-input-cep input';
      const el = document.querySelector<HTMLInputElement>(selector);
      el?.focus();
    }, 80);
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get telefoneControl(): FormControl {
    return this.form.get('telefone') as FormControl;
  }

  get documentoControl(): FormControl {
    return this.form.get('documento') as FormControl;
  }

  get cepControl() {
    return this.form.get('endereco.cep') as FormControl;
  }
  
  get logradouroControl() {
    return this.form.get('endereco.logradouro') as FormControl;
  }
  
  get numeroControl() {
    return this.form.get('endereco.numero') as FormControl;
  }
  
  get complementoControl() {
    return this.form.get('endereco.complemento') as FormControl;
  }
  
  get bairroControl() {
    return this.form.get('endereco.bairro') as FormControl;
  }
  
  get cidadeControl() {
    return this.form.get('endereco.cidade') as FormControl;
  }
  
  get estadoControl() {
    return this.form.get('endereco.estado') as FormControl;
  }

}
