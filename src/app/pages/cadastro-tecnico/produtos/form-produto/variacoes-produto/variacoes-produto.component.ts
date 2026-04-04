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
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InputMultiSelectComponent } from '../../../../../components/inputs/input-multi-select/input-multi-select-component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { NomeDePipe } from '../../../../../pipe/nomeDe.pipe';
import { VariacaoProduto } from './models/variacao.model';
import { VariacaoProdutoHelperService } from './variacao-produto-helper.service';
import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { MatDialog } from '@angular/material/dialog';
import { VariacaoDetalheDialogComponent } from 'src/app/components/dialog/variacao-detalhe-dialog/variacao-detalhe-dialog.component';
import { VariacaoEditarDialogComponent, VariacaoEditarDialogResult } from 'src/app/components/dialog/variacao-editar-dialog/variacao-editar-dialog.component';
import { MobileTotalBarComponent } from 'src/app/components/mobile-total-bar/mobile-total-bar.component';

type ProdutoSelectorPanel = 'materiais' | 'formatos' | 'cores' | 'acabamentos' | 'servicos';
type MobileEstruturaView = 'overview' | 'selector' | 'variations';

@Component({
  standalone: true,
  selector: 'app-variacoes-produto',
  templateUrl: './variacoes-produto.component.html',
  styleUrls: ['./variacoes-produto.component.scss'],
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
    PrecoSelectorComponent,
    InputMultiSelectComponent,
    MobileTotalBarComponent,
    NomeDePipe
  ],
})
export class VariacoesProdutoComponent implements OnDestroy {
  expandedSelectorPanel: ProdutoSelectorPanel | null = 'materiais';
  mobileView: MobileEstruturaView = 'overview';
  activeMobileGroup: ProdutoSelectorPanel | null = null;
  isMobile = false;
  carregandoOpcoes = true;
  gerandoVariacoes = false;
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatTable) table!: MatTable<VariacaoProduto>;
  @ViewChild('variacoesSalvasCard') variacoesSalvasCard?: ElementRef<HTMLElement>;

  @Input() etapa: 'estrutura' | 'preco' = 'estrutura';
  @Input() isEditMode = false;
  @Input() variacoesIniciais: VariacaoProduto[] | null = null;
  @Input() politicaProduto: PoliticaRevenda | null = null;
  @Input() currentStep = 2;
  @Input() totalSteps = 4;
  @Input() completedStepsCount = 0;
  @Input() progressPercent = 0;

  @Output() variacoesChange = new EventEmitter<VariacaoProduto[]>();
  @Output() previousStepRequest = new EventEmitter<void>();
  @Output() nextStepRequest = new EventEmitter<void>();

  materiais: any[] = [];
  formatos: any[] = [];
  servicosDisponiveis: any[] = [];
  acabamentosDisponiveis: { id: any; nome: string }[] = [];
  coresDisponiveis: any[] = [];

  formEstrutura!: FormGroup;
  formPrecoGlobal!: FormGroup;

  dataSource = new MatTableDataSource<VariacaoProduto>([]);
  displayedColumnsEstrutura: string[] = ['material', 'formato', 'cor', 'extras', 'ver', 'editar', 'acoes'];
  displayedColumnsEstruturaEdit: string[] = ['variacao', 'extras', 'acoes'];
  displayedColumnsPreco: string[] = ['variacao', 'preco', 'status', 'acoes'];

  constructor(
    private readonly fb: FormBuilder,
    private readonly helperService: VariacaoProdutoHelperService,
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
      .subscribe(({ materiais, formatos, servicos, acabamentos, cores }) => {
        this.materiais = [...materiais];
        this.formatos = [...formatos];
        this.servicosDisponiveis = [...servicos];
        this.acabamentosDisponiveis = [...acabamentos];
        this.coresDisponiveis = [...cores];
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
      this.dataSource.data = [...(this.variacoesIniciais ?? [])];
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
      coresIds: this.fb.control<any[]>([], { nonNullable: true }),
      acabamentos: this.fb.control<any[]>([], { nonNullable: true }),
      servicos: this.fb.control<any[]>([], { nonNullable: true }),
    });

    this.formPrecoGlobal = this.fb.group({});
  }

  gerarVariacoes(): void {
    this.formEstrutura.markAllAsTouched();

    if (!this.materiaisSelecionadosCount || this.formEstrutura.invalid) {
      this.toastr.error('Selecione ao menos um material para gerar as variações.', 'Estrutura incompleta');
      this.scrollToFirstInvalid();
      return;
    }

    this.gerandoVariacoes = true;

    setTimeout(() => {
      const raw = this.formEstrutura.getRawValue();
      const materiais = this.materiaisSelecionados.map(item => this.extractId(item)).filter((id): id is number => id != null);
      const formatos = this.formatosSelecionados.length
        ? this.formatosSelecionados.map(item => this.extractId(item))
        : [null];
      const cores = this.coresSelecionadas.length
        ? this.coresSelecionadas.map(item => this.extractId(item))
        : [null];

      const acabamentos = (raw.acabamentos ?? [])
        .map((id: any) => this.extractId(id))
        .filter((id: number | null): id is number => id != null);
      const servicos = (raw.servicos ?? [])
        .map((id: any) => this.extractId(id))
        .filter((id: number | null): id is number => id != null);

      const novasVariacoes: VariacaoProduto[] = [];

      for (const materialId of materiais) {
        for (const formatoId of formatos) {
          for (const corId of cores) {
            if (this.combinacaoJaExiste(materialId, formatoId, corId)) {
              continue;
            }

            novasVariacoes.push({
              materialId,
              formatoId: formatoId ?? null,
              cor: corId ?? null,
              corId: corId ?? null,
              corLabel: this.resolveLabel(corId, this.coresDisponiveis),
              acabamentos: [...acabamentos],
              servicos: [...servicos],
              preco: null,
              politicaRevenda: this.politicaProduto ?? null,
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

      this.toastr.success('Estrutura definida com sucesso');
    }, 140);
  }

  aplicarPrecoEmLote(): void {
    const precoFG = this.formPrecoGlobal as FormGroup;
    precoFG.markAllAsTouched();
    precoFG.updateValueAndValidity();

    if (!this.dataSource.data.length) {
      this.toastr.info('Gere variações antes de aplicar o preço.');
      return;
    }

    if (precoFG.invalid) {
      const msgPreco = (precoFG.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Defina um preço válido antes de continuar.', 'Preço incompleto');
      this.scrollToFirstInvalid();
      return;
    }

    const precoBase = this.cloneValue(precoFG.getRawValue());
    this.dataSource.data = this.dataSource.data.map(v => ({
      ...v,
      preco: this.cloneValue(precoBase),
      politicaRevenda: this.politicaProduto ?? v.politicaRevenda ?? null,
    }));

    this.emitirVariacoes();
    this.toastr.success(`Preço aplicado em ${this.dataSource.data.length} variação(ões).`);
  }

  verVariacao(v: VariacaoProduto): void {
    this.dialog.open(VariacaoDetalheDialogComponent, {
      width: '760px',
      maxHeight: '85vh',
      data: {
        variacao: v,
        lookups: {
          materiais: this.materiais ?? [],
          formatos: this.formatos ?? [],
          cores: this.coresDisponiveis ?? [],
          acabamentos: this.acabamentosDisponiveis ?? [],
          servicos: this.servicosDisponiveis ?? [],
        },
        politicaProduto: this.politicaProduto ?? null,
      }
    });
  }

  removerVariacao(index: number): void {
    const arr = [...this.dataSource.data];
    arr.splice(index, 1);
    this.dataSource.data = arr;
    this.emitirVariacoes();
    this.toastr.info('Variação removida.');
  }

  editarVariacao(variacao: VariacaoProduto, index: number): void {
    const dialogRef = this.dialog.open(VariacaoEditarDialogComponent, {
      width: this.isMobile ? 'calc(100vw - 12px)' : 'min(1120px, calc(100vw - 48px))',
      maxWidth: this.isMobile ? '100vw' : '1120px',
      maxHeight: this.isMobile ? '92dvh' : '90vh',
      position: this.isMobile ? { bottom: '0' } : undefined,
      panelClass: this.isMobile ? ['mobile-variation-edit-sheet'] : undefined,
      data: {
        variacao,
        lookups: {
          materiais: this.materiais ?? [],
          formatos: this.formatos ?? [],
          cores: this.coresDisponiveis ?? [],
          acabamentos: this.acabamentosDisponiveis ?? [],
          servicos: this.servicosDisponiveis ?? [],
        },
        politicaProduto: this.politicaProduto ?? null,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result?: VariacaoEditarDialogResult) => {
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

  get coresSelecionadas(): any[] {
    const ids = this.formEstrutura?.get('coresIds')?.value ?? [];
    return ids.map((id: any) => this.buscarItemPorId(this.coresDisponiveis, id)).filter((item: any) => item != null);
  }

  get materiaisSelecionadosCount(): number {
    return this.materiaisSelecionados.length;
  }

  get formatosSelecionadosCount(): number {
    return this.formatosSelecionados.length;
  }

  get coresSelecionadasCount(): number {
    return this.coresSelecionadas.length;
  }

  get totalCombinacoes(): number {
    const materiais = this.materiaisSelecionadosCount || 0;
    const formatos = this.formatosSelecionadosCount || 1;
    const cores = this.coresSelecionadasCount || 1;
    return materiais * formatos * cores;
  }

  get podeGerarCombinacoes(): boolean {
    return this.materiaisSelecionadosCount > 0 && !this.formEstrutura.invalid && !!this.totalCombinacoes;
  }

  get resumoGeracao(): string {
    if (!this.materiaisSelecionadosCount) {
      return 'Selecione ao menos um material para começar.';
    }

    return `Você está criando ${this.totalCombinacoes} variação(ões) com ${this.materiaisSelecionadosCount} material(is), ${this.formatosSelecionadosCount || 1} formato(s) e ${this.coresSelecionadasCount || 1} cor(es).`;
  }

  get mensagemGeracaoBloqueada(): string {
    if (!this.materiaisSelecionadosCount) {
      return 'Escolha ao menos um material para liberar a geração automática.';
    }

    return '';
  }

  get ctaGeracaoLabel(): string {
    return this.gerandoVariacoes ? 'Gerando combinações...' : 'Gerar variações automaticamente';
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

  get todasVariacoesComPreco(): boolean {
    return this.variacoesGeradasCount > 0 && this.variacoesSemPrecoCount === 0;
  }

  get resumoAplicacaoPreco(): string {
    if (!this.variacoesGeradasCount) {
      return 'Gere as variações primeiro para depois aplicar a regra de preço.';
    }

    return 'Aplique uma regra geral ou edite variações individualmente.';
  }

  get mobilePrimaryActionText(): string {
    return this.variacoesGeradasCount ? 'Próximo' : 'Gerar variações';
  }

  get mobilePrimaryActionDisabled(): boolean {
    if (this.variacoesGeradasCount) {
      return false;
    }

    return !this.podeGerarCombinacoes || this.gerandoVariacoes;
  }

  get mobileBarValueText(): string {
    if (this.variacoesGeradasCount) {
      return `${this.variacoesGeradasCount} variação(ões)`;
    }

    return `${this.totalCombinacoes || 0} combinações`;
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

    return 'Selecione materiais, formatos e cores';
  }

  get mobileVariationsBarValueText(): string {
    return `${this.variacoesGeradasCount} variação(ões)`;
  }

  get resumoPrecoMobile(): string {
    return `${this.variacoesGeradasCount} variações • ${this.variacoesComPrecoCount} com preço • ${this.variacoesSemPrecoCount} pendentes`;
  }

  get mensagemPrecoBloqueado(): string {
    if (!this.variacoesGeradasCount) {
      return 'Nenhuma variação gerada ainda.';
    }
    if (!this.variacoesComPrecoCount) {
      return 'Nenhuma variação tem preço aplicado ainda.';
    }
    if (this.variacoesSemPrecoCount) {
      return `${this.variacoesSemPrecoCount} variação(ões) ainda estão sem preço.`;
    }
    return 'Todas as variações já estão com preço configurado.';
  }

  get materiaisOptions(): { id: any; nome: string }[] {
    return (this.materiais ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get formatosOptions(): { id: any; nome: string }[] {
    return (this.formatos ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get coresOptions(): { id: any; nome: string }[] {
    return (this.coresDisponiveis ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get extrasSelecionadosResumo(): string {
    const acabamentos = (this.formEstrutura?.get('acabamentos')?.value ?? []).length;
    const servicos = (this.formEstrutura?.get('servicos')?.value ?? []).length;
    if (!acabamentos && !servicos) {
      return 'Sem extras opcionais selecionados.';
    }
    return `${acabamentos} acabamento(s) e ${servicos} serviço(s) serão adicionados às combinações.`;
  }

  get accordionResumo(): string {
    return `${this.materiaisSelecionadosCount || 0} materiais • ${this.formatosSelecionadosCount || 0} formatos • ${this.coresSelecionadasCount || 0} cores`;
  }

  concluirBloco(panel: ProdutoSelectorPanel): void {
    const flow: ProdutoSelectorPanel[] = [
      'materiais',
      'formatos',
      'cores',
      'acabamentos',
      'servicos'
    ];

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

  openMobileGroup(panel: ProdutoSelectorPanel): void {
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

  get activeMobileGroupTitle(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Materiais';
      case 'formatos': return 'Formatos';
      case 'cores': return 'Cores';
      case 'acabamentos': return 'Acabamentos';
      case 'servicos': return 'Serviços';
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
      case 'materiais': return 'Escolha os materiais que compõem a base do produto.';
      case 'formatos': return 'Selecione os formatos disponíveis para esse produto.';
      case 'cores': return 'Defina as opções de cor usadas nas combinações.';
      case 'acabamentos': return 'Opcional. Esses acabamentos serão aplicados em lote.';
      case 'servicos': return 'Opcional. Esses serviços poderão ser adicionados às combinações.';
      default: return '';
    }
  }

  get activeMobileSelectorLabel(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Materiais obrigatórios';
      case 'formatos': return 'Formatos principais';
      case 'cores': return 'Cores principais';
      case 'acabamentos': return 'Acabamentos opcionais';
      case 'servicos': return 'Serviços opcionais';
      default: return 'Selecionar';
    }
  }

  get activeMobileSearchPlaceholder(): string {
    switch (this.activeMobileGroup) {
      case 'materiais': return 'Buscar material';
      case 'formatos': return 'Buscar formato';
      case 'cores': return 'Buscar cor';
      case 'acabamentos': return 'Buscar acabamento';
      case 'servicos': return 'Buscar serviço';
      default: return 'Buscar opção';
    }
  }

  get activeMobileConcludeText(): string {
    return this.activeMobileGroup === 'acabamentos' || this.activeMobileGroup === 'servicos'
      ? 'Aplicar'
      : 'Confirmar';
  }

  get activeMobileControl(): FormControl {
    switch (this.activeMobileGroup) {
      case 'materiais': return this.getFormControl(this.formEstrutura.get('materiaisIds'));
      case 'formatos': return this.getFormControl(this.formEstrutura.get('formatosIds'));
      case 'cores': return this.getFormControl(this.formEstrutura.get('coresIds'));
      case 'acabamentos': return this.getFormControl(this.formEstrutura.get('acabamentos'));
      case 'servicos': return this.getFormControl(this.formEstrutura.get('servicos'));
      default: return new FormControl<any[]>([], { nonNullable: true });
    }
  }

  get activeMobileOptions(): { id: any; nome: string }[] {
    switch (this.activeMobileGroup) {
      case 'materiais': return this.materiaisOptions;
      case 'formatos': return this.formatosOptions;
      case 'cores': return this.coresOptions;
      case 'acabamentos': return this.acabamentosDisponiveis;
      case 'servicos': return this.servicosDisponiveis;
      default: return [];
    }
  }

  get mobileBaseGroups(): Array<{ key: ProdutoSelectorPanel; label: string; count: number }> {
    return [
      { key: 'materiais', label: 'Materiais', count: this.materiaisSelecionadosCount },
      { key: 'formatos', label: 'Formatos', count: this.formatosSelecionadosCount },
      { key: 'cores', label: 'Cores', count: this.coresSelecionadasCount },
    ];
  }

  get mobileExtraGroups(): Array<{ key: ProdutoSelectorPanel; label: string; count: number }> {
    return [
      { key: 'acabamentos', label: 'Acabamentos', count: (this.formEstrutura?.get('acabamentos')?.value ?? []).length },
      { key: 'servicos', label: 'Serviços', count: (this.formEstrutura?.get('servicos')?.value ?? []).length },
    ];
  }

  tituloVariacaoMobile(v: VariacaoProduto): string {
    const partes = [
      this.resolveLabel(v.materialId, this.materiais),
      this.resolveLabel(v.formatoId, this.formatos),
      this.resolveLabel(v.corLabel ?? v.cor ?? v.corId, this.coresDisponiveis),
    ].filter(parte => parte && parte !== '---');

    return partes.join(' • ') || 'Variação';
  }

  tituloVariacaoDesktop(v: VariacaoProduto): string {
    return this.tituloVariacaoMobile(v);
  }

  subtituloVariacaoMobile(v: VariacaoProduto): string {
    return this.resumoExtras(v);
  }

  resumoExtras(v: VariacaoProduto): string {
    const acabamentos = Array.isArray(v.acabamentos) ? v.acabamentos.length : 0;
    const servicos = Array.isArray(v.servicos) ? v.servicos.length : 0;
    if (!acabamentos && !servicos) {
      return 'Sem extras';
    }
    return `Acab: ${acabamentos} • Serv: ${servicos}`;
  }

  statusPreco(v: VariacaoProduto): string {
    return v.preco?.tipo ? 'Definido' : 'Pendente';
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

  resolveLabel(val: any, options: any[]): string {
    if (val == null) return '---';
    const id = typeof val === 'object' ? val.id : val;
    const found = options?.find(o => String(o.id) === String(id));
    return found?.nome ?? found?.descricao ?? (typeof val === 'object' ? (val.nome ?? val.descricao ?? '---') : '---');
  }

  politicaResumo(pol?: PoliticaRevenda | null): string {
    if (!pol) return '—';
    if (pol.percentual && pol.percentualDesconto != null) {
      return `Desconto ${pol.percentualDesconto}%`;
    }
    if (!pol.percentual && pol.precoFixo != null) {
      return `Preço fixo ${this.moeda(pol.precoFixo)}`;
    }
    return '—';
  }

  trackByIndex(index: number, _row: any): number {
    return index;
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

  private moeda(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  private extractId(value: any): number | null {
    if (value == null) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    if (typeof value === 'object' && value.id != null) return Number(value.id);
    return null;
  }

  private cloneValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  private combinacaoJaExiste(
    materialId: number | null,
    formatoId: number | null,
    corId: number | null,
  ): boolean {
    return this.dataSource.data.some((v: any) =>
      this.extractId(v.materialId) === materialId &&
      this.extractId(v.formatoId) === formatoId &&
      this.extractId(v.corId ?? v.cor) === corId
    );
  }

  private buscarItemPorId(collection: any[], value: any): any | null {
    const id = this.extractId(value);
    if (id == null) {
      return null;
    }

    return collection.find(item => this.extractId(item) === id) ?? null;
  }

  private focusVariacoesGeradas(): void {
    setTimeout(() => {
      this.variacoesSalvasCard?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  }

  private syncMobileEntryFlow(): void {
    if (!this.isMobile || this.etapa !== 'estrutura') {
      return;
    }

    if (this.currentStep !== 2) {
      this.mobileView = 'overview';
      this.activeMobileGroup = null;
      return;
    }

    if (this.temEstruturaInicial) {
      this.mobileView = 'overview';
      this.activeMobileGroup = null;
      return;
    }

    if (this.mobileView === 'overview' && !this.activeMobileGroup) {
      this.activeMobileGroup = 'materiais';
      this.mobileView = 'selector';
    }
  }

  private sincronizarEstruturaComVariacoes(): void {
    if (!this.formEstrutura) {
      return;
    }

    const rows = this.variacoesIniciais ?? [];
    if (!rows.length) {
      return;
    }

    const uniqueIds = (values: any[]): number[] => {
      const ids = values
        .map(value => this.extractId(value))
        .filter((id): id is number => id != null);

      return [...new Set(ids)];
    };

    const materiaisIds = uniqueIds(rows.map(row => row.materialId));
    const formatosIds = uniqueIds(rows.map(row => row.formatoId));
    const coresIds = uniqueIds(rows.map(row => row.corId ?? row.cor));
    const acabamentos = uniqueIds(rows.flatMap(row => Array.isArray(row.acabamentos) ? row.acabamentos : []));
    const servicos = uniqueIds(rows.flatMap(row => Array.isArray(row.servicos) ? row.servicos : []));

    this.formEstrutura.patchValue({
      materiaisIds,
      formatosIds,
      coresIds,
      acabamentos,
      servicos,
    }, { emitEvent: false });

    if (this.etapa === 'estrutura') {
      this.expandedSelectorPanel = materiaisIds.length ? null : 'materiais';
    }
  }

  private get temEstruturaInicial(): boolean {
    return !!(
      this.materiaisSelecionadosCount ||
      this.formatosSelecionadosCount ||
      this.coresSelecionadasCount ||
      this.variacoesGeradasCount
    );
  }
}
