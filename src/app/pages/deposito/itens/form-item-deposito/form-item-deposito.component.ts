import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputMoedaComponent } from 'src/app/components/inputs/input-moeda/input-moeda.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { DepositoImagemGaleriaComponent } from '../../components/deposito-imagem-galeria/deposito-imagem-galeria.component';
import { ListaDinamicaInputComponent } from '../../components/lista-dinamica-input/lista-dinamica-input.component';
import {
  DepositoCategoria,
  DepositoImagem,
  DepositoItemRequest,
  DepositoMarca,
  DepositoUnidadeVenda,
} from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';
import { depositoSlugify } from '../../utils/deposito-slug.util';

@Component({
  selector: 'app-form-item-deposito',
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
    InputMoedaComponent,
    InputNumericoComponent,
    ListaDinamicaInputComponent,
    DepositoImagemGaleriaComponent,
  ],
  templateUrl: './form-item-deposito.component.html',
  styleUrl: './form-item-deposito.component.scss',
})
export class FormItemDepositoComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId!: number;
  isMobileView = false;
  carregando = false;
  salvando = false;
  carregandoCategorias = false;
  carregandoMarcas = false;
  uploadImagemPrincipalEmAndamento = false;
  uploadGaleriaEmAndamento = false;
  empresaSlug = '';
  imagemPrincipalSelecionada: DepositoImagem | null = null;
  galeriaSelecionada: DepositoImagem[] = [];
  categorias: DepositoCategoria[] = [];
  marcas: DepositoMarca[] = [];
  readonly unidadesVenda: Array<{ value: DepositoUnidadeVenda; label: string }> = [
    { value: 'UNIDADE', label: 'Unidade' },
    { value: 'METRO', label: 'Metro' },
    { value: 'METRO_QUADRADO', label: 'Metro quadrado' },
    { value: 'CAIXA', label: 'Caixa' },
    { value: 'PACOTE', label: 'Pacote' },
    { value: 'SACO', label: 'Saco' },
    { value: 'LITRO', label: 'Litro' },
    { value: 'KG', label: 'Kg' },
  ];
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
      categoriaId: [null],
      marcaId: [null],
      descricaoCurta: ['', [Validators.maxLength(255)]],
      descricaoCompleta: [''],
      tags: [[] as string[]],
      indicadoPara: [[] as string[]],
      voceEncontra: [[] as string[]],
      precoVenda: [null, [Validators.min(0)]],
      precoPromocional: [null, [Validators.min(0)]],
      unidadeVenda: ['UNIDADE' as DepositoUnidadeVenda],
      exibirPreco: [true],
      sobConsulta: [false],
      orcamentoIndividual: [true],
      ordem: [0, [Validators.min(0)]],
      destaque: [false],
      controlaEstoque: [true],
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

    this.sobConsultaControl.valueChanges.subscribe((sobConsulta) => {
      this.atualizarEstadoCamposPreco(!!sobConsulta);
    });
    this.atualizarEstadoCamposPreco(!!this.sobConsultaControl.value);

    this.carregarCategorias();
    this.carregarMarcas();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }

      this.isEditMode = true;
      this.itemId = +id;
      this.carregarItem(this.itemId);
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

  get categoriaIdControl(): FormControl {
    return this.form.get('categoriaId') as FormControl;
  }

  get marcaIdControl(): FormControl {
    return this.form.get('marcaId') as FormControl;
  }

  get descricaoCurtaControl(): FormControl {
    return this.form.get('descricaoCurta') as FormControl;
  }

  get descricaoCompletaControl(): FormControl {
    return this.form.get('descricaoCompleta') as FormControl;
  }

  get tagsControl(): FormControl<string[] | null> {
    return this.form.get('tags') as FormControl<string[] | null>;
  }

  get indicadoParaControl(): FormControl<string[] | null> {
    return this.form.get('indicadoPara') as FormControl<string[] | null>;
  }

  get voceEncontraControl(): FormControl<string[] | null> {
    return this.form.get('voceEncontra') as FormControl<string[] | null>;
  }

  get precoVendaControl(): FormControl {
    return this.form.get('precoVenda') as FormControl;
  }

  get precoPromocionalControl(): FormControl {
    return this.form.get('precoPromocional') as FormControl;
  }

  get unidadeVendaControl(): FormControl {
    return this.form.get('unidadeVenda') as FormControl;
  }

  get exibirPrecoControl(): FormControl {
    return this.form.get('exibirPreco') as FormControl;
  }

  get sobConsultaControl(): FormControl {
    return this.form.get('sobConsulta') as FormControl;
  }

  get orcamentoIndividualControl(): FormControl {
    return this.form.get('orcamentoIndividual') as FormControl;
  }

  get ordemControl(): FormControl {
    return this.form.get('ordem') as FormControl;
  }

  get destaqueControl(): FormControl {
    return this.form.get('destaque') as FormControl;
  }

  get controlaEstoqueControl(): FormControl {
    return this.form.get('controlaEstoque') as FormControl;
  }

  get ativoControl(): FormControl {
    return this.form.get('ativo') as FormControl;
  }

  get tituloPagina(): string {
    return this.isEditMode ? 'Editar Item de Depósito' : 'Novo Item de Depósito';
  }

  get textoAcaoPrincipal(): string {
    if (this.salvando) {
      return this.isEditMode ? 'Atualizando...' : 'Salvando...';
    }

    return this.isEditMode ? 'Atualizar' : 'Salvar';
  }

  get uploadEmAndamento(): boolean {
    return this.uploadImagemPrincipalEmAndamento || this.uploadGaleriaEmAndamento;
  }

  get podeSalvar(): boolean {
    return !this.form.invalid
      && !this.salvando
      && !this.carregando
      && !this.carregandoCategorias
      && !this.carregandoMarcas
      && !this.uploadEmAndamento;
  }

  onSlugInput(): void {
    const valor = depositoSlugify(this.slugControl.value);
    this.slugEditadoManualmente = !!valor;
    this.slugControl.setValue(valor, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.uploadEmAndamento) {
      this.toastr.info('Aguarde o envio das imagens terminar antes de salvar.');
      return;
    }

    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.salvando = true;

    const request$ = this.isEditMode
      ? this.depositoService.atualizarItem(this.itemId, payload)
      : this.depositoService.criarItem(payload);

    request$.subscribe({
      next: () => {
        this.salvando = false;
        this.toastr.success(this.isEditMode ? 'Item atualizado com sucesso!' : 'Item criado com sucesso!');
        this.router.navigate(['/page/deposito/itens']);
      },
      error: (err) => {
        this.salvando = false;
        this.toastr.error(err?.userMessage || (this.isEditMode ? 'Erro ao atualizar o item.' : 'Erro ao criar o item.'));
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/page/deposito/itens']);
  }

  onImagemPrincipalSelecionada(imagem: DepositoImagem | null): void {
    this.imagemPrincipalSelecionada = imagem;
  }

  onGaleriaSelecionada(imagens: DepositoImagem[]): void {
    this.galeriaSelecionada = [...imagens];
  }

  onUploadingImagemPrincipalChange(uploading: boolean): void {
    this.uploadImagemPrincipalEmAndamento = uploading;
  }

  onUploadingGaleriaChange(uploading: boolean): void {
    this.uploadGaleriaEmAndamento = uploading;
  }

  categoriaLabel(categoria: DepositoCategoria): string {
    return categoria.ativo ? categoria.nome : `${categoria.nome} (inativa)`;
  }

  marcaLabel(marca: DepositoMarca): string {
    return marca.ativo ? marca.nome : `${marca.nome} (inativa)`;
  }

  private atualizarEstadoCamposPreco(sobConsulta: boolean): void {
    const options = { emitEvent: false };
    if (sobConsulta) {
      this.precoVendaControl.disable(options);
      this.precoPromocionalControl.disable(options);
      return;
    }

    this.precoVendaControl.enable(options);
    this.precoPromocionalControl.enable(options);
  }

  private carregarCategorias(): void {
    this.carregandoCategorias = true;
    this.depositoService
      .listarCategorias({
        page: 0,
        size: 200,
        sort: 'nome,asc',
      })
      .subscribe({
        next: (response) => {
          this.categorias = response.content || [];
          this.carregandoCategorias = false;
        },
        error: () => {
          this.carregandoCategorias = false;
          this.toastr.error('Não foi possível carregar as categorias do depósito.');
        },
      });
  }

  private carregarMarcas(): void {
    this.carregandoMarcas = true;
    this.depositoService
      .listarMarcas({
        page: 0,
        size: 200,
        sort: 'nome,asc',
      })
      .subscribe({
        next: (response) => {
          this.marcas = response.content || [];
          this.carregandoMarcas = false;
        },
        error: () => {
          this.carregandoMarcas = false;
          this.toastr.error('Não foi possível carregar as marcas do depósito.');
        },
      });
  }

  private carregarItem(id: number): void {
    this.carregando = true;
    this.depositoService.detalharItem(id).subscribe({
      next: (item) => {
        this.carregando = false;
        this.slugEditadoManualmente = true;
        this.imagemPrincipalSelecionada = item.imagemPrincipal || null;
        this.galeriaSelecionada = [...(item.galeria || [])];
        this.form.patchValue({
          codigo: item.codigo,
          nome: item.nome,
          slug: item.slug || depositoSlugify(item.nome),
          categoriaId: item.categoriaId ?? null,
          marcaId: item.marcaId ?? null,
          descricaoCurta: item.descricaoCurta || '',
          descricaoCompleta: item.descricaoCompleta || '',
          tags: item.tags || [],
          indicadoPara: item.indicadoPara || [],
          voceEncontra: item.voceEncontra || [],
          precoVenda: item.precoVenda ?? null,
          precoPromocional: item.precoPromocional ?? null,
          unidadeVenda: item.unidadeVenda || 'UNIDADE',
          exibirPreco: item.exibirPreco ?? true,
          sobConsulta: item.sobConsulta ?? false,
          orcamentoIndividual: item.orcamentoIndividual,
          ordem: item.ordem ?? 0,
          destaque: item.destaque,
          controlaEstoque: item.controlaEstoque,
          ativo: item.ativo,
        });
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Erro ao carregar o item.');
        this.router.navigate(['/page/deposito/itens']);
      },
    });
  }

  private buildPayload(): DepositoItemRequest {
    const raw = this.form.getRawValue();

    return {
      codigo: String(raw.codigo || '').trim(),
      nome: String(raw.nome || '').trim(),
      slug: depositoSlugify(String(raw.slug || '')),
      categoriaId: raw.categoriaId ?? null,
      descricaoCurta: String(raw.descricaoCurta || '').trim() || null,
      descricaoCompleta: String(raw.descricaoCompleta || '').trim() || null,
      imagemPrincipalId: this.imagemPrincipalSelecionada?.id ?? null,
      galeriaIds: this.galeriaSelecionada
        .map((imagem) => imagem.id)
        .filter((id, index, lista) => Number.isFinite(id) && lista.indexOf(id) === index),
      marcaId: raw.marcaId ?? null,
      tags: this.normalizarLista(raw.tags),
      indicadoPara: this.normalizarLista(raw.indicadoPara),
      voceEncontra: this.normalizarLista(raw.voceEncontra),
      precoVenda: this.normalizarPreco(raw.precoVenda),
      precoPromocional: this.normalizarPreco(raw.precoPromocional),
      unidadeVenda: raw.unidadeVenda || 'UNIDADE',
      exibirPreco: !!raw.exibirPreco,
      sobConsulta: !!raw.sobConsulta,
      orcamentoIndividual: !!raw.orcamentoIndividual,
      ordem: raw.ordem === null || raw.ordem === '' ? null : Number(raw.ordem),
      destaque: !!raw.destaque,
      controlaEstoque: !!raw.controlaEstoque,
      ativo: !!raw.ativo,
    };
  }

  private normalizarLista(valor: unknown): string[] {
    if (!Array.isArray(valor)) {
      return [];
    }

    return valor
      .map((item) => String(item || '').trim())
      .filter((item, index, lista) => !!item && lista.indexOf(item) === index);
  }

  private normalizarPreco(valor: unknown): number | null {
    if (valor === null || valor === undefined || valor === '') {
      return null;
    }

    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
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
