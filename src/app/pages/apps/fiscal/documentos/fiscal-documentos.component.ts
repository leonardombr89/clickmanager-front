import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';
import { FiscalDocumentoListItem } from '../shared/fiscal.models';
import { FiscalArquivoService, FiscalDocumentoService } from '../shared/fiscal.services';

@Component({
  selector: 'app-fiscal-documentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, PageCardComponent, SectionCardComponent],
  template: `
    <app-page-card titulo="Documentos fiscais" subtitulo="NF-e e NFC-e emitidas pelo depósito." botaoTexto="Emitir nota" botaoIcone="receipt_long" [botaoRota]="['/apps/fiscal/emitir']" [permissao]="'FISCAL_EMITIR'">
      <div class="fiscal-alert fiscal-alert--error" *ngIf="erro"><mat-icon>error</mat-icon>{{ erro }}</div>
      <app-section-card titulo="Filtros">
        <div class="filters">
          <mat-form-field appearance="outline"><mat-label>Texto</mat-label><input matInput [formControl]="texto" placeholder="Cliente, número, chave ou pedido" /></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Status</mat-label><mat-select [formControl]="status"><mat-option value="">Todos</mat-option><mat-option *ngFor="let item of statusOptions" [value]="item">{{ label(item) }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Ambiente</mat-label><mat-select [formControl]="ambiente"><mat-option value="">Todos</mat-option><mat-option value="HOMOLOGACAO">Homologação</mat-option><mat-option value="PRODUCAO">Produção</mat-option></mat-select></mat-form-field>
          <button mat-flat-button color="primary" type="button" (click)="carregar()"><mat-icon>search</mat-icon>Filtrar</button>
        </div>
      </app-section-card>

      <app-section-card titulo="Notas fiscais" subtitulo="Ações aparecem somente quando aplicáveis ao status e permissão.">
        <div class="loading" *ngIf="carregando"><mat-spinner diameter="32"></mat-spinner><span>Carregando documentos...</span></div>
        <div class="empty" *ngIf="!carregando && !documentos.length">Nenhum documento fiscal emitido.</div>
        <table mat-table [dataSource]="documentos" *ngIf="!carregando && documentos.length">
          <ng-container matColumnDef="numero"><th mat-header-cell *matHeaderCellDef>Número</th><td mat-cell *matCellDef="let item">{{ item.numero || '-' }}/{{ item.serie || '-' }}</td></ng-container>
          <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Tipo</th><td mat-cell *matCellDef="let item">{{ item.tipo }}</td></ng-container>
          <ng-container matColumnDef="pedido"><th mat-header-cell *matHeaderCellDef>Pedido</th><td mat-cell *matCellDef="let item">{{ item.pedidoNumero || item.pedidoId || '-' }}</td></ng-container>
          <ng-container matColumnDef="cliente"><th mat-header-cell *matHeaderCellDef>Cliente</th><td mat-cell *matCellDef="let item">{{ item.clienteNome || '-' }}</td></ng-container>
          <ng-container matColumnDef="emissao"><th mat-header-cell *matHeaderCellDef>Emissão</th><td mat-cell *matCellDef="let item">{{ item.emissao | date:'short' }}</td></ng-container>
          <ng-container matColumnDef="valor"><th mat-header-cell *matHeaderCellDef>Valor</th><td mat-cell *matCellDef="let item">{{ item.valor | currency:'BRL':'symbol':'1.2-2' }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><span class="status"><mat-icon>{{ statusIcon(item.status) }}</mat-icon>{{ label(item.status) }}</span></td></ng-container>
          <ng-container matColumnDef="ambiente"><th mat-header-cell *matHeaderCellDef>Ambiente</th><td mat-cell *matCellDef="let item">{{ item.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação' }}</td></ng-container>
          <ng-container matColumnDef="chave"><th mat-header-cell *matHeaderCellDef>Chave</th><td mat-cell *matCellDef="let item" class="mono">{{ item.chave || '-' }}</td></ng-container>
          <ng-container matColumnDef="acoes"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item">
            <button mat-icon-button matTooltip="Visualizar" [routerLink]="['/apps/fiscal/documentos', item.id]"><mat-icon>visibility</mat-icon></button>
            <button mat-icon-button matTooltip="Consultar" *ngIf="pode('FISCAL_DOCUMENTOS_VER')" (click)="consultar(item)"><mat-icon>sync</mat-icon></button>
            <button mat-icon-button matTooltip="Baixar XML" *ngIf="pode('FISCAL_XML_BAIXAR')" [disabled]="!item.xmlDisponivel" (click)="baixarXml(item)"><mat-icon>code</mat-icon></button>
            <button mat-icon-button matTooltip="Baixar DANFE" *ngIf="pode('FISCAL_XML_BAIXAR')" [disabled]="!item.danfeDisponivel" (click)="baixarDanfe(item)"><mat-icon>picture_as_pdf</mat-icon></button>
          </td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      </app-section-card>
    </app-page-card>
  `,
  styleUrls: ['../shared/fiscal-ui.scss'],
})
export class FiscalDocumentosComponent implements OnInit {
  documentos: FiscalDocumentoListItem[] = [];
  columns = ['numero', 'tipo', 'pedido', 'cliente', 'emissao', 'valor', 'status', 'ambiente', 'chave', 'acoes'];
  statusOptions = ['RASCUNHO', 'VALIDANDO', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'DENEGADA', 'CANCELADA', 'ERRO'];
  texto = new FormControl('', { nonNullable: true });
  status = new FormControl('', { nonNullable: true });
  ambiente = new FormControl('', { nonNullable: true });
  carregando = false;
  erro = '';

  constructor(private readonly service: FiscalDocumentoService, private readonly arquivos: FiscalArquivoService, private readonly auth: AuthService) {}
  ngOnInit(): void { this.carregar(); }
  pode(permissao: string): boolean { return this.auth.temPermissao(permissao); }
  carregar(): void {
    this.carregando = true; this.erro = '';
    this.service.listar({ texto: this.texto.value, status: this.status.value, ambiente: this.ambiente.value }).pipe(finalize(() => (this.carregando = false))).subscribe({
      next: (page) => (this.documentos = page.content || []),
      error: () => (this.erro = 'Não foi possível carregar documentos fiscais.'),
    });
  }
  consultar(item: FiscalDocumentoListItem): void { this.service.consultar(item.id).subscribe({ next: () => this.carregar(), error: () => (this.erro = 'Consulta não concluída.') }); }
  baixarXml(item: FiscalDocumentoListItem): void { this.arquivos.baixarXml(item.id).subscribe(); }
  baixarDanfe(item: FiscalDocumentoListItem): void { this.arquivos.baixarDanfe(item.id).subscribe(); }
  label(status: string): string { return status.replace('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (s) => s.toUpperCase()); }
  statusIcon(status: string): string { return status === 'AUTORIZADA' ? 'check_circle' : status === 'REJEITADA' || status === 'ERRO' ? 'error' : status === 'CANCELADA' ? 'block' : 'hourglass_empty'; }
}
