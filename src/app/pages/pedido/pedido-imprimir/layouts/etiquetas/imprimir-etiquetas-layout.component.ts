import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { displayNumero } from '../../shared/imprimir-utils';

@Component({
  selector: 'app-imprimir-etiquetas-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-etiquetas-layout.component.html',
  styleUrls: ['./imprimir-etiquetas-layout.component.scss']
})
export class ImprimirEtiquetasLayoutComponent {
  @Input({ required: true }) pedido!: PedidoResponse;

  displayNumero = displayNumero;

  trackByItem = (_: number, item: any) => item?.id ?? item?.descricao ?? _;
}
