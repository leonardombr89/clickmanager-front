import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ApiService } from 'src/app/services/api.service';
import { SmartCalcResultado } from 'src/app/models/smart-calc/smart-calc-resultado.model';

export interface DemoFormatOption {
  id: number;
  label: string;
  widthCm: number;
  heightCm: number;
  maxWidthCm: number;
  maxHeightCm: number;
  ratePerM2: number;
  minimumUnitPrice: number;
  description: string;
}

export interface DemoFinishOption {
  id: number;
  label: string;
  surcharge: number;
  description: string;
  formatoId?: number | null;
  formatoNome?: string | null;
}

export interface DemoServiceOption {
  id: string;
  label: string;
  surcharge: number;
  description: string;
}

export interface DemoOrderPreview {
  numero: string;
  clienteNome: string;
  clienteTelefone: string;
  produtoNome: string;
  formatoLabel: string;
  quantidade: number;
  larguraCm: number;
  alturaCm: number;
  acabamentos: string[];
  valorUnitario: number;
  total: number;
  status: string;
  criadoEm: string;
}

export interface DemoCalculatedItem {
  id: string;
  nomeComposto: string;
  quantidade: number;
  valor: number;
  subTotal: number;
}

export interface DemoDistributionLine {
  formato: string;
  orientacao: string;
  folhas: number;
  porFolha: number;
}

interface DemoProdutoApi {
  id: number;
  nome: string;
}

interface DemoMaterialApi {
  id: number;
  nome: string;
}

interface DemoAcabamentoApi {
  id: number;
  nome: string;
  valor: number;
  formatoId?: number | null;
  formatoNome?: string | null;
}

interface DemoFormatoApi {
  id: number;
  nome: string;
  larguraCm: number;
  alturaCm: number;
  larguraUtilCm: number;
  alturaUtilCm: number;
  valorFolha: number;
}

interface DemoLimitesApi {
  larguraMinimaCm: number;
  alturaMinimaCm: number;
  quantidadeMinima: number;
}

interface DemoContextoApi {
  nome: string;
  produto: DemoProdutoApi;
  materiais: DemoMaterialApi[];
  acabamentos: DemoAcabamentoApi[];
  formatos: DemoFormatoApi[];
  limites: DemoLimitesApi;
  whatsappPhone: string;
}

interface DemoCalculoItemApi {
  id: number;
  tipo: string;
  nomeComposto: string;
  descricao: string;
  quantidade: number;
  valor: number;
  subTotal: number;
  largura?: number | null;
  altura?: number | null;
}

interface DemoCalculoApi {
  produtoId: number;
  produtoNome: string;
  materialId: number;
  materialNome: string;
  itens: DemoCalculoItemApi[];
  observacao?: string | null;
  observacaoResumo?: SmartCalcResultado['observacaoResumo'];
  sugestaoEconomica?: SmartCalcResultado['sugestaoEconomica'];
  total: number;
}

interface DemoPedidoItemApi {
  tipo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface DemoPedidoApi {
  numeroPedido: string;
  status: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string | null;
  produtoNome: string;
  materialNome: string;
  largura: number;
  altura: number;
  quantidade: number;
  observacoes?: string | null;
  subtotal: number;
  total: number;
  itens: DemoPedidoItemApi[];
  layoutsImpressao: string[];
}

export interface DemoWhatsappPreviewApi {
  mensagem: string;
  telefone: string;
  numeroPedido: string;
  status: string;
  whatsappUrl: string;
}

interface DemoCalculoRequestApi {
  materialId: number;
  largura: number;
  altura: number;
  quantidade: number;
  acabamentosIds: number[];
}

interface DemoPedidoRequestApi extends DemoCalculoRequestApi {
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail: string;
  observacoes: string;
}

@Injectable({ providedIn: 'root' })
export class DemoSmartcalcService {
  private readonly baseUrl = environment.apiUrl;

  private readonly contextSignal = signal<DemoContextoApi | null>(null);
  private readonly calculationSignal = signal<SmartCalcResultado | null>(null);
  private readonly pedidoSignal = signal<DemoPedidoApi | null>(null);
  private readonly whatsappSignal = signal<DemoWhatsappPreviewApi | null>(null);

  private readonly productSelected = signal(false);
  private readonly materialIdSignal = signal<number | null>(null);
  private readonly widthCmSignal = signal<number | null>(null);
  private readonly heightCmSignal = signal<number | null>(null);
  private readonly quantitySignal = signal<number | null>(null);
  private readonly selectedFinishIdsSignal = signal<number[]>([]);
  private readonly selectedServiceIdsSignal = signal<string[]>([]);
  private readonly createdAtSignal = signal(new Date());
  private readonly lastPedidoRequestSignal = signal<DemoPedidoRequestApi | null>(null);

  readonly loadingContext = signal(false);
  readonly loadingCalculation = signal(false);
  readonly loadingPedido = signal(false);
  readonly loadingWhatsapp = signal(false);
  readonly contextError = signal<string | null>(null);
  readonly calculationError = signal<string | null>(null);

  readonly selectedMaterial = computed(() => {
    const id = this.materialIdSignal();
    return this.materiais.find(item => item.id === id) ?? null;
  });

  readonly selectedFinishes = computed(() => {
    const ids = this.selectedFinishIdsSignal();
    return this.acabamentos.filter(item => ids.includes(item.id));
  });

  readonly selectedServices = computed(() => {
    return this.servicos.filter(item => this.selectedServiceIdsSignal().includes(item.id));
  });

  constructor(
    private readonly api: ApiService,
    private readonly http: HttpClient,
  ) {}

  get contexto(): DemoContextoApi | null {
    return this.contextSignal();
  }

  get produto() {
    const context = this.contextSignal();
    const materiais = context?.materiais?.length ?? 0;
    const formatos = context?.formatos?.length ?? 0;

    return {
      id: context?.produto?.id ?? 0,
      nome: context?.produto?.nome ?? 'Produto demo',
      descricao: context?.nome ?? 'Demonstração pública do SmartCalc',
      variacoes: materiais * formatos,
    };
  }

  get formatos(): DemoFormatOption[] {
    return (this.contextSignal()?.formatos ?? []).map(formato => ({
      id: formato.id,
      label: formato.nome,
      widthCm: Number(formato.larguraCm ?? 0),
      heightCm: Number(formato.alturaCm ?? 0),
      maxWidthCm: Number(formato.larguraUtilCm ?? formato.larguraCm ?? 0),
      maxHeightCm: Number(formato.alturaUtilCm ?? formato.alturaCm ?? 0),
      ratePerM2: 0,
      minimumUnitPrice: 0,
      description: `Formato ${formato.nome}`,
    }));
  }

  get materiais(): { id: number; nome: string }[] {
    return (this.contextSignal()?.materiais ?? []).map(material => ({
      id: material.id,
      nome: material.nome,
    }));
  }

  get acabamentos(): DemoFinishOption[] {
    return (this.contextSignal()?.acabamentos ?? []).map(acabamento => ({
      id: acabamento.id,
      label: acabamento.nome,
      surcharge: Number(acabamento.valor ?? 0),
      description: acabamento.formatoNome ? `${acabamento.nome} • ${acabamento.formatoNome}` : acabamento.nome,
      formatoId: acabamento.formatoId ?? null,
      formatoNome: acabamento.formatoNome ?? null,
    }));
  }

  get servicos(): DemoServiceOption[] {
    return [];
  }

  get limites(): DemoLimitesApi | null {
    return this.contextSignal()?.limites ?? null;
  }

  resultado(): SmartCalcResultado | null {
    return this.calculationSignal();
  }

  pedidoSimulado(): DemoPedidoApi | null {
    return this.pedidoSignal();
  }

  whatsappPreview(): DemoWhatsappPreviewApi | null {
    return this.whatsappSignal();
  }

  produtoMeta() {
    return {
      nome: this.produto.nome,
      variacoes: this.produto.variacoes,
    };
  }

  hasResult(): boolean {
    return !!this.calculationSignal() && (this.calculationSignal()?.itens?.length ?? 0) > 0;
  }

  areaM2(): number {
    const largura = this.widthCmSignal() ?? 0;
    const altura = this.heightCmSignal() ?? 0;
    if (!largura || !altura) return 0;
    return this.round((largura * altura) / 10000);
  }

  baseUnitPrice(): number {
    const item = this.calculationSignal()?.itens?.find(it => (it.quantidade ?? 0) > 1) ?? this.calculationSignal()?.itens?.[0];
    return Number(item?.valor ?? 0);
  }

  finishesUnitPrice(): number {
    return this.round(this.selectedFinishes().reduce((acc, item) => acc + item.surcharge, 0));
  }

  servicesUnitPrice(): number {
    return 0;
  }

  unitPrice(): number {
    const pedido = this.pedidoSignal();
    if (pedido?.quantidade) {
      return this.round(Number(pedido.total ?? 0) / Math.max(1, pedido.quantidade));
    }
    const quantidadeBase = this.quantitySignal() ?? 0;
    if (quantidadeBase <= 0) return this.baseUnitPrice();
    return this.round((this.calculationSignal()?.total ?? 0) / quantidadeBase);
  }

  totalPrice(): number {
    return Number(this.calculationSignal()?.total ?? this.pedidoSignal()?.total ?? 0);
  }

  completedFinishesLabel(): string {
    const extras = this.selectedFinishes().map(item => item.label);
    return extras.length ? extras.join(', ') : 'Sem extras';
  }

  perSheet(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.distribuicao?.[0]?.porFolha ?? 0);
  }

  totalSheets(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.distribuicao?.[0]?.folhas ?? 0);
  }

  producedQuantity(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.produzido ?? 0);
  }

  sobraUtil(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.sobraUtil ?? 0);
  }

  custoUnitarioSolicitado(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.custoUnitarioSolicitado ?? 0);
  }

  custoUnitarioProduzido(): number {
    return Number(this.calculationSignal()?.observacaoResumo?.custoUnitarioProduzido ?? 0);
  }

  distribution(): DemoDistributionLine[] {
    return (this.calculationSignal()?.observacaoResumo?.distribuicao ?? []).map(item => ({
      formato: item.formato ?? '',
      orientacao: item.orientacao ?? '',
      folhas: Number(item.folhas ?? 0),
      porFolha: Number(item.porFolha ?? 0),
    }));
  }

  calculatedItems(): DemoCalculatedItem[] {
    return (this.calculationSignal()?.itens ?? []).map(item => ({
      id: String(item.id),
      nomeComposto: item.nomeComposto,
      quantidade: item.quantidade,
      valor: item.valor,
      subTotal: item.subTotal,
    }));
  }

  orderPreview(): DemoOrderPreview {
    const pedido = this.pedidoSignal();
    if (pedido) {
      return {
        numero: pedido.numeroPedido,
        clienteNome: pedido.clienteNome,
        clienteTelefone: pedido.clienteTelefone,
        produtoNome: pedido.produtoNome,
        formatoLabel: pedido.materialNome,
        quantidade: pedido.quantidade,
        larguraCm: Number(pedido.largura ?? 0),
        alturaCm: Number(pedido.altura ?? 0),
        acabamentos: this.selectedFinishes().map(item => item.label),
        valorUnitario: this.unitPrice(),
        total: Number(pedido.total ?? 0),
        status: pedido.status,
        criadoEm: this.createdAtSignal().toLocaleString('pt-BR'),
      };
    }

    return {
      numero: `DEM-${this.createdAtSignal().getTime()}`,
      clienteNome: 'Cliente Demo',
      clienteTelefone: this.demoClientPhone(),
      produtoNome: this.produto.nome,
      formatoLabel: this.selectedMaterial()?.nome ?? 'Sem material',
      quantidade: this.quantitySignal() ?? 0,
      larguraCm: this.widthCmSignal() ?? 0,
      alturaCm: this.heightCmSignal() ?? 0,
      acabamentos: this.selectedFinishes().map(item => item.label),
      valorUnitario: this.unitPrice(),
      total: this.totalPrice(),
      status: 'RASCUNHO',
      criadoEm: this.createdAtSignal().toLocaleString('pt-BR'),
    };
  }

  whatsappMessage(): string {
    return this.whatsappSignal()?.mensagem ?? '';
  }

  loadContext(force = false): Observable<DemoContextoApi> {
    if (this.contextSignal() && !force) {
      return of(this.contextSignal()!);
    }

    this.loadingContext.set(true);
    this.contextError.set(null);

    return this.api.get<DemoContextoApi>('api/demo/contexto').pipe(
      tap(context => this.contextSignal.set(context)),
      catchError(error => {
        this.contextError.set('Não foi possível carregar a demo agora.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingContext.set(false)),
    );
  }

  calcularAtual(): Observable<SmartCalcResultado | null> {
    const payload = this.buildCalculoRequest();
    if (!payload) {
      this.calculationSignal.set(null);
      return of(null);
    }

    this.loadingCalculation.set(true);
    this.calculationError.set(null);

    return this.api.post<DemoCalculoApi>('api/demo/smartcalc/calcular', payload).pipe(
      map(response => this.mapCalculo(response)),
      tap(resultado => {
        this.calculationSignal.set(resultado);
        this.pedidoSignal.set(null);
        this.whatsappSignal.set(null);
      }),
      catchError(error => {
        this.calculationSignal.set(null);
        this.calculationError.set('Não foi possível calcular agora.');
        return throwError(() => error);
      }),
      finalize(() => this.loadingCalculation.set(false)),
    );
  }

  simularPedido(overrides?: Partial<DemoPedidoRequestApi>): Observable<DemoPedidoApi> {
    const payload = this.buildPedidoRequest(overrides);
    this.loadingPedido.set(true);

    return this.api.post<DemoPedidoApi>('api/demo/pedido/simular', payload).pipe(
      tap(response => {
        this.pedidoSignal.set(response);
        this.lastPedidoRequestSignal.set(payload);
      }),
      catchError(error => {
        return throwError(() => error);
      }),
      finalize(() => this.loadingPedido.set(false)),
    );
  }

  carregarWhatsappPreview(): Observable<DemoWhatsappPreviewApi> {
    const pedido = this.lastPedidoRequestSignal() ?? this.buildPedidoRequest();
    this.loadingWhatsapp.set(true);

    return this.api.post<DemoWhatsappPreviewApi>('api/demo/whatsapp/preview', { pedido }).pipe(
      tap(response => this.whatsappSignal.set(response)),
      catchError(error => {
        return throwError(() => error);
      }),
      finalize(() => this.loadingWhatsapp.set(false)),
    );
  }

  abrirPdf(layout: 'completo' | 'duas-vias' | 'etiquetas', download = false): Observable<string> {
    const pedido = this.lastPedidoRequestSignal() ?? this.buildPedidoRequest();
    const params = new HttpParams()
      .set('layout', layout)
      .set('download', String(download));

    return this.http.post(`${this.baseUrl}/api/demo/pedido/pdf`, pedido, {
      params,
      responseType: 'blob',
    }).pipe(
      map(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        return url;
      })
    );
  }

  reset(): void {
    this.productSelected.set(false);
    this.materialIdSignal.set(null);
    this.widthCmSignal.set(null);
    this.heightCmSignal.set(null);
    this.quantitySignal.set(null);
    this.selectedFinishIdsSignal.set([]);
    this.selectedServiceIdsSignal.set([]);
    this.createdAtSignal.set(new Date());
    this.calculationSignal.set(null);
    this.pedidoSignal.set(null);
    this.whatsappSignal.set(null);
    this.lastPedidoRequestSignal.set(null);
    this.calculationError.set(null);
  }

  setProductSelected(selected: boolean): void {
    this.productSelected.set(selected);
  }

  setFormat(id: number | string | null): void {
    this.materialIdSignal.set(id == null ? null : Number(id));
    this.calculationSignal.set(null);
  }

  setWidth(value: number | null): void {
    this.widthCmSignal.set(value);
  }

  setHeight(value: number | null): void {
    this.heightCmSignal.set(value);
  }

  setQuantity(value: number | null): void {
    this.quantitySignal.set(value);
  }

  setSelectedFinishIds(ids: Array<number | string>): void {
    const normalized = Array.isArray(ids) ? ids.filter(Boolean).map(id => Number(id)) : [];
    this.selectedFinishIdsSignal.set(normalized);
  }

  setSelectedServiceIds(ids: string[]): void {
    this.selectedServiceIdsSignal.set(ids ?? []);
  }

  getWidth(): number {
    return this.widthCmSignal() ?? 0;
  }

  getHeight(): number {
    return this.heightCmSignal() ?? 0;
  }

  getQuantity(): number {
    return this.quantitySignal() ?? 0;
  }

  getSelectedFinishIds(): number[] {
    return [...this.selectedFinishIdsSignal()];
  }

  getSelectedServiceIds(): string[] {
    return [...this.selectedServiceIdsSignal()];
  }

  buildWhatsappUrl(): string {
    return this.whatsappSignal()?.whatsappUrl ?? '#';
  }

  prepareOrder(overrides?: Partial<DemoPedidoRequestApi>): Observable<DemoPedidoApi> {
    return this.simularPedido(overrides);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  formatMeasurement(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    }).format(value);
  }

  private buildCalculoRequest(): DemoCalculoRequestApi | null {
    const materialId = this.materialIdSignal();
    const largura = this.widthCmSignal();
    const altura = this.heightCmSignal();
    const quantidade = this.quantitySignal();

    if (!this.productSelected() || !materialId || !largura || !altura || !quantidade) {
      return null;
    }

    return {
      materialId,
      largura,
      altura,
      quantidade,
      acabamentosIds: this.selectedFinishIdsSignal(),
    };
  }

  private buildPedidoRequest(overrides?: Partial<DemoPedidoRequestApi>): DemoPedidoRequestApi {
    const base = this.buildCalculoRequest();
    if (!base) {
      throw new Error('Não há dados suficientes para simular o pedido demo.');
    }

    const payload: DemoPedidoRequestApi = {
      ...base,
      clienteNome: 'Cliente Demo',
      clienteTelefone: this.demoClientPhone(),
      clienteEmail: 'cliente.demo@clickmanager.app',
      observacoes: 'Pedido apenas para demonstração',
      ...overrides,
    };

    return payload;
  }

  private mapCalculo(response: DemoCalculoApi): SmartCalcResultado {
    return {
      itens: (response.itens ?? []).map((item, index) => ({
        id: Number(item.id ?? index + 1),
        nomeComposto: item.nomeComposto,
        descricao: item.descricao,
        quantidade: Number(item.quantidade ?? 0),
        valor: Number(item.valor ?? 0),
        subTotal: Number(item.subTotal ?? 0),
        produtoId: Number(response.produtoId ?? 0),
        largura: Number(item.largura ?? this.widthCmSignal() ?? 0),
        altura: Number(item.altura ?? this.heightCmSignal() ?? 0),
      })),
      observacao: response.observacao ?? undefined,
      observacaoResumo: response.observacaoResumo ?? undefined,
      sugestaoEconomica: response.sugestaoEconomica ?? undefined,
      total: Number(response.total ?? 0),
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private demoClientPhone(): string {
    const rawPhone = this.contextSignal()?.whatsappPhone?.replace(/\D/g, '');
    if (!rawPhone) {
      return '31999999999';
    }

    return rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone;
  }
}
