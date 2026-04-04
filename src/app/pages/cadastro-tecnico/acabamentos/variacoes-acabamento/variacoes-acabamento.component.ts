import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { AcabamentoVariacaoHelperService } from './variacoes-acabamento-helper.service';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';
import { requireAtLeastOneSelected } from 'src/app/components/validators/require-at-least-one-selected';
import {
  AcabamentoVariacaoDialogComponent,
  AcabamentoVariacaoDialogResult
} from 'src/app/components/dialog/acabamento-variacao-dialog/acabamento-variacao-dialog.component';

export interface AcabamentoVariacaoForm {
  id?: number;
  materialId?: any;
  formatoId?: any;
  tipoAplicacao: TipoAplicacaoAcabamento | string;
  preco: any;
  ativo?: boolean;
}

type AcabamentoSelectorPanel = 'materiais' | 'formatos' | 'aplicacoes';
type MobileEstruturaView = 'overview' | 'selector' | 'variations';

@Component({
  standalone: true,
  selector: 'app-variacoes-acabamento',
  templateUrl: './variacoes-acabamento.component.html',
  styleUrls: ['./variacoes-acabamento.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    InputMultiSelectComponent,
    PrecoSelectorComponent,
    MobileTotalBarComponent
  ],
})
export class VariacoesAcabamentoComponent implements OnDestroy {
  @ViewChild(MatTable) table!: MatTable<AcabamentoVariacaoForm>;
  @ViewChild('variacoesSalvasCard') variacoesSalvasCard?: ElementRef<HTMLElement>;

  @Input() etapa: 'estrutura' | 'preco' = 'estrutura';
  @Input() isEditMode = false;
  @Input() variacoesIniciais: AcabamentoVariacaoForm[] | AcabamentoVariacaoResponse[] | null = null;
  @Input() currentStep = 2;
  @Input() totalSteps = 4;
  @Input() completedStepsCount = 0;
  @Input() progressPercent = 0;

  @Output() variacoesChange = new EventEmitter<AcabamentoVariacaoForm[]>();
  @Output() previousStepRequest = new EventEmitter<void>();
  @Output() nextStepRequest = new EventEmitter<void>();

  materiais: any[] = [];
  formatos: any[] = [];

  formEstrutura!: FormGroup;
  formPrecoGlobal!: FormGroup;

  dataSource = new MatTableDataSource<AcabamentoVariacaoForm>([]);
  displayedColumnsEstrutura: string[] = ['variacao', 'preco', 'acoes'];
  displayedColumnsPreco: string[] = ['variacao', 'preco', 'status', 'acoes'];

  expandedSelectorPanel: AcabamentoSelectorPanel | null = 'materiais';
  mobileView: MobileEstruturaView = 'overview';
  activeMobileGroup: AcabamentoSelectorPanel | null = null;
  isMobile = false;
  carregandoOpcoes = true;
  gerandoVariacoes = false;

  readonly TipoAplicacaoAcabamento = TipoAplicacaoAcabamento;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly helperService: AcabamentoVariacaoHelperService,
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog,
    private readonly cdr: ChangeDetectorRef,
    private readonly breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
        if (!this.isMobile) {
          this.mobileView = 'overview';
          this.activeMobileGroup = null;
        } else {
          this.syncMobileEntryFlow();
        }
        this.cdr.markForCheck();
      });

    this.helperService.carregarDadosIniciais()
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ materiais, formatos }) => {
        this.materiais = [...materiais];
        this.formatos = [...formatos];
        this.carregandoOpcoes = false;
        this.sincronizarEstruturaComVariacoes();
        this.cdr.markForCheck();
      });

    this.iniciarFormularios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['variacoesIniciais']) {
      this.dataSource.data = [...this.normalizarVariacoes(this.variacoesIniciais ?? [])];
      this.sincronizarEstruturaComVariacoes();
    }

    if (changes['currentStep']) {
      this.syncMobileEntryFlow();
    }
  }

  iniciarFormularios(): void {
    this.formEstrutura = this.fb.group({
      materiaisIds: this.fb.control<any[]>([], { validators: [Validators.required], nonNullable: true }),
      formatosIds: this.fb.control<any[]>([], { nonNullable: true }),
      tiposAplicacao: this.fb.control<any[]>([], { validators: [requireAtLeastOneSelected], nonNullable: true }),
    });

    this.formPrecoGlobal = this.fb.group({});
  }

  gerarVariacoes(): void {
    this.formEstrutura.markAllAsTouched();

    if (!this.tiposAplicacaoSelecionados.length || this.formEstrutura.invalid) {
      this.toastr.error('Selecione materiais e aplicações para gerar as combinações.', 'Estrutura incompleta');
      this.scrollToFirstInvalid();
      return;
    }

    this.gerandoVariacoes = true;

    setTimeout(() => {
      const materiais = this.materiaisSelecionados.length
        ? this.materiaisSelecionados.map(item => this.extractId(item))
        : [null];
      const formatos = this.formatosSelecionados.length
        ? this.formatosSelecionados.map(item => this.extractId(item))
        : [null];

      const novasVariacoes: AcabamentoVariacaoForm[] = [];

      for (const materialId of materiais) {
        for (const formatoId of formatos) {
          for (const tipoAplicacao of this.tiposAplicacaoSelecionados) {
            if (this.combinacaoJaExiste(materialId, formatoId, tipoAplicacao)) {
              continue;
            }

            novasVariacoes.push({
              materialId,
              formatoId,
              tipoAplicacao,
              preco: null,
              ativo: true,
            });
          }
        }
      }

      this.gerandoVariacoes = false;

      if (!novasVariacoes.length) {
        this.toastr.info('Todas as combinações geradas já estavam cadastradas.');
        return;
      }

      this.dataSource.data = [...this.dataSource.data, ...novasVariacoes];
      this.emitirVariacoes();
      this.focusVariacoesGeradas();
      this.toastr.success('Combinações geradas com sucesso.');
      this.syncMobileEntryFlow();
      this.cdr.markForCheck();
    }, 140);
  }

  aplicarPrecoGlobal(): void {
    this.formPrecoGlobal.markAllAsTouched();
    this.formPrecoGlobal.updateValueAndValidity();

    if (!this.variacoesGeradasCount) {
      this.toastr.info('Gere combinações antes de aplicar o preço.');
      return;
    }

    if (this.formPrecoGlobal.invalid) {
      this.toastr.error('Defina um preço válido antes de continuar.', 'Preço incompleto');
      this.scrollToFirstInvalid();
      return;
    }

    const precoBase = this.cloneValue(this.formPrecoGlobal.getRawValue());
    this.dataSource.data = this.dataSource.data.map(v => ({
      ...v,
      preco: this.cloneValue(precoBase),
    }));

    this.emitirVariacoes();
    this.toastr.success(`Preço aplicado em ${this.dataSource.data.length} variação(ões).`);
  }

  verVariacao(variacao: AcabamentoVariacaoForm): void {
    this.openVariacaoDialog('view', variacao);
  }

  editarVariacao(variacao: AcabamentoVariacaoForm, index: number): void {
    const dialogRef = this.openVariacaoDialog('edit', variacao);

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result?: AcabamentoVariacaoDialogResult) => {
        if (!result?.variacao) {
          return;
        }

        const arr = [...this.dataSource.data];
        arr[index] = result.variacao;
        this.dataSource.data = arr;
        this.emitirVariacoes();
        this.toastr.success('Variação atualizada com sucesso.');
        this.cdr.markForCheck();
      });
  }

  removerVariacao(index: number): void {
    const arr = [...this.dataSource.data];
    arr.splice(index, 1);
    this.dataSource.data = arr;
    this.emitirVariacoes();
    this.toastr.info('Variação removida.');
    this.cdr.markForCheck();
  }

  emitirVariacoes(): void {
    this.variacoesChange.emit(this.dataSource.data);
  }

  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  getFormGroup(control: AbstractControl | null): FormGroup {
    return control as FormGroup;
  }

  get materiaisSelecionados(): any[] {
    const ids = this.formEstrutura?.get('materiaisIds')?.value ?? [];
    return ids.map((id: any) => this.buscarItemPorId(this.materiais, id)).filter((item: any) => item != null);
  }

  get formatosSelecionados(): any[] {
    const ids = this.formEstrutura?.get('formatosIds')?.value ?? [];
    return ids.map((id: any) => this.buscarItemPorId(this.formatos, id)).filter((item: any) => item != null);
  }

  get tiposAplicacaoSelecionados(): TipoAplicacaoAcabamento[] {
    return (this.formEstrutura?.get('tiposAplicacao')?.value ?? [])
      .map((tipo: any) => TipoAplicacaoAcabamento.toValue(tipo))
      .filter((tipo: TipoAplicacaoAcabamento | null): tipo is TipoAplicacaoAcabamento => tipo != null);
  }

  get materiaisSelecionadosCount(): number {
    return this.materiaisSelecionados.length;
  }

  get formatosSelecionadosCount(): number {
    return this.formatosSelecionados.length;
  }

  get tiposAplicacaoSelecionadosCount(): number {
    return this.tiposAplicacaoSelecionados.length;
  }

  get totalCombinacoes(): number {
    const materiais = this.materiaisSelecionadosCount || 0;
    const formatos = this.formatosSelecionadosCount || 1;
    const aplicacoes = this.tiposAplicacaoSelecionadosCount || 0;
    return materiais * formatos * aplicacoes;
  }

  get podeGerarCombinacoes(): boolean {
    return this.materiaisSelecionadosCount > 0 && this.tiposAplicacaoSelecionadosCount > 0 && !this.formEstrutura.invalid;
  }

  get resumoGeracao(): string {
    return `${this.materiaisSelecionadosCount || 0} materiais • ${this.formatosSelecionadosCount || 0} formatos • ${this.tiposAplicacaoSelecionadosCount || 0} aplicações → ${this.totalCombinacoes || 0} combinações`;
  }

  get ctaGeracaoLabel(): string {
    return this.gerandoVariacoes ? 'Gerando combinações...' : 'Gerar combinações';
  }

  get variacoesGeradasCount(): number {
    return this.dataSource.data.length;
  }

  get variacoesComPrecoCount(): number {
    return this.dataSource.data.filter(v => !!v.preco?.tipo).length;
  }

  get variacoesSemPrecoCount(): number {
    return this.variacoesGeradasCount - this.variacoesComPrecoCount;
  }

  get resumoAplicacaoPreco(): string {
    if (!this.variacoesGeradasCount) {
      return 'Gere as combinações primeiro para depois aplicar a regra de preço.';
    }

    return 'Aplique uma regra geral ou edite variações individualmente.';
  }

  get mobilePrimaryActionText(): string {
    return this.variacoesGeradasCount ? 'Próximo' : 'Gerar combinações';
  }

  get mobilePrimaryActionDisabled(): boolean {
    if (this.variacoesGeradasCount) {
      return false;
    }

    return !this.podeGerarCombinacoes || this.gerandoVariacoes;
  }

  get mobileBarValueText(): string {
    return this.variacoesGeradasCount
      ? `${this.variacoesGeradasCount} variação(ões)`
      : `${this.totalCombinacoes || 0} combinações`;
  }

  get mobileBarDetailText(): string {
    if (this.gerandoVariacoes) {
      return 'Gerando combinações...';
    }

    if (this.variacoesGeradasCount) {
      return 'Pronto para definir preços';
    }

    if (this.podeGerarCombinacoes) {
      return `${this.totalCombinacoes} combinações serão criadas`;
    }

    return 'Selecione materiais e aplicações';
  }

  get resumoPrecoMobile(): string {
    return `${this.variacoesGeradasCount} variações • ${this.variacoesComPrecoCount} com preço • ${this.variacoesSemPrecoCount} pendentes`;
  }

  get materiaisOptions(): { id: any; nome: string }[] {
    return (this.materiais ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get formatosOptions(): { id: any; nome: string }[] {
    return (this.formatos ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get tiposAplicacaoOptions(): { id: TipoAplicacaoAcabamento; nome: string }[] {
    return TipoAplicacaoAcabamento.options().map(option => ({
      id: option.value,
      nome: option.label,
    }));
  }

  get activeMobileGroupTitle(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Materiais';
      case 'formatos': return 'Formatos';
      case 'aplicacoes': return 'Aplicações';
      default: return 'Seleção';
    }
  }

  get mobileSubstepLabel(): string {
    if (this.mobileView === 'selector') {
      return this.activeMobileGroupTitle;
    }

    if (this.mobileView === 'variations') {
      return 'Variações geradas';
    }

    return 'Seleção de grupos';
  }

  get activeMobileGroupHint(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Escolha os materiais que entram nas combinações.';
      case 'formatos': return 'Selecione os formatos disponíveis para esse acabamento.';
      case 'aplicacoes': return 'Defina os tipos de aplicação usados nas combinações.';
      default: return '';
    }
  }

  get activeMobileSelectorLabel(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Materiais obrigatórios';
      case 'formatos': return 'Formatos principais';
      case 'aplicacoes': return 'Aplicações principais';
      default: return 'Selecionar';
    }
  }

  get activeMobileSearchPlaceholder(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Buscar material';
      case 'formatos': return 'Buscar formato';
      case 'aplicacoes': return 'Buscar aplicação';
      default: return 'Buscar opção';
    }
  }

  get activeMobileControl(): FormControl {
    switch (this.activeMobileGroup) {
      case 'materiais': return this.getFormControl(this.formEstrutura.get('materiaisIds'));
      case 'formatos': return this.getFormControl(this.formEstrutura.get('formatosIds'));
      case 'aplicacoes': return this.getFormControl(this.formEstrutura.get('tiposAplicacao'));
      default: return new FormControl<any[]>([], { nonNullable: true });
    }
  }

  get activeMobileOptions(): { id: any; nome: string }[] {
    switch (this.activeMobileGroup) {
      case 'materiais': return this.materiaisOptions;
      case 'formatos': return this.formatosOptions;
      case 'aplicacoes': return this.tiposAplicacaoOptions;
      default: return [];
    }
  }

  get mobileGroups(): Array<{ key: AcabamentoSelectorPanel; label: string; count: number }> {
    return [
      { key: 'materiais', label: 'Materiais', count: this.materiaisSelecionadosCount },
      { key: 'formatos', label: 'Formatos', count: this.formatosSelecionadosCount },
      { key: 'aplicacoes', label: 'Aplicações', count: this.tiposAplicacaoSelecionadosCount },
    ];
  }

  concluirBloco(panel: AcabamentoSelectorPanel): void {
    const flow: AcabamentoSelectorPanel[] = ['materiais', 'formatos', 'aplicacoes'];
    const currentIndex = flow.indexOf(panel);
    const nextPanel = flow[currentIndex + 1] ?? null;
    this.expandedSelectorPanel = nextPanel;

    if (this.isMobile) {
      if (nextPanel) {
        this.activeMobileGroup = nextPanel;
        this.mobileView = 'selector';
      } else {
        this.mobileView = 'overview';
        this.activeMobileGroup = null;
      }
      this.cdr.markForCheck();
    }
  }

  onMobileBack(): void {
    if (this.mobileView === 'overview') {
      this.previousStepRequest.emit();
      return;
    }

    this.mobileView = 'overview';
    this.activeMobileGroup = null;
    this.cdr.markForCheck();
  }

  openMobileGroup(panel: AcabamentoSelectorPanel): void {
    this.activeMobileGroup = panel;
    this.mobileView = 'selector';
    this.cdr.markForCheck();
  }

  openMobileVariations(): void {
    if (!this.variacoesGeradasCount) {
      return;
    }

    this.mobileView = 'variations';
    this.activeMobileGroup = null;
    this.cdr.markForCheck();
  }

  onMobilePrimaryAction(): void {
    if (this.variacoesGeradasCount) {
      this.nextStepRequest.emit();
      return;
    }

    this.gerarVariacoes();
  }

  onMobileSelectorConclude(): void {
    if (!this.activeMobileGroup) {
      this.mobileView = 'overview';
      this.cdr.markForCheck();
      return;
    }

    this.concluirBloco(this.activeMobileGroup);
  }

  tituloVariacao(v: AcabamentoVariacaoForm): string {
    const partes = [
      this.resolveLabel(v.materialId, this.materiais),
      this.resolveLabel(v.formatoId, this.formatos),
      this.mostrarTipoAplicacao(v.tipoAplicacao),
    ].filter(Boolean);
    return partes.join(' • ') || 'Variação';
  }

  statusPreco(v: AcabamentoVariacaoForm): string {
    return v.preco?.tipo ? 'Definido' : 'Pendente';
  }

  mostrarTipoAplicacao(item: any): string {
    return TipoAplicacaoAcabamento.label(item);
  }

  precoResumo(preco: any): string {
    if (!preco?.tipo) return 'Pendente';
    switch (preco.tipo) {
      case 'FIXO':
        return this.moeda(preco.valor);
      case 'HORA':
        return `${this.moeda(preco.valorHora)}/h`;
      case 'QUANTIDADE': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return 'Pendente';
        const first = faixas[0];
        const head = `${this.moeda(first.valor)} (${first.quantidade})`;
        return faixas.length > 1 ? `${head} (+${faixas.length - 1})` : head;
      }
      case 'DEMANDA': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return 'Pendente';
        const first = faixas[0];
        const head = `${this.moeda(first.valorUnitario)} (${first.de}–${first.ate})`;
        return faixas.length > 1 ? `${head} (+${faixas.length - 1})` : head;
      }
      case 'METRO': {
        const modo = preco.modoCobranca === 'LINEAR' ? 'm' : 'm²';
        return `${this.moeda(preco.precoMetro)}/${modo}`;
      }
      default:
        return 'Pendente';
    }
  }

  trackByIndex(index: number, _row: any): number {
    return index;
  }

  private syncMobileEntryFlow(): void {
    if (!this.isMobile || this.etapa !== 'estrutura') {
      return;
    }

    if (this.isEditMode || this.variacoesGeradasCount) {
      this.mobileView = 'overview';
      this.activeMobileGroup = null;
      return;
    }

    this.mobileView = 'selector';
    this.activeMobileGroup = 'materiais';
  }

  private openVariacaoDialog(mode: 'view' | 'edit', variacao: AcabamentoVariacaoForm) {
    return this.dialog.open(AcabamentoVariacaoDialogComponent, {
      width: this.isMobile ? 'calc(100vw - 12px)' : 'min(880px, calc(100vw - 48px))',
      maxWidth: this.isMobile ? '100vw' : '880px',
      maxHeight: this.isMobile ? '92dvh' : '90vh',
      position: this.isMobile ? { bottom: '0' } : undefined,
      panelClass: this.isMobile ? ['mobile-variation-edit-sheet'] : undefined,
      data: {
        mode,
        variacao,
        lookups: {
          materiais: this.materiais ?? [],
          formatos: this.formatos ?? [],
        }
      },
    });
  }

  private normalizarVariacoes(lista: Array<AcabamentoVariacaoForm | AcabamentoVariacaoResponse>): AcabamentoVariacaoForm[] {
    return (lista ?? []).map((v: any) => ({
      id: v.id,
      materialId: v.materialId ?? null,
      formatoId: v.formatoId ?? null,
      tipoAplicacao: TipoAplicacaoAcabamento.toValue(v.tipoAplicacao) ?? v.tipoAplicacao,
      preco: v.preco ?? null,
      ativo: v.ativo ?? true,
    }));
  }

  private sincronizarEstruturaComVariacoes(): void {
    if (!this.formEstrutura || this.carregandoOpcoes) {
      return;
    }

    const materiaisIds = this.uniqueIds(this.dataSource.data.map(v => this.extractId(v.materialId)));
    const formatosIds = this.uniqueIds(this.dataSource.data.map(v => this.extractId(v.formatoId)));
    const tiposAplicacao = Array.from(
      new Set(
        this.dataSource.data
          .map(v => TipoAplicacaoAcabamento.toValue(v.tipoAplicacao))
          .filter((tipo): tipo is TipoAplicacaoAcabamento => tipo != null)
      )
    );

    this.formEstrutura.patchValue({
      materiaisIds,
      formatosIds,
      tiposAplicacao,
    }, { emitEvent: false });

    if (!this.isEditMode && this.dataSource.data.length) {
      this.expandedSelectorPanel = null;
    }

    this.cdr.markForCheck();
  }

  private scrollToFirstInvalid(): void {
    setTimeout(() => {
      const el = document.querySelector(
        'mat-form-field .ng-invalid, .ng-invalid input, .ng-invalid textarea, .ng-invalid select'
      ) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as any)?.focus?.();
    }, 0);
  }

  private focusVariacoesGeradas(): void {
    setTimeout(() => {
      this.variacoesSalvasCard?.nativeElement?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 80);
  }

  private combinacaoJaExiste(materialId: number | null, formatoId: number | null, tipoAplicacao: TipoAplicacaoAcabamento | string): boolean {
    const targetTipo = TipoAplicacaoAcabamento.toValue(tipoAplicacao) ?? tipoAplicacao;
    return this.dataSource.data.some(item => {
      const itemTipo = TipoAplicacaoAcabamento.toValue(item.tipoAplicacao) ?? item.tipoAplicacao;
      return this.extractId(item.materialId) === materialId
        && this.extractId(item.formatoId) === formatoId
        && itemTipo === targetTipo;
    });
  }

  private uniqueIds(ids: Array<number | null>): number[] {
    return Array.from(new Set(ids.filter((id): id is number => id != null)));
  }

  private buscarItemPorId(lista: any[], valor: any): any | null {
    const id = this.extractId(valor);
    if (id == null) {
      return null;
    }
    return lista.find(item => Number(item.id) === Number(id)) ?? null;
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

  private resolveLabel(val: any, options: any[]): string {
    if (val == null) return 'Todos';
    const id = typeof val === 'object' ? val.id : val;
    const found = options?.find(o => String(o.id) === String(id));
    return found?.nome ?? found?.descricao ?? 'Todos';
  }

  private moeda(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }
}
