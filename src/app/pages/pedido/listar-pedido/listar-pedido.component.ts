import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { PedidoService } from '../pedido.service';
import { PedidoListagem } from 'src/app/models/pedido/pedido-listagem.model';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-pedido',
  standalone: true,
  templateUrl: './listar-pedido.component.html',
  styleUrl: './listar-pedido.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatChipsModule,
    InputPesquisaComponent,
    TemPermissaoDirective,
    CardHeaderComponent
],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ListarPedidoComponent implements OnInit {
  private readonly pedidoService = inject(PedidoService);

  pedidos = signal<PedidoListagem[]>([]);
  totalPedidos = 0;
  tamanhoPagina = 10;
  paginaAtual = 0;
  textoPesquisa = '';
  filtroStatus: string | null = null;

  expandedElement: PedidoListagem | null = null;
  readonly columnsToDisplay = ['numero', 'cliente', 'total', 'status', 'acoes'];
  readonly columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.pedidoService.listar(this.paginaAtual, this.tamanhoPagina, this.textoPesquisa, this.filtroStatus ?? undefined)
      .subscribe(pagina => {
        this.pedidos.set(pagina.content);
        this.totalPedidos = pagina.totalElements;
      });
  }

  onPesquisar(texto: string): void {
    this.textoPesquisa = texto;
    this.paginaAtual = 0;
    this.carregarPedidos();
  }

  onPaginaAlterada(event: PageEvent): void {
    this.paginaAtual = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarPedidos();
  }

  aplicarFiltro(status: string): void {
    this.filtroStatus = status;
    this.carregarPedidos();
  }

  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarPedidos();
  }

  get dataSource() {
    return this.pedidos();
  }
}
