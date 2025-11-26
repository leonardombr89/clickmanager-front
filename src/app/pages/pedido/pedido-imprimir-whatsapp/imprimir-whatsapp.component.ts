import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PedidoService } from '../pedido.service';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { ToastrService } from 'ngx-toastr';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
    selector: 'app-imprimir-whatsapp',
    standalone: true,
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatCardModule],
    template: `
  <div class="wa-container">
    <mat-card class="cardWithShadow">
      <mat-card-content>
        <div class="row m-b-16 justify-content-between align-items-center">
          <div class="col">
            <h2 class="f-s-20 f-w-600 m-0">Mensagem para WhatsApp</h2>
            <small class="text-muted">Pré-visualização e ações</small>
          </div>
          <div class="col-auto">
            <a mat-stroked-button routerLink="/pedidos">Voltar</a>
          </div>
        </div>

        <div class="m-b-16" *ngIf="pedido as p">
          <div class="m-b-8">
            <strong>Número:</strong> {{ displayNumero(p) }} |
            <strong>Status:</strong> {{ p.status }}
          </div>
          <div *ngIf="p.nomeOrcamento || p.vencimentoOrcamento">
            <span *ngIf="p.nomeOrcamento"><strong>Nome do orçamento:</strong> {{ p.nomeOrcamento }}</span>
            <span *ngIf="p.vencimentoOrcamento" class="m-l-12">
              <strong>Vencimento:</strong> {{ fmtDate(p.vencimentoOrcamento) }}
            </span>
          </div>
        </div>

        <textarea class="wa-preview" rows="16" [value]="mensagem" readonly></textarea>

        <div class="text-right m-t-16 d-flex gap-8 flex-wrap justify-content-end">
          <button mat-stroked-button (click)="copiar()">
            <mat-icon>content_copy</mat-icon>
            Copiar
          </button>
          <button mat-flat-button color="primary" (click)="abrirWhatsApp()">
            <mat-icon>chat</mat-icon>
                Abrir no WhatsApp
                <span *ngIf="pedido?.cliente?.telefone" class="m-l-8">
                    ({{ pedido?.cliente?.telefone }})
                </span>
         </button>

        </div>
      </mat-card-content>
    </mat-card>
  </div>
  `,
    styles: [`
    .wa-container { padding: 16px; }
    .wa-preview {
      width: 100%;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      white-space: pre-wrap;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      padding: 12px;
      background: #fafafa;
    }
    .gap-8 { gap: 8px; }
    .m-l-12 { margin-left: 12px; }
  `]
})
export class ImprimirWhatsAppComponent implements OnInit {

    pedido!: PedidoResponse;
    mensagem = '';
    empresaNome = '';

    constructor(
        private route: ActivatedRoute,
        private pedidoService: PedidoService,
        private cdr: ChangeDetectorRef,
        private toastr: ToastrService,
        private usuarioService: UsuarioService
    ) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.pedidoService.buscarPorId(id).subscribe(p => {
            this.pedido = p;

            const respId = p?.responsavel?.id;
            if (respId) {
                this.usuarioService.buscarPorId(respId).subscribe({
                    next: (u: any) => {
                        this.empresaNome = u?.empresa?.nome || '';
                        this.mensagem = this.montarMensagemComIcones(this.pedido);
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.empresaNome = '';
                        this.mensagem = this.montarMensagemComIcones(this.pedido);
                        this.cdr.detectChanges();
                    }
                });
            } else {
                this.mensagem = this.montarMensagemComIcones(this.pedido);
                this.cdr.detectChanges();
            }
        });
    }

    displayNumero(p: PedidoResponse): string {
        return p.numeroOrcamento?.trim() || p.numero?.trim() || '—';
    }

    abrirWhatsApp(): void {
        // >>> AQUI: usa a versão SEM ícones <<<
        const mensagemSemIcones = this.montarMensagemSemIcones(this.pedido);

        const telRaw = this.pedido?.cliente?.telefone ?? '';
        const phone = this.toE164BR(telRaw);

        if (!phone) {
            this.toastr.error('Telefone do cliente não encontrado ou inválido.');
            return;
        }
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagemSemIcones)}`;
        window.open(url, '_blank');
    }


    /** Normaliza telefone BR para E.164 (sem sinal de +, como o wa.me exige) */
    private toE164BR(raw: string): string {
        if (!raw) return '';
        let digits = raw.replace(/\D+/g, ''); // só números

        // Se já vier com 55 no início, mantém
        if (digits.startsWith('55')) {
            return digits;
        }

        // Se vier com 0 à esquerda (DDD discado), remove
        if (digits.startsWith('0')) {
            digits = digits.replace(/^0+/, '');
        }

        // Telefone BR típico: 10 (fixo) ou 11 (celular com 9)
        if (digits.length === 10 || digits.length === 11) {
            return '55' + digits;
        }

        // Se já estiver em 13 dígitos mas começar com 550 (casos raros), corrige
        if (digits.length === 13 && digits.startsWith('550')) {
            return '55' + digits.slice(2);
        }

        // fallback: prefixa 55 se não tiver
        if (!digits.startsWith('55')) {
            digits = '55' + digits;
        }
        return digits;
    }


    copiar(): void {
        if (!this.mensagem) return;
        navigator.clipboard.writeText(this.mensagem)
            .then(() => this.toastr.success('Mensagem copiada!'))
            .catch(() => this.toastr.error('Não foi possível copiar.'));
    }

    /** Helpers de formatação */
    fmtMoney(v?: number): string {
        const n = typeof v === 'number' ? v : 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
    }

    fmtDate(iso?: string): string {
        if (!iso) return '-';
        // aceita LocalDate (YYYY-MM-DD) ou ISO completo
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso; // fallback
        return d.toLocaleDateString('pt-BR');
    }

    // =========================
    // MENSAGEM COM ÍCONES (preview)
    // =========================
    private montarMensagemComIcones(p: PedidoResponse): string {
        const numero = this.displayNumero(p);
        const linhaTitulo = this.empresaNome ? `*ORCAMENTO ${this.empresaNome}*` : `*ORCAMENTO*`;
        const linhaPedido = `\n\n📦 *PEDIDO: ${numero}*`;
        const cliente = p.cliente?.nome ? `\n\n👤 *Cliente:* ${p.cliente.nome}` : '';
        const atendente = p.responsavel?.nome ? `\n🧑‍💼 *Atendido por:* ${p.responsavel.nome}` : '';
        const data = p.dataCriacao ? `\n🗓️ *Data:* ${new Date(p.dataCriacao).toLocaleString('pt-BR')}` : '';

        const itensHeader = `\n\n📦 *Itens*`;
        const itens = '\n' + (p.itens || []).map(it => {
            const qtd = it.quantidade ?? 0;
            const unit = this.fmtMoney(it.valor ?? 0);
            const sub = this.fmtMoney(it.subTotal ?? 0);
            return `- ${it.descricao} — *${qtd}× ${unit} = ${sub}*`;
        }).join('\n');

        const subtotal = `\n\n➕ *Subtotal:* ${this.fmtMoney(p.subTotal)}`;
        const freteDesc = `\n🚚 *Frete:* ${this.fmtMoney(p.frete)}  |  🔼 *Acrésc.:* ${this.fmtMoney(p.acrescimo)}  |  🔽 *Desc.:* ${this.fmtMoney(p.desconto)}`;
        const total = `\n\n💰 *TOTAL:* *${this.fmtMoney(p.total)}*`;
        const rodape = `\n\n🙌 Obrigado pela preferência! Qualquer dúvida, estamos à disposição.`;

        return [
            linhaTitulo,
            linhaPedido,
            cliente,
            atendente,
            data,
            itensHeader,
            itens || '* (sem itens)*',
            subtotal,
            freteDesc,
            total,
            rodape
        ].join('');
    }

    // =========================
    // MENSAGEM SEM ÍCONES (para o botão/WhatsApp)
    // =========================
    private montarMensagemSemIcones(p: PedidoResponse): string {
        const numero = this.displayNumero(p);
        const titulo = this.empresaNome ? `*ORCAMENTO ${this.empresaNome}*` : `*ORCAMENTO*`;

        const linhasCabecalho = [
            '',
            `\n\n*PEDIDO: ${numero}*`,
            p.cliente?.nome ? `\n*Cliente:* ${p.cliente.nome}` : '',
            p.responsavel?.nome ? `\n*Atendido por:* ${p.responsavel.nome}` : '',
            p.dataCriacao ? `\n*Data:* ${new Date(p.dataCriacao).toLocaleString('pt-BR')}` : ''
        ].join('');

        const itensHeader = `\n\n*Itens*`;
        const itens = '\n' + (p.itens || []).map(it => {
            const qtd = it.quantidade ?? 0;
            const unit = this.fmtMoney(it.valor ?? 0);
            const sub = this.fmtMoney(it.subTotal ?? 0);
            return `- ${it.descricao} — *${qtd}× ${unit} = ${sub}*`;
        }).join('\n');

        const totais = [
            `\n\n*Subtotal:* ${this.fmtMoney(p.subTotal)}`,
            `\n*Frete:* ${this.fmtMoney(p.frete)}  |  *Acrésc.:* ${this.fmtMoney(p.acrescimo)}  |  *Desc.:* ${this.fmtMoney(p.desconto)}`,
            `\n\n*TOTAL:* *${this.fmtMoney(p.total)}*`
        ].join('');

        const rodape = `\n\nObrigado pela preferência! Qualquer dúvida, estamos à disposição.`;

        return [
            titulo,
            linhasCabecalho,
            itensHeader,
            itens || '* (sem itens)*',
            totais,
            rodape
        ].join('');
    }
}


