import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TablerIconsModule } from 'angular-tabler-icons';
import { ToastrService } from 'ngx-toastr';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TelefonePipe } from 'src/app/pipe/telefone.pipe';
import { AuthService } from 'src/app/services/auth.service';
import { DepositoOrcamento, DepositoOrcamentoItem, DepositoOrcamentoStatus } from '../../models/deposito.models';
import { DepositoService } from '../../services/deposito.service';

type StatusOption = {
  value: DepositoOrcamentoStatus;
  label: string;
};

@Component({
  selector: 'app-detalhe-orcamento-deposito',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TablerIconsModule,
    CardHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TelefonePipe,
    DatePipe,
  ],
  templateUrl: './detalhe-orcamento-deposito.component.html',
  styleUrl: './detalhe-orcamento-deposito.component.scss',
})
export class DetalheOrcamentoDepositoComponent implements OnInit {
  orcamento: DepositoOrcamento | null = null;
  observacaoInterna = '';
  carregando = false;
  salvandoObservacao = false;
  atualizandoStatus = false;
  readonly colunasItens = ['produto', 'quantidade', 'precoUnitario', 'subtotal', 'observacao'];
  readonly statusOptions: StatusOption[] = [
    { value: 'NOVO', label: 'Novo' },
    { value: 'EM_ATENDIMENTO', label: 'Em atendimento' },
    { value: 'AGUARDANDO_CLIENTE', label: 'Aguardando cliente' },
    { value: 'CONVERTIDO', label: 'Convertido' },
    { value: 'PERDIDO', label: 'Não convertido' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly depositoService: DepositoService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.voltar();
      return;
    }

    this.carregarOrcamento(id);
  }

  get podeEditar(): boolean {
    return this.authService.temPermissao('DEPOSITO_ORCAMENTOS_EDITAR');
  }

  get telefone(): string | null {
    return this.orcamento?.telefoneCliente || this.orcamento?.telefone || null;
  }

  get email(): string | null {
    return this.orcamento?.emailCliente || this.orcamento?.email || null;
  }

  get nomeCliente(): string {
    return this.orcamento?.nomeCliente || this.orcamento?.nome || 'Não informado';
  }

  carregarOrcamento(id: number): void {
    this.carregando = true;
    this.depositoService.detalharOrcamento(id).subscribe({
      next: (response) => {
        this.orcamento = response;
        this.observacaoInterna = response.observacaoInterna || '';
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Não foi possível carregar o orçamento.');
        this.voltar();
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/page/deposito/orcamentos']);
  }

  alterarStatus(novoStatus: DepositoOrcamentoStatus | string): void {
    const status = novoStatus as DepositoOrcamentoStatus;
    if (!this.orcamento?.id || !this.podeEditar || status === this.orcamento.status || this.atualizandoStatus) {
      return;
    }

    if (status === 'CONVERTIDO' || status === 'PERDIDO') {
      this.confirmarAlteracaoStatus(status);
      return;
    }

    this.executarAlteracaoStatus(status);
  }

  marcarStatus(status: DepositoOrcamentoStatus): void {
    this.alterarStatus(status);
  }

  deveMostrarAcaoStatus(status: DepositoOrcamentoStatus): boolean {
    return this.podeEditar && this.orcamento?.status !== status;
  }

  salvarObservacaoInterna(): void {
    if (!this.orcamento?.id || !this.podeEditar || this.salvandoObservacao) {
      return;
    }

    this.salvandoObservacao = true;
    this.depositoService
      .atualizarObservacaoInternaOrcamento(this.orcamento.id, this.observacaoInterna.trim() || null)
      .subscribe({
        next: (response) => {
          this.orcamento = response;
          this.observacaoInterna = response.observacaoInterna || '';
          this.salvandoObservacao = false;
          this.toastr.success('Anotação salva com sucesso.');
        },
        error: () => {
          this.salvandoObservacao = false;
          this.toastr.error('Não foi possível salvar a anotação.');
        },
      });
  }

  copiarTexto(valor: string | null | undefined, label: string): void {
    if (!valor) {
      return;
    }

    navigator.clipboard?.writeText(valor)
      .then(() => this.toastr.success(`${label} copiado.`))
      .catch(() => this.toastr.error(`Não foi possível copiar ${label.toLowerCase()}.`));
  }

  abrirWhatsApp(): void {
    const telefone = this.telefoneNormalizado();
    if (!telefone) {
      this.toastr.info('Este orçamento não possui telefone para WhatsApp.');
      return;
    }

    window.open(`https://wa.me/${telefone}`, '_blank', 'noopener,noreferrer');
  }

  itensLabel(): string {
    const quantidade = this.orcamento?.quantidadeItens ?? this.orcamento?.itens?.length ?? 0;
    return quantidade === 1 ? '1 item' : `${quantidade} itens`;
  }

  quantidadeLabel(item: DepositoOrcamentoItem): string {
    const quantidade = item.quantidade ?? 0;
    return `${quantidade} ${this.formatarUnidadeVenda(item.unidadeVenda)}`;
  }

  valorUnitario(item: DepositoOrcamentoItem): number | null {
    return item.precoPromocional ?? item.precoUnitario ?? null;
  }

  statusLabel(status: DepositoOrcamentoStatus | null | undefined): string {
    const option = this.statusOptions.find((item) => item.value === status);
    return option?.label || 'Sem status';
  }

  statusClass(status: DepositoOrcamentoStatus | null | undefined): string {
    return `status-pill--${String(status || 'DESCONHECIDO').toLowerCase().replace(/_/g, '-')}`;
  }

  origemLabel(origem: string | null | undefined): string {
    const labels: Record<string, string> = {
      SITE: 'Site público',
      WHATSAPP: 'WhatsApp',
      ADMIN: 'Admin',
      OUTRO: 'Outro',
    };

    return origem ? labels[origem] || origem : 'Não informado';
  }

  dataCriacao(): string | null {
    return this.orcamento?.createdAt || this.orcamento?.criadoEm || null;
  }

  dataAtualizacao(): string | null {
    return this.orcamento?.atualizadoEm || this.orcamento?.updatedAt || null;
  }

  totalEstimado(): number | null {
    return this.orcamento?.totalEstimado ?? null;
  }

  tempoRelativo(iso: string | null | undefined, prefixo: string): string {
    if (!iso) {
      return 'Sem atualização';
    }

    const data = new Date(iso);
    const diffMs = Date.now() - data.getTime();
    const minutos = Math.max(0, Math.floor(diffMs / 60000));
    if (minutos < 1) {
      return `${prefixo} agora`;
    }
    if (minutos < 60) {
      return `${prefixo} há ${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    if (horas < 24) {
      return `${prefixo} há ${horas}h`;
    }

    const dias = Math.floor(horas / 24);
    return `${prefixo} há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
  }

  private confirmarAlteracaoStatus(status: DepositoOrcamentoStatus): void {
    const convertido = status === 'CONVERTIDO';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: convertido ? 'Marcar como convertido' : 'Marcar como não convertido',
        message: convertido
          ? 'Deseja marcar este orçamento como convertido? Isso não cria pedido automaticamente.'
          : 'Deseja marcar este orçamento como não convertido?',
        confirmText: convertido ? 'Marcar convertido' : 'Marcar não convertido',
        confirmColor: convertido ? 'primary' : 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmou) => {
      if (confirmou) {
        this.executarAlteracaoStatus(status);
      }
    });
  }

  private executarAlteracaoStatus(status: DepositoOrcamentoStatus): void {
    if (!this.orcamento?.id) {
      return;
    }

    this.atualizandoStatus = true;
    this.depositoService.alterarStatusOrcamento(this.orcamento.id, status).subscribe({
      next: (response) => {
        this.orcamento = response;
        this.observacaoInterna = response.observacaoInterna || '';
        this.atualizandoStatus = false;
        this.toastr.success(status === 'CONVERTIDO' ? 'Orçamento marcado como convertido.' : 'Status atualizado com sucesso.');
      },
      error: () => {
        this.atualizandoStatus = false;
        this.toastr.error('Não foi possível atualizar o status.');
      },
    });
  }

  private telefoneNormalizado(): string | null {
    const telefone = this.telefone?.replace(/\D/g, '') || '';
    if (!telefone) {
      return null;
    }

    return telefone.startsWith('55') ? telefone : `55${telefone}`;
  }

  private formatarUnidadeVenda(valor: string | null | undefined): string {
    const labels: Record<string, string> = {
      UNIDADE: 'un.',
      METRO: 'm',
      METRO_QUADRADO: 'm2',
      CAIXA: 'caixa',
      PACOTE: 'pacote',
      SACO: 'saco',
      LITRO: 'L',
      KG: 'kg',
    };

    return valor ? labels[valor] || valor.toLowerCase() : 'un.';
  }
}
