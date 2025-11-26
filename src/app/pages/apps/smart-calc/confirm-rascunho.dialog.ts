import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-confirm-rascunho',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, CommonModule, MatIconModule],
  template: `
  <h2 mat-dialog-title>Já existe um rascunho</h2>
  <mat-dialog-content>
    <p>Atendente: <b>{{data.usuario?.nome}}</b></p>
    <p>Pedido: <b>#{{data.pedido?.numero}}</b></p>
    <p>Deseja <b>adicionar ao existente</b> ou <b>criar outro</b>?</p>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-stroked-button mat-dialog-close="existente">
      <mat-icon>playlist_add</mat-icon>&nbsp;Usar existente
    </button>
    <button mat-flat-button color="primary" [mat-dialog-close]="'novo'">
      <mat-icon>add_circle</mat-icon>&nbsp;Criar novo
    </button>
  </mat-dialog-actions>
  `
})
export class ConfirmRascunhoDialog {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}