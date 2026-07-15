import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MetricCardComponent } from 'src/app/components/metric-card/metric-card.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { TelefonePipe } from 'src/app/pipe/telefone.pipe';
import { AuthService } from 'src/app/services/auth.service';
import {
  DepositoDashboardCatalogo,
  DepositoDashboardOrcamentoRecente,
  DepositoDashboardOrcamentoResumo,
  DepositoDashboardResponse,
  DepositoDashboardOrcamentoStatus,
} from './models/deposito-dashboard.models';
import { DepositoDashboardService } from './services/deposito-dashboard.service';

interface DashboardMetric {
  label: string;
  valor: string;
  detalhe: string;
  info: string;
  icon: string;
  accent: 'primary' | 'warning' | 'success' | 'neutral';
  disabled?: boolean;
}

interface DashboardStatusItem {
  label: string;
  valor: number;
  status: DepositoDashboardOrcamentoStatus;
}

interface DashboardQualityItem {
  label: string;
  detalhe: string;
  valor: number;
  icon: string;
  accent: 'primary' | 'warning' | 'success' | 'danger';
  destaque?: boolean;
}

@Component({
  selector: 'app-deposito-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TablerIconsModule,
    MetricCardComponent,
    TemPermissaoDirective,
    TelefonePipe,
    DatePipe,
  ],
  templateUrl: './deposito-dashboard-page.component.html',
  styleUrl: './deposito-dashboard-page.component.scss',
})
export class DepositoDashboardPageComponent implements OnInit {
  dashboard: DepositoDashboardResponse | null = null;
  carregando = false;
  erro = false;
  readonly colunasRecentes = ['cliente', 'telefone', 'itens', 'data', 'status', 'acao'];

  constructor(
    private readonly dashboardService: DepositoDashboardService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
  }

  carregarDashboard(): void {
    this.carregando = true;
    this.erro = false;

    this.dashboardService.buscarDashboard().subscribe({
      next: (response) => {
        this.dashboard = response;
        this.carregando = false;
      },
      error: () => {
        this.dashboard = null;
        this.erro = true;
        this.carregando = false;
      }
    });
  }

  get catalogo(): DepositoDashboardCatalogo | null {
    return this.dashboard?.catalogo ?? null;
  }

  get orcamentos(): DepositoDashboardOrcamentoResumo | null {
    return this.dashboard?.orcamentos ?? null;
  }

  get orcamentosRecentes(): DepositoDashboardOrcamentoRecente[] {
    return (this.dashboard?.orcamentosRecentes ?? []).slice(0, 5);
  }

  get indicadores(): DashboardMetric[] {
    const catalogo = this.catalogo;
    const orcamentos = this.orcamentos;

    if (!catalogo || !orcamentos) {
      return [];
    }

    const orcamentosAguardando = orcamentos.novos + orcamentos.emAtendimento;

    return [
      {
        label: 'Itens do catálogo',
        valor: String(catalogo.itensAtivos),
        detalhe: this.pluralizar(catalogo.itensAtivos, 'item ativo', 'itens ativos'),
        info: `${catalogo.totalItens} ${this.pluralizar(catalogo.totalItens, 'cadastrado no total', 'cadastrados no total')}`,
        icon: 'package',
        accent: 'primary',
      },
      {
        label: 'Categorias',
        valor: String(catalogo.categoriasAtivas),
        detalhe: catalogo.totalCategorias === 0
          ? 'Nenhuma categoria cadastrada'
          : this.pluralizar(catalogo.categoriasAtivas, 'categoria ativa', 'categorias ativas'),
        info: this.pluralizar(catalogo.categoriasInativas, 'categoria inativa', 'categorias inativas'),
        icon: 'tag',
        accent: 'warning',
      },
      {
        label: 'Marcas',
        valor: String(catalogo.marcasAtivas),
        detalhe: catalogo.totalMarcas === 0
          ? 'Nenhuma marca cadastrada'
          : this.pluralizar(catalogo.marcasAtivas, 'marca ativa', 'marcas ativas'),
        info: this.pluralizar(catalogo.marcasInativas, 'marca inativa', 'marcas inativas'),
        icon: 'star',
        accent: 'success',
      },
      {
        label: 'Orçamentos',
        valor: orcamentos.ativoNoSite ? String(orcamentosAguardando) : 'Orçamento desativado',
        detalhe: orcamentos.ativoNoSite
          ? this.pluralizar(orcamentosAguardando, 'orçamento pendente', 'orçamentos pendentes')
          : 'solicitações fora do site',
        info: orcamentos.ativoNoSite ? this.recebidosHojeLabel(orcamentos.novosHoje) : 'Configure para receber solicitações',
        icon: 'file-text',
        accent: 'neutral',
        disabled: !orcamentos.ativoNoSite,
      },
    ];
  }

  get primeiroNome(): string | null {
    const usuario = this.authService.getUsuario();
    const payload = this.authService.getJwtPayload();
    const candidatos = [
      usuario.nome,
      payload?.nome,
      usuario.username,
      payload?.sub,
      this.extrairNomeDeEmail(usuario.email),
      this.extrairNomeDeEmail(usuario.username),
      this.extrairNomeDeEmail(payload?.sub),
      this.extrairNomeDaEmpresa(usuario.empresa?.nome),
    ];

    for (const candidato of candidatos) {
      const nome = this.normalizarNome(candidato);
      if (nome && !this.isEmail(nome) && !this.isNomeGenerico(nome)) {
        return this.primeiraPalavra(nome);
      }
    }

    return null;
  }

  get resumoTitulo(): string {
    return this.primeiroNome ? `Olá, ${this.primeiroNome}!` : 'Visão geral da operação';
  }

  get resumoCatalogo(): string {
    const itensAtivos = this.catalogo?.itensAtivos ?? 0;
    return `Seu catálogo possui ${this.pluralizarComNumero(itensAtivos, 'item ativo', 'itens ativos')}.`;
  }

  get resumoOrcamentos(): string {
    const novos = this.orcamentos?.novos ?? 0;
    const emAtendimento = this.orcamentos?.emAtendimento ?? 0;
    const novosTexto = novos === 0
      ? 'nenhum novo orçamento aguardando atendimento'
      : `${this.pluralizarComNumero(novos, 'novo orçamento', 'novos orçamentos')} aguardando atendimento`;
    const atendimentoTexto = emAtendimento === 0
      ? 'nenhum em atendimento'
      : `${this.pluralizarComNumero(emAtendimento, 'orçamento', 'orçamentos')} em atendimento`;

    return `Há ${novosTexto} e ${atendimentoTexto}.`;
  }

  private extrairNomeDeEmail(valor: string | null | undefined): string | null {
    const texto = this.normalizarNome(valor);
    if (!this.isEmail(texto)) {
      return null;
    }

    return texto.split('@')[0].replace(/[._-]+/g, ' ');
  }

  private extrairNomeDaEmpresa(valor: string | null | undefined): string | null {
    const texto = this.normalizarNome(valor);
    const partes = texto.split(/\s[-–—]\s/).map(parte => parte.trim()).filter(Boolean);
    return partes.length > 1 ? partes[partes.length - 1] : null;
  }

  private normalizarChaveNome(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
  }

  private isNomeGenerico(valor: string): boolean {
    const chave = this.normalizarChaveNome(valor);
    return ['usuario', 'user', 'admin', 'administrador'].includes(chave);
  }

  get qualidadeItens(): DashboardQualityItem[] {
    const catalogo = this.catalogo;
    if (!catalogo) {
      return [];
    }

    return [
      {
        label: 'Sem imagem',
        detalhe: 'Itens sem imagem principal',
        valor: catalogo.itensSemImagem,
        icon: 'photo',
        accent: 'primary',
        destaque: catalogo.itensSemImagem > 0,
      },
      {
        label: 'Sem categoria',
        detalhe: 'Itens sem categoria ou categoria inativa',
        valor: catalogo.itensSemCategoria,
        icon: 'category',
        accent: 'warning',
        destaque: catalogo.itensSemCategoria > 0,
      },
      {
        label: 'Inativos',
        detalhe: 'Itens cadastrados como inativos',
        valor: catalogo.itensInativos,
        icon: 'trash',
        accent: 'danger',
      },
      {
        label: 'Em destaque',
        detalhe: 'Itens em destaque no catálogo',
        valor: catalogo.itensDestaque,
        icon: 'star',
        accent: 'success',
      },
    ];
  }

  get catalogoVazio(): boolean {
    return (this.catalogo?.totalItens ?? 0) === 0;
  }

  get catalogoBemOrganizado(): boolean {
    const catalogo = this.catalogo;
    return !!catalogo
      && catalogo.totalItens > 0
      && catalogo.itensSemImagem === 0
      && catalogo.itensSemCategoria === 0
      && catalogo.itensInativos === 0;
  }

  get statusOrcamentos(): DashboardStatusItem[] {
    const orcamentos = this.orcamentos;
    if (!orcamentos) {
      return [];
    }

    return [
      { label: 'Novos', valor: orcamentos.novos, status: 'NOVO' },
      { label: 'Em atendimento', valor: orcamentos.emAtendimento, status: 'EM_ATENDIMENTO' },
      { label: 'Aguardando cliente', valor: orcamentos.aguardandoCliente, status: 'AGUARDANDO_CLIENTE' },
      { label: 'Convertidos', valor: orcamentos.convertidos, status: 'CONVERTIDO' },
      { label: 'Não convertidos', valor: orcamentos.perdidos, status: 'PERDIDO' },
    ];
  }

  get podeMostrarAtalhoOrcamentos(): boolean {
    return !!this.orcamentos?.ativoNoSite || (this.orcamentos?.total ?? 0) > 0;
  }

  get nenhumOrcamento(): boolean {
    return (this.orcamentos?.total ?? 0) === 0;
  }

  get orcamentosAtencao(): number {
    return (this.orcamentos?.novos ?? 0) + (this.orcamentos?.emAtendimento ?? 0);
  }

  get siteOrcamentoMensagem(): string {
    return this.orcamentos?.ativoNoSite
      ? 'Solicitações de orçamento estão ativas no seu site'
      : 'Solicitações de orçamento estão desativadas no seu site';
  }

  get siteOrcamentoDescricao(): string {
    return this.orcamentos?.ativoNoSite
      ? 'Clientes podem enviar orçamentos normalmente através da sua loja online.'
      : 'Ative a função para receber solicitações pela sua loja online.';
  }

  abrirMeuSite(): void {
    const slug = this.authService.getUsuario()?.empresa?.slug?.trim();
    if (slug) {
      window.open(`${window.location.origin}/loja/${slug}`, '_blank', 'noopener,noreferrer');
      return;
    }

    this.router.navigate(['/page/site/configuracoes']);
  }

  configurarSite(): void {
    this.router.navigate(['/page/site/configuracoes']);
  }

  labelStatus(status: DepositoDashboardOrcamentoStatus | null | undefined): string {
    const labels: Record<string, string> = {
      NOVO: 'Novo',
      EM_ATENDIMENTO: 'Em atendimento',
      AGUARDANDO_CLIENTE: 'Aguardando cliente',
      CONVERTIDO: 'Convertido',
      PERDIDO: 'Não convertido',
    };

    const chave = String(status || '').toUpperCase();
    return labels[chave] || this.formatarTexto(chave);
  }

  classeStatus(status: DepositoDashboardOrcamentoStatus | null | undefined): string {
    return `status-${String(status || 'DESCONHECIDO').toLowerCase().replace(/_/g, '-')}`;
  }

  statusDotClass(status: DepositoDashboardOrcamentoStatus | null | undefined): string {
    return `dot-${String(status || 'DESCONHECIDO').toLowerCase().replace(/_/g, '-')}`;
  }

  itensLabel(quantidade: number): string {
    return this.pluralizarComNumero(quantidade, 'item', 'itens');
  }

  solicitacoesRegistradasLabel(quantidade: number | null | undefined): string {
    return this.pluralizarComNumero(quantidade ?? 0, 'solicitação registrada', 'solicitações registradas');
  }

  verOrcamento(orcamento: DepositoDashboardOrcamentoRecente): void {
    if (!orcamento?.id) {
      return;
    }

    this.router.navigate(['/page/deposito/orcamentos']);
  }

  private formatarTexto(valor: string): string {
    return valor
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }

  private normalizarNome(valor: string | null | undefined): string {
    return (valor || '').trim().replace(/\s+/g, ' ');
  }

  private primeiraPalavra(valor: string): string {
    const primeira = valor.split(/\s+/)[0] || '';
    return primeira.charAt(0).toUpperCase() + primeira.slice(1);
  }

  private isEmail(valor: string | null | undefined): boolean {
    return !!valor && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  recebidosHojeLabel(quantidade: number): string {
    if (quantidade === 0) {
      return 'Nenhum recebido hoje';
    }

    return this.pluralizarComNumero(quantidade, 'recebido hoje', 'recebidos hoje');
  }

  pluralizarComNumero(quantidade: number, singular: string, plural: string): string {
    return `${quantidade} ${this.pluralizar(quantidade, singular, plural)}`;
  }

  pluralizar(quantidade: number, singular: string, plural: string): string {
    return quantidade === 1 ? singular : plural;
  }
}
