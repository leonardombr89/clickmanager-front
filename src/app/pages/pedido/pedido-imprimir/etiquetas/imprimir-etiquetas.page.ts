import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { PedidoService } from '../../pedido.service';
import { ImprimirEtiquetasLayoutComponent } from '../layouts/etiquetas/imprimir-etiquetas-layout.component';

@Component({
  selector: 'app-imprimir-etiquetas-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, ImprimirEtiquetasLayoutComponent],
  templateUrl: './imprimir-etiquetas.page.html',
  styleUrls: ['./imprimir-etiquetas.page.scss']
})
export class ImprimirEtiquetasPageComponent implements OnInit {
  pedido!: PedidoResponse;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pedidoService.buscarPorId(id).subscribe((res) => {
      this.pedido = res;
    });
  }

  onPrint(): void {
    window.print();
  }
}
