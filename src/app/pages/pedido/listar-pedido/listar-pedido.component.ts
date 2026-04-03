import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, HostListener, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FiltroPesquisaCardComponent } from 'src/app/components/filtro-pesquisa-card/filtro-pesquisa-card.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { PedidoTabelaComponent } from 'src/app/components/pedido-tabela/pedido-tabela.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { PedidoListagem } from 'src/app/models/pedido/pedido-listagem.model';
import { PedidoService } from '../pedido.service';

@Component({
  selector: 'app-listar-pedido',
  standalone: true,
  templateUrl: './listar-pedido.component.html',
  styleUrls: ['./listar-pedido.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    TemPermissaoDirective,
    PageCardComponent,
    FiltroPesquisaCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    PedidoTabelaComponent
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ListarPedidoComponent implements OnInit, OnDestroy {
  private static readonly MOBILE_DEFAULT_HIDDEN_STATUSES = new Set(['CANCELADO', 'ENTREGUE']);
  private readonly pedidoService = inject(PedidoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  pedidos = signal<PedidoListagem[]>([]);
  readonly isMobileView = signal(false);
  readonly mobileStatusOptions = signal<string[]>(['TODOS']);
  readonly mobileFabCompact = signal(false);
  readonly groupedMobilePedidos = computed(() => {
    const groups = new Map<string, PedidoListagem[]>();

    for (const pedido of this.pedidos()) {
      const label = this.grupoDataPedido(pedido.dataCriacao);
      const lista = groups.get(label) || [];
      lista.push(pedido);
      groups.set(label, lista);
    }

    return Array.from(groups.entries()).map(([label, pedidos]) => ({ label, pedidos }));
  });
  totalPedidos = 0;
  tamanhoPagina = 10;
  readonly tamanhoPaginaMobile = 20;
  paginaAtual = 0;
  textoPesquisa = '';
  statusSelecionado = 'TODOS';
  statusOptions: string[] = [];
  sortParams: string[] = ['dataCriacao,desc'];
  sortActive = 'dataCriacao';
  sortDirection: 'asc' | 'desc' | '' = 'desc';
  abaAtual: 'todos' | 'orcamentos' | 'rascunhos' = 'todos';
  carregandoPedidos = false;
  carregandoMais = false;
  mobileHasMore = true;
  pedidoSelecionadoMenu: PedidoListagem | null = null;
  private searchDebounceTimer?: ReturnType<typeof setTimeout>;

  expandedElement: PedidoListagem | null = null;
  readonly columnsToDisplay = ['numero', 'dataCriacao', 'cliente', 'status', 'total', 'acoes'];
  readonly columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  ngOnInit(): void {
    this.atualizarViewport(false);
    this.carregarStatus();

    this.route.queryParamMap.subscribe((params) => {
      const status = (params.get('status') || 'TODOS').toUpperCase();
      this.statusSelecionado = status || 'TODOS';
      this.abaAtual = status === 'ORCAMENTO' ? 'orcamentos' : status === 'RASCUNHO' ? 'rascunhos' : 'todos';
      this.resetarListagem();
      this.carregarPedidos(true);
    });
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.atualizarViewport(true);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mobileFabCompact.set((window.scrollY || document.documentElement.scrollTop || 0) > 96);

    if (!this.isMobileView() || this.carregandoPedidos || this.carregandoMais || !this.mobileHasMore) {
      return;
    }

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;

    if (scrollTop + viewportHeight >= documentHeight - 320) {
      this.carregarMaisPedidos();
    }
  }

  carregarStatus(): void {
    this.pedidoService.listarStatus().subscribe(lista => {
      const todos = (lista || []).filter(Boolean);
      const desktop = todos.filter(s => s !== 'RASCUNHO' && s !== 'ORCAMENTO');
      this.statusOptions = ['TODOS', ...desktop];
      this.mobileStatusOptions.set(this.montarStatusMobile(todos));
    });
  }

  carregarPedidos(reset: boolean = false): void {
    const mobile = this.isMobileView();

    if (reset) {
      this.paginaAtual = 0;
      this.mobileHasMore = true;
      if (mobile) {
        this.pedidos.set([]);
      }
    }

    const statusFiltro = this.statusSelecionado !== 'TODOS' ? this.statusSelecionado : undefined;
    const tamanho = mobile ? this.tamanhoPaginaMobile : this.tamanhoPagina;
    this.carregandoPedidos = !mobile || this.paginaAtual === 0;
    this.carregandoMais = mobile && this.paginaAtual > 0;

    this.pedidoService.listar(this.paginaAtual, tamanho, this.textoPesquisa, statusFiltro, this.sortParams)
      .subscribe({
        next: (pagina) => {
          const filtrandoTodosDesktop = !mobile && this.abaAtual === 'todos' && !statusFiltro;
          let conteudo = pagina.content;

          if (filtrandoTodosDesktop) {
            conteudo = conteudo.filter(p => p.status !== 'RASCUNHO' && p.status !== 'ORCAMENTO');
          }

          if (mobile && !statusFiltro) {
            conteudo = conteudo.filter(p => !ListarPedidoComponent.MOBILE_DEFAULT_HIDDEN_STATUSES.has((p.status || '').toUpperCase()));
          }

          if (mobile) {
            const atuais = reset ? [] : this.pedidos();
            const ids = new Set(atuais.map(item => item.id));
            const atualizados = reset ? conteudo : [...atuais, ...conteudo.filter(item => !ids.has(item.id))];
            this.pedidos.set(atualizados);
            this.totalPedidos = pagina.totalElements;
            this.mobileHasMore = pagina.number + 1 < pagina.totalPages;

            if (!atualizados.length && this.mobileHasMore) {
              this.paginaAtual += 1;
              this.carregarPedidos(false);
              return;
            }
          } else {
            this.pedidos.set(conteudo);
            this.totalPedidos = filtrandoTodosDesktop ? conteudo.length : pagina.totalElements;
          }

          this.carregandoPedidos = false;
          this.carregandoMais = false;
        },
        error: () => {
          this.carregandoPedidos = false;
          this.carregandoMais = false;
        }
      });
  }

  onPesquisar(texto: string): void {
    this.textoPesquisa = texto;
    this.resetarListagem();
    this.carregarPedidos(true);
  }

  onPesquisarMobile(texto: string): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.onPesquisar(texto);
    }, 250);
  }

  limparPesquisaMobile(): void {
    if (!this.textoPesquisa) return;
    this.onPesquisar('');
  }

  onPaginaAlterada(event: PageEvent): void {
    this.paginaAtual = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarPedidos(false);
  }

  onStatusChange(valor: string): void {
    this.statusSelecionado = valor || 'TODOS';
    this.resetarListagem();
    this.carregarPedidos(true);
  }

  onSort(sort: Sort): void {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction;

    if (!sort.direction) {
      this.sortParams = [];
      this.carregarPedidos(false);
      return;
    }

    if (sort.active === 'cliente') {
      this.sortParams = [`cliente,${sort.direction}`];
    } else if (sort.active === 'status' || sort.active === 'orcamentoStatus') {
      this.sortParams = [`status,${sort.direction}`];
    } else if (sort.active === 'orcamentoNome') {
      this.sortParams = [`orcamento.nome,${sort.direction}`];
    } else if (sort.active === 'vencimento') {
      this.sortParams = [`orcamento.vencimento,${sort.direction}`];
    } else if (sort.active === 'total') {
      this.sortParams = [`total,${sort.direction}`, 'dataCriacao,desc'];
    } else {
      this.sortParams = [];
    }

    this.carregarPedidos(false);
  }

  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 0) {
      this.abaAtual = 'todos';
      this.statusSelecionado = 'TODOS';
    } else if (event.index === 1) {
      this.abaAtual = 'orcamentos';
      this.statusSelecionado = 'ORCAMENTO';
    } else {
      this.abaAtual = 'rascunhos';
      this.statusSelecionado = 'RASCUNHO';
    }

    this.resetarListagem();
    this.carregarPedidos(true);
  }

  get dataSource() {
    return this.pedidos();
  }

  selecionarChipStatus(valor: string): void {
    this.statusSelecionado = valor || 'TODOS';
    this.resetarListagem();
    this.carregarPedidos(true);
  }

  abrirPedido(pedido: PedidoListagem): void {
    if (!pedido?.id) return;
    this.router.navigate([`/page/pedido/detalhe/${pedido.id}`]);
  }

  abrirCriacaoPedido(): void {
    this.router.navigate(['/page/pedido/criar']);
  }

  selecionarPedidoMenu(pedido: PedidoListagem, event?: Event): void {
    event?.stopPropagation();
    this.pedidoSelecionadoMenu = pedido;
  }

  cancelarPedidoMobile(): void {
    const pedido = this.pedidoSelecionadoMenu;
    if (!pedido?.id || !this.podeCancelar(pedido)) return;

    const confirmar = window.confirm(`Cancelar o pedido ${pedido.numero}?`);
    if (!confirmar) return;

    this.pedidoService.cancelar(pedido.id).subscribe(() => {
      this.resetarListagem();
      this.carregarPedidos(true);
    });
  }

  podeCancelar(pedido: PedidoListagem): boolean {
    const status = (pedido?.status || '').toUpperCase();
    return !!pedido?.id && status !== 'CANCELADO' && status !== 'ENTREGUE';
  }

  formatarDataPedido(data?: string | null): string {
    if (!data) return 'Agora';
    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return 'Agora';

    const now = new Date();
    const sameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate();

    const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `Hoje, ${time}`;
    if (isYesterday) return `Ontem, ${time}`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  labelStatus(status: string): string {
    const normalized = (status || 'TODOS').toUpperCase();
    const labels: Record<string, string> = {
      TODOS: 'Todos',
      ORCAMENTO: 'Orçamento',
      RASCUNHO: 'Rascunho',
      PENDENTE: 'Pendente',
      AGUARDANDO_PAGAMENTO: 'Pagamento',
      EM_PRODUCAO: 'Produção',
      PRONTO: 'Pronto',
      ENTREGUE: 'Entregue',
      CANCELADO: 'Cancelado'
    };

    return labels[normalized] || normalized.replaceAll('_', ' ');
  }

  subtituloPedido(pedido: PedidoListagem): string {
    return `Pedido ${pedido.numero}`;
  }

  tempoCompactoPedido(data?: string | null): string {
    if (!data) return 'Agora';
    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return 'Agora';

    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private carregarMaisPedidos(): void {
    if (!this.isMobileView() || this.carregandoPedidos || this.carregandoMais || !this.mobileHasMore) {
      return;
    }

    this.paginaAtual += 1;
    this.carregarPedidos(false);
  }

  private resetarListagem(): void {
    this.paginaAtual = 0;
    this.mobileHasMore = true;
    this.pedidoSelecionadoMenu = null;
  }

  private atualizarViewport(recarregarSeMudar: boolean): void {
    const proximo = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
    const anterior = this.isMobileView();
    this.isMobileView.set(proximo);
    this.mobileFabCompact.set(proximo && typeof window !== 'undefined' ? window.scrollY > 96 : false);

    if (recarregarSeMudar && anterior !== proximo) {
      this.resetarListagem();
      this.carregarPedidos(true);
    }
  }

  private montarStatusMobile(statuses: string[]): string[] {
    const prioritarios = [
      'TODOS',
      'ORCAMENTO',
      'RASCUNHO',
      'PENDENTE',
      'AGUARDANDO_PAGAMENTO',
      'EM_PRODUCAO',
      'PRONTO',
      'ENTREGUE',
      'CANCELADO'
    ];
    const unicos = new Set<string>(prioritarios);

    for (const status of statuses) {
      if (status) {
        unicos.add(status);
      }
    }

    return Array.from(unicos);
  }

  private grupoDataPedido(data?: string | null): string {
    if (!data) return 'Hoje';

    const date = new Date(data);
    if (Number.isNaN(date.getTime())) return 'Hoje';

    const now = new Date();
    const sameDay =
      now.getFullYear() === date.getFullYear() &&
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate();

    if (sameDay) {
      return 'Hoje';
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === date.getFullYear() &&
      yesterday.getMonth() === date.getMonth() &&
      yesterday.getDate() === date.getDate();

    if (isYesterday) {
      return 'Ontem';
    }

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
