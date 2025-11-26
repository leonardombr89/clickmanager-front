import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../pedido.service';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-imprimir-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatTableModule],
  templateUrl: './imprimir-pedido.component.html',
  styleUrls: ['./imprimir-pedido.component.scss']
})
export class ImprimirPedidoComponent implements OnInit {
  pedido: PedidoResponse | null = null;
  isDuasVias = false;

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isDuasVias = this.route.snapshot.routeConfig?.path?.includes('imprimir-duas-vias') ?? false;

    this.pedidoService.buscarPorId(id).subscribe((res) => {
      this.pedido = res;
      this.cdr.detectChanges();
      // opcional: auto-print
      // setTimeout(() => this.onPrint(), 300);
    });
  }

  displayNumero(p: PedidoResponse | null | undefined): string {
    if (!p) return '—';
    // se vier "ORCAMENTO", prioriza numeroOrcamento; senão usa numero
    const isOrc = (p.status || '').toUpperCase() === 'ORCAMENTO';
    const no = (isOrc ? (p as any).numeroOrcamento : p.numero) as string | undefined;
    return no || '—';
  }

  trackByItem = (_: number, item: any) => item?.id ?? item?.descricao ?? _;

  onPrint(): void {
    window.print();
  }
}
