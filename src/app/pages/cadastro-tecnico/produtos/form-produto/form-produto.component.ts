import { CommonModule } from '@angular/common';
import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {
  ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, FormControl
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';

import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { ProdutoService } from '../../services/produto.service';

import { ProdutoRequest } from 'src/app/models/produto/produto-request.model';
import { VariacoesProdutoComponent } from './variacoes-produto/variacoes-produto.component';
import { VariacaoProduto } from './variacoes-produto/models/variacao.model';
import { PrecoRequest } from 'src/app/models/preco/preco.model';
import { VariacaoProdutoRequest } from 'src/app/models/produto/variacao-produto-request.model';
import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { PoliticaRevendaComponent } from './politica-revenda/politica-revenda.component';
import { ProdutoResponse } from 'src/app/models/produto/produto-response.model';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-form-produto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatIconModule,
    MatDividerModule,
    TablerIconsModule,
    SharedComponentsModule,
    VariacoesProdutoComponent,
    PoliticaRevendaComponent,
    CardHeaderComponent
],
  templateUrl: './form-produto.component.html',
  styleUrls: ['./form-produto.component.scss'],
})
export class FormProdutoComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isEditMode = false;
  produtoId!: number;
  politicaDoProduto: PoliticaRevenda | null = null;

  /** estado local das variações (o filho emite alterações) */
  variacoes: VariacaoProduto[] = [];

  /** seed para o filho preencher a tabela quando for edição */
  variacoesIniciais: VariacaoProduto[] = [];

  /** loading simples para feedback */
  loading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly produtoService: ProdutoService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  // ================= lifecycle =================

  ngOnInit(): void {
    this.buildForm();
    this.detectEditModeAndLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================= template bindings =================

  onVariacoesChange(lista: VariacaoProduto[]) {
    // Garantir sempre estrutura de objeto; não aceitamos strings
    this.variacoes = (Array.isArray(lista) ? lista : [])
      .filter(v => typeof v === 'object' && v !== null) as VariacaoProduto[];
  }

  // ================= init/load =================

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(120)]],
      descricao: ['', [Validators.required, Validators.maxLength(1000)]],
      ativo: [true],
      // se precisar no futuro:
      // categoriaId: [null],
      // grupoId: [null],
    });
  }

  private detectEditModeAndLoad(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const idParam = params.get('id');
        this.isEditMode = !!idParam;
        if (!this.isEditMode) return;

        this.produtoId = Number(idParam);
        if (!Number.isFinite(this.produtoId)) return;

        this.fetchProduto(this.produtoId);
      });
  }

  private fetchProduto(id: number): void {
  this.loading = true;
  this.cdr.markForCheck();

  this.produtoService.buscarPorId(id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (produto: ProdutoResponse) => {
        this.patchProduto(produto);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Erro ao carregar produto.');
        this.router.navigate(['/page/cadastro-tecnico/produtos']);
        this.cdr.markForCheck();
      }
    });
}

  private dedupeById<T extends { id: number }>(arr: T[] = []): T[] {
    const seen = new Set<number>();
    return (arr || []).filter(x => !seen.has(x.id) && seen.add(x.id));
  }


  private patchProduto(produto: ProdutoResponse): void {
    this.form.patchValue({
      nome: produto?.nome ?? '',
      descricao: produto?.descricao ?? '',
      ativo: !!produto?.ativo,
    });

    this.politicaDoProduto = this.mapPoliticaRevenda(produto.politicaRevenda);

    this.variacoesIniciais = (produto?.variacoes ?? []).map(v => ({
      id: v.id,
      materialId: v.materialId,
      formatoId: v.formatoId,
      cor: v.corId ? { id: v.corId, nome: v.corNome ?? undefined } : null,

      // ✅ objetos completos vindos do back (com dedupe se necessário)
      acabamentos: this.dedupeById(
        (v.acabamentos ?? []).map(a => ({
          id: a.id,
          nome: a.nome,
          descricao: a.descricao,
          preco: a.preco ?? null,
          ativo: a.ativo,
        }))
      ),
      servicos: this.dedupeById(
        (v.servicos ?? []).map(s => ({
          id: s.id,
          nome: s.nome,
          descricao: s.descricao,
          preco: s.preco ?? null,
          ativo: s.ativo,
        }))
      ),

      // preço da variação (já vem pronto)
      preco: v.preco ?? null,

      politicaRevenda: this.politicaDoProduto ?? null,
    }));

    this.cdr.markForCheck();
  }

  // ================= submit =================
  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      this.toastr.error('Preencha os campos obrigatórios.');
      return;
    }

    if (!Array.isArray(this.variacoes) || !this.variacoes.length) {
      this.toastr.error('Adicione pelo menos uma variação antes de salvar.');
      return;
    }

    // Bloqueia casos em que o filho emite strings ou linhas sem ids/preço
    const invalidRow = this.variacoes.find(v => this.isInvalidVariacao(v as any));
    if (invalidRow) {
      this.toastr.error('Há variações com dados inválidos. Verifique material, formato e preço.');
      return;
    }

    const payload = this.toProdutoRequest(this.form.getRawValue());

    this.loading = true;
    this.cdr.markForCheck();

    const req$ = this.isEditMode
      ? this.produtoService.atualizar(this.produtoId, payload)
      : this.produtoService.salvar(payload);

    req$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.success(this.isEditMode ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/produtos']);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toastr.error(this.isEditMode ? 'Erro ao atualizar produto.' : 'Erro ao criar produto.');
          this.cdr.markForCheck();
        }
      });
  }

  // ================= utils =================

  private isInvalidVariacao(v: any): boolean {
    if (typeof v !== 'object' || v == null) return true;
    const toId = (x: any) => x == null ? null : (typeof x === 'object' ? Number(x.id) : Number(x));
    const materialId = toId(v.materialId);
    const formatoId = toId(v.formatoId);
    const precoTipo = v?.preco?.tipo;
    return !materialId || !formatoId || !precoTipo;
  }

  private num(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('Valor numérico inválido.');
    return n;
  }

  private numOrNull(v: any): number | null {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  onPoliticaChange(val: PoliticaRevenda | null) {
    this.politicaDoProduto = val;
    this.cdr.markForCheck();
  }

  // ================= mapping helpers =================

  private toProdutoRequest(formValue: any): ProdutoRequest {
    return {
      nome: String(formValue?.nome ?? '').trim(),
      descricao: String(formValue?.descricao ?? '').trim(),
      variacoes: this.toVariacoesRequest(this.variacoes),
      politicaRevenda: this.buildPoliticaRevendaPayload() ?? undefined, // envia só se existir
    };
  }

  private buildPoliticaRevendaPayload(): ProdutoRequest['politicaRevenda'] | null {
    const src = this.politicaDoProduto ?? this.extractPoliticaFromVariacoes(this.variacoes);
    if (!src) return null;

    const percentual = !!src.percentual;
    const percentualDesconto = percentual ? this.numOrNull(src.percentualDesconto) : undefined;
    const precoFixo = !percentual ? this.numOrNull(src.precoFixo) : undefined;

    // (opcional) validação simples: não permitir ambos/nenhum
    if (percentual && (percentualDesconto == null)) {
      this.toastr.error('Defina o percentual de desconto da política.');
      throw new Error('PoliticaRevenda inválida: percentual sem valor.');
    }
    if (!percentual && (precoFixo == null)) {
      this.toastr.error('Defina o preço fixo da política.');
      throw new Error('PoliticaRevenda inválida: preço fixo ausente.');
    }

    return { percentual, percentualDesconto, precoFixo };
  }

  private extractPoliticaFromVariacoes(lista: VariacaoProduto[]): PoliticaRevenda | null {
    const p = (lista ?? []).find(v => !!v.politicaRevenda)?.politicaRevenda;
    return p ? this.normalizePolitica(p) : null;
  }

  private normalizePolitica(src: any): PoliticaRevenda {
    if (!src) return null as any;

    const percentual = !!src.percentual;

    return {
      id: src.id ?? undefined,
      percentual,
      // quando for percentual, usa percentualDesconto; quando for preço fixo, usa precoFixo
      percentualDesconto: percentual
        ? this.numOrNull(src.percentualDesconto)
        : undefined,
      precoFixo: !percentual
        ? this.numOrNull(src.precoFixo)
        : undefined,
    };
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

  private toVariacoesRequest(lista: VariacaoProduto[]): VariacaoProdutoRequest[] {
    return (lista ?? []).map((v: any) => {
      const materialId = this.extractId(v.materialId);
      const formatoId = this.extractId(v.formatoId);
      // aceita v.cor (objeto/numero) ou v.corId (fallback)
      const corId = this.extractId(v.cor ?? v.corId);

      if (!materialId || !formatoId || !v?.preco?.tipo) {
        throw new Error('Variação inválida (material, formato ou preço ausente).');
      }

      return {
        ...(v?.id ? { id: Number(v.id) } : {}),
        ...(this.isEditMode ? {} : {}), // não enviar produtoId (mantém o mesmo shape do criar)
        materialId: Number(materialId),
        formatoId: Number(formatoId),
        corId: corId != null ? Number(corId) : null,
        acabamentoIds: Array.isArray(v.acabamentos) ? v.acabamentos.map((x: any) => Number(this.extractId(x))) : [],
        servicoIds: Array.isArray(v.servicos) ? v.servicos.map((x: any) => Number(this.extractId(x))) : [],
        preco: this.toPrecoRequest(v.preco),
      } as VariacaoProdutoRequest;
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
          ...(p.largurasLinearesPermitidas
            ? { largurasLinearesPermitidas: String(p.largurasLinearesPermitidas) }
            : {}),
        } as PrecoRequest;

      default:
        throw new Error(`Tipo de preço desconhecido: ${preco?.tipo}`);
    }
  }

  private mapPoliticaRevenda(src: PoliticaRevenda | null | undefined): PoliticaRevenda | null {
    if (!src) return null;
    return {
      id: src.id,
      percentual: !!src.percentual,
      percentualDesconto: src.percentual ? (src.percentualDesconto ?? undefined) : undefined,
      precoFixo: !src.percentual ? (src.precoFixo ?? undefined) : undefined,
    };
  }

  // ================= getters de conveniência =================

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }
  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }
}
