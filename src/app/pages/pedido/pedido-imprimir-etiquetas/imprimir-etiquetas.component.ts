import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule, ActivatedRoute } from "@angular/router";
import { PedidoResponse } from "src/app/models/pedido/pedido-response.model";
import { PedidoService } from "../pedido.service";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: 'app-imprimir-etiquetas',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  templateUrl: './imprimir-etiquetas.component.html',
  styleUrls: ['./imprimir-etiquetas.component.scss']
})
export class ImprimirEtiquetasComponent implements OnInit {
  pedido!: PedidoResponse;
  window = window;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pedidoService.buscarPorId(id).subscribe((res) => {
      this.pedido = res;
    });
  }

  displayNumero(p: PedidoResponse | null | undefined): string {
    if (!p) return '—';
    return p.status === 'ORCAMENTO' ? (p.numeroOrcamento ?? '—') : (p.numero ?? '—');
  }

  trackByItem = (_: number, item: any) => item?.id ?? item?.descricao ?? _;

  onPrint(): void {
    window.print();
  }

}
