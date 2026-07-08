import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { DepositoImagemUploadComponent } from '../../components/deposito-imagem-upload/deposito-imagem-upload.component';
import { DepositoImagem, DepositoMarcaRequest } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { depositoSlugify } from '../../utils/deposito-slug.util';

@Component({
  selector: 'app-form-marca-deposito',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MaterialModule,
    PageCardComponent,
    SectionCardComponent,
    MobileTotalBarComponent,
    InputTextoRestritoComponent,
    InputTextareaComponent,
    DepositoImagemUploadComponent,
  ],
  templateUrl: './form-marca-deposito.component.html',
  styleUrl: './form-marca-deposito.component.scss',
})
export class FormMarcaDepositoComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  marcaId!: number;
  isMobileView = false;
  carregando = false;
  salvando = false;
  uploadImagemEmAndamento = false;
  empresaSlug = '';
  imagemSelecionada: DepositoImagem | null = null;
  private slugEditadoManualmente = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly depositoService: DepositoService,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.atualizarViewport();
    this.resolverEmpresaSlug();
    this.authService.usuario$.subscribe((usuario) => {
      this.atualizarEmpresaSlug(usuario?.empresa?.slug || usuario?.empresa?.nome || '');
    });
    this.form = this.fb.group({
      codigo: ['', Validators.required],
      nome: ['', Validators.required],
      slug: ['', Validators.required],
      descricao: ['', [Validators.maxLength(255)]],
      ordem: [0],
      destaque: [false],
      ativo: [true],
    });

    this.nomeControl.valueChanges.subscribe((valor) => {
      if (this.slugEditadoManualmente) {
        return;
      }

      this.slugControl.setValue(depositoSlugify(String(valor || '')), { emitEvent: false });
    });

    this.slugControl.valueChanges.subscribe((valor) => {
      const normalizado = depositoSlugify(String(valor || ''));
      this.slugEditadoManualmente = !!normalizado && normalizado !== depositoSlugify(String(this.nomeControl.value || ''));
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }

      this.isEditMode = true;
      this.marcaId = +id;
      this.carregarMarca(this.marcaId);
    });
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport();
  }

  get codigoControl(): FormControl {
    return this.form.get('codigo') as FormControl;
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get slugControl(): FormControl {
    return this.form.get('slug') as FormControl;
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }

  get ordemControl(): FormControl {
    return this.form.get('ordem') as FormControl;
  }

  get destaqueControl(): FormControl {
    return this.form.get('destaque') as FormControl;
  }

  get ativoControl(): FormControl {
    return this.form.get('ativo') as FormControl;
  }

  get tituloPagina(): string {
    return this.isEditMode ? 'Editar Marca de Depósito' : 'Nova Marca de Depósito';
  }

  get textoAcaoPrincipal(): string {
    if (this.salvando) {
      return this.isEditMode ? 'Atualizando...' : 'Salvando...';
    }

    return this.isEditMode ? 'Atualizar' : 'Salvar';
  }

  get podeSalvar(): boolean {
    return !this.form.invalid && !this.salvando && !this.carregando && !this.uploadImagemEmAndamento;
  }

  onSlugInput(): void {
    const valor = depositoSlugify(this.slugControl.value);
    this.slugEditadoManualmente = !!valor;
    this.slugControl.setValue(valor, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.uploadImagemEmAndamento) {
      this.toastr.info('Aguarde o envio da imagem terminar antes de salvar.');
      return;
    }

    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.salvando = true;

    const request$ = this.isEditMode
      ? this.depositoService.atualizarMarca(this.marcaId, payload)
      : this.depositoService.criarMarca(payload);

    request$.subscribe({
      next: () => {
        this.salvando = false;
        this.toastr.success(this.isEditMode ? 'Marca atualizada com sucesso!' : 'Marca criada com sucesso!');
        this.router.navigate(['/page/deposito/marcas']);
      },
      error: () => {
        this.salvando = false;
        this.toastr.error(this.isEditMode ? 'Erro ao atualizar a marca.' : 'Erro ao criar a marca.');
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/page/deposito/marcas']);
  }

  onImagemSelecionada(imagem: DepositoImagem | null): void {
    this.imagemSelecionada = imagem;
  }

  onUploadingImagemChange(uploading: boolean): void {
    this.uploadImagemEmAndamento = uploading;
  }

  private carregarMarca(id: number): void {
    this.carregando = true;
    this.depositoService.detalharMarca(id).subscribe({
      next: (marca) => {
        this.carregando = false;
        this.slugEditadoManualmente = true;
        this.imagemSelecionada = marca.imagem || null;
        this.form.patchValue({
          codigo: marca.codigo,
          nome: marca.nome,
          slug: marca.slug || depositoSlugify(marca.nome),
          descricao: marca.descricao || '',
          ordem: marca.ordem ?? 0,
          destaque: marca.destaque,
          ativo: marca.ativo,
        });
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Erro ao carregar a marca.');
        this.router.navigate(['/page/deposito/marcas']);
      },
    });
  }

  private buildPayload(): DepositoMarcaRequest {
    const raw = this.form.getRawValue();

    return {
      codigo: String(raw.codigo || '').trim(),
      nome: String(raw.nome || '').trim(),
      slug: depositoSlugify(String(raw.slug || '')),
      descricao: String(raw.descricao || '').trim() || null,
      imagemId: this.imagemSelecionada?.id ?? null,
      ordem: raw.ordem === null || raw.ordem === '' ? null : Number(raw.ordem),
      destaque: !!raw.destaque,
      ativo: !!raw.ativo,
    };
  }

  private atualizarViewport(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.isMobileView = window.innerWidth <= 768;
  }

  private resolverEmpresaSlug(): void {
    try {
      const empresa = this.authService.getUsuario()?.empresa;
      this.atualizarEmpresaSlug(empresa?.slug || empresa?.nome || '');
    } catch {
      this.empresaSlug = '';
    }
  }

  private atualizarEmpresaSlug(valor: string): void {
    const slug = depositoSlugify(String(valor || ''));
    if (slug) {
      this.empresaSlug = slug;
    }
  }
}
