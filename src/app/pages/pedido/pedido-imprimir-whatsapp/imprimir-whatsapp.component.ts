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
import {
    buildPedidoWhatsAppPreviewMessage,
    buildPedidoWhatsAppSendMessage,
    displayPedidoNumero,
    toE164BR
} from '../pedido-whatsapp.utils';

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
                        this.mensagem = buildPedidoWhatsAppPreviewMessage(this.pedido, this.empresaNome);
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        this.empresaNome = '';
                        this.mensagem = buildPedidoWhatsAppPreviewMessage(this.pedido, this.empresaNome);
                        this.cdr.detectChanges();
                    }
                });
            } else {
                this.mensagem = buildPedidoWhatsAppPreviewMessage(this.pedido, this.empresaNome);
                this.cdr.detectChanges();
            }
        });
    }

    displayNumero(p: PedidoResponse): string {
        return displayPedidoNumero(p);
    }

    abrirWhatsApp(): void {
        const mensagemSemIcones = buildPedidoWhatsAppSendMessage(this.pedido, this.empresaNome);

        const telRaw = this.pedido?.cliente?.telefone ?? '';
        const phone = toE164BR(telRaw);

        if (!phone) {
            this.toastr.error('Telefone do cliente não encontrado ou inválido.');
            return;
        }
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(mensagemSemIcones)}`;
        window.open(url, '_blank');
    }


    copiar(): void {
        if (!this.mensagem) return;
        navigator.clipboard.writeText(this.mensagem)
            .then(() => this.toastr.success('Mensagem copiada!'))
            .catch(() => this.toastr.error('Não foi possível copiar.'));
    }

    fmtDate(iso?: string): string {
        if (!iso) return '-';
        // aceita LocalDate (YYYY-MM-DD) ou ISO completo
        const d = new Date(iso);
        if (isNaN(d.getTime())) return iso; // fallback
        return d.toLocaleDateString('pt-BR');
    }
}
