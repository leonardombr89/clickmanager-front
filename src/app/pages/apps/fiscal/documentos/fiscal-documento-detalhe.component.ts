import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { FiscalDocumentoDetalhe } from '../shared/fiscal.models';
import { FiscalArquivoService, FiscalDocumentoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-documento-detalhe',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Detalhe da nota" subtitulo="Resumo fiscal sem expor payload bruto do provedor." botaoTexto="Voltar" botaoIcone="arrow_back" [botaoRota]="['/apps/fiscal/documentos']">
      <div class="loading" *ngIf="carregando"><mat-spinner diameter="32"></mat-spinner><span>Carregando nota...</span></div>
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <ng-container *ngIf="documento">
        <div class="doc-hero">
          <div><span>{{ documento.tipo }}</span><strong>{{ documento.numero || 'Sem número' }}/{{ documento.serie || '-' }}</strong></div>
          <div><span>Status</span><strong>{{ documento.status }}</strong></div>
          <div><span>Ambiente</span><strong>{{ documento.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação' }}</strong></div>
          <div><span>Valor</span><strong>{{ documento.valor | currency:'BRL':'symbol':'1.2-2' }}</strong></div>
        </div>
        <div class="fiscal-alert fiscal-alert--error" *ngIf="documento.status === 'REJEITADA' || documento.status === 'ERRO'">
          <mat-icon>error</mat-icon>{{ documento.codigoRejeicao || 'Rejeição' }} - {{ documento.mensagemRejeicao || documento.orientacao || 'Consulte a orientação retornada pelo backend.' }}
        </div>
        <mat-tab-group>
          <mat-tab label="Resumo"><app-section-card><dl class="pairs"><div><dt>Chave</dt><dd class="mono">{{ documento.chave || '-' }}</dd></div><div><dt>Protocolo</dt><dd>{{ documento.protocolo || '-' }}</dd></div><div><dt>Pedido</dt><dd>{{ documento.pedidoNumero || documento.pedidoId || '-' }}</dd></div><div><dt>Cliente</dt><dd>{{ documento.clienteNome || '-' }}</dd></div></dl></app-section-card></mat-tab>
          <mat-tab label="Itens"><app-section-card><table mat-table [dataSource]="documento.itens || []"><ng-container matColumnDef="produto"><th mat-header-cell *matHeaderCellDef>Produto</th><td mat-cell *matCellDef="let item">{{ item.produto }}</td></ng-container><ng-container matColumnDef="qtd"><th mat-header-cell *matHeaderCellDef>Qtd.</th><td mat-cell *matCellDef="let item">{{ item.quantidade }} {{ item.unidade }}</td></ng-container><ng-container matColumnDef="fiscal"><th mat-header-cell *matHeaderCellDef>Fiscal</th><td mat-cell *matCellDef="let item">NCM {{ item.ncm || '-' }} • CFOP {{ item.cfop || '-' }} • {{ item.cstCsosn || '-' }}</td></ng-container><ng-container matColumnDef="valor"><th mat-header-cell *matHeaderCellDef>Valor</th><td mat-cell *matCellDef="let item">{{ item.valor | currency:'BRL':'symbol':'1.2-2' }}</td></ng-container><tr mat-header-row *matHeaderRowDef="itemColumns"></tr><tr mat-row *matRowDef="let row; columns: itemColumns"></tr></table></app-section-card></mat-tab>
          <mat-tab label="Eventos"><app-section-card><div class="timeline" *ngIf="documento.eventos?.length; else semEventos"><div *ngFor="let evento of documento.eventos"><strong>{{ evento.tipo }}</strong><span>{{ evento.data | date:'short' }} • {{ evento.protocolo || '-' }}</span><p>{{ evento.descricao }}</p></div></div><ng-template #semEventos><p class="empty">Nenhum evento registrado.</p></ng-template></app-section-card></mat-tab>
          <mat-tab label="Arquivos"><app-section-card><div class="actions"><button mat-stroked-button color="primary" *ngIf="pode('FISCAL_XML_BAIXAR')" [disabled]="!documento.xmlDisponivel" (click)="baixarXml()"><mat-icon>code</mat-icon>Baixar XML</button><button mat-stroked-button color="primary" *ngIf="pode('FISCAL_XML_BAIXAR')" [disabled]="!documento.danfeDisponivel" (click)="baixarDanfe()"><mat-icon>picture_as_pdf</mat-icon>Baixar DANFE</button><button mat-stroked-button color="warn" *ngIf="pode('FISCAL_CANCELAR') && documento.status === 'AUTORIZADA'" (click)="cancelar()"><mat-icon>block</mat-icon>Cancelar</button><button mat-stroked-button *ngIf="pode('FISCAL_CARTA_CORRECAO') && documento.status === 'AUTORIZADA'" (click)="carta()"><mat-icon>edit_note</mat-icon>Carta de correção</button></div></app-section-card></mat-tab>
        </mat-tab-group>
      </ng-container>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss'],
})
export class FiscalDocumentoDetalheComponent implements OnInit {
  documento: FiscalDocumentoDetalhe | null = null;
  carregando = false;
  erro = '';
  itemColumns = ['produto', 'qtd', 'fiscal', 'valor'];
  private id = 0;
  constructor(private readonly route: ActivatedRoute, private readonly service: FiscalDocumentoService, private readonly arquivos: FiscalArquivoService, private readonly auth: AuthService) {}
  ngOnInit(): void { this.id = Number(this.route.snapshot.paramMap.get('id')); this.carregar(); }
  pode(permissao: string): boolean { return this.auth.temPermissao(permissao); }
  carregar(): void { this.carregando = true; this.service.detalhar(this.id).pipe(finalize(() => (this.carregando = false))).subscribe({ next: (doc) => (this.documento = doc), error: () => (this.erro = 'Não foi possível carregar o documento.') }); }
  baixarXml(): void { this.arquivos.baixarXml(this.id).subscribe(); }
  baixarDanfe(): void { this.arquivos.baixarDanfe(this.id).subscribe(); }
  cancelar(): void { const justificativa = window.prompt('Justificativa do cancelamento'); if (justificativa && justificativa.length >= 15) this.service.cancelar(this.id, justificativa).subscribe(() => this.carregar()); }
  carta(): void { const correcao = window.prompt('Correção'); if (correcao && correcao.length >= 15) this.service.cartaCorrecao(this.id, correcao).subscribe(() => this.carregar()); }
}
