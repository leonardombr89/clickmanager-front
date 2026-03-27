import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
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

import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';

import { ToastrService } from 'ngx-toastr';

import { AutoCompleteComponent } from 'src/app/components/inputs/auto-complete/auto-complete.component';
import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { NomeDePipe } from 'src/app/pipe/nomeDe.pipe';

import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { AcabamentoVariacaoHelperService } from './variacoes-acabamento-helper.service';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';
import { of } from 'rxjs';
import { requireAtLeastOneSelected } from 'src/app/components/validators/require-at-least-one-selected';

export interface AcabamentoVariacaoForm {
  id?: number;
  materialId?: any;
  formatoId?: any;
  tipoAplicacao: TipoAplicacaoAcabamento | string;
  preco: any;
  ativo?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-variacoes-acabamento',
  templateUrl: './variacoes-acabamento.component.html',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatOptionModule,
    MatCardModule,
    MatTableModule,
    MatExpansionModule,
    MatAccordion,
    AutoCompleteComponent,
    InputMultiSelectComponent,
    PrecoSelectorComponent,
    NomeDePipe
  ],
  styleUrl: './variacoes-acabamento.component.scss'
})
export class VariacoesAcabamentoComponent {

  @ViewChild(MatAccordion) accordion?: MatAccordion;
  @ViewChild('novaVarPanel') novaVarPanel?: MatExpansionPanel;
  @ViewChild(MatTable) table!: MatTable<AcabamentoVariacaoForm>;
  @ViewChild('variacoesSalvasCard') variacoesSalvasCard?: ElementRef<HTMLElement>;

  materiais: any[] = [];
  formatos: any[] = [];

  @Input() variacoesIniciais: AcabamentoVariacaoResponse[] | null = null;

  @Output() variacoesChange = new EventEmitter<AcabamentoVariacaoForm[]>();

  formVariacaoAtual!: FormGroup;
  formPrecoEmLote!: FormGroup;
  formEdicaoRapida!: FormGroup;
  formDuplicarVariacao!: FormGroup;
  indicesSelecionados = new Set<number>();
  editandoIndex: number | null = null;
  duplicandoIndex: number | null = null;
  mostrarEditorLote = false;

  dataSource = new MatTableDataSource<AcabamentoVariacaoForm>([]);
  displayedColumns: string[] = ['selecionar', 'material', 'formato', 'tipoAplicacao', 'preco', 'acoes'];

  TipoAplicacaoAcabamento = TipoAplicacaoAcabamento;

  constructor(
    private readonly fb: FormBuilder,
    private readonly helperService: AcabamentoVariacaoHelperService,
    private readonly toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.helperService.carregarDadosIniciais().subscribe(({ materiais, formatos }) => {
      this.materiais = materiais;
      this.formatos = formatos;
    });

    this.iniciarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['variacoesIniciais'] && this.variacoesIniciais) {
      const mapped: AcabamentoVariacaoForm[] =
        (this.variacoesIniciais ?? []).map(v => ({
          id: v.id,
          materialId: v.materialId ?? null,
          formatoId: v.formatoId ?? null,
          tipoAplicacao: TipoAplicacaoAcabamento.toValue(v.tipoAplicacao) ?? v.tipoAplicacao,
          preco: v.preco,
          ativo: v.ativo,
        }));

      this.dataSource.data = mapped;
      this.emitirVariacoes();
    }
  }


  iniciarFormulario(): void {
    this.formVariacaoAtual = this.fb.group({
      materiaisIds: this.fb.control<any[]>([], { nonNullable: true }),
      formatosIds: this.fb.control<any[]>([], { nonNullable: true }),
      tiposAplicacao: this.fb.control<any[]>([], { validators: [requireAtLeastOneSelected], nonNullable: true }),
      preco: this.fb.group({}),  // <app-preco-selector> preenche/valida
    });

    this.formPrecoEmLote = this.fb.group({
      preco: this.fb.group({}),
    });

    this.formEdicaoRapida = this.fb.group({
      preco: this.fb.group({}),
    });

    this.formDuplicarVariacao = this.fb.group({
      materialId: [null],
      formatoId: [null],
      tipoAplicacao: [null, Validators.required],
      preco: this.fb.group({}),
    });
  }

  // ======= Adicionar / Remover =======

  gerarVariacoes(): void {
    this.markBuilderAsTouched();

    const precoFG = this.formVariacaoAtual.get('preco') as FormGroup | null;
    precoFG?.updateValueAndValidity();

    if (!this.tiposAplicacaoSelecionados.length || this.formVariacaoAtual.invalid || precoFG?.invalid) {
      const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Selecione ao menos um tipo de aplicação e configure o preço.', 'Gerador incompleto');
      this.scrollToFirstInvalid();
      return;
    }

    const raw = this.formVariacaoAtual.getRawValue();
    const precoClonado = this.cloneValue(raw.preco);

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
          const existe = this.combinacaoJaExiste(materialId, formatoId, tipoAplicacao);

          if (existe) {
            continue;
          }

          novasVariacoes.push({
            materialId,
            formatoId,
            tipoAplicacao,
            preco: this.cloneValue(precoClonado),
            ativo: true,
          });
        }
      }
    }

    if (!novasVariacoes.length) {
      this.toastr.info('Todas as combinações geradas já estavam cadastradas.');
      return;
    }

    this.dataSource.data = [...this.dataSource.data, ...novasVariacoes];
    this.emitirVariacoes();
    this.mostrarEditorLote = false;
    this.limparSelecao();
    this.novaVarPanel?.close();
    this.focusVariacoesGeradas();

    const duplicadas = this.totalCombinacoes - novasVariacoes.length;
    if (duplicadas > 0) {
      this.toastr.success(`${novasVariacoes.length} combinação(ões) gerada(s). ${duplicadas} já existia(m) e foram ignorada(s).`);
    } else {
      this.toastr.success(`${novasVariacoes.length} combinação(ões) gerada(s) com sucesso!`);
    }
  }

  removerVariacao(index: number): void {
    const arr = [...this.dataSource.data];
    arr.splice(index, 1);
    this.dataSource.data = arr;
    this.reindexarSelecaoAposRemocao(index);
    if (this.editandoIndex === index) {
      this.cancelarEdicaoRapida();
    } else if (this.editandoIndex != null && this.editandoIndex > index) {
      this.editandoIndex -= 1;
    }
    if (this.duplicandoIndex === index) {
      this.cancelarDuplicarVariacao();
    } else if (this.duplicandoIndex != null && this.duplicandoIndex > index) {
      this.duplicandoIndex -= 1;
    }
    this.emitirVariacoes();
    this.toastr.info('Variação removida.');
  }

  toggleSelecionarTodos(checked: boolean): void {
    if (checked) {
      this.indicesSelecionados = new Set(this.dataSource.data.map((_, index) => index));
      return;
    }

    this.limparSelecao();
  }

  toggleSelecionarLinha(index: number, checked: boolean): void {
    const selecionados = new Set(this.indicesSelecionados);
    if (checked) {
      selecionados.add(index);
    } else {
      selecionados.delete(index);
    }
    this.indicesSelecionados = selecionados;
  }

  abrirEditorLote(): void {
    if (!this.selectedCount) {
      this.toastr.info('Selecione ao menos uma variação para aplicar preço em lote.');
      return;
    }

    this.cancelarEdicaoRapida();
    this.formPrecoEmLote.reset();
    this.mostrarEditorLote = true;
  }

  cancelarEditorLote(): void {
    this.mostrarEditorLote = false;
    this.formPrecoEmLote.reset();
  }

  aplicarPrecoEmLote(): void {
    const precoFG = this.formPrecoEmLote.get('preco') as FormGroup | null;
    precoFG?.updateValueAndValidity();
    this.formPrecoEmLote.markAllAsTouched();

    if (!this.selectedCount || this.formPrecoEmLote.invalid || precoFG?.invalid) {
      const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Configure um preço válido para aplicar em lote.', 'Preço em lote');
      return;
    }

    const precoClonado = this.cloneValue(this.formPrecoEmLote.getRawValue().preco);
    this.dataSource.data = this.dataSource.data.map((item, index) =>
      this.indicesSelecionados.has(index)
        ? { ...item, preco: this.cloneValue(precoClonado) }
        : item
    );

    this.emitirVariacoes();
    this.cancelarEditorLote();
    this.toastr.success(`Preço aplicado em ${this.selectedCount} variação(ões).`);
  }

  abrirEdicaoRapida(index: number): void {
    this.cancelarEditorLote();
    this.cancelarDuplicarVariacao();
    this.editandoIndex = index;
    this.formEdicaoRapida.reset({
      preco: this.cloneValue(this.dataSource.data[index]?.preco ?? {})
    });
  }

  cancelarEdicaoRapida(): void {
    this.editandoIndex = null;
    this.formEdicaoRapida.reset();
  }

  salvarEdicaoRapida(): void {
    if (this.editandoIndex == null) {
      return;
    }

    const precoFG = this.formEdicaoRapida.get('preco') as FormGroup | null;
    precoFG?.updateValueAndValidity();
    this.formEdicaoRapida.markAllAsTouched();

    if (this.formEdicaoRapida.invalid || precoFG?.invalid) {
      const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Configure um preço válido para salvar a edição.', 'Editar preço');
      return;
    }

    const atualizadas = [...this.dataSource.data];
    atualizadas[this.editandoIndex] = {
      ...atualizadas[this.editandoIndex],
      preco: this.cloneValue(this.formEdicaoRapida.getRawValue().preco)
    };
    this.dataSource.data = atualizadas;
    this.emitirVariacoes();
    this.cancelarEdicaoRapida();
    this.toastr.success('Preço da variação atualizado.');
  }

  abrirDuplicarVariacao(index: number): void {
    const variacao = this.dataSource.data[index];
    if (!variacao) {
      return;
    }

    this.cancelarEditorLote();
    this.cancelarEdicaoRapida();
    this.duplicandoIndex = index;
    this.formDuplicarVariacao.reset({
      materialId: this.buscarItemPorId(this.materiais, variacao.materialId),
      formatoId: this.buscarItemPorId(this.formatos, variacao.formatoId),
      tipoAplicacao: TipoAplicacaoAcabamento.toValue(variacao.tipoAplicacao),
      preco: this.cloneValue(variacao.preco)
    });
  }

  cancelarDuplicarVariacao(): void {
    this.duplicandoIndex = null;
    this.formDuplicarVariacao.reset();
  }

  salvarDuplicarVariacao(): void {
    const precoFG = this.formDuplicarVariacao.get('preco') as FormGroup | null;
    const tipoAplicacaoControl = this.formDuplicarVariacao.get('tipoAplicacao');
    precoFG?.updateValueAndValidity();
    tipoAplicacaoControl?.markAsTouched();
    this.formDuplicarVariacao.markAllAsTouched();

    if (this.formDuplicarVariacao.invalid || precoFG?.invalid) {
      const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Preencha os dados da cópia antes de salvar.', 'Duplicar variação');
      return;
    }

    const raw = this.formDuplicarVariacao.getRawValue();
    const materialId = this.extractId(raw.materialId);
    const formatoId = this.extractId(raw.formatoId);
    const tipoAplicacao = TipoAplicacaoAcabamento.toValue(raw.tipoAplicacao);

    if (!tipoAplicacao) {
      this.toastr.error('Selecione um tipo de aplicação válido.', 'Duplicar variação');
      return;
    }

    if (this.combinacaoJaExiste(materialId, formatoId, tipoAplicacao)) {
      this.toastr.warning('Já existe uma variação com essa combinação. Ajuste material, formato ou aplicação.');
      return;
    }

    this.dataSource.data = [
      ...this.dataSource.data,
      {
        materialId,
        formatoId,
        tipoAplicacao,
        preco: this.cloneValue(raw.preco),
        ativo: true
      }
    ];

    this.emitirVariacoes();
    this.cancelarDuplicarVariacao();
    this.toastr.success('Cópia criada com sucesso.');
  }

  emitirVariacoes(): void {
    this.variacoesChange.emit(this.dataSource.data);
  }

  abrirGerador(): void {
    this.novaVarPanel?.open();
  }

  // ======= Busca / labels =======

  buscarMateriais = (filtro: string) => this.helperService.buscarMateriais(filtro);
  buscarFormatos = (filtro: string) => this.helperService.buscarFormatos(filtro);
  buscarTiposAplicacao = (filtro: string) => of(TipoAplicacaoAcabamento.buscar(filtro));

  mostrarDescricaoMaterial = (x: any) => x?.nome || '';
  mostrarDescricaoFormato = (x: any) => x?.nome || '';
  displayTipoAplicacao = (item: any): string => TipoAplicacaoAcabamento.label(item);

  mostrarTipoAplicacao = (item: any): string =>
    TipoAplicacaoAcabamento.label(item);

  // ======= Helpers form =======

  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  getFormGroup(control: AbstractControl | null): FormGroup {
    return control as FormGroup;
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

  // ======= Resumo preço =======

  precoResumo(preco: any): string {
    if (!preco?.tipo) return '—';
    switch (preco.tipo) {
      case 'FIXO':
        return this.moeda(preco.valor);
      case 'HORA':
        return `${this.moeda(preco.valorHora)}/h`;
      case 'QUANTIDADE': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return '—';
        const first = faixas[0];
        return `${faixas.length} faixa(s) (ex.: ${first.quantidade} → ${this.moeda(first.valor)})`;
      }
      case 'DEMANDA': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return '—';
        const first = faixas[0];
        const head = `${first.de}–${first.ate} → ${this.moeda(first.valorUnitario)}`;
        return faixas.length > 1 ? `${head} (+${faixas.length - 1})` : head;
      }
      case 'METRO': {
        const modo = preco.modoCobranca === 'LINEAR' ? 'm' : 'm²';
        return `${this.moeda(preco.precoMetro)}/${modo}`;
      }
      default:
        return '—';
    }
  }

  private moeda(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  trackByIndex(index: number, _row: any): number {
    return index;
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
    const materiais = this.materiaisSelecionadosCount || 1;
    const formatos = this.formatosSelecionadosCount || 1;
    const aplicacoes = this.tiposAplicacaoSelecionadosCount || 0;
    return materiais * formatos * aplicacoes;
  }

  get podeGerarCombinacoes(): boolean {
    return this.tiposAplicacaoSelecionadosCount > 0 && !this.formVariacaoAtual.invalid && !!this.totalCombinacoes;
  }

  get resumoGeracao(): string {
    if (!this.tiposAplicacaoSelecionadosCount) {
      return 'Selecione ao menos um tipo de aplicação para iniciar a geração.';
    }

    return `Você está prestes a gerar ${this.totalCombinacoes} variação(ões) (${this.materiaisSelecionadosCount || 1} material(is) × ${this.formatosSelecionadosCount || 1} formato(s) × ${this.tiposAplicacaoSelecionadosCount} aplicação(ões)).`;
  }

  get mensagemGeracaoBloqueada(): string {
    if (!this.tiposAplicacaoSelecionadosCount) {
      return 'Selecione ao menos um tipo de aplicação para gerar variações.';
    }

    const precoFG = this.formVariacaoAtual?.get('preco') as FormGroup | null;
    if (!precoFG?.value || !Object.keys(precoFG.getRawValue() || {}).length || precoFG.invalid) {
      return 'Defina um preço base válido antes de gerar as combinações.';
    }

    return '';
  }

  get ctaGeracaoLabel(): string {
    return this.totalCombinacoes
      ? `Gerar ${this.totalCombinacoes} variação(ões)`
      : 'Gerar variações';
  }

  get tituloAjustes(): string {
    if (!this.dataSource.data.length) {
      return 'Ajustar variações geradas';
    }

    return 'Variações geradas';
  }

  get subtituloAjustes(): string {
    if (!this.dataSource.data.length) {
      return 'Gere as primeiras combinações acima para começar a revisar e ajustar.';
    }

    return `${this.dataSource.data.length} variação(ões) pronta(s) para revisão e ajustes finais.`;
  }

  get selectedCount(): number {
    return this.indicesSelecionados.size;
  }

  get allSelected(): boolean {
    return !!this.dataSource.data.length && this.selectedCount === this.dataSource.data.length;
  }

  get someSelected(): boolean {
    return this.selectedCount > 0 && !this.allSelected;
  }

  private markBuilderAsTouched(): void {
    this.formVariacaoAtual.markAllAsTouched();
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
    tipoAplicacao: TipoAplicacaoAcabamento | string
  ): boolean {
    return this.dataSource.data.some(v =>
      this.extractId(v.materialId) === materialId &&
      this.extractId(v.formatoId) === formatoId &&
      TipoAplicacaoAcabamento.toValue(v.tipoAplicacao) === TipoAplicacaoAcabamento.toValue(tipoAplicacao)
    );
  }

  private buscarItemPorId(collection: any[], value: any): any | null {
    const id = this.extractId(value);
    if (id == null) {
      return null;
    }

    return collection.find(item => this.extractId(item) === id) ?? null;
  }

  get materiaisSelecionados(): any[] {
    const ids = this.formVariacaoAtual?.get('materiaisIds')?.value ?? [];
    return ids
      .map((id: any) => this.buscarItemPorId(this.materiais, id))
      .filter((item: any) => item != null);
  }

  get formatosSelecionados(): any[] {
    const ids = this.formVariacaoAtual?.get('formatosIds')?.value ?? [];
    return ids
      .map((id: any) => this.buscarItemPorId(this.formatos, id))
      .filter((item: any) => item != null);
  }

  get tiposAplicacaoSelecionados(): TipoAplicacaoAcabamento[] {
    const values = this.formVariacaoAtual?.get('tiposAplicacao')?.value ?? [];
    return values
      .map((value: any) => TipoAplicacaoAcabamento.toValue(value))
      .filter((item: TipoAplicacaoAcabamento | null): item is TipoAplicacaoAcabamento => item != null);
  }

  get materiaisOptions(): { id: any; nome: string }[] {
    return (this.materiais ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get formatosOptions(): { id: any; nome: string }[] {
    return (this.formatos ?? []).map(item => ({ id: item.id, nome: item.nome }));
  }

  get tiposAplicacaoOptions(): { id: any; nome: string }[] {
    return TipoAplicacaoAcabamento.options().map(item => ({ id: item.value, nome: item.label }));
  }

  private limparSelecao(): void {
    this.indicesSelecionados = new Set<number>();
  }

  private reindexarSelecaoAposRemocao(indexRemovido: number): void {
    const atualizado = new Set<number>();
    this.indicesSelecionados.forEach(index => {
      if (index < indexRemovido) {
        atualizado.add(index);
      }
      if (index > indexRemovido) {
        atualizado.add(index - 1);
      }
    });
    this.indicesSelecionados = atualizado;
  }

  private focusVariacoesGeradas(): void {
    setTimeout(() => {
      this.variacoesSalvasCard?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  }
}
