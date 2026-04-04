import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Observable } from 'rxjs';

import { AcabamentoService } from '../acabamento.service';
import { AcabamentoRequest } from 'src/app/models/acabamento/acabamento-request.model';
import { AcabamentoResponse } from 'src/app/models/acabamento/acabamento-response.model';
import { AcabamentoVariacaoRequest } from 'src/app/models/acabamento/acabamento-variacao-request.model';
import { PrecoRequest } from 'src/app/models/preco/preco.model';

import { InputTextoRestritoComponent } from '../../../../components/inputs/input-texto/input-texto-restrito.component';
import { AcabamentoVariacaoForm, VariacoesAcabamentoComponent } from '../variacoes-acabamento/variacoes-acabamento.component';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';

@Component({
  selector: 'app-form-acabamento',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    InputTextoRestritoComponent,
    VariacoesAcabamentoComponent,
    PageCardComponent,
    SectionCardComponent,
    InputTextareaComponent,
    MobileTotalBarComponent
  ],
  templateUrl: './form-acabamento.component.html',
  styleUrl: './form-acabamento.component.scss'
})
export class FormAcabamentoComponent implements OnInit {
  @ViewChild('wizardTop') wizardTop?: ElementRef<HTMLElement>;

  readonly totalSteps = 4;
  readonly wizardSteps = [
    { key: 'base', label: 'Base' },
    { key: 'estrutura', label: 'Estrutura' },
    { key: 'preco', label: 'Preço' },
    { key: 'revisao', label: 'Revisão' },
  ] as const;

  form!: FormGroup;
  isEditMode = false;
  acabamentoId!: number;
  currentStep = 1;

  variacoes: AcabamentoVariacaoForm[] = [];
  variacoesIniciais: AcabamentoVariacaoForm[] = [];

  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly acabamentoService: AcabamentoService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.detectEditModeAndLoad();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(120)]],
      descricao: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  private detectEditModeAndLoad(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!idParam;

    if (!this.isEditMode) {
      return;
    }

    this.acabamentoId = Number(idParam);
    if (!Number.isFinite(this.acabamentoId)) {
      return;
    }

    this.carregarAcabamento(this.acabamentoId);
  }

  private carregarAcabamento(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.acabamentoService.buscarPorId(id).subscribe({
      next: (acabamento: AcabamentoResponse) => {
        this.patchAcabamento(acabamento);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(extrairMensagemErro(err, 'Erro ao carregar acabamento.'));
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
        this.cdr.markForCheck();
      }
    });
  }

  private patchAcabamento(acabamento: AcabamentoResponse): void {
    this.form.patchValue({
      nome: acabamento?.nome ?? '',
      descricao: acabamento?.descricao ?? '',
    });

    this.variacoesIniciais = (acabamento.variacoes ?? []).map(v => ({
      id: v.id,
      materialId: v.materialId ?? null,
      formatoId: v.formatoId ?? null,
      tipoAplicacao: TipoAplicacaoAcabamento.toValue(v.tipoAplicacao) ?? v.tipoAplicacao,
      preco: v.preco ?? null,
      ativo: v.ativo,
    }));

    this.variacoes = [...this.variacoesIniciais];
  }

  onVariacoesChange(lista: AcabamentoVariacaoForm[]): void {
    this.variacoes = Array.isArray(lista)
      ? lista.filter(v => v && typeof v === 'object')
      : [];
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormControlsAsTouched();
      this.toastr.error('Preencha os campos obrigatórios.');
      return;
    }

    if (!Array.isArray(this.variacoes) || !this.variacoes.length) {
      this.toastr.error('Adicione pelo menos uma variação antes de salvar.');
      return;
    }

    const invalid = this.variacoes.find(v => this.isInvalidVariacao(v));
    if (invalid) {
      this.toastr.error('Há variações com dados inválidos. Verifique aplicação e preço.');
      return;
    }

    const payload = this.toAcabamentoRequest(this.form.getRawValue());

    this.loading = true;
    this.cdr.markForCheck();

    const acao: Observable<AcabamentoResponse> = this.isEditMode
      ? this.acabamentoService.atualizar(this.acabamentoId, payload)
      : this.acabamentoService.salvar(payload);

    acao.subscribe({
      next: () => {
        const mensagem = this.isEditMode ? 'atualizado' : 'criado';
        this.toastr.success(`Acabamento ${mensagem} com sucesso!`);
        this.loading = false;
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
        this.cdr.markForCheck();
      },
      error: (err) => {
        const mensagem = this.isEditMode ? 'atualizar' : 'criar';
        this.loading = false;
        this.toastr.error(extrairMensagemErro(err, `Erro ao ${mensagem} acabamento.`));
        this.cdr.markForCheck();
      }
    });
  }

  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps || step > this.maxAccessibleStep) {
      return;
    }

    this.currentStep = step;
    this.cdr.markForCheck();
    this.scrollToWizardTop();
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.stepBaseCompleta) {
      this.nomeControl.markAsTouched();
      this.descricaoControl.markAsTouched();
      this.toastr.error('Preencha nome e descrição para continuar.');
      return;
    }

    if (this.currentStep === 2 && !this.stepEstruturaCompleta) {
      this.toastr.error('Gere ao menos uma combinação antes de continuar.');
      return;
    }

    if (this.currentStep === 3 && !this.stepPrecoCompleta) {
      this.toastr.error('Defina o preço das variações antes de revisar o cadastro.');
      return;
    }

    this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
    this.cdr.markForCheck();
    this.scrollToWizardTop();
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
    this.cdr.markForCheck();
    this.scrollToWizardTop();
  }

  get showMobileWizardFooter(): boolean {
    return this.currentStep !== 2;
  }

  get mobileWizardFooterLabel(): string {
    return `Etapa ${this.currentStep} de ${this.totalSteps}`;
  }

  get mobileWizardFooterValueText(): string {
    switch (this.currentStep) {
      case 1:
        return 'Base';
      case 3:
        return 'Preço';
      case 4:
        return 'Revisão';
      default:
        return '';
    }
  }

  get mobileWizardFooterSecondaryActionText(): string {
    return this.currentStep > 1 ? 'Voltar' : '';
  }

  get mobileWizardFooterActionText(): string {
    if (this.currentStep === 4) {
      return this.loading ? 'Salvando...' : (this.isEditMode ? 'Atualizar acabamento' : 'Salvar acabamento');
    }

    if (this.currentStep === 3) {
      return 'Revisar acabamento →';
    }

    return 'Próximo';
  }

  get mobileWizardFooterActionDisabled(): boolean {
    if (this.loading) {
      return true;
    }

    switch (this.currentStep) {
      case 1:
        return !this.stepBaseCompleta;
      case 3:
        return !this.stepPrecoCompleta;
      case 4:
        return !this.prontoParaSalvar;
      default:
        return false;
    }
  }

  onMobileWizardPrimaryAction(): void {
    if (this.currentStep === 4) {
      this.onSubmit();
      return;
    }

    this.nextStep();
  }

  onMobileWizardSecondaryAction(): void {
    if (this.currentStep <= 1) {
      return;
    }

    this.previousStep();
  }

  private toAcabamentoRequest(formValue: any): AcabamentoRequest {
    return {
      nome: String(formValue?.nome ?? '').trim(),
      descricao: String(formValue?.descricao ?? '').trim(),
      variacoes: this.toVariacoesRequest(this.variacoes),
    };
  }

  private toVariacoesRequest(lista: AcabamentoVariacaoForm[]): AcabamentoVariacaoRequest[] {
    return (lista ?? []).map((v: AcabamentoVariacaoForm) => {
      const materialId = this.extractId(v.materialId);
      const formatoId = this.extractId(v.formatoId);

      if (!v.tipoAplicacao) {
        throw new Error('Variação inválida: tipoAplicacao é obrigatório.');
      }

      if (!v.preco?.tipo) {
        throw new Error('Variação inválida: tipo de preço ausente.');
      }

      return {
        ...(v.id ? { id: Number(v.id) } : {}),
        materialId: materialId ?? null,
        formatoId: formatoId ?? null,
        tipoAplicacao: v.tipoAplicacao,
        preco: this.toPrecoRequest(v.preco),
        ativo: v.ativo ?? true,
      } as AcabamentoVariacaoRequest;
    });
  }

  private toPrecoRequest(preco: any): PrecoRequest {
    if (!preco?.tipo) throw new Error('Preço inválido na variação.');
    const p = preco ?? {};

    switch (preco.tipo) {
      case 'FIXO':
        return { tipo: 'FIXO', valor: this.num(p.valor) };

      case 'QUANTIDADE':
        return {
          tipo: 'QUANTIDADE',
          faixas: (p.faixas ?? []).map((f: any) => ({
            quantidade: this.num(f.quantidade),
            valor: this.num(f.valor),
          })),
        };

      case 'DEMANDA':
        return {
          tipo: 'DEMANDA',
          faixas: (p.faixas ?? []).map((f: any) => ({
            de: this.num(f.de),
            ate: this.num(f.ate),
            valorUnitario: this.num(f.valorUnitario),
          })),
        };

      case 'METRO':
        return {
          tipo: 'METRO',
          precoMetro: this.num(p.precoMetro),
          modoCobranca: p.modoCobranca ?? 'QUADRADO',
          ...(p.precoMinimo != null ? { precoMinimo: this.num(p.precoMinimo) } : {}),
          ...(p.alturaMaxima != null ? { alturaMaxima: this.num(p.alturaMaxima) } : {}),
          ...(p.larguraMaxima != null ? { larguraMaxima: this.num(p.larguraMaxima) } : {}),
          ...(p.largurasLinearesPermitidas ? { largurasLinearesPermitidas: String(p.largurasLinearesPermitidas) } : {}),
        } as PrecoRequest;

      case 'HORA':
        return {
          tipo: 'HORA',
          valorHora: this.num(p.valorHora),
        } as any;

      default:
        throw new Error(`Tipo de preço desconhecido: ${preco?.tipo}`);
    }
  }

  private scrollToWizardTop(): void {
    setTimeout(() => {
      this.wizardTop?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 30);
  }

  private isInvalidVariacao(v: AcabamentoVariacaoForm): boolean {
    if (!v || typeof v !== 'object') return true;
    if (!v.tipoAplicacao) return true;
    if (!v.preco || !v.preco.tipo) return true;
    return false;
  }

  private extractId(val: any): number | null {
    if (val == null) return null;
    if (typeof val === 'number') return Number(val);
    if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
    if (typeof val === 'object') {
      if ('id' in val && val.id != null) return Number(val.id);
      if ('value' in val && val.value != null) return Number(val.value);
    }
    return null;
  }

  private num(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('Valor numérico inválido.');
    return n;
  }

  private markFormControlsAsTouched(): void {
    Object.values(this.form.controls).forEach(control => control.markAsTouched());
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }

  get variacoesRenderizadas(): AcabamentoVariacaoForm[] {
    return this.variacoes.length ? this.variacoes : this.variacoesIniciais;
  }

  get variacoesCount(): number {
    return this.variacoes.length;
  }

  get variacoesComPrecoCount(): number {
    return this.variacoes.filter(variacao => !!variacao.preco?.tipo).length;
  }

  get variacoesSemPrecoCount(): number {
    return this.variacoesCount - this.variacoesComPrecoCount;
  }

  get dadosPrincipaisProntos(): boolean {
    return this.nomeControl.valid && this.descricaoControl.valid;
  }

  get stepBaseCompleta(): boolean {
    return this.dadosPrincipaisProntos;
  }

  get stepEstruturaCompleta(): boolean {
    return this.variacoesCount > 0;
  }

  get stepPrecoCompleta(): boolean {
    return this.variacoesCount > 0 && this.variacoesSemPrecoCount === 0;
  }

  get completedStepsCount(): number {
    let count = 0;
    if (this.stepBaseCompleta) count += 1;
    if (this.stepEstruturaCompleta) count += 1;
    if (this.stepPrecoCompleta) count += 1;
    if (this.prontoParaSalvar) count += 1;
    return count;
  }

  get maxAccessibleStep(): number {
    if (!this.stepBaseCompleta) return 1;
    if (!this.stepEstruturaCompleta) return 2;
    if (!this.stepPrecoCompleta) return 3;
    return 4;
  }

  get progressPercent(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  get prontoParaSalvar(): boolean {
    return this.dadosPrincipaisProntos && this.stepEstruturaCompleta && this.stepPrecoCompleta;
  }

  get resumoNome(): string {
    return (this.nomeControl.value || '').trim() || 'Pendente';
  }

  get resumoPreco(): string {
    if (!this.variacoesCount) {
      return 'Sem preço';
    }
    if (!this.variacoesComPrecoCount) {
      return 'Pendente';
    }
    if (this.variacoesSemPrecoCount) {
      return `${this.variacoesComPrecoCount}/${this.variacoesCount} com preço`;
    }
    return 'Completo';
  }

  get statusValidacao(): string {
    return this.prontoParaSalvar ? 'Pronto para salvar' : 'Em revisão';
  }

  get statusRevisaoTitulo(): string {
    return this.prontoParaSalvar ? 'Pronto para salvar' : 'Ainda falta revisar';
  }

  get statusRevisaoDescricao(): string {
    if (this.prontoParaSalvar) {
      return `Acabamento ${this.resumoNome} com ${this.variacoesCount} variação(ões) configurada(s) e pronto para salvar.`;
    }

    if (!this.dadosPrincipaisProntos && !this.variacoesCount) {
      return 'Preencha os dados principais e gere ao menos uma variação para concluir o cadastro.';
    }

    if (!this.dadosPrincipaisProntos) {
      return 'Revise nome e descrição para deixar o acabamento pronto para ser salvo.';
    }

    if (!this.stepEstruturaCompleta) {
      return 'Gere ao menos uma variação para concluir o cadastro deste acabamento.';
    }

    return 'Defina o preço das variações antes de concluir o cadastro.';
  }

  get pendenciasSalvamento(): string[] {
    const pendencias: string[] = [];

    if (!this.nomeControl.valid) {
      pendencias.push('Informar o nome do acabamento.');
    }

    if (!this.descricaoControl.valid) {
      pendencias.push('Preencher uma descrição clara do uso do acabamento.');
    }

    if (!this.variacoesCount) {
      pendencias.push('Gerar ao menos uma variação antes de salvar.');
    }

    if (this.variacoesSemPrecoCount) {
      pendencias.push(`Definir preço para ${this.variacoesSemPrecoCount} variação(ões).`);
    }

    return pendencias;
  }
}
