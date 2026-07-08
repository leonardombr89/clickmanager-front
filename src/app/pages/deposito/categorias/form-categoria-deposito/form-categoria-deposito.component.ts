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
import { DepositoCategoria, DepositoCategoriaRequest, DepositoImagem } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { depositoSlugify } from '../../utils/deposito-slug.util';

@Component({
  selector: 'app-form-categoria-deposito',
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
  templateUrl: './form-categoria-deposito.component.html',
  styleUrl: './form-categoria-deposito.component.scss',
})
export class FormCategoriaDepositoComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  categoriaId!: number;
  isMobileView = false;
  carregando = false;
  salvando = false;
  carregandoCategoriasPai = false;
  uploadImagemEmAndamento = false;
  empresaSlug = '';
  imagemSelecionada: DepositoImagem | null = null;
  categoriasPai: DepositoCategoria[] = [];
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
      descricaoCurta: ['', [Validators.maxLength(255)]],
      descricaoCompleta: [''],
      ordem: [0],
      destaque: [false],
      categoriaPaiId: [null],
      whatsappLinkPadrao: [''],
      mensagemPadraoWhatsapp: [''],
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

    this.carregarCategoriasPai();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }

      this.isEditMode = true;
      this.categoriaId = +id;
      this.carregarCategoria(this.categoriaId);
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

  get descricaoCurtaControl(): FormControl {
    return this.form.get('descricaoCurta') as FormControl;
  }

  get descricaoCompletaControl(): FormControl {
    return this.form.get('descricaoCompleta') as FormControl;
  }

  get ordemControl(): FormControl {
    return this.form.get('ordem') as FormControl;
  }

  get destaqueControl(): FormControl {
    return this.form.get('destaque') as FormControl;
  }

  get categoriaPaiIdControl(): FormControl {
    return this.form.get('categoriaPaiId') as FormControl;
  }

  get whatsappLinkPadraoControl(): FormControl {
    return this.form.get('whatsappLinkPadrao') as FormControl;
  }

  get mensagemPadraoWhatsappControl(): FormControl {
    return this.form.get('mensagemPadraoWhatsapp') as FormControl;
  }

  get ativoControl(): FormControl {
    return this.form.get('ativo') as FormControl;
  }

  get categoriasPaiDisponiveis(): DepositoCategoria[] {
    if (!this.isEditMode) {
      return this.categoriasPai;
    }

    return this.categoriasPai.filter((categoria) => categoria.id !== this.categoriaId);
  }

  get tituloPagina(): string {
    return this.isEditMode ? 'Editar Categoria de Depósito' : 'Nova Categoria de Depósito';
  }

  get textoAcaoPrincipal(): string {
    if (this.salvando) {
      return this.isEditMode ? 'Atualizando...' : 'Salvando...';
    }

    return this.isEditMode ? 'Atualizar' : 'Salvar';
  }

  get podeSalvar(): boolean {
    return !this.form.invalid && !this.salvando && !this.carregando && !this.carregandoCategoriasPai && !this.uploadImagemEmAndamento;
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
      ? this.depositoService.atualizarCategoria(this.categoriaId, payload)
      : this.depositoService.criarCategoria(payload);

    request$.subscribe({
      next: () => {
        this.salvando = false;
        this.toastr.success(
          this.isEditMode ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!'
        );
        this.router.navigate(['/page/deposito/categorias']);
      },
      error: () => {
        this.salvando = false;
        this.toastr.error(
          this.isEditMode ? 'Erro ao atualizar a categoria.' : 'Erro ao criar a categoria.'
        );
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/page/deposito/categorias']);
  }

  onImagemSelecionada(imagem: DepositoImagem | null): void {
    this.imagemSelecionada = imagem;
  }

  onUploadingImagemChange(uploading: boolean): void {
    this.uploadImagemEmAndamento = uploading;
  }

  categoriaPaiLabel(categoria: DepositoCategoria): string {
    return categoria.ativo ? categoria.nome : `${categoria.nome} (inativa)`;
  }

  private carregarCategoriasPai(): void {
    this.carregandoCategoriasPai = true;
    this.depositoService
      .listarCategorias({
        page: 0,
        size: 200,
        sort: 'nome,asc',
      })
      .subscribe({
        next: (response) => {
          this.categoriasPai = response.content || [];
          this.carregandoCategoriasPai = false;
        },
        error: () => {
          this.carregandoCategoriasPai = false;
          this.toastr.error('Não foi possível carregar as categorias do depósito.');
        },
      });
  }

  private carregarCategoria(id: number): void {
    this.carregando = true;
    this.depositoService.detalharCategoria(id).subscribe({
      next: (categoria) => {
        this.carregando = false;
        this.slugEditadoManualmente = true;
        this.imagemSelecionada = categoria.imagem || null;
        this.form.patchValue({
          codigo: categoria.codigo,
          nome: categoria.nome,
          slug: categoria.slug || depositoSlugify(categoria.nome),
          descricaoCurta: categoria.descricaoCurta || '',
          descricaoCompleta: categoria.descricaoCompleta || '',
          ordem: categoria.ordem ?? 0,
          destaque: categoria.destaque,
          categoriaPaiId: categoria.categoriaPaiId ?? null,
          whatsappLinkPadrao: categoria.whatsappLinkPadrao || '',
          mensagemPadraoWhatsapp: categoria.mensagemPadraoWhatsapp || '',
          ativo: categoria.ativo,
        });
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Erro ao carregar a categoria.');
        this.router.navigate(['/page/deposito/categorias']);
      },
    });
  }

  private buildPayload(): DepositoCategoriaRequest {
    const raw = this.form.getRawValue();

    return {
      codigo: String(raw.codigo || '').trim(),
      nome: String(raw.nome || '').trim(),
      slug: depositoSlugify(String(raw.slug || '')),
      descricaoCurta: String(raw.descricaoCurta || '').trim() || null,
      descricaoCompleta: String(raw.descricaoCompleta || '').trim() || null,
      imagemId: this.imagemSelecionada?.id ?? null,
      ordem: raw.ordem === null || raw.ordem === '' ? null : Number(raw.ordem),
      destaque: !!raw.destaque,
      categoriaPaiId: raw.categoriaPaiId ?? null,
      whatsappLinkPadrao: String(raw.whatsappLinkPadrao || '').trim() || null,
      mensagemPadraoWhatsapp: String(raw.mensagemPadraoWhatsapp || '').trim() || null,
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
