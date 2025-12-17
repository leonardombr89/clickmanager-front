import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';

import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { ProdutoResponse } from 'src/app/models/produto/produto-response.model';
import { ProdutoVariacaoResponse } from 'src/app/models/produto/produto-variacao-response.model';

import { SmartCalcDataService } from './smart-calc-data.service';
import { SmartCalcRequest } from 'src/app/models/smart-calc/smart-calc-request.model';
import { SmartCalcItem } from 'src/app/models/smart-calc/smart-calc-item.model';
import { SmartCalcResultado } from 'src/app/models/smart-calc/smart-calc-resultado.model';
import { ToastrService } from 'ngx-toastr';
import {
  of,
  switchMap,
  map,
  finalize,
  catchError,
  tap,
  debounceTime,
  distinctUntilChanged,
  Observable,
} from 'rxjs';

import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { PedidoService } from '../../pedido/pedido.service';
import { ItemTipo } from 'src/app/models/pedido/item-tipo.enum';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { CalculadoraConfigService } from '../../smart-calc-config/calculadora-config.service';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { MatCardTitle, MatCard } from "@angular/material/card";

type Material = { id: number; nome: string; descricao?: string };
type Servico = { id: number; nome: string };
type Acabamento = { id: number; nome: string };

@Component({
  selector: 'app-smart-calc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    InputMultiSelectComponent,
    InputNumericoComponent,
    MatCardTitle,
    MatCard
  ],
  templateUrl: './smart-calc.component.html',
  styleUrls: ['./smart-calc.component.scss']
})
export class SmartCalcComponent implements OnInit {

  produtos: ProdutoListagem[] = [];
  produtoSelecionado: ProdutoResponse | null = null;
  private variacoesPorMaterial = new Map<number, ProdutoVariacaoResponse[]>();
  materiais: Material[] = [];
  servicos: Servico[] = [];
  acabamentos: Acabamento[] = [];

  carregandoProdutos = false;
  erroProdutos: string | null = null;
  carregandoCalculo = false;
  erroCalculo: string | null = null;
  carregandoAdd = false;

  form!: FormGroup<{
    largura: FormControl<number | null>;
    altura: FormControl<number | null>;
    quantidade: FormControl<number | null>;
    produtoId: FormControl<number | null>;
    materialId: FormControl<number | null>;
    servicosIds: FormControl<number[]>;
    acabamentosIds: FormControl<number[]>;
    permiteRotacao: FormControl<boolean>;
  }>;

  resultado = signal<SmartCalcResultado | null>(null);
  itens = computed<SmartCalcItem[]>(() => this.resultado()?.itens ?? []);
  observacao = computed<string | undefined>(() => this.resultado()?.observacao);
  total = computed<number>(() => this.resultado()?.total ?? 0);
  melhor = computed<SmartCalcItem | null>(() => this.itens()[0] ?? null);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SmartCalcComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dataSvc: SmartCalcDataService,
    private pedidoService: PedidoService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private router: Router,
    private calcCfgSvc: CalculadoraConfigService
  ) { }

  ngOnInit(): void {
    // 1) carrega configuração
    this.calcCfgSvc.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.configAtiva = !!cfg?.ativo;

        // seta whitelist de produtos se vier na config
        this.allowedProductIds.clear();
        for (const p of (cfg?.produtos ?? [])) {
          if (p?.id != null) this.allowedProductIds.add(p.id);
        }

        if (!this.configAtiva) {
          this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
        }

        // 2) depois carrega produtos (já filtra pelos permitidos)
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('[SmartCalc] erro ao obter config', err);
        // sem config -> assume desabilitado? aqui vou assumir habilitado para não travar
        this.configAtiva = true;
        this.carregarProdutos();
      }
    });

    // 3) cria o form
    this.form = this.fb.group({
      largura: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      altura: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      quantidade: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      produtoId: this.fb.control<number | null>(null, [Validators.required]),
      materialId: this.fb.control<number | null>(null),
      servicosIds: this.fb.nonNullable.control<number[]>([]),
      acabamentosIds: this.fb.nonNullable.control<number[]>([]),
      permiteRotacao: this.fb.nonNullable.control(true),
    });

    this.form.controls.produtoId.valueChanges.subscribe((id) => { if (id) this.carregarProduto(id); });
    this.form.controls.materialId.valueChanges.subscribe((mid) => {
      this.atualizarListasPorMaterial(mid ?? undefined);
      this.aplicarModoCobrancaRegraLargura();
    });
  }


  config?: CalculadoraConfigResponse | null;
  private allowedProductIds = new Set<number>();
  configAtiva = false;

  // ===== Data =====
  private carregarProdutos(): void {
    this.carregandoProdutos = true;
    this.erroProdutos = null;

    this.dataSvc.getProdutos(500).subscribe({
      next: (lista) => {
        let arr = lista ?? [];

        // se houver whitelist na config, aplica
        if (this.allowedProductIds.size > 0) {
          arr = arr.filter(p => this.allowedProductIds.has(p.id));
        }

        this.produtos = arr;

        // se não há produtos após filtro, evita setar um id inválido
        if (!this.form.controls.produtoId.value && this.produtos.length) {
          this.form.controls.produtoId.setValue(this.produtos[0].id);
        }

        // se config estiver desabilitada, bloqueia o form
        if (!this.configAtiva) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }
        this.aplicarModoCobrancaRegraLargura();
        this.form.controls.largura.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        this.carregandoProdutos = false;
      },
      error: (err) => {
        console.error('Erro ao carregar produtos', err);
        this.erroProdutos = 'Não foi possível carregar os produtos.';
        this.carregandoProdutos = false;
      }
    });
  }


  private carregarProduto(produtoId: number): void {
    this.produtoSelecionado = null;
    this.resultado.set(null);
    this.servicos = [];
    this.acabamentos = [];
    this.materiais = [];
    this.variacoesPorMaterial.clear();
    this.form.controls.materialId.setValue(null, { emitEvent: false });

    this.dataSvc.getProdutoPorId(produtoId).subscribe({
      next: (det) => {
        this.produtoSelecionado = det;

        for (const v of det.variacoes ?? []) {
          if (v.materialId == null) continue;
          const arr = this.variacoesPorMaterial.get(v.materialId) ?? [];
          arr.push(v);
          this.variacoesPorMaterial.set(v.materialId, arr);
        }

        this.materiais = Array.from(this.variacoesPorMaterial.entries())
          .map(([id, arr]) => ({ id, nome: arr[0]?.materialNome ?? `Material ${id}` }));

        if (this.materiais.length) {
          const firstId = this.materiais[0].id;
          this.form.controls.materialId.setValue(firstId, { emitEvent: false });
          this.atualizarListasPorMaterial(firstId);
        } else {
          this.atualizarListasPorMaterial(undefined);
        }

        // 👇 AQUI: produto + material já definidos → pode aplicar a regra
        this.aplicarModoCobrancaRegraLargura();
        this.form.controls.largura.updateValueAndValidity({ onlySelf: true, emitEvent: false });
      },
      error: (err: any) => {
        console.error('Erro ao carregar produto', err);
        this.atualizarListasPorMaterial(undefined);
        // Mesmo em erro, garanta que o campo volte habilitado
        this.aplicarModoCobrancaRegraLargura();
      }
    });
  }


  private atualizarListasPorMaterial(materialId?: number): void {
    const variacoes = materialId ? (this.variacoesPorMaterial.get(materialId) ?? []) : [];
    const novosAcab = this.dedupeById(
      variacoes.flatMap(v => v.acabamentos ?? [])
        .filter(a => a?.id != null && a?.ativo !== false)
        .map(a => ({ id: a.id!, nome: a.nome! }))
    );
    const novosServs = this.dedupeById(
      variacoes.flatMap(v => v.servicos ?? [])
        .filter(s => s?.id != null && s?.ativo !== false)
        .map(s => ({ id: s.id!, nome: s.nome! }))
    );
    this.acabamentos = novosAcab;
    this.servicos = novosServs;

    const selAcab = (this.form.controls.acabamentosIds.value ?? []).filter(id => this.acabamentos.some(a => a.id === id));
    const selServ = (this.form.controls.servicosIds.value ?? []).filter(id => this.servicos.some(s => s.id === id));
    if (selAcab.length !== (this.form.controls.acabamentosIds.value ?? []).length) {
      this.form.controls.acabamentosIds.setValue(selAcab);
    }
    if (selServ.length !== (this.form.controls.servicosIds.value ?? []).length) {
      this.form.controls.servicosIds.setValue(selServ);
    }
  }

  // ===== Ações =====
  calcular(): void {
    if (!this.configAtiva) {
      this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
      return;
    }
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    if (v.largura == null || v.altura == null || v.quantidade == null || v.produtoId == null) return;

    const payload: SmartCalcRequest = {
      produtoId: v.produtoId,
      materialId: v.materialId ?? undefined,
      largura: Number(v.largura),
      altura: Number(v.altura),
      quantidade: Number(v.quantidade),
      servicosIds: v.servicosIds ?? [],
      acabamentosIds: v.acabamentosIds ?? []
    };

    this.carregandoCalculo = true;
    this.erroCalculo = null;


    this.dataSvc.calcularSmartCalc(payload).subscribe({
      next: (res) => {
        this.resultado.set(res ?? { itens: [], total: 0, observacao: undefined });
        this.carregandoCalculo = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.message ?? 'Não foi possível calcular. Tente novamente.';
        this.toastr.error(msg, 'SmartCalc', { timeOut: 6000, closeButton: true, progressBar: true });
        this.resultado.set(null);
        this.erroCalculo = msg;
        this.carregandoCalculo = false;
      }
    });
  }

  // 1) Garanta que o modelo tem produtoVariacaoId
  // export interface PedidoItemRequest { ... produtoVariacaoId?: number; ... }

  adicionarAoPedido(): void {
    if (!this.configAtiva) {
      this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
      return;
    }
    const top = this.melhor();
    if (!top) { this.toastr.warning('Nenhum item calculado.', 'SmartCalc'); return; }

    // 0) Coleção vinda do engine
    const r = this.resultado();
    const itensCalc: any[] = Array.isArray(r?.itens) && r!.itens.length ? r!.itens : [top];

    // 1) Conjuntos de nomes de serviço/acabamento (minúsculo + trim)
    const nomesServ = new Set((this.servicos ?? []).map(s => (s?.nome ?? '').toLowerCase().trim()));
    const nomesAcab = new Set((this.acabamentos ?? []).map(a => (a?.nome ?? '').toLowerCase().trim()));

    // 2) Heurística para detectar PRODUTO
    const isProduto = (it: any) => {
      const nome = (it?.nomeComposto ?? it?.nome ?? it?.descricao ?? '')
        .toString().toLowerCase().trim();
      const ehServico = !!it?.servicoId || nomesServ.has(nome);
      const ehAcabamento = !!it?.acabamentoId || nomesAcab.has(nome);
      if (ehServico || ehAcabamento) return false;

      const temVinculoVariacao = it?.produtoVariacaoId || it?.variacaoId || it?.produtoId || it?.materialId || it?.formatoId;
      return !!temVinculoVariacao || (!nomesServ.has(nome) && !nomesAcab.has(nome));
    };

    // 3) Somente produtos viram BASE
    const itensProduto = itensCalc.filter(isProduto);

    const bases: PedidoItemRequest[] = [];
    const grupos: string[] = [];

    for (const item of itensProduto) {
      const grupoKey = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
      grupos.push(grupoKey);

      const variacaoId = Number(item.produtoVariacaoId ?? item.variacaoId ?? this.getSelectedVariacaoId() ?? 0);
      if (!variacaoId) {
        this.toastr.error('Variação não identificada para um dos itens.');
        return;
      }

      const quantidade = Number(item.quantidade ?? top.quantidade ?? 1);
      const subTotal = Number(item.subTotal ?? 0);
      const unitTop = Number(item.precoUnitario ?? (quantidade > 0 ? subTotal / quantidade : 0));
      const unitario = Number.isFinite(unitTop) && unitTop > 0 ? unitTop : 0;

      const largura = Number(item.largura ?? top.largura ?? 0) || undefined;
      const altura = Number(item.altura ?? top.altura ?? 0) || undefined;

      bases.push({
        grupoKey,
        tipo: ItemTipo.BASE,
        descricao: item.nomeComposto ?? item.nome ?? item.descricao ?? 'Item calculado',
        quantidade,
        valor: unitario,
        subTotal,
        produtoVariacaoId: variacaoId,
        largura,
        altura,
      });
    }

    // 4) Filhos — replicar serviços/acabamentos em cada BASE
    const filhos: PedidoItemRequest[] = [];
    for (const base of bases) {
      for (const sid of this.form.controls.servicosIds.value ?? []) {
        filhos.push({
          grupoKey: base.grupoKey!,
          tipo: ItemTipo.SERVICO,
          servicoId: sid,
          descricao: this.servicos.find(s => s.id === sid)?.nome ?? `Serviço #${sid}`,
          quantidade: 1,
          valor: 0,
          subTotal: 0,
          largura: base.largura,
          altura: base.altura,
        });
      }
      for (const aid of this.form.controls.acabamentosIds.value ?? []) {
        filhos.push({
          grupoKey: base.grupoKey!,
          tipo: ItemTipo.ACABAMENTO,
          acabamentoId: aid,
          descricao: this.acabamentos.find(a => a.id === aid)?.nome ?? `Acabamento #${aid}`,
          quantidade: 1,
          valor: 0,
          subTotal: 0,
          largura: base.largura,
          altura: base.altura,
        });
      }
    }

    const itens: PedidoItemRequest[] = [...bases, ...filhos];
    // console.log('PAYLOAD FINAL >>>', itens);

    // 5) Envia tudo pro pedido + salva observação antes
    this.carregandoAdd = true;
    const usuario = this.dataSvc.getUsuarioLogado();

    this.dataSvc.getDraftByUser$()
      .pipe(
        switchMap(draft => {
          if (draft) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
              data: {
                title: 'Rascunho já existente',
                message: `Atendente: ${usuario?.nome}\nPedido: #${draft.numero}\n\nDeseja adicionar ao pedido existente?`,
                confirmText: 'Usar existente',
                confirmColor: 'primary',
                cancelText: 'Criar novo',
              }
            });

            return ref.afterClosed().pipe(
              switchMap((useExisting: boolean) => {
                if (useExisting === true) {
                  return this.saveObsSeTiver$(draft.id).pipe(
                    switchMap(() => this.dataSvc.addItensToPedido$(draft.id, itens)),
                    map(() => draft)
                  );
                }
                if (useExisting === false) {
                  return this.dataSvc.createDraftForUser$().pipe(
                    switchMap(p => this.saveObsSeTiver$(p.id).pipe(
                      switchMap(() => this.dataSvc.addItensToPedido$(p.id, itens)),
                      map(() => p)
                    ))
                  );
                }
                return of(null);
              })
            );
          }

          // não havia rascunho -> cria, salva obs, adiciona itens
          return this.dataSvc.createDraftForUser$().pipe(
            switchMap(p => this.saveObsSeTiver$(p.id).pipe(
              switchMap(() => this.dataSvc.addItensToPedido$(p.id, itens)),
              map(() => p)
            ))
          );
        }),
        finalize(() => this.carregandoAdd = false)
      )
      .subscribe({
        next: (pedido) => {
          if (!pedido) return;
          const num = pedido?.numero ? ` #${pedido.numero}` : '';
          this.toastr.success(`Itens adicionados ao pedido${num}.`, 'SmartCalc');

          const ref = this.dialog.open(ConfirmDialogComponent, {
            data: { title: 'Abrir pedido?', message: `Deseja abrir o pedido${num} agora?`, confirmText: 'Abrir pedido', confirmColor: 'primary' }
          });

          ref.afterClosed()
            .pipe(
              switchMap((go: boolean): Observable<PedidoResponse | null> =>
                go ? this.pedidoService.buscarPorId(pedido.id) : of(null)
              )
            )
            .subscribe({
              next: (p) => {
                if (!p) return;
                this.dialog.closeAll();
                this.router.navigate(['/page/pedido/detalhe', p.id]);
              },
              error: (err) => this.toastr.error(err?.error?.message ?? err?.message ?? 'Falha ao abrir o pedido.', 'SmartCalc'),
            });
        },
        error: (err) => this.toastr.error(err?.error?.message ?? err?.message ?? 'Falha ao adicionar itens ao pedido.', 'SmartCalc'),
      });
  }

  private saveObsSeTiver$(pedidoId: number): Observable<void | null> {
    const obs = (this.observacao() ?? '').trim();
    if (!obs) return of(null);
    return this.pedidoService.atualizar(pedidoId, { observacoes: obs } as any) as unknown as Observable<void>;
  }

  // Helper: pega a variação pelo material selecionado
  private getSelectedVariacaoId(): number | undefined {
    const materialId = this.form.value.materialId;
    if (!materialId || !this.produtoSelecionado?.variacoes?.length) return undefined;
    const variacao = this.produtoSelecionado.variacoes.find(v => v.materialId === materialId);
    return variacao?.id ?? undefined;
  }


  limpar(): void {
    this.form.reset({
      largura: null,
      altura: null,
      quantidade: null,
      produtoId: this.produtos[0]?.id ?? null,
      materialId: this.materiais[0]?.id ?? null,
      servicosIds: [],
      acabamentosIds: [],
      permiteRotacao: true
    });
    this.resultado.set(null);
    this.aplicarModoCobrancaRegraLargura();
  }

  enviarParaPedido(): void {
    this.adicionarAoPedido();
  }

  private dedupeById<T extends { id: number }>(arr: T[]): T[] {
    const map = new Map<number, T>();
    for (const item of arr) if (!map.has(item.id)) map.set(item.id, item);
    return Array.from(map.values());
  }

  fechar(): void { this.dialogRef.close(null); }

  getMaterialDescricao(id: number): string {
    const m = this.materiais.find(x => x.id === id);
    return m?.descricao ?? '—';
  }

  private getSelectedVariacao(): ProdutoVariacaoResponse | undefined {
    const variacoes = this.produtoSelecionado?.variacoes ?? [];
    if (!variacoes.length) return undefined;

    const materialId = this.form?.value?.materialId;
    if (materialId != null) {
      const found = variacoes.find(v => v.materialId === materialId);
      if (found) return found;
    }
    return variacoes[0];
  }

  private getSelectedPreco(): any | undefined {
    return this.getSelectedVariacao()?.preco;
  }

  isMetroLinear(): boolean {
    const preco: any = this.getSelectedPreco();
    // tipo vem como 'METRO' no seu payload
    const tipo = (preco?.tipo ?? '').toString().toUpperCase();
    const modo = (preco?.modoCobranca ?? '').toString().toUpperCase();
    return tipo === 'METRO' && modo === 'LINEAR';
  }

  getLinearLarguraMaxima(): number | null {
    const preco: any = this.getSelectedPreco();
    const raw = Number(preco?.larguraMaxima);
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }

  /**
   * Aplica a regra:
   * - Se METRO/LINEAR: seta largura = larguraMaxima e desabilita o controle.
   * - Caso contrário: reabilita o controle (sem sobrescrever o valor do usuário).
   */
  private aplicarModoCobrancaRegraLargura(): void {
    const larguraCtrl = this.form.controls.largura;

    if (this.isMetroLinear()) {
      const larguraMax = this.getLinearLarguraMaxima();
      if (larguraMax != null) {
        // seta sem disparar valueChanges
        larguraCtrl.setValue(larguraMax, { emitEvent: false });
      }
      // desabilita para impedir edição
      larguraCtrl.disable({ emitEvent: false });
    } else {
      // reabilita quando não for linear
      if (larguraCtrl.disabled) {
        larguraCtrl.enable({ emitEvent: false });
      }
    }
  }
}
