import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../pedido.service';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'src/app/services/auth.service';
import { Empresa } from 'src/app/models/empresa/empresa.model';
import { Subscription } from 'rxjs';
import { ImprimirPedidoCompletoComponent } from './layouts/pedido-completo/imprimir-pedido-completo/imprimir-pedido-completo.component';
import { ImprimirPedidoDuasViasComponent } from './layouts/pedido-duas-vias/imprimir-pedido-duas-vias/imprimir-pedido-duas-vias.component';

@Component({
  selector: 'app-imprimir-pedido',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, ImprimirPedidoCompletoComponent, ImprimirPedidoDuasViasComponent],
  templateUrl: './imprimir-pedido.page.html',
  styleUrls: ['imprimir-pedido.page.scss']
})
export class ImprimirPedidoPageComponent implements OnInit, OnDestroy {
  pedido: PedidoResponse | null = null;
  isDuasVias = false;
  empresa: Empresa | null = null;
  private usuarioSub?: Subscription;
  agora = new Date();

  constructor(
    private route: ActivatedRoute,
    private pedidoService: PedidoService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.isDuasVias = this.route.snapshot.routeConfig?.path?.includes('imprimir-duas-vias') ?? false;
    this.usuarioSub = this.authService.usuario$.subscribe(u => {
      this.empresa = u?.empresa ?? null;
      this.cdr.detectChanges();
    });

    this.pedidoService.buscarPorId(id).subscribe((res) => {
      this.pedido = res;
      this.cdr.detectChanges();
      // opcional: auto-print
      // setTimeout(() => this.onPrint(), 300);
    });
  }

  ngOnDestroy(): void {
    this.usuarioSub?.unsubscribe();
  }

  onPrint(): void {
    window.print();
  }
}
