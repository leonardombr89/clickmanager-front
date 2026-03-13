import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { MaterialModule } from 'src/app/material.module';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import {
  ChamadoSuporteDetalhe,
  ChamadoSuporteListaItem,
  ChamadoSuportePrioridade,
  ChamadoSuporteStatus
} from './models/chamado-suporte.model';
import { ChamadoSuporteDialogComponent } from './components/chamado-suporte-dialog.component';
import { SuporteService } from './services/suporte.service';

@Component({
  selector: 'app-suporte',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    DatePipe,
    MaterialModule,
    PageCardComponent,
    SectionCardComponent,
    StatusBadgeComponent
  ],
  templateUrl: './suporte.component.html',
  styleUrl: './suporte.component.scss'
})
export class SuporteComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  carregandoLista = false;
  carregandoDetalhe = false;
  salvandoResposta = false;
  chamados: ChamadoSuporteListaItem[] = [];
  chamadosFiltrados: ChamadoSuporteListaItem[] = [];
  chamadoSelecionado: ChamadoSuporteDetalhe | null = null;
  statusFiltro = 'TODOS';
  busca = '';

  readonly respostaForm = this.fb.group({
    mensagem: ['', [Validators.required, Validators.maxLength(3000)]]
  });

  constructor(
    private readonly service: SuporteService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      this.carregarLista(true, Number.isFinite(id) && id > 0 ? id : null);
    });
  }

  abrirNovoChamado(): void {
    const dialogRef = this.dialog.open(ChamadoSuporteDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((chamado?: ChamadoSuporteDetalhe | null) => {
      if (!chamado?.id) return;
      this.chamadoSelecionado = chamado;
      this.router.navigate(['/page/suporte', chamado.id], { replaceUrl: true });
      this.carregarLista(false);
    });
  }

  aplicarFiltroBusca(event: Event): void {
    this.busca = String((event.target as HTMLInputElement)?.value || '');
    this.aplicarFiltros();
  }

  aplicarFiltroStatus(): void {
    this.aplicarFiltros();
  }

  selecionarChamado(item: ChamadoSuporteListaItem): void {
    if (!item?.id) return;
    this.carregarDetalhe(item.id, true);
  }

  responderChamado(): void {
    if (!this.chamadoSelecionado?.id || this.naoPodeResponder || this.salvandoResposta) return;
    if (this.respostaForm.invalid) {
      this.respostaForm.markAllAsTouched();
      return;
    }

    const mensagem = String(this.respostaForm.value.mensagem || '').trim();
    if (!mensagem) return;

    this.salvandoResposta = true;
    this.service.responder$(this.chamadoSelecionado.id, { mensagem }).subscribe({
      next: (detalhe) => {
        this.salvandoResposta = false;
        this.chamadoSelecionado = detalhe;
        this.respostaForm.reset();
        this.atualizarItemNaLista(detalhe);
        this.toastr.success('Mensagem enviada com sucesso.');
      },
      error: (err) => {
        this.salvandoResposta = false;
        this.toastr.error(err?.userMessage || 'Não foi possível enviar a mensagem.');
      }
    });
  }

  fecharChamado(): void {
    if (!this.chamadoSelecionado?.id || this.chamadoSelecionado.status === 'FECHADO') return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Fechar chamado',
        message: 'Deseja encerrar este chamado? Depois disso não será possível enviar novas mensagens.',
        confirmText: 'Fechar chamado',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe((ok) => {
      if (!ok || !this.chamadoSelecionado?.id) return;
      this.service.fechar$(this.chamadoSelecionado.id).subscribe({
        next: (detalhe) => {
          this.chamadoSelecionado = detalhe;
          this.atualizarItemNaLista(detalhe);
          this.toastr.success('Chamado fechado com sucesso.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível fechar o chamado.');
        }
      });
    });
  }

  prioridadeLabel(prioridade: ChamadoSuportePrioridade): string {
    return {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      URGENTE: 'Urgente'
    }[prioridade] || prioridade;
  }

  categoriaLabel(categoria: string): string {
    return {
      DUVIDA: 'Dúvida',
      ERRO: 'Erro',
      FINANCEIRO: 'Financeiro',
      SUGESTAO: 'Sugestão',
      ACESSO: 'Acesso',
      OUTRO: 'Outro'
    }[String(categoria || '').toUpperCase()] || categoria;
  }

  prioridadeClass(prioridade: ChamadoSuportePrioridade): string {
    return `priority-${String(prioridade || 'MEDIA').toLowerCase()}`;
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) return 'Agora';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Agora';
    if (min < 60) return `${min} min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} dia(s) atrás`;
    return new DatePipe('pt-BR').transform(date, 'dd/MM/yyyy HH:mm') || '';
  }

  autorMensagemClass(tipo: string): string {
    return String(tipo || 'CLIENTE').toUpperCase() === 'CLIENTE' ? 'msg-cliente' : 'msg-suporte';
  }

  get naoPodeResponder(): boolean {
    return !this.chamadoSelecionado || this.chamadoSelecionado.status === 'FECHADO';
  }

  get totalAbertos(): number {
    return this.chamados.filter((item) => item.status !== 'FECHADO').length;
  }

  private carregarLista(resolverSelecao = false, chamadoId: number | null = null): void {
    this.carregandoLista = true;
    this.service.listar$(0, 50).subscribe({
      next: (res) => {
        this.carregandoLista = false;
        this.chamados = [...(res.itens || [])].sort(
          (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
        );
        this.aplicarFiltros();
        if (resolverSelecao) {
          this.resolverSelecaoInicial(chamadoId);
        }
      },
      error: (err) => {
        this.carregandoLista = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar os chamados.');
      }
    });
  }

  private aplicarFiltros(): void {
    const termo = this.busca.trim().toLowerCase();
    const status = this.statusFiltro;
    this.chamadosFiltrados = this.chamados.filter((item) => {
      const atendeStatus = status === 'TODOS' ? true : item.status === status;
      const atendeBusca = !termo
        ? true
        : `${item.assunto} ${item.categoria} ${item.prioridade}`.toLowerCase().includes(termo);
      return atendeStatus && atendeBusca;
    });
  }

  private resolverSelecaoInicial(chamadoId: number | null): void {
    if (chamadoId) {
      const encontrado = this.chamados.find((item) => item.id === chamadoId);
      if (encontrado) {
        this.carregarDetalhe(encontrado.id, false);
        return;
      }

      this.carregarDetalhe(chamadoId, false);
      return;
    }

    const primeiro = this.chamados[0];
    if (primeiro) {
      this.carregarDetalhe(primeiro.id, true);
    } else {
      this.chamadoSelecionado = null;
    }
  }

  private carregarDetalhe(id: number, navegar: boolean): void {
    this.carregandoDetalhe = true;
    this.service.buscarPorId$(id).subscribe({
      next: (detalhe) => {
        this.chamadoSelecionado = detalhe;
        this.carregandoDetalhe = false;
        this.respostaForm.reset();
        this.atualizarItemNaLista(detalhe);

        if (navegar) {
          this.router.navigate(['/page/suporte', detalhe.id], { replaceUrl: true });
        }
      },
      error: (err) => {
        this.carregandoDetalhe = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar o chamado.');
      }
    });
  }

  private atualizarItemNaLista(detalhe: ChamadoSuporteDetalhe): void {
    const atualizado: ChamadoSuporteListaItem = {
      id: detalhe.id,
      assunto: detalhe.assunto,
      categoria: detalhe.categoria,
      prioridade: detalhe.prioridade,
      status: detalhe.status,
      criadoEm: detalhe.criadoEm,
      atualizadoEm: detalhe.atualizadoEm,
      fechadoEm: detalhe.fechadoEm
    };

    const existe = this.chamados.some((item) => item.id === detalhe.id);
    this.chamados = existe
      ? this.chamados.map((item) => (item.id === detalhe.id ? atualizado : item))
      : [atualizado, ...this.chamados];
    this.chamados = [...this.chamados].sort(
      (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
    );
    this.aplicarFiltros();
  }
}
