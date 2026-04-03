import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';

import { ProdutoService } from '../../cadastro-tecnico/services/produto.service';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { Preco } from 'src/app/models/preco/preco-response.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { ConfigurarPrecoStepComponent } from './steps/configurar-preco-step/configurar-preco-step.component';

type Variacao = {
  id: number;
  materialId: number; materialNome: string;
  formatoId: number | null; formatoNome: string | null;
  corId?: number | null; corNome?: string | null;
  preco: Preco;
  acabamentos: AcabamentoVariacaoResponse[];
  servicos: ServicoResponse[];
};

type IdNome = { id: number | null; nome: string };

@Component({
  standalone: true,
  selector: 'app-dialog-adicionar-produto-mobile',
  templateUrl: './dialog-adicionar-produto-mobile.component.html',
  styleUrls: ['./dialog-adicionar-produto-mobile.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatCheckboxModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ConfigurarPrecoStepComponent,
  ],
})
export class DialogAdicionarProdutoMobileComponent {
  readonly stepLabels = [
    'Selecionar produto',
    'Escolher variação',
    'Configurar preço',
    'Serviços',
    'Revisão',
  ] as const;

  currentStep = 0;
  loadingProdutos = false;
  loadingVariacoes = false;
  isFinishing = false;
  precoReady = false;

  produtos: ProdutoListagem[] = [];
  produtoIdSelecionado: number | null = null;
  produtoBase: { id: number; nome: string; descricao: string | null } | null = null;

  variacoes: Variacao[] = [];
  selectedVariacao: Variacao | null = null;
  servicosDisponiveis: ServicoResponse[] = [];
  acabamentosDisponiveis: AcabamentoVariacaoResponse[] = [];

  materiais: IdNome[] = [];
  formatos: IdNome[] = [];
  cores: IdNome[] = [];
  selMaterialId: number | null = null;
  selFormatoId: number | null = null;
  selCorId: number | null = null;
  materialChosen = false;
  formatoChosen = false;
  corChosen = false;

  produtoAtual: ProdutoListagem | null = null;
  resumoPreco: any = null;

  readonly searchCtrl = new FormControl<string>('', { nonNullable: true });
  readonly selectForm: FormGroup = this.fb.group({
    produtoId: [null as number | null, Validators.required],
  });
  readonly variacaoForm: FormGroup = this.fb.group({
    variacaoId: [null as number | null, Validators.required],
    acabamentoIds: this.fb.control<number[]>([]),
  });
  readonly configForm: FormGroup = this.fb.group({});
  readonly servicosForm: FormGroup = this.fb.group({
    servicoIds: this.fb.control<number[]>([]),
  });

  private searchSub?: Subscription;

  constructor(
    private readonly dialogRef: MatDialogRef<DialogAdicionarProdutoMobileComponent>,
    private readonly fb: FormBuilder,
    private readonly produtoService: ProdutoService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.searchSub = this.searchCtrl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => this.carregarProdutos());

    this.carregarProdutos();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  @HostListener('window:keydown.escape')
  onEsc(): void {
    this.close();
  }

  get currentStepLabel(): string {
    return this.stepLabels[this.currentStep] || '';
  }

  get currentActionLabel(): string {
    return this.currentStep === this.stepLabels.length - 1 ? 'Confirmar e adicionar' : 'Próximo';
  }

  get currentValueText(): string {
    if (this.totalConhecido !== null) {
      return this.money(this.totalConhecido);
    }

    if (this.baseSubtotal !== null) {
      return this.money(this.baseSubtotal);
    }

    return 'R$ 0,00';
  }

  get currentFooterHint(): string {
    if (this.currentStep === 0) return 'Escolha um produto para continuar';
    if (this.currentStep === 1) return this.selectedVariacao ? 'Variação pronta para configurar' : 'Selecione material, formato e cor';
    if (this.currentStep === 2) return this.precoReady ? 'Preço calculado automaticamente' : 'Configure quantidade e medidas';
    if (this.currentStep === 3) return 'Serviços opcionais';
    return 'Revise antes de adicionar';
  }

  get canAdvance(): boolean {
    if (this.currentStep === 0) return !!this.produtoIdSelecionado && !this.loadingVariacoes;
    if (this.currentStep === 1) return !!this.selectedVariacao;
    if (this.currentStep === 2) return this.precoReady;
    return true;
  }

  get isLastStep(): boolean {
    return this.currentStep === this.stepLabels.length - 1;
  }

  get acabamentoIdsCtrl(): FormControl<number[]> {
    return this.variacaoForm.get('acabamentoIds') as FormControl<number[]>;
  }

  get servicoIdsCtrl(): FormControl<number[]> {
    return this.servicosForm.get('servicoIds') as FormControl<number[]>;
  }

  carregarProdutos(): void {
    this.loadingProdutos = true;
    const termo = this.searchCtrl.value?.trim() || '';

    this.produtoService.listar(0, 20, true, termo).subscribe({
      next: (res: any) => {
        this.produtos = res?.content ?? [];
        this.loadingProdutos = false;
      },
      error: () => {
        this.loadingProdutos = false;
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  goPrev(): void {
    if (this.currentStep === 0) {
      this.close();
      return;
    }

    this.currentStep -= 1;
  }

  goNext(): void {
    if (!this.canAdvance || this.isFinishing) return;

    if (this.currentStep === 0) {
      this.irParaVariacao();
      return;
    }

    if (this.currentStep === 1) {
      this.irParaConfig();
      return;
    }

    if (this.isLastStep) {
      this.finish();
      return;
    }

    this.currentStep += 1;
  }

  selecionarProduto(produto: ProdutoListagem): void {
    this.produtoIdSelecionado = produto?.id ?? null;
    this.selectForm.get('produtoId')?.setValue(this.produtoIdSelecionado);
    this.produtoBase = { id: produto.id, nome: produto.nome ?? '', descricao: produto.descricao ?? null };
    this.irParaVariacao();
  }

  irParaVariacao(): void {
    if (!this.produtoIdSelecionado || this.loadingVariacoes) return;

    this.loadingVariacoes = true;
    this.produtoService.buscarPorId(this.produtoIdSelecionado).subscribe({
      next: (res: any) => {
        this.loadingVariacoes = false;
        this.produtoBase = { id: res.id, nome: res.nome, descricao: res.descricao ?? null };
        this.variacoes = Array.isArray(res.variacoes) ? (res.variacoes as Variacao[]) : [];

        this.resetSelections();
        this.rebuildMateriais();
        this.currentStep = 1;
      },
      error: () => {
        this.loadingVariacoes = false;
      }
    });
  }

  irParaConfig(): void {
    if (!this.selectedVariacao || !this.produtoBase) return;

    this.precoReady = false;
    this.resumoPreco = null;
    this.servicosDisponiveis = Array.isArray(this.selectedVariacao.servicos) ? this.selectedVariacao.servicos : [];
    this.acabamentosDisponiveis = Array.isArray(this.selectedVariacao.acabamentos) ? this.selectedVariacao.acabamentos : [];

    this.produtoAtual = {
      id: this.produtoBase.id,
      nome: this.produtoBase.nome,
      descricao: this.produtoBase.descricao ?? '',
      preco: this.selectedVariacao.preco,
      ativo: true,
      categoria: '',
      grupo: '',
      variacaoId: this.selectedVariacao.id,
      produtoVariacaoId: this.selectedVariacao.id,
    } as unknown as ProdutoListagem;

    this.currentStep = 2;
  }

  onConfigConcluida(payload: any): void {
    this.resumoPreco = { ...payload, produtoVariacaoId: this.selectedVariacao?.id };
    this.precoReady = true;
  }

  onPrecoReady(ready: boolean): void {
    this.precoReady = ready;
  }

  toggleAcabamento(id: number, checked: boolean): void {
    this.toggle(this.acabamentoIdsCtrl, id, checked);
  }

  toggleServico(id: number, checked: boolean): void {
    this.toggle(this.servicoIdsCtrl, id, checked);
  }

  finish(): void {
    if (this.isFinishing || !this.canAdvance) return;
    this.isFinishing = true;
    try {
      this.dialogRef.close(this.buildPedidoItens());
    } finally {
      this.isFinishing = false;
    }
  }

  resumoVariacao(v: Variacao): string {
    const cor = v?.corNome ?? 'Sem cor';
    return `${v?.materialNome ?? 'Sem material'} • ${v?.formatoNome ?? 'Sem formato'} • ${cor}`;
  }

  get resumoVariacaoComAcab(): string | null {
    if (!this.selectedVariacao) return null;
    const base = this.resumoVariacao(this.selectedVariacao);
    const acabs = this.acabamentosSelecionadosDetalhe.map(a => a?.nome).filter(Boolean) as string[];
    return acabs.length ? `${base} • ${acabs.join(' + ')}` : base;
  }

  get baseResumoTexto(): string | null {
    const tipo = this.selectedVariacao?.preco?.tipo;
    if (!tipo || !this.resumoPreco) return null;

    if (tipo === 'METRO') {
      let areaM2 = Number(this.resumoPreco?.areaM2);
      if (!areaM2) {
        const aCm = Number(this.resumoPreco?.altura ?? this.resumoPreco?.alturaCm ?? 0);
        const lCm = Number(this.resumoPreco?.largura ?? this.resumoPreco?.larguraCm ?? 0);
        if (aCm && lCm) areaM2 = (aCm * lCm) / 10000;
      }

      return areaM2
        ? `Área: ${areaM2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
        : null;
    }

    if (tipo === 'FIXO') {
      const qtd = Number(this.resumoPreco?.quantidade ?? 1);
      return `Qtd: ${qtd}`;
    }

    if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
      const det = this.resumoPreco?.detalhe || this.resumoPreco?.faixa || this.resumoPreco?.quantidade;
      return det ? String(det) : null;
    }

    return null;
  }

  get baseQtd(): number {
    return Number(this.resumoPreco?.quantidade ?? 1);
  }

  get baseSubtotal(): number | null {
    const preco = this.selectedVariacao?.preco;
    if (!preco) return null;

    const totalDireto = Number(
      this.resumoPreco?.total ??
      this.resumoPreco?.subTotal ??
      this.resumoPreco?.subtotal ??
      this.resumoPreco?.valorTotal
    );
    if (!Number.isNaN(totalDireto)) return totalDireto;

    switch (preco.tipo) {
      case 'FIXO': {
        const unit = Number((preco as any).valor ?? 0);
        const qtd = this.baseQtd || 1;
        return unit * qtd;
      }
      case 'METRO': {
        const pM = Number((preco as any).precoMetro ?? 0);
        const pMin = Number((preco as any).precoMinimo ?? 0);
        let areaM2 = Number(this.resumoPreco?.areaM2);
        if (!areaM2) {
          const aCm = Number(this.resumoPreco?.altura ?? this.resumoPreco?.alturaCm ?? 0);
          const lCm = Number(this.resumoPreco?.largura ?? this.resumoPreco?.larguraCm ?? 0);
          if (aCm && lCm) areaM2 = (aCm * lCm) / 10000;
        }
        const qtd = this.baseQtd || 1;
        if (!pM || !areaM2 || !qtd) return null;
        const unit = Math.max(areaM2 * pM, pMin);
        return unit * qtd;
      }
      case 'QUANTIDADE':
      case 'DEMANDA': {
        const tot = Number(this.resumoPreco?.subtotal ?? this.resumoPreco?.total ?? NaN);
        return Number.isNaN(tot) ? null : tot;
      }
      default:
        return null;
    }
  }

  get baseUnit(): number | null {
    const tipo = this.selectedVariacao?.preco?.tipo;
    if (!tipo) return null;

    const fromChild = Number(this.resumoPreco?.valorUnitario);
    if (!Number.isNaN(fromChild) && fromChild > 0) return fromChild;

    if (tipo === 'FIXO') {
      const v = Number((this.selectedVariacao?.preco as any)?.valor ?? NaN);
      return Number.isNaN(v) ? null : v;
    }

    if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
      const total = Number(this.resumoPreco?.subTotal ?? this.resumoPreco?.total ?? NaN);
      const q = this.baseQtd || 1;
      if (!Number.isNaN(total) && q > 0) return total / q;
    }

    return null;
  }

  get adicionaisFixosSubtotal(): number {
    const soma = (arr: any[]) =>
      (arr || [])
        .map(x => this.precoFixo(x.preco))
        .filter((v): v is number => typeof v === 'number')
        .reduce((a, b) => a + b, 0);

    return soma(this.acabamentosSelecionadosDetalhe) + soma(this.servicosSelecionadosDetalhe);
  }

  get totalConhecido(): number | null {
    return this.baseSubtotal === null ? null : this.baseSubtotal + this.adicionaisFixosSubtotal;
  }

  get servicosSelecionadosDetalhe(): ServicoResponse[] {
    const ids = this.servicoIdsCtrl.value ?? [];
    return this.servicosDisponiveis.filter(s => ids.includes(s.id));
  }

  get acabamentosSelecionadosDetalhe(): AcabamentoVariacaoResponse[] {
    const ids = this.acabamentoIdsCtrl.value ?? [];
    return this.acabamentosDisponiveis.filter(a => ids.includes(a.id));
  }

  isSelected(ctrl: FormControl<number[]>, id: number): boolean {
    return (ctrl.value ?? []).includes(id);
  }

  private toggle(ctrl: FormControl<number[]>, id: number, checked: boolean): void {
    let arr = [...(ctrl.value ?? [])];
    arr = checked ? (arr.includes(id) ? arr : [...arr, id]) : arr.filter(x => x !== id);
    ctrl.setValue(arr);
  }

  private resetSelections(): void {
    this.selMaterialId = null;
    this.selFormatoId = null;
    this.selCorId = null;
    this.materialChosen = false;
    this.formatoChosen = false;
    this.corChosen = false;
    this.selectedVariacao = null;
    this.acabamentosDisponiveis = [];
    this.variacaoForm.reset({ variacaoId: null, acabamentoIds: [] });
    this.servicosForm.reset({ servicoIds: [] });
  }

  private uniq<T extends IdNome>(arr: T[]): T[] {
    const seen = new Set<string>();
    return arr.filter(x => {
      const key = String(x?.id ?? 'null');
      if (!x || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private rebuildMateriais(): void {
    const raw = this.variacoes
      .filter(v => v.materialId != null)
      .map(v => ({ id: v.materialId, nome: v.materialNome ?? String(v.materialId) }));

    this.materiais = this.uniq(raw);
    if (this.materiais.length === 1) {
      this.selMaterialId = this.materiais[0].id;
      this.materialChosen = true;
    }
    this.rebuildFormatos();
  }

  private rebuildFormatos(): void {
    if (this.selMaterialId == null) {
      this.formatos = [];
      this.selFormatoId = null;
      this.formatoChosen = false;
      this.rebuildCores();
      return;
    }

    const base = this.variacoes.filter(v => this.materialMatches(v));
    const raw = base.map(v => ({
      id: v.formatoId ?? null,
      nome: v.formatoId == null ? 'Sem formato' : (v.formatoNome ?? String(v.formatoId))
    }));

    this.formatos = this.uniq(raw);

    const temSemFormatoGlobal = this.variacoes.some(v => v.formatoId == null);
    const jaTemSemFormato = this.formatos.some(f => f.id == null);
    if (temSemFormatoGlobal && !jaTemSemFormato) {
      this.formatos = [{ id: null, nome: 'Sem formato' }, ...this.formatos];
    }

    if (this.formatos.length === 1) {
      this.selFormatoId = this.formatos[0].id;
      this.formatoChosen = true;
    }

    this.rebuildCores();
  }

  private rebuildCores(): void {
    if (this.selMaterialId == null) {
      this.cores = [];
      this.selCorId = null;
      this.corChosen = false;
      this.updateSelectedVariacao();
      return;
    }

    let base = this.variacoes.filter(v => this.materialMatches(v) && this.formatoMatches(v));
    if (!base.length && this.formatoChosen && this.selFormatoId === null) {
      base = this.variacoes.filter(v => this.materialMatches(v));
    }

    const raw = base
      .map(v => v.corId != null
        ? { id: v.corId!, nome: v.corNome ?? String(v.corId) }
        : { id: null, nome: 'Sem cor' });

    this.cores = this.uniq(raw);
    if (this.cores.length === 1) {
      this.selCorId = this.cores[0].id;
      this.corChosen = true;
    }

    this.updateSelectedVariacao();
  }

  onSelectMaterial(id: number | string | null): void {
    this.selMaterialId = this.coerceSelection(id);
    this.materialChosen = true;
    this.selFormatoId = null;
    this.formatoChosen = false;
    this.selCorId = null;
    this.corChosen = false;
    this.rebuildFormatos();
  }

  onSelectFormato(id: number | string | null): void {
    this.selFormatoId = this.coerceSelection(id);
    this.formatoChosen = true;
    this.selCorId = null;
    this.corChosen = false;
    this.rebuildCores();
  }

  onSelectCor(id: number | string | null): void {
    this.selCorId = this.coerceSelection(id);
    this.corChosen = true;
    this.updateSelectedVariacao();
  }

  private coerceSelection(val: any): number | null {
    if (val === null || val === undefined || val === '' || val === 'null') return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }

  private materialMatches(v: Variacao): boolean {
    if (!this.materialChosen) return true;
    if (this.selMaterialId === null) return v.materialId == null;
    return Number(v.materialId) === this.selMaterialId;
  }

  private formatoMatches(v: Variacao): boolean {
    if (!this.formatoChosen) return true;
    if (this.selFormatoId === null) return v.formatoId == null;
    return Number(v.formatoId) === this.selFormatoId;
  }

  private corMatches(v: Variacao): boolean {
    if (!this.corChosen) return true;
    if (this.selCorId === null) return v.corId == null;
    return String(v.corId ?? '') === String(this.selCorId);
  }

  private updateSelectedVariacao(): void {
    const matches = this.variacoes.filter(v =>
      this.materialMatches(v) &&
      this.formatoMatches(v) &&
      this.corMatches(v)
    );

    if (this.selectedVariacao && matches.some(v => v.id === this.selectedVariacao!.id)) {
      this.setSelected(this.selectedVariacao);
      return;
    }

    if (matches.length === 0) {
      this.clearSelection();
      return;
    }

    const best = [...matches].sort((a, b) => {
      const srvA = (a.servicos || []).length;
      const srvB = (b.servicos || []).length;
      if (srvA !== srvB) return srvB - srvA;
      const acbA = (a.acabamentos || []).length;
      const acbB = (b.acabamentos || []).length;
      if (acbA !== acbB) return acbB - acbA;
      return 0;
    })[0];

    const narrowed = this.autoNarrow(matches);
    this.setSelected(narrowed || best);
  }

  private autoNarrow(matches: Variacao[]): Variacao | null {
    const formatosRestantes = this.uniq(matches.map(v => ({
      id: v.formatoId ?? null,
      nome: v.formatoId == null ? 'Sem formato' : (v.formatoNome ?? String(v.formatoId))
    })));
    if (!this.formatoChosen && formatosRestantes.length === 1) {
      this.selFormatoId = formatosRestantes[0].id;
      this.formatoChosen = true;
    }

    const coresRestantes = this.uniq(matches.map(v => v.corId != null
      ? { id: v.corId!, nome: v.corNome ?? String(v.corId) }
      : { id: null, nome: 'Sem cor' }));
    if (!this.corChosen && coresRestantes.length === 1) {
      this.selCorId = coresRestantes[0].id;
      this.corChosen = true;
    }

    const narrowed = this.variacoes.filter(v =>
      this.materialMatches(v) &&
      this.formatoMatches(v) &&
      this.corMatches(v)
    );
    return narrowed.length === 1 ? narrowed[0] : null;
  }

  private setSelected(v: Variacao): void {
    this.selectedVariacao = v;
    this.variacaoForm.get('variacaoId')?.setValue(v.id);
    this.acabamentosDisponiveis = Array.isArray(v.acabamentos) ? v.acabamentos : [];

    this.variacaoForm.patchValue({ acabamentoIds: [] }, { emitEvent: false });
    const auto = this.acabamentosDisponiveis.length === 1 ? [this.acabamentosDisponiveis[0].id] : [];
    if (auto.length) {
      this.variacaoForm.patchValue({ acabamentoIds: auto }, { emitEvent: false });
    }

    this.servicosDisponiveis = Array.isArray(v.servicos) ? v.servicos : [];
    this.servicosForm.patchValue({ servicoIds: [] }, { emitEvent: false });
    this.cdr.detectChanges();
  }

  private clearSelection(): void {
    this.selectedVariacao = null;
    this.acabamentosDisponiveis = [];
    this.servicosDisponiveis = [];
    this.variacaoForm.patchValue({ variacaoId: null, acabamentoIds: [] }, { emitEvent: false });
    this.servicosForm.patchValue({ servicoIds: [] }, { emitEvent: false });
  }

  precoResumo(p: Preco | null | undefined): string {
    if (!p) return '—';
    switch (p.tipo) {
      case 'FIXO': return `Fixo: R$ ${this.num((p as any).valor)}`;
      case 'HORA': return `Hora: R$ ${this.num((p as any).valorHora)}${(p as any).tempoEstimado ? ` / ${(p as any).tempoEstimado} min` : ''}`;
      case 'QUANTIDADE': return `Qtd: ${(p as any).faixas?.length ?? 0} faixa(s)`;
      case 'DEMANDA': return `Demanda: ${(p as any).faixas?.length ?? 0} faixa(s)`;
      case 'METRO': return `Metro: R$ ${this.num((p as any).precoMetro)}`;
      default: return '—';
    }
  }

  precoFixo(p?: Preco | null): number | null {
    if (!p || p.tipo !== 'FIXO') return null;
    const v = Number((p as any).valor ?? NaN);
    return Number.isNaN(v) ? null : v;
  }

  money(v?: number | null): string {
    const n = Number(v ?? 0);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  unitFromPreco(p?: Preco | null): number | null {
    if (!p || p.tipo !== 'FIXO') return null;
    const v = Number((p as any).valor ?? NaN);
    return Number.isNaN(v) ? null : v;
  }

  private num(v: number | null | undefined): string {
    const n = Number(v ?? 0);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private buildPedidoItens(): any[] {
    const itens: any[] = [];
    if (!this.selectedVariacao) return itens;

    const v = this.selectedVariacao;
    const p = this.resumoPreco ?? {};
    const tipo = v.preco?.tipo;

    const baseNome = this.produtoBase?.nome ?? 'Produto';
    const variacaoTxt = [v.materialNome, v.formatoNome, v.corNome].filter(Boolean).join(' / ');
    const nomeComposto = `${baseNome} / ${variacaoTxt}`;

    const qtd = Number(p?.quantidade ?? 1) || 1;

    const pickNum = (...keys: string[]) => {
      for (const k of keys) {
        const raw = (p as any)?.[k];
        const n = typeof raw === 'string'
          ? Number(String(raw).replace(',', '.'))
          : Number(raw);
        if (Number.isFinite(n)) return n;
      }
      return NaN;
    };

    let unit = NaN;
    let subtotal = NaN;

    if (tipo === 'FIXO') {
      unit = Number((v.preco as any)?.valor ?? 0);
      subtotal = unit * qtd;
    } else if (tipo === 'METRO') {
      unit = pickNum('valorUnitario', 'unit', 'unitario');
      subtotal = pickNum('subTotal', 'subtotal', 'total', 'valorTotal');
    } else if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
      unit = pickNum('valorUnitario', 'unit', 'unitario', 'valor', 'precoUnitario');
      subtotal = pickNum('subTotal', 'subtotal', 'total', 'valorTotal', 'precoTotal');
    }

    if (!Number.isFinite(subtotal)) subtotal = Number.isFinite(unit) ? unit * qtd : 0;
    if (!Number.isFinite(unit) && qtd > 0) unit = subtotal / qtd;
    if (!Number.isFinite(unit)) unit = 0;

    const largura = Number((p as any)?.largura ?? (p as any)?.larguraCm ?? NaN);
    const altura = Number((p as any)?.altura ?? (p as any)?.alturaCm ?? NaN);

    itens.push({
      produtoVariacaoId: v.id,
      produtoId: this.produtoBase?.id ?? v.id,
      nome: nomeComposto,
      quantidade: qtd,
      valor: unit,
      subTotal: subtotal,
      largura: Number.isFinite(largura) ? largura : undefined,
      altura: Number.isFinite(altura) ? altura : undefined,
      servicosIds: this.servicoIdsCtrl.value ?? [],
      acabamentosIds: this.acabamentoIdsCtrl.value ?? [],
    });

    return itens;
  }

  trackById(_: number, item: { id: number | null }): number | null {
    return item?.id ?? null;
  }
}
