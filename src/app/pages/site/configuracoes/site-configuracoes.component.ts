import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { SiteConfigResponse, SiteConfigUpdateRequest, SiteWhatsappExibicao } from '../models/site-config.models';
import { SiteConfigService } from '../services/site-config.service';
import {
  getUrlClickManager,
  getUrlDominioProprio,
  getUrlPublicaPrincipal,
  normalizarDominioProprio,
  normalizarSlugPublico,
} from '../utils/site-public-url.util';

@Component({
  selector: 'app-site-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    CardHeaderComponent,
    InputOptionsComponent,
    InputTelefoneComponent,
    InputTextoRestritoComponent,
    InputTextareaComponent,
    TemPermissaoDirective,
  ],
  templateUrl: './site-configuracoes.component.html',
  styleUrl: './site-configuracoes.component.scss',
})
export class SiteConfiguracoesComponent implements OnInit {
  readonly exibicoesWhatsapp: Array<{ value: SiteWhatsappExibicao; label: string }> = [
    { value: 'ICONE', label: 'Somente ícone' },
    { value: 'ICONE_TEXTO', label: 'Ícone e texto' },
  ];

  form!: FormGroup;
  carregando = false;
  salvando = false;
  salvandoFavicon = false;
  faviconUrl = '';
  faviconPreviewUrl = '';
  faviconArquivoNome = '';
  faviconArquivoTamanho = '';
  faviconErro = '';
  private faviconSelecionado: File | null = null;
  private readonly faviconFallbackUrl = 'favicon.ico';
  private configAtual: SiteConfigResponse | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly siteConfigService: SiteConfigService,
    private readonly authService: AuthService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      siteAtivo: [true],
      slugPublico: ['', [Validators.required, Validators.maxLength(120)]],
      dominioCustom: ['', Validators.maxLength(255)],
      orcamentoAtivo: [true],
      whatsappAtivo: [true],
      whatsappTelefone: ['', [Validators.pattern(/^\d{10,13}$/)]],
      whatsappExibicao: ['ICONE_TEXTO' as SiteWhatsappExibicao, Validators.required],
      whatsappTexto: ['Fale conosco', Validators.maxLength(80)],
      whatsappMensagemInicial: ['Olá! Acessei o site e gostaria de mais informações.', Validators.maxLength(500)],
    });

    if (!this.podeEditar) {
      this.form.disable({ emitEvent: false });
    }

    this.carregarConfiguracao();
  }

  get podeEditar(): boolean {
    return this.authService.temPermissao('SITE_CONFIG_EDITAR');
  }

  get podeSalvar(): boolean {
    return this.podeEditar && !this.carregando && !this.salvando;
  }

  get siteAtivoControl(): FormControl {
    return this.form.get('siteAtivo') as FormControl;
  }

  get slugPublicoControl(): FormControl {
    return this.form.get('slugPublico') as FormControl;
  }

  get dominioCustomControl(): FormControl {
    return this.form.get('dominioCustom') as FormControl;
  }

  get orcamentoAtivoControl(): FormControl {
    return this.form.get('orcamentoAtivo') as FormControl;
  }

  get whatsappAtivoControl(): FormControl {
    return this.form.get('whatsappAtivo') as FormControl;
  }

  get whatsappTelefoneControl(): FormControl {
    return this.form.get('whatsappTelefone') as FormControl;
  }

  get whatsappExibicaoControl(): FormControl {
    return this.form.get('whatsappExibicao') as FormControl;
  }

  get whatsappTextoControl(): FormControl {
    return this.form.get('whatsappTexto') as FormControl;
  }

  get whatsappMensagemInicialControl(): FormControl {
    return this.form.get('whatsappMensagemInicial') as FormControl;
  }

  get enderecoClickManager(): string {
    return getUrlClickManager(this.slugPublicoControl.value);
  }

  get enderecoPublicoPrincipal(): string {
    return getUrlPublicaPrincipal(this.configParaUrlAtual());
  }

  get siteInativo(): boolean {
    return this.siteAtivoControl.value !== true;
  }

  get mensagemSiteInativo(): string {
    return this.siteInativo ? 'Site desativado. Ative o site para abrir este endereço.' : '';
  }

  get faviconPreview(): string {
    return this.faviconPreviewUrl || this.faviconUrl || this.faviconFallbackUrl;
  }

  get podeSalvarFavicon(): boolean {
    return this.podeEditar && !this.carregando && !this.salvandoFavicon && !!this.faviconSelecionado;
  }

  carregarConfiguracao(): void {
    this.carregando = true;
    this.siteConfigService.buscar().subscribe({
      next: (config) => {
        this.carregando = false;
        this.preencherFormulario(config);
      },
      error: (err) => {
        this.carregando = false;
        this.toastr.error(err?.userMessage || 'Erro ao carregar as configurações do site.');
      },
    });
  }

  salvar(): void {
    if (!this.podeEditar) {
      this.toastr.warning('Você não tem permissão para editar as configurações do site.');
      return;
    }

    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      this.toastr.warning('Preencha os campos obrigatórios corretamente.');
      return;
    }

    this.salvando = true;
    this.siteConfigService.atualizar(this.buildPayload()).subscribe({
      next: (config) => {
        this.salvando = false;
        this.preencherFormulario(config);
        this.toastr.success('Configurações do site salvas com sucesso!');
      },
      error: (err) => {
        this.salvando = false;
        this.toastr.error(err?.userMessage || 'Erro ao salvar as configurações do site.');
      },
    });
  }

  abrirSite(): void {
    if (this.siteInativo) {
      this.toastr.warning('O site está desativado. Ative o site para abrir o endereço público.');
      return;
    }

    window.open(this.enderecoPublicoPrincipal, '_blank', 'noopener,noreferrer');
  }

  abrirEnderecoClickManager(): void {
    const slug = normalizarSlugPublico(this.slugPublicoControl.value);
    if (!slug) {
      this.toastr.warning('Informe o slug público para abrir o endereço ClickManager.');
      return;
    }

    if (this.siteInativo) {
      this.toastr.warning('O site está desativado. Ative o site para abrir o endereço ClickManager.');
      return;
    }

    window.open(this.enderecoClickManager, '_blank', 'noopener,noreferrer');
  }

  testarDominioCustom(): void {
    const dominio = normalizarDominioProprio(this.dominioCustomControl.value);
    if (!dominio) {
      this.toastr.warning('Informe o domínio próprio para testar.');
      return;
    }

    window.open(getUrlDominioProprio(dominio), '_blank', 'noopener,noreferrer');
  }

  onFaviconSelecionado(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    if (!this.validarFavicon(file)) {
      this.limparInputArquivo(input);
      return;
    }

    this.faviconSelecionado = file;
    this.faviconArquivoNome = file.name;
    this.faviconArquivoTamanho = this.formatarTamanho(file.size);
    this.faviconErro = '';

    const reader = new FileReader();
    reader.onload = () => {
      this.faviconPreviewUrl = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    this.limparInputArquivo(input);
  }

  salvarFavicon(): void {
    if (!this.podeSalvarFavicon || !this.faviconSelecionado) {
      return;
    }

    this.salvandoFavicon = true;
    this.siteConfigService.atualizarFavicon(this.faviconSelecionado).subscribe({
      next: (config) => {
        this.salvandoFavicon = false;
        this.preencherFormulario(config);
        this.limparFaviconSelecionado();
        this.toastr.success('Favicon atualizado com sucesso!');
      },
      error: (err) => {
        this.salvandoFavicon = false;
        this.toastr.error(err?.userMessage || 'Erro ao atualizar o favicon.');
      },
    });
  }

  removerFavicon(): void {
    if (!this.podeEditar || this.salvandoFavicon) {
      return;
    }

    this.salvandoFavicon = true;
    this.siteConfigService.removerFavicon().subscribe({
      next: (config) => {
        this.salvandoFavicon = false;
        this.preencherFormulario(config);
        this.limparFaviconSelecionado();
        this.toastr.success('Favicon removido. O padrão do ClickManager será usado.');
      },
      error: (err) => {
        this.salvandoFavicon = false;
        this.toastr.error(err?.userMessage || 'Erro ao remover o favicon.');
      },
    });
  }

  cancelarFaviconSelecionado(): void {
    this.limparFaviconSelecionado();
  }

  private preencherFormulario(config: SiteConfigResponse): void {
    this.configAtual = config;
    this.faviconUrl = config.faviconUrl || '';
    this.faviconPreviewUrl = '';
    this.form.patchValue({
      siteAtivo: config.siteAtivo ?? true,
      slugPublico: config.slugPublico || '',
      dominioCustom: config.dominioCustom || '',
      orcamentoAtivo: config.orcamentoAtivo ?? true,
      whatsappAtivo: config.whatsappAtivo ?? true,
      whatsappTelefone: this.normalizarTelefoneParaFormulario(config.whatsappTelefone),
      whatsappExibicao: config.whatsappExibicao || 'ICONE_TEXTO',
      whatsappTexto: config.whatsappTexto || '',
      whatsappMensagemInicial: config.whatsappMensagemInicial || '',
    });
  }

  private buildPayload(): SiteConfigUpdateRequest {
    const raw = this.form.getRawValue();

    return {
      siteAtivo: !!raw.siteAtivo,
      slugPublico: this.normalizarTexto(raw.slugPublico),
      dominioCustom: this.normalizarNulo(raw.dominioCustom),
      orcamentoAtivo: !!raw.orcamentoAtivo,
      whatsappAtivo: !!raw.whatsappAtivo,
      whatsappTelefone: this.normalizarNulo(raw.whatsappTelefone)?.replace(/\D/g, '') || null,
      whatsappExibicao: raw.whatsappExibicao || 'ICONE_TEXTO',
      whatsappTexto: this.normalizarNulo(raw.whatsappTexto),
      whatsappMensagemInicial: this.normalizarNulo(raw.whatsappMensagemInicial),
    };
  }

  private normalizarNulo(value: unknown): string | null {
    const normalized = this.normalizarTexto(value);
    return normalized || null;
  }

  private normalizarTexto(value: unknown): string {
    return String(value || '').trim();
  }

  private configParaUrlAtual(): SiteConfigResponse {
    const dominioAtual = this.normalizarNulo(this.dominioCustomControl.value);
    const dominioOriginal = normalizarDominioProprio(this.configAtual?.dominioCustom);
    const dominioMesmoDoBackend = normalizarDominioProprio(dominioAtual) === dominioOriginal;
    const statusDominio = dominioMesmoDoBackend
      ? {
        dominioCustomAtivo: this.configAtual?.dominioCustomAtivo,
        dominioVerificado: this.configAtual?.dominioVerificado,
        statusDominio: this.configAtual?.statusDominio,
      }
      : {
        dominioCustomAtivo: false,
        dominioVerificado: false,
        statusDominio: null,
      };

    return {
      ...(this.configAtual || {
        orcamentoAtivo: true,
        whatsappAtivo: true,
        whatsappExibicao: 'ICONE_TEXTO' as SiteWhatsappExibicao,
      }),
      ...statusDominio,
      siteAtivo: this.siteAtivoControl.value === true,
      slugPublico: normalizarSlugPublico(this.slugPublicoControl.value),
      dominioCustom: dominioAtual,
    };
  }

  private normalizarTelefoneParaFormulario(value?: string | null): string {
    const telefone = String(value || '').replace(/\D/g, '');
    if ((telefone.length === 12 || telefone.length === 13) && telefone.startsWith('55')) {
      return telefone.slice(2);
    }
    return telefone;
  }

  private validarFavicon(file: File): boolean {
    const tiposPermitidos = ['image/png', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    const nomeValido = /\.(png|svg|webp|ico)$/i.test(file.name);

    if (!tiposPermitidos.includes(file.type) && !nomeValido) {
      this.faviconErro = 'Formato inválido. Use PNG, SVG, WEBP ou ICO.';
      this.limparFaviconSelecionado(false);
      return false;
    }

    if (file.size > 1024 * 1024) {
      this.faviconErro = 'O favicon deve ter até 1 MB.';
      this.limparFaviconSelecionado(false);
      return false;
    }

    return true;
  }

  private limparFaviconSelecionado(limparErro = true): void {
    this.faviconSelecionado = null;
    this.faviconPreviewUrl = '';
    this.faviconArquivoNome = '';
    this.faviconArquivoTamanho = '';
    if (limparErro) {
      this.faviconErro = '';
    }
  }

  private limparInputArquivo(input?: HTMLInputElement | null): void {
    if (input) {
      input.value = '';
    }
  }

  private formatarTamanho(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
      return '';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
